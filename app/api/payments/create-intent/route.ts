import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const CreatePaymentIntentSchema = z.object({
  userId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('zar'),
});

// POST /api/payments/create-intent - Create Stripe payment intent
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreatePaymentIntentSchema.parse(body);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(validatedData.amount * 100), // Convert to cents
      currency: validatedData.currency,
      metadata: {
        userId: validatedData.userId,
        invoiceId: validatedData.invoiceId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

// POST /api/payments/webhook - Handle Stripe webhooks
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { userId, invoiceId } = paymentIntent.metadata;
  
  if (!userId || !invoiceId) {
    console.error('Missing metadata in payment intent:', paymentIntent.id);
    return;
  }

  // Update invoice status to paid
  // This would typically involve updating your database
  console.log(`Payment succeeded for invoice ${invoiceId} by user ${userId}`);
  
  // TODO: Update invoice status in database
  // TODO: Send confirmation email/SMS
  // TODO: Generate receipt
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const { userId, invoiceId } = paymentIntent.metadata;
  
  if (!userId || !invoiceId) {
    console.error('Missing metadata in payment intent:', paymentIntent.id);
    return;
  }

  console.log(`Payment failed for invoice ${invoiceId} by user ${userId}`);
  
  // TODO: Send failure notification
  // TODO: Update invoice status
  // TODO: Retry logic if appropriate
}
