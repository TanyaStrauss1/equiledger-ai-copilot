import { streamText, generateText, tool } from 'ai';
import { z } from 'zod';
import { openai } from './config';
import { db } from '../db';
import { users, clients, invoices, invoiceItems, expenses, conversations, messages } from '../db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class AdvancedFinancialAIService {
  async processAdvancedQuery(userId: string, messageContent: string, channel: 'WHATSAPP' | 'TELEGRAM' | 'WEB_CHAT') {
    // Find or create conversation
    let conversation = await db.query.conversations.findFirst({
      where: and(eq(conversations.userId, userId), eq(conversations.channel, channel)),
    });

    if (!conversation) {
      conversation = (await db.insert(conversations).values({
        id: uuidv4(),
        userId,
        channel,
        channelConversationId: userId,
      }).returning())[0];
    }

    // Log incoming message
    await db.insert(messages).values({
      id: uuidv4(),
      conversationId: conversation.id,
      senderId: userId,
      recipientId: 'AI',
      content: messageContent,
      isIncoming: true,
    });

    const { text, toolResults } = await generateText({
      model: openai('gpt-4o-mini'),
      system: `You are EquiLedger, an advanced AI financial assistant for South African SMEs.

      You have access to comprehensive financial tools and can:
      - Create and manage invoices with automatic VAT calculations
      - Track business expenses with categorization
      - Generate detailed financial reports and insights
      - Provide tax compliance guidance
      - Analyze business performance trends
      - Suggest financial optimizations

      Always respond in a helpful, professional manner.
      When creating invoices, ask for confirmation before finalizing.
      Provide detailed explanations for financial calculations.
      Suggest actionable insights based on the data.`,
      messages: [
        { role: 'user', content: messageContent },
      ],
      tools: {
        // Enhanced invoice creation with more options
        createAdvancedInvoice: tool({
          description: 'Create a detailed invoice with multiple line items and advanced options.',
          parameters: z.object({
            clientName: z.string().describe('The name of the client.'),
            lineItems: z.array(z.object({
              description: z.string().describe('Description of the service or product.'),
              quantity: z.number().positive().describe('Quantity of the item.'),
              unitPrice: z.number().positive().describe('Price per unit.'),
            })).describe('Array of line items for the invoice.'),
            currency: z.string().default('ZAR').describe('The currency of the invoice.'),
            vatIncluded: z.boolean().default(true).describe('Whether VAT is included in the amounts.'),
            vatRate: z.number().default(0.15).describe('The VAT rate as a decimal.'),
            dueInDays: z.number().default(30).describe('Number of days until the invoice is due.'),
            notes: z.string().optional().describe('Additional notes for the invoice.'),
          }),
          execute: async ({ clientName, lineItems, currency, vatIncluded, vatRate, dueInDays, notes }) => {
            console.log('Tool: createAdvancedInvoice called', { clientName, lineItems });

            let user = await db.query.users.findFirst({ where: eq(users.id, userId) });
            if (!user) {
              user = (await db.insert(users).values({ 
                id: userId, 
                whatsappNumber: userId, 
                name: 'New User' 
              }).returning())[0];
            }

            let client = await db.query.clients.findFirst({ 
              where: and(eq(clients.userId, userId), eq(clients.name, clientName)) 
            });
            if (!client) {
              client = (await db.insert(clients).values({ 
                id: uuidv4(), 
                userId, 
                name: clientName 
              }).returning())[0];
            }

            const dueDate = new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000);
            const invoiceCount = await db.select().from(invoices).where(eq(invoices.userId, userId));
            const invoiceNumber = `INV-${String(invoiceCount.length + 1).padStart(4, '0')}`;

            const invoice = (await db.insert(invoices).values({
              id: uuidv4(),
              userId: user.id,
              clientId: client.id,
              invoiceNumber,
              currency,
              vatIncluded,
              vatRate: vatRate.toString(),
              status: 'DRAFT',
              dueDate,
              notes,
            }).returning())[0];

            let totalAmount = 0;
            for (const item of lineItems) {
              const lineTotal = item.quantity * item.unitPrice;
              totalAmount += lineTotal;
              
              await db.insert(invoiceItems).values({
                id: uuidv4(),
                invoiceId: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice.toString(),
                lineTotal: lineTotal.toString(),
              });
            }

            const vatAmount = vatIncluded 
              ? totalAmount * (vatRate / (1 + vatRate))
              : totalAmount * vatRate;
            
            const finalTotal = vatIncluded ? totalAmount : totalAmount + vatAmount;

            return {
              invoiceId: invoice.id,
              invoiceNumber,
              clientName,
              lineItems: lineItems.length,
              subtotal: totalAmount,
              vatAmount,
              total: finalTotal,
              dueDate: dueDate.toISOString(),
              message: `Advanced invoice created for ${clientName} with ${lineItems.length} line items. Total: R${finalTotal.toFixed(2)} (VAT: R${vatAmount.toFixed(2)}).`,
            };
          },
        }),

        // Advanced expense logging with receipt processing
        logAdvancedExpense: tool({
          description: 'Log a business expense with detailed categorization and receipt processing.',
          parameters: z.object({
            description: z.string().describe('A detailed description of the expense.'),
            amount: z.number().positive().describe('The total amount of the expense.'),
            category: z.string().describe('The category of the expense.'),
            currency: z.string().default('ZAR').describe('The currency of the expense.'),
            vatIncluded: z.boolean().default(true).describe('Whether VAT is included in the amount.'),
            vatRate: z.number().default(0.15).describe('The VAT rate as a decimal.'),
            date: z.string().optional().describe('The date of the expense in ISO format.'),
            receiptUrl: z.string().optional().describe('URL to the receipt image/document.'),
            tags: z.array(z.string()).optional().describe('Tags for better categorization.'),
          }),
          execute: async ({ description, amount, category, currency, vatIncluded, vatRate, date, receiptUrl, tags }) => {
            console.log('Tool: logAdvancedExpense called', { description, amount, category });

            let user = await db.query.users.findFirst({ where: eq(users.id, userId) });
            if (!user) {
              user = (await db.insert(users).values({ 
                id: userId, 
                whatsappNumber: userId, 
                name: 'New User' 
              }).returning())[0];
            }

            const vatAmount = vatIncluded 
              ? amount * (vatRate / (1 + vatRate))
              : amount * vatRate;
            
            const expenseDate = date ? new Date(date) : new Date();

            const expense = (await db.insert(expenses).values({
              id: uuidv4(),
              userId: user.id,
              description,
              amount: amount.toString(),
              currency,
              category,
              date: expenseDate,
              vatIncluded,
              vatRate: vatRate.toString(),
              vatAmount: vatAmount.toString(),
              receiptUrl,
              tags: tags ? JSON.stringify(tags) : null,
            }).returning())[0];

            return {
              expenseId: expense.id,
              description,
              amount,
              category,
              vatAmount,
              date: expenseDate.toISOString(),
              message: `Advanced expense logged: ${description} for R${amount.toFixed(2)} (VAT: R${vatAmount.toFixed(2)}) in category "${category}".`,
            };
          },
        }),

        // Comprehensive financial analysis
        analyzeFinancialHealth: tool({
          description: 'Analyze the financial health of the business and provide insights.',
          parameters: z.object({
            period: z.enum(['month', 'quarter', 'year', 'all']).default('month').describe('The period for analysis.'),
            includeRecommendations: z.boolean().default(true).describe('Whether to include actionable recommendations.'),
          }),
          execute: async ({ period, includeRecommendations }) => {
            console.log('Tool: analyzeFinancialHealth called', { period });

            let user = await db.query.users.findFirst({ where: eq(users.id, userId) });
            if (!user) {
              return { message: "User not found. Please create some financial data first." };
            }

            const now = new Date();
            let startDate: Date;

            switch (period) {
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
              case 'all':
              default:
                startDate = new Date(0);
                break;
            }

            // Get comprehensive financial data
            const paidInvoices = await db.select()
              .from(invoices)
              .innerJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
              .where(and(
                eq(invoices.userId, userId),
                eq(invoices.status, 'PAID'),
                gte(invoices.paidAt, startDate)
              ));

            const userExpenses = await db.select()
              .from(expenses)
              .where(and(
                eq(expenses.userId, userId),
                gte(expenses.date, startDate)
              ));

            const totalRevenue = paidInvoices.reduce((sum, invoice) => 
              sum + Number(invoice.invoice_items.lineTotal || 0), 0);
            
            const totalExpenses = userExpenses.reduce((sum, expense) => 
              sum + Number(expense.amount), 0);
            
            const netProfit = totalRevenue - totalExpenses;
            const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

            // Calculate trends
            const monthlyRevenue = await this.calculateMonthlyTrends(userId, startDate, now);
            const expenseCategories = await this.calculateExpenseCategories(userExpenses);

            // Generate insights
            const insights = this.generateFinancialInsights({
              totalRevenue,
              totalExpenses,
              netProfit,
              profitMargin,
              monthlyRevenue,
              expenseCategories,
              period,
            });

            const recommendations = includeRecommendations 
              ? this.generateRecommendations({
                  totalRevenue,
                  totalExpenses,
                  netProfit,
                  profitMargin,
                  monthlyRevenue,
                  expenseCategories,
                })
              : [];

            return {
              period: { startDate: startDate.toISOString(), endDate: now.toISOString() },
              summary: {
                revenue: { total: totalRevenue, count: paidInvoices.length },
                expenses: { total: totalExpenses, count: userExpenses.length },
                profit: { net: netProfit, margin: profitMargin },
              },
              trends: {
                monthlyRevenue,
                expenseCategories,
              },
              insights,
              recommendations,
              message: `Financial analysis complete for ${period}. Revenue: R${totalRevenue.toFixed(2)}, Expenses: R${totalExpenses.toFixed(2)}, Net Profit: R${netProfit.toFixed(2)} (${profitMargin.toFixed(1)}% margin).`,
            };
          },
        }),

        // VAT compliance checker
        checkVATCompliance: tool({
          description: 'Check VAT compliance and calculate amounts owed to SARS.',
          parameters: z.object({
            period: z.enum(['month', 'quarter', 'year']).default('month').describe('The period for VAT calculation.'),
          }),
          execute: async ({ period }) => {
            console.log('Tool: checkVATCompliance called', { period });

            const now = new Date();
            let startDate: Date;

            switch (period) {
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

            // Calculate VAT collected from invoices
            const paidInvoices = await db.select()
              .from(invoices)
              .innerJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
              .where(and(
                eq(invoices.userId, userId),
                eq(invoices.status, 'PAID'),
                gte(invoices.paidAt, startDate)
              ));

            const vatCollected = paidInvoices.reduce((sum, invoice) => {
              const invoiceTotal = Number(invoice.invoice_items.lineTotal || 0);
              const vatAmount = invoice.invoices.vatIncluded 
                ? invoiceTotal * (invoice.invoices.vatRate / (1 + invoice.invoices.vatRate))
                : invoiceTotal * invoice.invoices.vatRate;
              return sum + Number(vatAmount);
            }, 0);

            // Calculate VAT paid on expenses
            const userExpenses = await db.select()
              .from(expenses)
              .where(and(
                eq(expenses.userId, userId),
                gte(expenses.date, startDate)
              ));

            const vatPaid = userExpenses.reduce((sum, expense) => 
              sum + Number(expense.vatAmount || 0), 0);

            const vatOwed = vatCollected - vatPaid;
            const isCompliant = vatOwed >= 0;

            return {
              period: { startDate: startDate.toISOString(), endDate: now.toISOString() },
              vatCollected,
              vatPaid,
              vatOwed: Math.abs(vatOwed),
              isCompliant,
              status: isCompliant ? 'Compliant' : 'Refund Due',
              message: `VAT compliance check complete for ${period}. ${isCompliant ? `R${vatOwed.toFixed(2)} owed to SARS` : `R${Math.abs(vatOwed).toFixed(2)} refund due from SARS`}.`,
            };
          },
        }),
      },
    });

    // Log outgoing message
    await db.insert(messages).values({
      id: uuidv4(),
      conversationId: conversation.id,
      senderId: 'AI',
      recipientId: userId,
      content: text,
      isIncoming: false,
    });

    return text;
  }

  // Helper methods for financial analysis
  private async calculateMonthlyTrends(userId: string, startDate: Date, endDate: Date) {
    // Implementation for monthly revenue trends
    return {};
  }

  private async calculateExpenseCategories(expenses: any[]) {
    return expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);
  }

  private generateFinancialInsights(data: any) {
    const insights = [];
    
    if (data.profitMargin > 20) {
      insights.push("Excellent profit margin! Your business is performing very well.");
    } else if (data.profitMargin > 10) {
      insights.push("Good profit margin. Consider optimizing expenses for better margins.");
    } else if (data.profitMargin > 0) {
      insights.push("Positive profit margin, but there's room for improvement.");
    } else {
      insights.push("Negative profit margin. Immediate action needed to improve profitability.");
    }

    return insights;
  }

  private generateRecommendations(data: any) {
    const recommendations = [];
    
    if (data.profitMargin < 10) {
      recommendations.push("Review and reduce unnecessary expenses");
      recommendations.push("Consider increasing prices if market allows");
      recommendations.push("Focus on higher-margin products/services");
    }

    return recommendations;
  }
}

export const advancedFinancialAIService = new AdvancedFinancialAIService();
