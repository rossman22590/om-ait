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

export async function createCheckoutSession(formData: FormData) {
  const accountId = formData.get('accountId') as string
  const planId = formData.get('planId') as string
  const returnUrl = formData.get('returnUrl') as string
  
  if (!accountId || !planId) {
    throw new Error('Missing required fields')
  }
  
  // Get the price ID from the plan ID
  let priceId = '';
  if (planId === 'pro') {
    priceId = process.env.STRIPE_PRO_PLAN_ID || '';
  } else if (planId === 'enterprise') {
    priceId = process.env.STRIPE_ENTERPRISE_PLAN_ID || '';
  } else {
    priceId = process.env.STRIPE_FREE_PLAN_ID || '';
  }
  
  // Check if we have a valid price ID
  if (!priceId) {
    console.error(`No price ID found for plan: ${planId}`);
    console.log('Available environment variables:', {
      STRIPE_FREE_PLAN_ID: process.env.STRIPE_FREE_PLAN_ID ? 'Set' : 'Not set',
      STRIPE_PRO_PLAN_ID: process.env.STRIPE_PRO_PLAN_ID ? 'Set' : 'Not set',
      STRIPE_ENTERPRISE_PLAN_ID: process.env.STRIPE_ENTERPRISE_PLAN_ID ? 'Set' : 'Not set'
    });
    throw new Error(`No price ID found for plan: ${planId}. Please check your environment variables.`);
  }
  
  const supabase = await createClient()
  
  // Get user email for the account
  let accountData;
  
  try {
    // Try public schema
    const { data: publicAccountData, error: publicError } = await supabase
      .from('accounts')
      .select('created_by')
      .eq('account_id', accountId)
      .single()
    
    if (publicAccountData) {
      accountData = publicAccountData;
    }
  } catch (error) {
    console.error('Error fetching account:', error);
  }
  
  if (!accountData) {
    // If account not found, try to use the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      accountData = { created_by: user.id };
    } else {
      throw new Error('Account not found')
    }
  }
  
  const userId = accountData.created_by
  
  // Get user email
  let userData;
  
  try {
    // Try public schema
    const { data: publicUserData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()
    
    if (publicUserData) {
      userData = publicUserData;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
  }
  
  if (!userData) {
    // If user not found, try to use the current user's email
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && user.email) {
      userData = { email: user.email };
    } else {
      throw new Error('User not found')
    }
  }
  
  // Create or retrieve customer
  let customerId: string
  
  // Check if customer already exists
  const { data: customerData } = await supabase
    .from('billing_customers')
    .select('customer_id')
    .eq('account_id', accountId)
    .single()
  
  if (customerData?.customer_id) {
    customerId = customerData.customer_id
  } else {
    // Create new customer
    const customer = await stripe.customers.create({
      email: userData.email,
      metadata: {
        account_id: accountId
      }
    })
    
    // Save customer ID
    await supabase
      .from('billing_customers')
      .insert({
        account_id: accountId,
        customer_id: customer.id,
        email: userData.email
      })
    
    customerId = customer.id
  }
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3003'}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3003'}/settings/billing?canceled=true`,
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
  
  return { url: session.url }
}

export async function createPortalSession(formData: FormData) {
  const accountId = formData.get('accountId') as string
  const returnUrl = formData.get('returnUrl') as string
  
  if (!accountId) {
    throw new Error('Missing account ID')
  }
  
  console.log(`Creating portal session for account: ${accountId}`);
  
  const supabase = await createClient()
  
  // Get customer ID - only from public schema now
  let customerData;
  
  try {
    // Only check public schema for customers
    const { data: publicCustomerData } = await supabase
      .from('billing_customers')
      .select('customer_id, email')
      .eq('account_id', accountId)
      .single();
    
    if (publicCustomerData?.customer_id) {
      console.log('Found customer in public schema:', publicCustomerData.customer_id);
      customerData = publicCustomerData;
    }
  } catch (error) {
    console.error('Error fetching customer data:', error);
  }
  
  // If no customer found, check if they have any active subscriptions
  if (!customerData?.customer_id) {
    try {
      // Check for subscriptions in Stripe directly
      const { data: subscriptionData } = await supabase
        .from('billing_subscriptions')
        .select('stripe_customer_id')
        .eq('account_id', accountId)
        .eq('status', 'active')
        .single();
      
      if (subscriptionData?.stripe_customer_id) {
        console.log('Found customer ID in subscriptions:', subscriptionData.stripe_customer_id);
        customerData = { customer_id: subscriptionData.stripe_customer_id };
      }
    } catch (error) {
      console.error('Error checking subscriptions:', error);
    }
  }
  
  // If still no customer, create one
  if (!customerData?.customer_id) {
    // Get user email from account
    let userEmail;
    
    try {
      // Get created_by from accounts
      let userId;
      
      const { data: accountData } = await supabase
        .from('accounts')
        .select('created_by')
        .eq('account_id', accountId)
        .single();
      
      if (accountData?.created_by) {
        userId = accountData.created_by;
        
        // Get email from users
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single();
        
        if (userData?.email) {
          userEmail = userData.email;
        }
      }
      
      // If we have an email, create a new customer
      if (userEmail) {
        console.log(`Creating new Stripe customer for email: ${userEmail}`);
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { account_id: accountId }
        });
        
        // Save the new customer ID
        await supabase
          .from('billing_customers')
          .insert({
            account_id: accountId,
            customer_id: customer.id,
            email: userEmail
          });
        
        customerData = { customer_id: customer.id };
        console.log(`Created new customer: ${customer.id}`);
      }
    } catch (err) {
      console.error('Error creating new customer:', err);
    }
  }
  
  // Final check for customer
  if (!customerData?.customer_id) {
    console.error('Could not find or create customer for account:', accountId);
    throw new Error('Customer not found and could not be created. Please contact support.');
  }
  
  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: customerData.customer_id,
    return_url: returnUrl || process.env.NEXT_PUBLIC_URL || 'http://localhost:3003'
  })
  
  console.log(`Created portal session: ${session.url}`);
  return { url: session.url }
}
