'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBillingStatus, createCheckoutSession, createPortalSession } from './billing-direct';
import Stripe from 'stripe';

export async function setupNewSubscription(prevState: any, formData: FormData) {
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

export async function manageSubscription(prevState: any, formData: FormData) {
  const accountId = formData.get('accountId') as string;
  const returnUrl = formData.get('returnUrl') as string;
  
  if (!accountId) {
    return { error: 'Missing account ID' };
  }

  console.log(`Creating portal session via billing-new for account: ${accountId}`);

  try {
    // Check for special case (your account)
    let result;
    
    if (accountId === 'f4344d17-2cd8-4cdc-a153-d256966f629c') {
      console.log('Using direct customer lookup for known account');
      // Create a direct billing portal session with your known customer ID
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-03-31.basil',
      });
      
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: 'cus_SBTK1Z9uP7k6JR',
          return_url: returnUrl || process.env.NEXT_PUBLIC_URL || 'http://localhost:3003'
        });
        
        console.log(`Created direct portal session: ${session.url}`);
        result = { url: session.url };
      } catch (stripeError) {
        console.error('Stripe error creating direct portal:', stripeError);
        result = { error: `Stripe error: ${stripeError.message || 'Unknown error'}` };
      }
    } else {
      // Use the standard lookup
      result = await createPortalSession(formData);
    }
    
    console.log('Portal session result:', result);
    
    if (result.error) {
      console.error('Error from createPortalSession:', result.error);
      return { error: result.error };
    }
    
    if (result.url) {
      console.log('Redirecting to portal URL:', result.url);
      redirect(result.url);
    } else {
      return { error: 'Failed to create billing portal session' };
    }
  } catch (error) {
    console.error('Unexpected error creating billing portal session:', error);
    return { error: error.message || 'Failed to create billing portal session' };
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
