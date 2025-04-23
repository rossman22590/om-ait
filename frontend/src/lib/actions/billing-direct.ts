'use server'

import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Define our custom plan limits
const SUBSCRIPTION_TIERS = {
  [process.env.STRIPE_FREE_PLAN_ID || 'price_1RGJ9GG6l1KZGqIroxSqgphC']: { name: 'free', minutes: 50 },
  [process.env.STRIPE_PRO_PLAN_ID || 'price_1RGJ9LG6l1KZGqIrd9pwzeNW']: { name: 'base', minutes: 300 },
  [process.env.STRIPE_ENTERPRISE_PLAN_ID || 'price_1RGJ9JG6l1KZGqIrVUU4ZRv6']: { name: 'extra', minutes: 2400 }
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
  const priceId = subscriptionData?.price_id || process.env.STRIPE_FREE_PLAN_ID || 'price_1RGJ9GG6l1KZGqIroxSqgphC'
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
  const tierInfo = SUBSCRIPTION_TIERS[priceId as keyof typeof SUBSCRIPTION_TIERS]
  
  return {
    price_id: priceId,
    plan_name: planName,
    status: status,
    usage_minutes: usageMinutes,
    limit_minutes: tierInfo?.minutes || 50,
    can_run: usageMinutes < (tierInfo?.minutes || 50),
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
  
  const supabase = await createClient()
  
  // Get user email for the account
  const { data: accountData } = await supabase
    .schema('basejump')
    .from('accounts')
    .select('created_by')
    .eq('account_id', accountId)
    .single()
  
  if (!accountData) {
    throw new Error('Account not found')
  }
  
  const userId = accountData.created_by
  
  // Get user email
  const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()
  
  if (!userData) {
    throw new Error('User not found')
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
        price: planId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: returnUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    cancel_url: returnUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    metadata: {
      account_id: accountId
    }
  })
  
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
