import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { randomUUID } from 'crypto'; // Use Node.js built-in UUID instead of external package

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

// Price‑ID → human plan name mapping (fallback when Stripe price.nickname is empty)
const PRICE_ID_TO_PLAN: Record<string, string> = {
  'price_1RGtl4G23sSyONuFYWYsA0HK': 'Free',
  'price_1RGtkVG23sSyONuF8kQcAclk': 'Pro',
  'price_1RGw3iG23sSyONuFGk8uD3XV': 'Enterprise'
};

function resolvePlanName(priceId: string, stripeNickname?: string | null): string {
  if (stripeNickname && stripeNickname.trim().length > 0) return stripeNickname;
  return PRICE_ID_TO_PLAN[priceId] || 'Unknown Plan';
}

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

// Helper to generate a valid UUID
function generateValidUUID(): string {
  // Use the proper crypto randomUUID function
  return randomUUID();
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // We'll use the service role client to bypass RLS policies
  const supabase = await createClient();
  
  // Handle the event
  switch (event.type) {
    case 'customer.created':
      await reliableDbOperation(async () => {
        const customer = event.data.object as Stripe.Customer;
        
        // Extract account_id from metadata if it exists
        const customerAccountId = customer.metadata?.account_id;
        
        if (!customerAccountId) {
          console.warn('Missing account_id in customer metadata:', customer.id);
          return;
        }

        // Insert into public schema billing_customers table
        await supabase
          .from('billing_customers')
          .insert({
            id: generateValidUUID(),
            created_at: new Date().toISOString(),
            account_id: customerAccountId,
            customer_id: customer.id,
            email: customer.email || ''
          });
        
        console.log(`Customer record created for account ${customerAccountId}`);
      }, event.type, { customerId: (event.data.object as Stripe.Customer).id });
      break;
      
    case 'customer.subscription.created':
      await reliableDbOperation(async () => {
        const subscription = event.data.object as Stripe.Subscription;
        // Safely get customer details
        let accountId: string | undefined = undefined;
        
        try {
          const customerObj = await stripe.customers.retrieve(
            subscription.customer as string
          );
          
          // Only access metadata if customer is not deleted
          if (!(customerObj as any).deleted) {
            accountId = (customerObj as Stripe.Customer).metadata?.account_id;
          }
        } catch (err) {
          console.error('Error retrieving customer:', err);
        }
        
        if (!accountId) {
          console.warn('Missing account_id in customer metadata:', subscription.customer);
          return;
        }
        
        // Insert subscription record
        try {
          await supabase
            .from('billing_subscriptions')  
            .insert({
              id: generateValidUUID(),
              created_at: new Date().toISOString(),
              account_id: accountId,
              subscription_id: subscription.id,
              customer_id: subscription.customer as string,
              price_id: subscription.items.data[0].price.id,
              plan_name: resolvePlanName(subscription.items.data[0].price.id, subscription.items.data[0].price.nickname),
              status: subscription.status,
              current_period_start: safeIsoDate((subscription as any).current_period_start),
              current_period_end: safeIsoDate((subscription as any).current_period_end),
            });
          
          console.log(`Subscription created in public schema for account ${accountId} - plan ${resolvePlanName(subscription.items.data[0].price.id, subscription.items.data[0].price.nickname)}`);
        } catch (err) {
          console.error(`Error saving subscription to public schema: ${err}`);
          // Continue execution - don't let this error stop the webhook
        }
      }, event.type, { subscriptionId: (event.data.object as Stripe.Subscription).id });
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
          const { data: existingCustomer } = await supabase
            .from('billing_customers')
            .select('customer_id')
            .eq('account_id', accountId)
            .single();
            
          if (!existingCustomer) {
            // Create customer record first
            await supabase
              .from('billing_customers')
              .insert({
                account_id: accountId,
                customer_id: subscription.customer as string,
                email: session.customer_details?.email || 'unknown@example.com',
                created_at: new Date().toISOString(),
                id: generateValidUUID()
              });
            
            console.log(`Created new customer for account ${accountId}`);
          }
          
          // Then add subscription
          try {
            await supabase
              .from('billing_subscriptions')  
              .insert({
                id: generateValidUUID(),
                account_id: accountId,
                subscription_id: subscription.id,
                customer_id: subscription.customer as string,
                price_id: subscription.items.data[0].price.id,
                plan_name: resolvePlanName(subscription.items.data[0].price.id, subscription.items.data[0].price.nickname),
                status: subscription.status,
                current_period_start: safeIsoDate((subscription as any).current_period_start),
                current_period_end: safeIsoDate((subscription as any).current_period_end),
                created_at: new Date().toISOString()
              });
            
            console.log(`Checkout subscription created in public schema for account ${accountId} - plan ${resolvePlanName(subscription.items.data[0].price.id, subscription.items.data[0].price.nickname)}`);
          } catch (err) {
            console.error(`Error saving checkout subscription to public schema: ${err}`);
            // Continue execution - don't let this error stop the webhook
          }
        }, event.type, { accountId, subscriptionId: subscription.id });
        
        if (success) {
          await logWebhookEvent(event.type, { 
            accountId, 
            subscriptionId: subscription.id,
            planName: resolvePlanName(subscription.items.data[0].price.id, subscription.items.data[0].price.nickname),
            status: 'success'
          });
        }
      }
      break;
      
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      
      await reliableDbOperation(async () => {
        // Update subscription in database
        await supabase
          .from('billing_subscriptions')
          .update({
            price_id: updatedSubscription.items.data[0].price.id,
            plan_name: resolvePlanName(updatedSubscription.items.data[0].price.id, updatedSubscription.items.data[0].price.nickname),
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
        await supabase
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
      
      // Special handling for users who might be stuck - check if this is a checkout-related event
      if (event.type.startsWith('checkout.') || event.type.includes('checkout')) {
        try {
          const eventObject = event.data.object as any;
          if (eventObject && eventObject.customer && eventObject.metadata?.account_id) {
            const accountId = eventObject.metadata.account_id;
            const customerId = eventObject.customer;
            
            console.log(`Special handling for potential stuck user: ${accountId} with customer ID: ${customerId}`);
            
            // Check if user has subscriptions in Stripe but not in our database
            const stripeSubscriptions = await stripe.subscriptions.list({
              customer: customerId,
              status: 'active',
              limit: 1
            });
            
            if (stripeSubscriptions.data.length > 0) {
              const subscription = stripeSubscriptions.data[0];
              
              // Check if subscription exists in our database
              const { data: existingSubscription } = await supabase
                .from('billing_subscriptions')
                .select('subscription_id')
                .eq('account_id', accountId)
                .eq('subscription_id', subscription.id)
                .single();
              
              // If no record found, add the subscription
              if (!existingSubscription) {
                console.log(`Fixing stuck user: Adding missing subscription ${subscription.id} for ${accountId}`);
                
                try {
                  await supabase
                    .from('billing_subscriptions')
                    .insert({
                      id: generateValidUUID(),
                      account_id: accountId,
                      subscription_id: subscription.id,
                      customer_id: customerId,
                      price_id: subscription.items.data[0].price.id,
                      plan_name: resolvePlanName(subscription.items.data[0].price.id, subscription.items.data[0].price.nickname),
                      status: subscription.status,
                      current_period_start: safeIsoDate((subscription as any).current_period_start),
                      current_period_end: safeIsoDate((subscription as any).current_period_end),
                      created_at: new Date().toISOString()
                    });
                  
                  console.log(`Successfully fixed subscription for stuck user ${accountId}`);
                } catch (err) {
                  console.error(`Error fixing stuck user subscription: ${err}`);
                }
              }
            }
          }
        } catch (err) {
          console.error(`Error in special stuck user handling: ${err}`);
          // Continue with normal webhook processing
        }
      }
  }

  return NextResponse.json({ received: true });
}
