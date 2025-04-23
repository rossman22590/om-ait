'use server'

import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Define our custom plan limits
const SUBSCRIPTION_TIERS = {
  'free': { name: 'free', minutes: 50, price_id: process.env.STRIPE_FREE_PLAN_ID || '' },
  'pro': { name: 'pro', minutes: 300, price_id: process.env.STRIPE_PRO_PLAN_ID || '' },
  'enterprise': { name: 'enterprise', minutes: 2400, price_id: process.env.STRIPE_ENTERPRISE_PLAN_ID || '' }
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
})

// Define consistent return type for billing functions 
export type BillingResult = { url?: string; error?: string };

export async function getBillingStatus(accountId: string) {
  const supabase = await createClient()
  
  // Get subscription data - ONLY from public schema now
  let subscriptionData = null;
  
  try {
    // Only check public schema - basejump schema no longer used for billing
    const { data: publicSubscription } = await supabase
      .from('billing_subscriptions')
      .select('price_id, plan_name, status')
      .eq('account_id', accountId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (publicSubscription) {
      console.log('Found subscription in public schema:', publicSubscription);
      subscriptionData = publicSubscription;
    }
  } catch (error) {
    console.error('Error fetching subscription data:', error);
  }
  
  // Default to free tier if no subscription found
  const priceId = subscriptionData?.price_id || process.env.STRIPE_FREE_PLAN_ID || 'price_1RGtl4G23sSyONuFYWYsA0HK'
  const planName = subscriptionData?.plan_name || 'Free'
  const status = subscriptionData?.status || 'active'
  
  console.log('Billing status check:', { 
    accountId, 
    priceId, 
    planName,
    status 
  });
  
  // Determine the tier based on price_id first (most reliable), then plan name as fallback
  let tierName = 'free';
  
  // First try to match by price_id (most reliable)
  if (priceId === process.env.STRIPE_PRO_PLAN_ID || priceId === 'price_1RGtkVG23sSyONuF8kQcAclk') {
    tierName = 'pro';
    console.log('Matched Pro tier by price_id');
  } else if (priceId === process.env.STRIPE_ENTERPRISE_PLAN_ID || priceId === 'price_1RGw3iG23sSyONuFGk8uD3XV') {
    tierName = 'enterprise';
    console.log('Matched Enterprise tier by price_id');
  } else {
    // Fallback to plan name matching (case insensitive)
    const lowerPlanName = planName.toLowerCase();
    if (lowerPlanName.includes('pro')) {
      tierName = 'pro';
      console.log('Matched Pro tier by plan name');
    } else if (lowerPlanName.includes('enterprise')) {
      tierName = 'enterprise';
      console.log('Matched Enterprise tier by plan name');
    } else {
      console.log('Using free tier (no match found)');
    }
  }
  
  // Get start of current month in UTC
  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  
  // First get threads for this account - only from public schema
  const { data: threadsData } = await supabase
    .from('threads')
    .select('thread_id')
    .eq('account_id', accountId)
  
  const threadIds = threadsData?.map(t => t.thread_id) || [];
  
  // Then get agent runs for those threads - only from public schema
  let agentRunData: any[] = [];
  if (threadIds.length > 0) {
    const { data: runsData } = await supabase
      .from('agent_runs')
      .select('started_at, completed_at')
      .in('thread_id', threadIds)
      .gte('started_at', startOfMonth.toISOString());
    
    if (runsData && runsData.length > 0) {
      agentRunData = runsData;
    }
  }
  
  // Calculate total minutes
  let totalSeconds = 0
  if (agentRunData.length > 0) {
    totalSeconds = agentRunData.reduce((acc, run) => {
      const start = new Date(run.started_at)
      const end = run.completed_at ? new Date(run.completed_at) : new Date()
      const seconds = (end.getTime() - start.getTime()) / 1000
      return acc + seconds
    }, 0)
  }
  
  const usageMinutes = totalSeconds / 60
  const tierInfo = SUBSCRIPTION_TIERS[tierName] || SUBSCRIPTION_TIERS['free']
  
  console.log('Final billing status:', {
    tierName,
    planName,
    priceId,
    usage: usageMinutes,
    limit: tierInfo.minutes,
    can_run: usageMinutes < tierInfo.minutes
  });
  
  return {
    price_id: priceId,
    plan_name: planName,
    status: status,
    usage_minutes: usageMinutes,
    limit_minutes: tierInfo.minutes,
    can_run: usageMinutes < tierInfo.minutes,
    billing_enabled: true
  }
}

export async function createCheckoutSession(formData: FormData): Promise<BillingResult> {
  const accountId = formData.get('accountId') as string
  const planId = formData.get('planId') as string
  const returnUrl = formData.get('returnUrl') as string
  
  if (!accountId || !planId) {
    return { error: 'Missing account ID or plan ID' }
  }
  
  console.log('Creating checkout session', { accountId, planId })
  
  const supabase = await createClient()
  
  // Get user email from account data
  let userEmail
  
  try {
    // Get created_by from accounts
    const { data: accountData } = await supabase
      .from('accounts')
      .select('created_by')
      .eq('account_id', accountId)
      .single()
    
    if (accountData?.created_by) {
      // Get email from users
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', accountData.created_by)
        .single()
      
      if (userData?.email) {
        userEmail = userData.email
      }
    }
  } catch (error) {
    console.error('Error fetching user email:', error)
  }
  
  if (!userEmail) {
    return { error: 'Could not determine user email' }
  }
  
  // Get customer data
  let customerId
  
  try {
    // Look up customer in billing_customers
    const { data: customerData } = await supabase
      .from('billing_customers')
      .select('customer_id')
      .eq('account_id', accountId)
      .maybeSingle()
    
    if (customerData?.customer_id) {
      customerId = customerData.customer_id
      console.log('Found existing customer:', customerId)
    }
  } catch (error) {
    console.error('Error fetching customer:', error)
  }
  
  // Create customer if not found
  if (!customerId) {
    try {
      console.log('Creating new customer for:', userEmail)
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { account_id: accountId }
      })
      
      customerId = customer.id
      
      // Store in DB
      const { error: insertError } = await supabase
        .from('billing_customers')
        .insert({
          account_id: accountId,
          customer_id: customerId,
          email: userEmail
        })
      
      if (insertError) {
        console.error('Error storing customer:', insertError)
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      return { error: 'Could not create customer. Please try again.' }
    }
  }
  
  // Determine price ID based on plan
  let priceId = ''
  
  if (planId === 'pro') {
    priceId = process.env.STRIPE_PRO_PLAN_ID || 'price_1RGtkVG23sSyONuF8kQcAclk'
  } else if (planId === 'enterprise') {
    priceId = process.env.STRIPE_ENTERPRISE_PLAN_ID || 'price_1RGw3iG23sSyONuFGk8uD3XV'
  } else {
    return { error: 'Invalid plan selected' }
  }
  
  // Create checkout session
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: returnUrl,
      cancel_url: returnUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        account_id: accountId
      },
      expand: ['payment_intent']
    })
    
    console.log('Stripe session created:', {
      id: session.id,
      url: session.url,
      customer: session.customer,
      status: session.status,
    });
    
    return { url: session.url || '' }
  } catch (error) {
    console.error('Stripe error:', error)
    return { error: `Stripe error: ${error.message || 'Unknown error'}` }
  }
}

export async function createPortalSession(formData: FormData): Promise<BillingResult> {
  const accountId = formData.get('accountId') as string;
  const returnUrl = formData.get('returnUrl') as string;
  
  if (!accountId) {
    return { error: 'Missing account ID' };
  }

  try {
    // Get the subscription data directly from database
    const supabase = await createClient();
    
    console.log(`Looking up subscription data for account: ${accountId}`);
    
    // Get the subscription with customer_id from database
    const { data: subscription } = await supabase
      .from('billing_subscriptions')
      .select('customer_id, subscription_id')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Check if we found the subscription with customer_id
    if (subscription?.customer_id) {
      console.log(`Found customer_id in subscription: ${subscription.customer_id}`);
      
      try {
        // Create Stripe portal session with the customer_id
        const session = await stripe.billingPortal.sessions.create({
          customer: subscription.customer_id,
          return_url: returnUrl
        });
        
        console.log(`Created portal session: ${session.url}`);
        return { url: session.url };
      } catch (stripeError) {
        console.error('Stripe portal creation error:', stripeError);
        return { error: `Stripe error: ${stripeError.message}` };
      }
    } else {
      console.error('No customer_id found in subscription');
      return { error: 'Could not find customer ID in subscription' };
    }
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return { error: 'Error accessing your subscription data' };
  }
}
