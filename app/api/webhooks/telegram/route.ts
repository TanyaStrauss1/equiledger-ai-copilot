import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env.mjs';
import { aiService } from '@/lib/ai/service';
import { db } from '@/lib/db';
import { users, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Telegram webhook signature verification
function verifyTelegramSignature(req: NextRequest, body: string): boolean {
  const signature = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (!signature) return false;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(env.TELEGRAM_WEBHOOK_SECRET)
  );
}

// Telegram webhook handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    
    // Verify Telegram signature
    if (!verifyTelegramSignature(req, body)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const update = JSON.parse(body);
    
    // Handle different types of Telegram updates
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
    
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handle incoming Telegram messages
async function handleMessage(message: any) {
  try {
    const chatId = message.chat.id;
    const text = message.text || '';
    const from = message.from;
    
    console.log(`Telegram message from ${from.id}: ${text}`);
    
    // Get or create user
    let user = await db.select().from(users).where(eq(users.telegramId, from.id.toString())).limit(1);
    
    if (user.length === 0) {
      const newUser = await db.insert(users).values({
        telegramId: from.id.toString(),
        name: from.first_name || 'User',
        businessName: 'My Business',
      }).returning();
      user = newUser;
    }

    // Log the message
    await db.insert(messages).values({
      userId: user[0].id,
      channel: 'TELEGRAM',
      from: from.id.toString(),
      to: 'bot',
      content: text,
      messageType: 'text',
      metadata: { chatId, messageId: message.message_id },
    });

    // Process the message with AI
    const aiResult = await aiService.processQuery(user[0].id, text);
    
    let responseMessage = aiResult.response;
    let responseData: any = null;

    // Handle specific intents
    switch (aiResult.intent) {
      case 'INVOICE_CREATE':
        const invoiceResult = await aiService.createInvoice(user[0].id, aiResult.parameters);
        responseMessage = invoiceResult.message;
        responseData = invoiceResult;
        break;
        
      case 'EXPENSE_LOG':
        const expenseResult = await aiService.logExpense(user[0].id, aiResult.parameters);
        responseMessage = expenseResult.message;
        responseData = expenseResult;
        break;
        
      case 'FINANCIAL_SUMMARY':
        const summaryResult = await aiService.getFinancialSummary(user[0].id, aiResult.parameters);
        responseMessage = summaryResult.message;
        responseData = summaryResult;
        break;
        
      case 'INVOICE_LIST':
        // TODO: Implement invoice listing
        responseMessage = 'Invoice listing feature coming soon!';
        break;
        
      case 'HELP':
        responseMessage = `🤖 *EquiLedger AI Financial Assistant*

*Invoice Management:*
• "Create invoice for R500 website design for ABC Company"
• "Show unpaid invoices"
• "Mark paid #[ID]"

*Expense Tracking:*
• "Record R450 for transport fuel"
• "Log R1200 office supplies expense"

*Financial Reports:*
• "How much did I make this month?"
• "Show quarterly summary"
• "What's my profit this year?"

*Compliance:*
• "Check VAT compliance"
• "Generate tax report"

Try any of these natural language commands!`;
        break;
    }

    // Send response back to Telegram
    await sendTelegramMessage(chatId, responseMessage);
    
    // Log the response
    await db.insert(messages).values({
      userId: user[0].id,
      channel: 'TELEGRAM',
      from: 'bot',
      to: from.id.toString(),
      content: responseMessage,
      messageType: 'text',
      metadata: { chatId },
    });

  } catch (error) {
    console.error('Handle Telegram message error:', error);
  }
}

// Handle callback queries (button presses)
async function handleCallbackQuery(callbackQuery: any) {
  try {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const from = callbackQuery.from;
    
    console.log(`Telegram callback from ${from.id}: ${data}`);
    
    // Handle different callback actions
    switch (data) {
      case 'help':
        await sendTelegramMessage(chatId, 'Help information here...');
        break;
      case 'invoices':
        await sendTelegramMessage(chatId, 'Invoice listing coming soon!');
        break;
      default:
        await sendTelegramMessage(chatId, 'Unknown action');
    }
    
    // Answer the callback query
    await answerCallbackQuery(callbackQuery.id);
    
  } catch (error) {
    console.error('Handle callback query error:', error);
  }
}

// Send Telegram message
async function sendTelegramMessage(chatId: number, text: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Send Telegram message error:', error);
    throw error;
  }
}

// Answer callback query
async function answerCallbackQuery(callbackQueryId: string) {
  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
      }),
    });
  } catch (error) {
    console.error('Answer callback query error:', error);
  }
}
