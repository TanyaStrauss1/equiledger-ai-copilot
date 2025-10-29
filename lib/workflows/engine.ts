import { z } from 'zod';
import { aiService } from '@/lib/ai/service';
import { db } from '@/lib/db';
import { users, invoices, clients, invoiceItems, expenses } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

// Workflow step schemas
const CreateInvoiceStepSchema = z.object({
  type: z.literal('create_invoice'),
  userId: z.string(),
  clientName: z.string(),
  amount: z.number(),
  description: z.string(),
  dueInDays: z.number().default(30),
});

const LogExpenseStepSchema = z.object({
  type: z.literal('log_expense'),
  userId: z.string(),
  amount: z.number(),
  description: z.string(),
  category: z.string(),
  date: z.string().optional(),
});

const GenerateReportStepSchema = z.object({
  type: z.literal('generate_report'),
  userId: z.string(),
  period: z.enum(['month', 'quarter', 'year']),
  reportType: z.enum(['financial_summary', 'vat_report', 'profit_loss']),
});

// Workflow execution context
interface WorkflowContext {
  userId: string;
  steps: WorkflowStep[];
  currentStep: number;
  results: Record<string, any>;
  errors: Record<string, string>;
}

type WorkflowStep = 
  | z.infer<typeof CreateInvoiceStepSchema>
  | z.infer<typeof LogExpenseStepSchema>
  | z.infer<typeof GenerateReportStepSchema>;

// Workflow execution engine
export class WorkflowEngine {
  private context: WorkflowContext;

  constructor(userId: string, steps: WorkflowStep[]) {
    this.context = {
      userId,
      steps,
      currentStep: 0,
      results: {},
      errors: {},
    };
  }

  // Execute workflow with error handling and retry logic
  async execute(): Promise<{
    success: boolean;
    results: Record<string, any>;
    errors: Record<string, string>;
    completedSteps: number;
  }> {
    const maxRetries = 3;
    let retryCount = 0;

    while (this.context.currentStep < this.context.steps.length && retryCount < maxRetries) {
      const step = this.context.steps[this.context.currentStep];
      
      try {
        const result = await this.executeStep(step);
        this.context.results[`step_${this.context.currentStep}`] = result;
        this.context.currentStep++;
        retryCount = 0; // Reset retry count on success
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.context.errors[`step_${this.context.currentStep}`] = errorMessage;
        
        // Determine if error is retriable
        if (this.isRetriableError(error)) {
          retryCount++;
          console.warn(`Retrying step ${this.context.currentStep}, attempt ${retryCount}`);
          await this.delay(1000 * retryCount); // Exponential backoff
        } else {
          // Fatal error, stop execution
          console.error(`Fatal error in step ${this.context.currentStep}:`, error);
          break;
        }
      }
    }

    return {
      success: this.context.currentStep === this.context.steps.length,
      results: this.context.results,
      errors: this.context.errors,
      completedSteps: this.context.currentStep,
    };
  }

  // Execute individual step
  private async executeStep(step: WorkflowStep): Promise<any> {
    switch (step.type) {
      case 'create_invoice':
        return await this.executeCreateInvoice(step);
      case 'log_expense':
        return await this.executeLogExpense(step);
      case 'generate_report':
        return await this.executeGenerateReport(step);
      default:
        throw new Error(`Unknown step type: ${(step as any).type}`);
    }
  }

  // Create invoice step
  private async executeCreateInvoice(step: z.infer<typeof CreateInvoiceStepSchema>) {
    const validatedStep = CreateInvoiceStepSchema.parse(step);
    
    // Get or create user
    let user = await db.select().from(users).where(eq(users.id, validatedStep.userId)).limit(1);
    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Get or create client
    let client = await db.select().from(clients)
      .where(and(eq(clients.userId, validatedStep.userId), eq(clients.name, validatedStep.clientName)))
      .limit(1);
    
    if (client.length === 0) {
      const newClient = await db.insert(clients).values({
        userId: validatedStep.userId,
        name: validatedStep.clientName,
      }).returning();
      client = newClient;
    }

    // Calculate amounts
    const vatRate = 0.15;
    const subtotal = validatedStep.amount / (1 + vatRate);
    const vatAmount = validatedStep.amount - subtotal;

    // Generate invoice number
    const invoiceCount = await db.select().from(invoices).where(eq(invoices.userId, validatedStep.userId));
    const invoiceNumber = `INV-${String(invoiceCount.length + 1).padStart(4, '0')}`;

    // Create invoice
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + validatedStep.dueInDays);

    const newInvoice = await db.insert(invoices).values({
      userId: validatedStep.userId,
      clientId: client[0].id,
      invoiceNumber,
      currency: 'ZAR',
      vatIncluded: true,
      vatRate,
      status: 'DRAFT',
      dueDate,
    }).returning();

    // Create invoice item
    await db.insert(invoiceItems).values({
      invoiceId: newInvoice[0].id,
      description: validatedStep.description,
      quantity: 1,
      unitPrice: subtotal,
      lineTotal: subtotal,
    });

    return {
      invoiceId: newInvoice[0].id,
      invoiceNumber,
      clientName: validatedStep.clientName,
      amount: validatedStep.amount,
      dueDate: dueDate.toISOString(),
    };
  }

  // Log expense step
  private async executeLogExpense(step: z.infer<typeof LogExpenseStepSchema>) {
    const validatedStep = LogExpenseStepSchema.parse(step);
    
    const vatRate = 0.15;
    const vatAmount = validatedStep.amount * (vatRate / (1 + vatRate));
    const expenseDate = validatedStep.date ? new Date(validatedStep.date) : new Date();

    const newExpense = await db.insert(expenses).values({
      userId: validatedStep.userId,
      description: validatedStep.description,
      amount: validatedStep.amount,
      currency: 'ZAR',
      category: validatedStep.category,
      date: expenseDate,
      vatAmount,
    }).returning();

    return {
      expenseId: newExpense[0].id,
      description: validatedStep.description,
      amount: validatedStep.amount,
      category: validatedStep.category,
      date: expenseDate.toISOString(),
    };
  }

  // Generate report step
  private async executeGenerateReport(step: z.infer<typeof GenerateReportStepSchema>) {
    const validatedStep = GenerateReportStepSchema.parse(step);
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (validatedStep.period) {
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

    // Get data based on report type
    switch (validatedStep.reportType) {
      case 'financial_summary':
        return await this.generateFinancialSummary(validatedStep.userId, startDate, now);
      case 'vat_report':
        return await this.generateVATReport(validatedStep.userId, startDate, now);
      case 'profit_loss':
        return await this.generateProfitLossReport(validatedStep.userId, startDate, now);
      default:
        throw new Error(`Unknown report type: ${validatedStep.reportType}`);
    }
  }

  // Generate financial summary
  private async generateFinancialSummary(userId: string, startDate: Date, endDate: Date) {
    const paidInvoices = await db.select()
      .from(invoices)
      .innerJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
      .where(and(
        eq(invoices.userId, userId),
        eq(invoices.status, 'PAID'),
        gte(invoices.paidAt, startDate),
        lte(invoices.paidAt, endDate)
      ));

    const expenses = await db.select()
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      ));

    const totalRevenue = paidInvoices.reduce((sum, invoice) => 
      sum + Number(invoice.invoice_items.lineTotal || 0), 0);
    
    const totalExpenses = expenses.reduce((sum, expense) => 
      sum + Number(expense.amount), 0);
    
    const netProfit = totalRevenue - totalExpenses;

    return {
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      revenue: { total: totalRevenue, invoiceCount: paidInvoices.length },
      expenses: { total: totalExpenses, expenseCount: expenses.length },
      profit: { net: netProfit, margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0 },
    };
  }

  // Generate VAT report
  private async generateVATReport(userId: string, startDate: Date, endDate: Date) {
    const paidInvoices = await db.select()
      .from(invoices)
      .innerJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
      .where(and(
        eq(invoices.userId, userId),
        eq(invoices.status, 'PAID'),
        gte(invoices.paidAt, startDate),
        lte(invoices.paidAt, endDate)
      ));

    const expenses = await db.select()
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      ));

    const vatCollected = paidInvoices.reduce((sum, invoice) => {
      const invoiceTotal = Number(invoice.invoice_items.lineTotal || 0);
      const vatAmount = invoice.invoices.vatIncluded 
        ? invoiceTotal * (invoice.invoices.vatRate / (1 + invoice.invoices.vatRate))
        : invoiceTotal * invoice.invoices.vatRate;
      return sum + Number(vatAmount);
    }, 0);

    const vatPaid = expenses.reduce((sum, expense) => 
      sum + Number(expense.vatAmount || 0), 0);

    return {
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      vatCollected,
      vatPaid,
      vatOwed: vatCollected - vatPaid,
      invoiceCount: paidInvoices.length,
      expenseCount: expenses.length,
    };
  }

  // Generate profit & loss report
  private async generateProfitLossReport(userId: string, startDate: Date, endDate: Date) {
    const financialSummary = await this.generateFinancialSummary(userId, startDate, endDate);
    
    return {
      period: financialSummary.period,
      revenue: financialSummary.revenue,
      expenses: financialSummary.expenses,
      profit: financialSummary.profit,
      breakdown: {
        revenueByMonth: await this.getRevenueByMonth(userId, startDate, endDate),
        expensesByCategory: await this.getExpensesByCategory(userId, startDate, endDate),
      },
    };
  }

  // Helper methods
  private async getRevenueByMonth(userId: string, startDate: Date, endDate: Date) {
    // Implementation for monthly revenue breakdown
    return {};
  }

  private async getExpensesByCategory(userId: string, startDate: Date, endDate: Date) {
    // Implementation for expense category breakdown
    return {};
  }

  // Determine if error is retriable
  private isRetriableError(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('timeout') || 
             message.includes('network') || 
             message.includes('connection') ||
             message.includes('rate limit');
    }
    return false;
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Workflow builder for common patterns
export class WorkflowBuilder {
  private steps: WorkflowStep[] = [];

  addCreateInvoice(userId: string, clientName: string, amount: number, description: string, dueInDays = 30) {
    this.steps.push({
      type: 'create_invoice',
      userId,
      clientName,
      amount,
      description,
      dueInDays,
    });
    return this;
  }

  addLogExpense(userId: string, amount: number, description: string, category: string, date?: string) {
    this.steps.push({
      type: 'log_expense',
      userId,
      amount,
      description,
      category,
      date,
    });
    return this;
  }

  addGenerateReport(userId: string, period: 'month' | 'quarter' | 'year', reportType: 'financial_summary' | 'vat_report' | 'profit_loss') {
    this.steps.push({
      type: 'generate_report',
      userId,
      period,
      reportType,
    });
    return this;
  }

  build(userId: string): WorkflowEngine {
    return new WorkflowEngine(userId, this.steps);
  }
}

// Export workflow types
export type { WorkflowStep, WorkflowContext };
export { CreateInvoiceStepSchema, LogExpenseStepSchema, GenerateReportStepSchema };
