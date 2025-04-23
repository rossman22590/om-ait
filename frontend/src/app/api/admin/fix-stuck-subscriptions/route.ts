import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

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

export async function GET(request: NextRequest) {
  // This endpoint is admin-only in production, but allowed in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    // In production, require authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Very basic auth - in production use a proper secure token
    const token = authHeader.replace('Bearer ', '');
    if (!process.env.ADMIN_API_KEY || token !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    console.log('Running in development mode - skipping authentication');
  }

  try {
    const supabase = await createClient();
    
    // Check if a specific account ID was provided
    const url = new URL(request.url);
    const specificAccountId = url.searchParams.get('account');
    
    let accounts = [];
    
    if (specificAccountId) {
      console.log(`Focusing on specific account: ${specificAccountId}`);
      // Only get the specific account
      const { data } = await supabase
        .from('accounts')
        .select('account_id')
        .eq('account_id', specificAccountId);
      
      accounts = data || [];
      
      if (accounts.length === 0) {
        return NextResponse.json({ 
          error: `Account ${specificAccountId} not found`
        }, { status: 404 });
      }
    } else {
      // Get all accounts
      const { data } = await supabase
        .from('accounts')
        .select('account_id');
      
      accounts = data || [];
    }
    
    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: 'No accounts found' });
    }
    
    let fixed = 0;
    const results = [];
    
    // 2. For each account, check if they have subscriptions in Stripe but not in our database
    for (const account of accounts) {
      // Get customer ID for this account
      const { data: customer } = await supabase
        .from('billing_customers')
        .select('customer_id')
        .eq('account_id', account.account_id)
        .maybeSingle();
      
      if (!customer?.customer_id) continue;
      
      // Check subscriptions in Stripe
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: customer.customer_id,
        status: 'active',
        limit: 5
      });
      
      if (stripeSubscriptions.data.length === 0) continue;
      
      // For each Stripe subscription, check if it exists in our database
      for (const subscription of stripeSubscriptions.data) {
        // Check if subscription exists in our database
        const { data: existingSubscription } = await supabase
          .from('billing_subscriptions')
          .select('subscription_id')
          .eq('account_id', account.account_id)
          .eq('subscription_id', subscription.id)
          .maybeSingle();
        
        // If no record found, add the subscription
        if (!existingSubscription) {
          console.log(`Fixing stuck user: Adding missing subscription ${subscription.id} for ${account.account_id}`);
          
          try {
            // Add to public schema
            await supabase
              .from('billing_subscriptions')
              .insert({
                id: randomUUID(),
                account_id: account.account_id,
                subscription_id: subscription.id,
                customer_id: customer.customer_id,
                price_id: subscription.items.data[0].price.id,
                plan_name: resolvePlanName(subscription.items.data[0].price.id, subscription.items.data[0].price.nickname),
                status: subscription.status,
                current_period_start: safeIsoDate((subscription as any).current_period_start),
                current_period_end: safeIsoDate((subscription as any).current_period_end),
                created_at: new Date().toISOString()
              });
            
            fixed++;
            results.push({
              account_id: account.account_id,
              subscription_id: subscription.id,
              status: 'fixed',
              plan: resolvePlanName(subscription.items.data[0].price.id, subscription.items.data[0].price.nickname)
            });
            
          } catch (err) {
            console.error(`Error fixing subscription: ${err}`);
            results.push({
              account_id: account.account_id,
              subscription_id: subscription.id,
              status: 'error',
              error: String(err)
            });
          }
        }
      }
    }
    
    return NextResponse.json({ 
      fixed, 
      total: accounts.length,
      results
    });
    
  } catch (error) {
    console.error('Error in fix-stuck-subscriptions:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
