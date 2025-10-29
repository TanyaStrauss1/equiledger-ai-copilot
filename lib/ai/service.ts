import { generateText, generateObject } from 'ai';
import { openaiClient, AI_MODELS, SYSTEM_PROMPTS, AI_TOOLS } from './config';
import { db } from '@/lib/db';
import { users, clients, invoices, invoiceItems, expenses } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { z } from 'zod';

// Zod schemas for AI tool validation
const CreateInvoiceSchema = z.object({
  clientName: z.string(),
  amount: z.number().positive(),
  description: z.string(),
  dueInDays: z.number().positive().default(30),
  vatIncluded: z.boolean().default(true),
});

const LogExpenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string(),
  category: z.string(),
  date: z.string().optional(),
  receipt: z.string().optional(),
});

const FinancialSummarySchema = z.object({
  period: z.enum(['month', 'quarter', 'year']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export class AIService {
  // Process natural language query and detect intent
  async processQuery(userId: string, message: string) {
    try {
      const result = await generateObject({
        model: openaiClient(AI_MODELS.CHAT),
        system: SYSTEM_PROMPTS.INTENT_DETECTION,
        prompt: `User query: "${message}"`,
        schema: z.object({
          intent: z.string(),
          confidence: z.number(),
          parameters: z.record(z.any()),
          response: z.string(),
          actions: z.array(z.string()),
        }),
      });

      return result.object;
    } catch (error) {
      console.error('AI query processing error:', error);
      return {
        intent: 'HELP',
        confidence: 0,
        parameters: {},
        response: 'I had trouble understanding your request. Please try again.',
        actions: [],
      };
    }
  }

  // Create invoice using AI
  async createInvoice(userId: string, params: any) {
    try {
      const validatedParams = CreateInvoiceSchema.parse(params);
      
      // Get or create user
      let user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0) {
        throw new Error('User not found');
      }

      // Get or create client
      let client = await db.select().from(clients)
        .where(and(eq(clients.userId, userId), eq(clients.name, validatedParams.clientName)))
        .limit(1);
      
      if (client.length === 0) {
        const newClient = await db.insert(clients).values({
          userId,
          name: validatedParams.clientName,
        }).returning();
        client = newClient;
      }

      // Calculate amounts
      const vatRate = 0.15;
      const subtotal = validatedParams.vatIncluded 
        ? validatedParams.amount / (1 + vatRate)
        : validatedParams.amount;
      const vatAmount = validatedParams.vatIncluded
        ? validatedParams.amount - subtotal
        : validatedParams.amount * vatRate;
      const total = validatedParams.vatIncluded 
        ? validatedParams.amount 
        : validatedParams.amount + vatAmount;

      // Generate invoice number
      const invoiceCount = await db.select().from(invoices).where(eq(invoices.userId, userId));
      const invoiceNumber = `INV-${String(invoiceCount.length + 1).padStart(4, '0')}`;

      // Create invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + validatedParams.dueInDays);

      const newInvoice = await db.insert(invoices).values({
        userId,
        clientId: client[0].id,
        invoiceNumber,
        currency: 'ZAR',
        vatIncluded: validatedParams.vatIncluded,
        vatRate,
        status: 'DRAFT',
        dueDate,
      }).returning();

      // Create invoice item
      await db.insert(invoiceItems).values({
        invoiceId: newInvoice[0].id,
        description: validatedParams.description,
        quantity: 1,
        unitPrice: subtotal,
        lineTotal: subtotal,
      });

      return {
        success: true,
        invoice: newInvoice[0],
        client: client[0],
        amounts: {
          subtotal: Number(subtotal.toFixed(2)),
          vatAmount: Number(vatAmount.toFixed(2)),
          total: Number(total.toFixed(2)),
        },
        message: `✅ Invoice ${invoiceNumber} created for ${validatedParams.clientName} - R${total.toFixed(2)}`,
      };
    } catch (error) {
      console.error('Create invoice error:', error);
      return {
        success: false,
        message: 'Sorry, there was an error creating your invoice. Please try again.',
      };
    }
  }

  // Log expense using AI
  async logExpense(userId: string, params: any) {
    try {
      const validatedParams = LogExpenseSchema.parse(params);
      
      // Calculate VAT amount (assuming VAT is included)
      const vatRate = 0.15;
      const vatAmount = validatedParams.amount * (vatRate / (1 + vatRate));
      
      const expenseDate = validatedParams.date ? new Date(validatedParams.date) : new Date();

      const newExpense = await db.insert(expenses).values({
        userId,
        description: validatedParams.description,
        amount: validatedParams.amount,
        currency: 'ZAR',
        category: validatedParams.category,
        date: expenseDate,
        receipt: validatedParams.receipt,
        vatAmount,
      }).returning();

      return {
        success: true,
        expense: newExpense[0],
        message: `✅ Expense logged: ${validatedParams.description} - R${validatedParams.amount.toFixed(2)}`,
      };
    } catch (error) {
      console.error('Log expense error:', error);
      return {
        success: false,
        message: 'Sorry, there was an error logging your expense. Please try again.',
      };
    }
  }

  // Get financial summary
  async getFinancialSummary(userId: string, params: any) {
    try {
      const validatedParams = FinancialSummarySchema.parse(params);
      
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (validatedParams.period) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Get paid invoices in period
      const paidInvoices = await db.select()
        .from(invoices)
        .innerJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
        .where(and(
          eq(invoices.userId, userId),
          eq(invoices.status, 'PAID'),
          gte(invoices.paidAt, startDate),
          lte(invoices.paidAt, now)
        ));

      // Get expenses in period
      const periodExpenses = await db.select()
        .from(expenses)
        .where(and(
          eq(expenses.userId, userId),
          gte(expenses.date, startDate),
          lte(expenses.date, now)
        ));

      // Calculate totals
      const totalRevenue = paidInvoices.reduce((sum, invoice) => 
        sum + Number(invoice.invoice_items.lineTotal || 0), 0);
      
      const totalExpenses = periodExpenses.reduce((sum, expense) => 
        sum + Number(expense.amount), 0);
      
      const netProfit = totalRevenue - totalExpenses;

      // Calculate VAT
      const vatCollected = paidInvoices.reduce((sum, invoice) => {
        const invoiceTotal = Number(invoice.invoice_items.lineTotal || 0);
        const vatAmount = invoice.invoices.vatIncluded 
          ? invoiceTotal * (invoice.invoices.vatRate / (1 + invoice.invoices.vatRate))
          : invoiceTotal * invoice.invoices.vatRate;
        return sum + Number(vatAmount);
      }, 0);

      return {
        success: true,
        summary: {
          period: validatedParams.period,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalExpenses: Number(totalExpenses.toFixed(2)),
          netProfit: Number(netProfit.toFixed(2)),
          vatCollected: Number(vatCollected.toFixed(2)),
          invoiceCount: paidInvoices.length,
          expenseCount: periodExpenses.length,
        },
        message: `📊 ${validatedParams.period.charAt(0).toUpperCase() + validatedParams.period.slice(1)} Summary: Revenue R${totalRevenue.toFixed(2)}, Expenses R${totalExpenses.toFixed(2)}, Net Profit R${netProfit.toFixed(2)}`,
      };
    } catch (error) {
      console.error('Financial summary error:', error);
      return {
        success: false,
        message: 'Sorry, there was an error generating your financial summary. Please try again.',
      };
    }
  }

  // Generate AI response for general queries
  async generateResponse(userId: string, message: string, context?: any) {
    try {
      const result = await generateText({
        model: openaiClient(AI_MODELS.CHAT),
        system: SYSTEM_PROMPTS.FINANCIAL_ASSISTANT,
        prompt: `User message: "${message}"\n\nContext: ${JSON.stringify(context || {})}`,
      });

      return {
        success: true,
        response: result.text,
      };
    } catch (error) {
      console.error('AI response generation error:', error);
      return {
        success: false,
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
      };
    }
  }
}

export const aiService = new AIService();
