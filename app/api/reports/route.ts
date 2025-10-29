import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, invoices, invoiceItems, expenses } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

const GenerateReportSchema = z.object({
  userId: z.string().uuid(),
  period: z.enum(['month', 'quarter', 'year']),
  reportType: z.enum(['financial_summary', 'vat_report', 'profit_loss']),
});

// POST /api/reports - Generate financial reports
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = GenerateReportSchema.parse(body);

    // Get user
    const user = await db.select().from(users).where(eq(users.id, validatedData.userId)).limit(1);
    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (validatedData.period) {
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

    // Generate report based on type
    switch (validatedData.reportType) {
      case 'financial_summary':
        const summary = await generateFinancialSummary(validatedData.userId, startDate, now);
        return NextResponse.json({
          success: true,
          summary,
        });

      case 'vat_report':
        const vatReport = await generateVATReport(validatedData.userId, startDate, now);
        return NextResponse.json({
          success: true,
          summary: vatReport,
        });

      case 'profit_loss':
        const profitLoss = await generateProfitLossReport(validatedData.userId, startDate, now);
        return NextResponse.json({
          success: true,
          summary: profitLoss,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Generate report error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Generate financial summary
async function generateFinancialSummary(userId: string, startDate: Date, endDate: Date) {
  const paidInvoices = await db.select()
    .from(invoices)
    .innerJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
    .where(and(
      eq(invoices.userId, userId),
      eq(invoices.status, 'PAID'),
      gte(invoices.paidAt, startDate),
      lte(invoices.paidAt, endDate)
    ));

  const userExpenses = await db.select()
    .from(expenses)
    .where(and(
      eq(expenses.userId, userId),
      gte(expenses.date, startDate),
      lte(expenses.date, endDate)
    ));

  const totalRevenue = paidInvoices.reduce((sum, invoice) => 
    sum + Number(invoice.invoice_items.lineTotal || 0), 0);
  
  const totalExpenses = userExpenses.reduce((sum, expense) => 
    sum + Number(expense.amount), 0);
  
  const netProfit = totalRevenue - totalExpenses;

  return {
    period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    revenue: { total: totalRevenue, invoiceCount: paidInvoices.length },
    expenses: { total: totalExpenses, expenseCount: userExpenses.length },
    profit: { net: netProfit, margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0 },
  };
}

// Generate VAT report
async function generateVATReport(userId: string, startDate: Date, endDate: Date) {
  const paidInvoices = await db.select()
    .from(invoices)
    .innerJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
    .where(and(
      eq(invoices.userId, userId),
      eq(invoices.status, 'PAID'),
      gte(invoices.paidAt, startDate),
      lte(invoices.paidAt, endDate)
    ));

  const userExpenses = await db.select()
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

  const vatPaid = userExpenses.reduce((sum, expense) => 
    sum + Number(expense.vatAmount || 0), 0);

  return {
    period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    vatCollected,
    vatPaid,
    vatOwed: vatCollected - vatPaid,
    invoiceCount: paidInvoices.length,
    expenseCount: userExpenses.length,
  };
}

// Generate profit & loss report
async function generateProfitLossReport(userId: string, startDate: Date, endDate: Date) {
  const financialSummary = await generateFinancialSummary(userId, startDate, endDate);
  
  return {
    period: financialSummary.period,
    revenue: financialSummary.revenue,
    expenses: financialSummary.expenses,
    profit: financialSummary.profit,
    breakdown: {
      revenueByMonth: await getRevenueByMonth(userId, startDate, endDate),
      expensesByCategory: await getExpensesByCategory(userId, startDate, endDate),
    },
  };
}

// Helper functions
async function getRevenueByMonth(userId: string, startDate: Date, endDate: Date) {
  // Implementation for monthly revenue breakdown
  return {};
}

async function getExpensesByCategory(userId: string, startDate: Date, endDate: Date) {
  const userExpenses = await db.select()
    .from(expenses)
    .where(and(
      eq(expenses.userId, userId),
      gte(expenses.date, startDate),
      lte(expenses.date, endDate)
    ));

  const expensesByCategory = userExpenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  return expensesByCategory;
}
