import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env.mjs';
import { aiService } from '@/lib/ai/service';
import { db } from '@/lib/db';
import { users, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Twilio webhook signature verification
function verifyTwilioSignature(req: NextRequest, body: string): boolean {
  const signature = req.headers.get('X-Twilio-Signature');
  if (!signature) return false;

  const authToken = env.TWILIO_AUTH_TOKEN;
  const url = req.url;
  
  // Create the signature
  const baseString = url + body;
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(baseString, 'utf-8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// WhatsApp webhook verification (GET request)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  // Verify the webhook
  if (mode === 'subscribe' && token === env.TELEGRAM_WEBHOOK_SECRET) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// WhatsApp webhook handler (POST request)
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    
    // Verify Twilio signature
    if (!verifyTwilioSignature(req, body)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse the webhook data
    const formData = new URLSearchParams(body);
    const from = formData.get('From')?.replace('whatsapp:', '');
    const messageBody = formData.get('Body');
    const messageSid = formData.get('MessageSid');

    if (!from || !messageBody) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    console.log(`WhatsApp message from ${from}: ${messageBody}`);

    // Get or create user
    let user = await db.select().from(users).where(eq(users.whatsappNumber, from)).limit(1);
    
    if (user.length === 0) {
      const newUser = await db.insert(users).values({
        whatsappNumber: from,
        name: 'Business Owner',
        businessName: 'My Business',
      }).returning();
      user = newUser;
    }

    // Log the message
    await db.insert(messages).values({
      userId: user[0].id,
      channel: 'WHATSAPP',
      from,
      to: env.TWILIO_WHATSAPP_NUMBER.replace('whatsapp:', ''),
      content: messageBody,
      messageType: 'text',
      metadata: { messageSid },
    });

    // Process the message with AI
    const aiResult = await aiService.processQuery(user[0].id, messageBody);
    
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

    // Send response back to WhatsApp
    const twilioResponse = await sendWhatsAppMessage(from, responseMessage);
    
    // Log the response
    await db.insert(messages).values({
      userId: user[0].id,
      channel: 'WHATSAPP',
      from: env.TWILIO_WHATSAPP_NUMBER.replace('whatsapp:', ''),
      to: from,
      content: responseMessage,
      messageType: 'text',
      metadata: { twilioResponse },
    });

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Send WhatsApp message via Twilio
async function sendWhatsAppMessage(to: string, message: string) {
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        From: env.TWILIO_WHATSAPP_NUMBER,
        To: `whatsapp:${to}`,
        Body: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Send WhatsApp message error:', error);
    throw error;
  }
}
