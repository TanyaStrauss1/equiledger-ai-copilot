import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, clients, invoices, invoiceItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Request schemas
const CreateInvoiceSchema = z.object({
  userId: z.string().uuid(),
  clientName: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().min(1),
  dueInDays: z.number().positive().default(30),
});

const MarkPaidSchema = z.object({
  userId: z.string().uuid(),
});

// GET /api/invoices - List invoices for a user
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

    const userInvoices = await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      amount: invoices.amount,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
      clientName: clients.name,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.userId, userId))
    .orderBy(invoices.createdAt);

    return NextResponse.json({
      success: true,
      invoices: userInvoices,
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create new invoice
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreateInvoiceSchema.parse(body);

    // Get or create user
    let user = await db.select().from(users).where(eq(users.id, validatedData.userId)).limit(1);
    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get or create client
    let client = await db.select().from(clients)
      .where(and(eq(clients.userId, validatedData.userId), eq(clients.name, validatedData.clientName)))
      .limit(1);
    
    if (client.length === 0) {
      const newClient = await db.insert(clients).values({
        userId: validatedData.userId,
        name: validatedData.clientName,
      }).returning();
      client = newClient;
    }

    // Calculate amounts
    const vatRate = 0.15;
    const subtotal = validatedData.amount / (1 + vatRate);
    const vatAmount = validatedData.amount - subtotal;

    // Generate invoice number
    const invoiceCount = await db.select().from(invoices).where(eq(invoices.userId, validatedData.userId));
    const invoiceNumber = `INV-${String(invoiceCount.length + 1).padStart(4, '0')}`;

    // Create invoice
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + validatedData.dueInDays);

    const newInvoice = await db.insert(invoices).values({
      userId: validatedData.userId,
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
      description: validatedData.description,
      quantity: 1,
      unitPrice: subtotal,
      lineTotal: subtotal,
    });

    return NextResponse.json({
      success: true,
      invoice: {
        id: newInvoice[0].id,
        invoiceNumber,
        clientName: validatedData.clientName,
        amount: validatedData.amount,
        status: 'DRAFT',
        dueDate: dueDate.toISOString(),
        createdAt: newInvoice[0].createdAt,
      },
    });

  } catch (error) {
    console.error('Create invoice error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
