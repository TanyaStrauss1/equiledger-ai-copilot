import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';
import { z } from 'zod';

// Request schema validation
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  userId: z.string().uuid(),
  context: z.record(z.any()).optional(),
});

// AI Chat API endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userId, context } = ChatRequestSchema.parse(body);

    // Process the message with AI
    const aiResult = await aiService.processQuery(userId, message);
    
    let responseMessage = aiResult.response;
    let responseData: any = null;

    // Handle specific intents
    switch (aiResult.intent) {
      case 'INVOICE_CREATE':
        const invoiceResult = await aiService.createInvoice(userId, aiResult.parameters);
        responseMessage = invoiceResult.message;
        responseData = invoiceResult;
        break;
        
      case 'EXPENSE_LOG':
        const expenseResult = await aiService.logExpense(userId, aiResult.parameters);
        responseMessage = expenseResult.message;
        responseData = expenseResult;
        break;
        
      case 'FINANCIAL_SUMMARY':
        const summaryResult = await aiService.getFinancialSummary(userId, aiResult.parameters);
        responseMessage = summaryResult.message;
        responseData = summaryResult;
        break;
        
      case 'INVOICE_LIST':
        // TODO: Implement invoice listing
        responseMessage = 'Invoice listing feature coming soon!';
        break;
        
      case 'HELP':
        responseMessage = `🤖 EquiLedger AI Financial Assistant

Invoice Management:
• "Create invoice for R500 website design for ABC Company"
• "Show unpaid invoices"
• "Mark paid #[ID]"

Expense Tracking:
• "Record R450 for transport fuel"
• "Log R1200 office supplies expense"

Financial Reports:
• "How much did I make this month?"
• "Show quarterly summary"
• "What's my profit this year?"

Compliance:
• "Check VAT compliance"
• "Generate tax report"

Try any of these natural language commands!`;
        break;
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      intent: aiResult.intent,
      confidence: aiResult.confidence,
      data: responseData,
    });

  } catch (error) {
    console.error('AI chat API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
