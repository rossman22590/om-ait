import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

// Maximum retries for database operations
const MAX_RETRIES = 3;

// Utility function to add a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Safely convert timestamps
const safeIsoDate = (timestamp: number | null | undefined): string => {
  if (!timestamp) return new Date().toISOString();
  try {
    return new Date(timestamp * 1000).toISOString();
  } catch (e) {
    console.error('Invalid timestamp:', timestamp);
    return new Date().toISOString();
  }
};

// Function to log webhook events to a reliable source
async function logWebhookEvent(eventType: string, details: any, error?: any) {
  try {
    // Create a more permanent record of the event
    const supabase = await createClient();
    await supabase
      .from('webhook_logs')
      .insert({
        event_type: eventType,
        data: JSON.stringify(details),
        error: error ? JSON.stringify(error) : null,
        created_at: new Date().toISOString()
      });
      
    console.log(`Webhook event logged: ${eventType}`, { details: details, error: error });
  } catch (logError) {
    // Even our logging failed, so use console as last resort
    console.error('Failed to log webhook event', { 
      eventType, 
      details, 
      originalError: error,
      loggingError: logError 
    });
  }
}

// Function to perform reliable database operations with retries
async function reliableDbOperation(operation: () => Promise<any>, eventType: string, details: any): Promise<boolean> {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      await operation();
      console.log(`Successfully performed database operation for ${eventType}`);
      return true;
    } catch (error) {
      retries++;
      console.error(`Error in database operation (attempt ${retries}/${MAX_RETRIES}):`, error);
      
      if (retries >= MAX_RETRIES) {
        await logWebhookEvent(eventType, details, error);
        return false;
      }
      
      // Exponential backoff
      await delay(Math.pow(2, retries) * 100);
    }
  }
  
  return false;
}

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

  // We'll use the service role client to bypass RLS policies
  const supabaseAdmin = await createClient();
  
  // Handle the event
  switch (event.type) {
    case 'customer.created':
      const customer = event.data.object as Stripe.Customer;
      console.log(`Customer created: ${customer.id}`);
      
      // Extract account_id from metadata if it exists
      const customerAccountId = customer.metadata?.account_id;
      
      if (customerAccountId) {
        // Store customer in database
        await reliableDbOperation(async () => {
          await supabaseAdmin
            .from('billing_customers')
            .insert({
              account_id: customerAccountId,
              customer_id: customer.id,
              email: customer.email || 'unknown@example.com',
              created_at: new Date().toISOString()
            });
            
          console.log(`Customer ${customer.id} stored in database for account ${customerAccountId}`);
        }, event.type, { customerId: customer.id, accountId: customerAccountId });
      }
      break;
      
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Get account ID from metadata
      const accountId = session.metadata?.account_id;
      
      if (accountId && session.subscription) {
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        // Create reliable record in database
        const success = await reliableDbOperation(async () => {
          // First ensure the customer exists
          const { data: existingCustomer } = await supabaseAdmin
            .from('billing_customers')
            .select('customer_id')
            .eq('account_id', accountId)
            .single();
            
          if (!existingCustomer) {
            // Create customer record first
            await supabaseAdmin
              .from('billing_customers')
              .insert({
                account_id: accountId,
                customer_id: subscription.customer as string,
                email: session.customer_details?.email || 'unknown@example.com',
                created_at: new Date().toISOString()
              });
            
            console.log(`Created new customer for account ${accountId}`);
          }
          
          // Then add subscription
          await supabaseAdmin
            .from('billing_subscriptions')
            .insert({
              account_id: accountId,
              subscription_id: subscription.id,
              customer_id: subscription.customer as string,
              price_id: subscription.items.data[0].price.id,
              plan_name: subscription.items.data[0].price.nickname || 'Unknown Plan',
              status: subscription.status,
              current_period_start: safeIsoDate((subscription as any).current_period_start),
              current_period_end: safeIsoDate((subscription as any).current_period_end),
              created_at: new Date().toISOString()
            });
            
          console.log(`Subscription activated for account ${accountId} - plan ${subscription.items.data[0].price.nickname || 'Unknown'}`);
        }, event.type, { accountId, subscriptionId: subscription.id });
        
        if (success) {
          await logWebhookEvent(event.type, { 
            accountId, 
            subscriptionId: subscription.id,
            planName: subscription.items.data[0].price.nickname,
            status: 'success'
          });
        }
      }
      break;
      
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      
      await reliableDbOperation(async () => {
        // Update subscription in database
        await supabaseAdmin
          .from('billing_subscriptions')
          .update({
            price_id: updatedSubscription.items.data[0].price.id,
            plan_name: updatedSubscription.items.data[0].price.nickname || 'Unknown Plan',
            status: updatedSubscription.status,
            current_period_start: safeIsoDate((updatedSubscription as any).current_period_start),
            current_period_end: safeIsoDate((updatedSubscription as any).current_period_end),
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', updatedSubscription.id);
      }, event.type, { subscriptionId: updatedSubscription.id });
      break;
      
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      
      await reliableDbOperation(async () => {
        // Update subscription status to canceled
        await supabaseAdmin
          .from('billing_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', deletedSubscription.id);
      }, event.type, { subscriptionId: deletedSubscription.id });
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
