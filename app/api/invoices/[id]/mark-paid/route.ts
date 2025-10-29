import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { invoices, invoiceItems, payments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const MarkPaidSchema = z.object({
  userId: z.string().uuid(),
});

// POST /api/invoices/[id]/mark-paid - Mark invoice as paid
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = MarkPaidSchema.parse(body);
    const invoiceId = params.id;

    // Get invoice with items
    const invoice = await db.select({
      id: invoices.id,
      userId: invoices.userId,
      status: invoices.status,
      vatIncluded: invoices.vatIncluded,
      vatRate: invoices.vatRate,
    })
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, validatedData.userId)))
    .limit(1);

    if (invoice.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice[0].status === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    // Get invoice items to calculate total
    const items = await db.select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));

    const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
    const vatAmount = invoice[0].vatIncluded 
      ? subtotal * (invoice[0].vatRate / (1 + invoice[0].vatRate))
      : subtotal * invoice[0].vatRate;
    const total = invoice[0].vatIncluded ? subtotal : subtotal + vatAmount;

    // Update invoice status
    await db.update(invoices)
      .set({ 
        status: 'PAID',
        paidAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    // Create payment record
    await db.insert(payments).values({
      invoiceId,
      amount: total,
      method: 'Manual',
      paidAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice marked as paid',
      invoice: {
        id: invoiceId,
        status: 'PAID',
        amount: total,
        paidAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Mark paid error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to mark invoice as paid' },
      { status: 500 }
    );
  }
}
