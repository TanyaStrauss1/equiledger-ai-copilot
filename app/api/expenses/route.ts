import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, expenses } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

const CreateExpenseSchema = z.object({
  userId: z.string().uuid(),
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  date: z.string().optional(),
});

// GET /api/expenses - List expenses for a user
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userExpenses = await db.select()
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(expenses.date);

    return NextResponse.json({
      success: true,
      expenses: userExpenses,
    });

  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreateExpenseSchema.parse(body);

    // Get user
    const user = await db.select().from(users).where(eq(users.id, validatedData.userId)).limit(1);
    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate VAT
    const vatRate = 0.15;
    const vatAmount = validatedData.amount * (vatRate / (1 + vatRate));

    // Create expense
    const expenseDate = validatedData.date ? new Date(validatedData.date) : new Date();
    
    const newExpense = await db.insert(expenses).values({
      userId: validatedData.userId,
      description: validatedData.description,
      amount: validatedData.amount,
      currency: 'ZAR',
      category: validatedData.category,
      date: expenseDate,
      vatAmount,
    }).returning();

    return NextResponse.json({
      success: true,
      expense: {
        id: newExpense[0].id,
        description: validatedData.description,
        amount: validatedData.amount,
        category: validatedData.category,
        date: expenseDate.toISOString(),
        vatAmount,
        createdAt: newExpense[0].createdAt,
      },
    });

  } catch (error) {
    console.error('Create expense error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
