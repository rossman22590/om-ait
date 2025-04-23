'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBillingStatus, createCheckoutSession, createPortalSession } from './billing-direct';
import Stripe from 'stripe';

export async function setupNewSubscription(formData: FormData) {
  const accountId = formData.get('accountId') as string;
  const returnUrl = formData.get('returnUrl') as string;
  const planId = formData.get('planId') as string;
  
  if (!accountId || !planId) {
    return { error: 'Missing required fields' };
  }

  try {
    console.log('Setting up subscription with:', { accountId, planId, returnUrl });
    const { url } = await createCheckoutSession(formData);
    
    if (url) {
      console.log('Redirecting to Stripe checkout:', url);
      // Use window.location.href for client-side redirect instead of Next.js redirect
      if (typeof window !== 'undefined') {
        window.location.href = url;
        return { success: true };
      }
      redirect(url);
    } else {
      return { error: 'Failed to create checkout session' };
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return { error: error.message || 'Failed to create checkout session' };
  }
}

export async function manageSubscription(formData: FormData) {
  const accountId = formData.get('accountId') as string;
  const returnUrl = formData.get('returnUrl') as string;
  
  if (!accountId) {
    throw new Error('Missing account ID');
  }

  // Log the attempt
  console.log(`Creating portal session for account: ${accountId}`);

  // Get the subscription data directly from database
  const supabase = await createClient();
  
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
    
    // Create Stripe portal session with the customer_id
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-03-31.basil',
    });
    
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.customer_id,
      return_url: returnUrl
    });
    
    console.log(`Created portal session, redirecting to: ${session.url}`);
    redirect(session.url);
  } else {
    // If no customer ID in the main subscription, try direct fallback for your account
    if (accountId === 'f4344d17-2cd8-4cdc-a153-d256966f629c') {
      console.log('Using direct link for known account');
      redirect('https://billing.stripe.com/p/login/00gbME8hR30T9I43cc');
    } else {
      throw new Error('Could not find customer ID for this account');
    }
  }
}

export async function checkBillingStatus(accountId: string) {
  if (!accountId) {
    return { 
      can_run: true, 
      message: 'OK',
      billing_enabled: true,
      status: 'active',
      plan_name: 'Free',
      subscription: {
        price_id: process.env.STRIPE_FREE_PLAN_ID || 'price_1RGtl4G23sSyONuFYWYsA0HK',
        plan_name: 'Free'
      }
    };
  }

  try {
    const billingStatus = await getBillingStatus(accountId);
    
    return {
      can_run: billingStatus.can_run,
      message: billingStatus.can_run ? 'OK' : `Monthly limit of ${billingStatus.limit_minutes} minutes reached. Please upgrade your plan.`,
      billing_enabled: true,
      status: billingStatus.status,
      plan_name: billingStatus.plan_name,
      subscription: {
        price_id: billingStatus.price_id,
        plan_name: billingStatus.plan_name,
        current_usage: billingStatus.usage_minutes / 60, // Convert to hours for frontend
        limit: billingStatus.limit_minutes / 60 // Convert to hours for frontend
      }
    };
  } catch (error: any) {
    console.error('Error checking billing status:', error);
    
    // Default to free tier on error
    return { 
      can_run: true, 
      message: 'OK',
      billing_enabled: true,
      status: 'active',
      plan_name: 'Free',
      subscription: {
        price_id: process.env.STRIPE_FREE_PLAN_ID || 'price_1RGtl4G23sSyONuFYWYsA0HK',
        plan_name: 'Free'
      }
    };
  }
}
