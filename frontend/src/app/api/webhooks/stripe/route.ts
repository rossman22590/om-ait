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

// Track processed webhook events to prevent double-processing
const processedEvents = new Set();

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
      // Log successful operation for auditing
      await logWebhookEvent(`${eventType}_success`, details);
      return true;
    } catch (error) {
      retries++;
      console.error(`Error in database operation (attempt ${retries}/${MAX_RETRIES}):`, error);
      
      if (retries >= MAX_RETRIES) {
        await logWebhookEvent(`${eventType}_failed`, { ...details, error: String(error) });
        return false;
      }
      
      // Exponential backoff with jitter to avoid thundering herd
      const jitter = Math.random() * 100;
      await delay(Math.pow(2, retries) * 100 + jitter);
    }
  }
  
  return false;
}

// Helper to generate a valid UUID
function generateValidUUID(): string {
  try {
    // Use the proper crypto randomUUID function
    return randomUUID();
  } catch (error) {
    // Fallback in case randomUUID fails
    console.error('Error generating UUID with randomUUID, using fallback:', error);
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Type augmentation for Stripe types to avoid TypeScript errors
interface StripeSubscriptionWithDates extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

// Utility function to add better type safety when accessing subscription dates
function getSubscriptionWithDates(subscription: Stripe.Subscription): StripeSubscriptionWithDates {
  return subscription as StripeSubscriptionWithDates;
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
  
  // Prevent duplicate processing of the same event
  const eventId = event.id;
  if (processedEvents.has(eventId)) {
    console.log(`Event ${eventId} already processed, skipping`);
    return NextResponse.json({ received: true, status: 'already_processed' });
  }
  
  // Mark event as being processed
  processedEvents.add(eventId);
  
  // Limit the size of the Set to prevent memory leaks
  if (processedEvents.size > 1000) {
    const iterator = processedEvents.values();
    processedEvents.delete(iterator.next().value);
  }

  // We'll use the service role client to bypass RLS policies
  const supabase = await createClient();
  
  // Log all incoming events for debugging and auditing
  await logWebhookEvent('webhook_received', { 
    event_id: event.id,
    event_type: event.type,
    created: event.created
  });
  
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
          .upsert({
            id: generateValidUUID(),
            created_at: new Date().toISOString(),
            account_id: customerAccountId,
            customer_id: customer.id,
            email: customer.email || ''
          }, {
            onConflict: 'customer_id'
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
          const typedSubscription = getSubscriptionWithDates(subscription);
          await supabase
            .from('billing_subscriptions')  
            .upsert({
              id: generateValidUUID(),
              created_at: new Date().toISOString(),
              account_id: accountId,
              subscription_id: subscription.id,
              customer_id: subscription.customer as string,
              price_id: subscription.items.data[0].price.id,
              plan_name: resolvePlanName(subscription.items.data[0].price.id, subscription.items.data[0].price.nickname),
              status: subscription.status,
              current_period_start: safeIsoDate(typedSubscription.current_period_start),
              current_period_end: safeIsoDate(typedSubscription.current_period_end),
            }, {
              onConflict: 'subscription_id'
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
      
      if (session.subscription && session.customer) {
        // Log extra details for debugging
        console.log(`Processing checkout.session.completed event: ${session.id}`);
        console.log(`Subscription ID: ${session.subscription}`);
        console.log(`Customer ID: ${session.customer}`);
        console.log(`Account ID from metadata: ${session.metadata?.account_id}`);
        
        await reliableDbOperation(async () => {
          try {
            // First, fetch the subscription details from Stripe
            const subscriptionDetails = await stripe.subscriptions.retrieve(
              session.subscription as string
            );
            
            // Convert to typed subscription with dates
            const typedSubscriptionDetails = getSubscriptionWithDates(subscriptionDetails);
            
            // Log subscription details for debugging
            console.log('Retrieved subscription details:', {
              id: subscriptionDetails.id,
              status: subscriptionDetails.status,
              items: subscriptionDetails.items.data.map(item => ({
                price_id: item.price.id,
                nickname: item.price.nickname
              }))
            });
            
            if (subscriptionDetails.items.data.length > 0) {
              const priceId = subscriptionDetails.items.data[0].price.id;
              const planName = resolvePlanName(
                priceId,
                subscriptionDetails.items.data[0].price.nickname
              );
              
              // Generate a valid UUID
              const validUuid = generateValidUUID();
              console.log(`Generated UUID for new subscription: ${validUuid}`);
              
              // Create new subscription entry - try public schema FIRST
              try {
                const result = await supabase
                  .from('billing_subscriptions')
                  .upsert({
                    id: validUuid,
                    account_id: session.metadata?.account_id,
                    subscription_id: subscriptionDetails.id,
                    customer_id: session.customer as string,
                    price_id: priceId,
                    plan_name: planName,
                    status: subscriptionDetails.status,
                    current_period_start: safeIsoDate(typedSubscriptionDetails.current_period_start),
                    current_period_end: safeIsoDate(typedSubscriptionDetails.current_period_end),
                    created_at: new Date().toISOString()
                  }, {
                    onConflict: 'subscription_id'
                  });
                  
                console.log(`Subscription created for account ${session.metadata?.account_id} with plan ${planName}`);
                
                // VERIFICATION: Check that the record was actually inserted
                const verificationCheck = await supabase
                  .from('billing_subscriptions')
                  .select('*')
                  .eq('id', validUuid)
                  .single();
                
                if (verificationCheck.error) {
                  console.error('VERIFICATION FAILED: Could not find the inserted subscription record:', verificationCheck.error);
                  await logWebhookEvent('subscription_verification_failed', {
                    uuid: validUuid,
                    account_id: session.metadata?.account_id,
                    subscription_id: subscriptionDetails.id,
                    error: verificationCheck.error
                  });
                } else {
                  console.log('VERIFICATION PASSED: Subscription record confirmed in database:', verificationCheck.data);
                }
              } catch (publicSchemaError) {
                console.error('Failed to insert into public schema:', publicSchemaError);
                
                // Try basejump schema as fallback
                try {
                  const fallbackResult = await supabase
                    .schema('basejump')
                    .from('billing_subscriptions')
                    .upsert({
                      id: validUuid,
                      account_id: session.metadata?.account_id,
                      subscription_id: subscriptionDetails.id,
                      customer_id: session.customer as string,
                      price_id: priceId,
                      plan_name: planName,
                      status: subscriptionDetails.status,
                      current_period_start: safeIsoDate(typedSubscriptionDetails.current_period_start),
                      current_period_end: safeIsoDate(typedSubscriptionDetails.current_period_end),
                      created_at: new Date().toISOString()
                    }, {
                      onConflict: 'subscription_id'
                    });
                    
                  if (fallbackResult.error) {
                    throw new Error(`Error inserting into basejump schema: ${fallbackResult.error.message}`);
                  }
                  
                  console.log(`Successfully inserted subscription ${subscriptionDetails.id} into basejump schema`);
                } catch (basejumpSchemaError) {
                  // If both schemas fail, log properly for debugging
                  console.error('Failed to insert into both schemas:', basejumpSchemaError);
                  throw new Error('Failed to insert subscription into any schema');
                }
              }
            } else {
              console.error('Subscription has no items:', subscriptionDetails);
            }
          } catch (error) {
            console.error('Error processing checkout session:', error);
            throw error; // Rethrow to trigger webhook logging
          }
        }, event.type, { 
          sessionId: session.id, 
          subscriptionId: session.subscription,
          customerId: session.customer,
          accountId: session.metadata?.account_id
        });
      }
      break;
      
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      const typedUpdatedSubscription = getSubscriptionWithDates(updatedSubscription);
      
      await reliableDbOperation(async () => {
        // Add transaction for atomicity
        const { error } = await supabase.rpc('begin_transaction');
        if (error) throw error;
        
        try {
          // Update subscription in database
          await supabase
            .from('billing_subscriptions')
            .update({
              price_id: updatedSubscription.items.data[0].price.id,
              plan_name: resolvePlanName(updatedSubscription.items.data[0].price.id, updatedSubscription.items.data[0].price.nickname),
              status: updatedSubscription.status,
              current_period_start: safeIsoDate(typedUpdatedSubscription.current_period_start),
              current_period_end: safeIsoDate(typedUpdatedSubscription.current_period_end),
              updated_at: new Date().toISOString()
            })
            .eq('subscription_id', updatedSubscription.id);
            
          await supabase.rpc('commit_transaction');
        } catch (error) {
          await supabase.rpc('rollback_transaction');
          throw error;
        }
      }, event.type, { subscriptionId: updatedSubscription.id });
      break;
      
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      const typedDeletedSubscription = getSubscriptionWithDates(deletedSubscription);
      
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
              const typedSubscription = getSubscriptionWithDates(subscription);
              
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
                    .upsert({
                      id: generateValidUUID(),
                      account_id: accountId,
                      subscription_id: subscription.id,
                      customer_id: customerId,
                      price_id: subscription.items.data[0].price.id,
                      plan_name: resolvePlanName(subscription.items.data[0].price.id, subscription.items.data[0].price.nickname),
                      status: subscription.status,
                      current_period_start: safeIsoDate(typedSubscription.current_period_start),
                      current_period_end: safeIsoDate(typedSubscription.current_period_end),
                      created_at: new Date().toISOString()
                    }, {
                      onConflict: 'subscription_id'
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
