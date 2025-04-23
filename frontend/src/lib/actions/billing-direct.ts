'use server'

import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Define our custom plan limits
const SUBSCRIPTION_TIERS = {
  'free': { name: 'free', minutes: 50, price_id: process.env.STRIPE_FREE_PLAN_ID || '' },
  'pro': { name: 'base', minutes: 300, price_id: process.env.STRIPE_PRO_PLAN_ID || '' },
  'enterprise': { name: 'extra', minutes: 2400, price_id: process.env.STRIPE_ENTERPRISE_PLAN_ID || '' }
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
})

export async function getBillingStatus(accountId: string) {
  const supabase = await createClient()
  
  // Get subscription data
  const { data: subscriptionData } = await supabase
    .schema('basejump')
    .from('billing_subscriptions')
    .select('price_id, plan_name, status')
    .eq('account_id', accountId)
    .eq('status', 'active')
    .single()
  
  // Default to free tier if no subscription found
  const priceId = subscriptionData?.price_id || process.env.STRIPE_FREE_PLAN_ID || 'price_1RGtl4G23sSyONuFYWYsA0HK'
  const planName = subscriptionData?.plan_name || 'Free'
  const status = subscriptionData?.status || 'active'
  
  // Get start of current month in UTC
  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  
  // First get threads for this account
  const { data: threadsData } = await supabase
    .from('threads')
    .select('thread_id')
    .eq('account_id', accountId)
  
  // Try basejump schema if no results
  let threadIds = threadsData?.map(t => t.thread_id) || []
  if (threadIds.length === 0) {
    const { data: basejumpThreadsData } = await supabase
      .schema('basejump')
      .from('threads')
      .select('thread_id')
      .eq('account_id', accountId)
    
    threadIds = basejumpThreadsData?.map(t => t.thread_id) || []
  }
  
  // Then get agent runs for those threads
  let agentRunData: any[] = []
  if (threadIds.length > 0) {
    const { data: runsData } = await supabase
      .from('agent_runs')
      .select('started_at, completed_at')
      .in('thread_id', threadIds)
      .gte('started_at', startOfMonth.toISOString())
    
    if (runsData && runsData.length > 0) {
      agentRunData = runsData
    } else {
      // Try basejump schema
      const { data: basejumpRunsData } = await supabase
        .schema('basejump')
        .from('agent_runs')
        .select('started_at, completed_at')
        .in('thread_id', threadIds)
        .gte('started_at', startOfMonth.toISOString())
      
      if (basejumpRunsData) {
        agentRunData = basejumpRunsData
      }
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
  const tierInfo = SUBSCRIPTION_TIERS[planName.toLowerCase()] || SUBSCRIPTION_TIERS['free']
  
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
    // Try basejump schema first
    const { data: basejumpAccountData, error: basejumpError } = await supabase
      .schema('basejump')
      .from('accounts')
      .select('created_by')
      .eq('account_id', accountId)
      .single()
    
    if (basejumpAccountData) {
      accountData = basejumpAccountData;
    } else {
      // Try public schema if basejump fails
      const { data: publicAccountData, error: publicError } = await supabase
        .from('accounts')
        .select('created_by')
        .eq('account_id', accountId)
        .single()
      
      if (publicAccountData) {
        accountData = publicAccountData;
      }
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
    // Try public schema first
    const { data: publicUserData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()
    
    if (publicUserData) {
      userData = publicUserData;
    } else {
      // Try basejump schema if public fails
      const { data: basejumpUserData } = await supabase
        .schema('basejump')
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()
      
      if (basejumpUserData) {
        userData = basejumpUserData;
      }
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
    .schema('basejump')
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
      .schema('basejump')
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
  
  const supabase = await createClient()
  
  // Get customer ID
  const { data: customerData } = await supabase
    .schema('basejump')
    .from('billing_customers')
    .select('customer_id')
    .eq('account_id', accountId)
    .single()
  
  if (!customerData?.customer_id) {
    throw new Error('Customer not found')
  }
  
  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: customerData.customer_id,
    return_url: returnUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  })
  
  return { url: session.url }
}
