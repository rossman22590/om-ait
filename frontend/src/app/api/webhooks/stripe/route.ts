import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createClient();

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Get account ID from metadata
      const accountId = session.metadata?.account_id;
      
      if (accountId && session.subscription) {
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        // Insert into billing_subscriptions table
        await supabase
          .schema('basejump')
          .from('billing_subscriptions')
          .insert({
            account_id: accountId,
            subscription_id: subscription.id,
            customer_id: subscription.customer as string,
            price_id: subscription.items.data[0].price.id,
            plan_name: subscription.items.data[0].price.nickname || 'Unknown Plan',
            status: subscription.status,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            created_at: new Date().toISOString()
          });
      }
      break;
      
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      
      // Update subscription in database
      await supabase
        .schema('basejump')
        .from('billing_subscriptions')
        .update({
          price_id: updatedSubscription.items.data[0].price.id,
          plan_name: updatedSubscription.items.data[0].price.nickname || 'Unknown Plan',
          status: updatedSubscription.status,
          current_period_start: new Date((updatedSubscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((updatedSubscription as any).current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', updatedSubscription.id);
      break;
      
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      
      // Update subscription status to canceled
      await supabase
        .schema('basejump')
        .from('billing_subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', deletedSubscription.id);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
