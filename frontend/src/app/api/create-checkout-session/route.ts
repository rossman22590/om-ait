import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const accountId = formData.get('accountId') as string;
    const planId = formData.get('planId') as string;
    const returnUrl = formData.get('returnUrl') as string;
    const promoCode = formData.get('promoCode') as string || null;

    if (!accountId || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Creating checkout session with:', { 
      accountId, 
      planId, 
      returnUrl,
      promoCode: promoCode || 'None' 
    });

    // Get the price ID from the plan ID
    let priceId = '';
    
    // Log ALL price ID environment variables for debugging
    console.log('ENVIRONMENT VARIABLES FOR PRICING:', {
      FREE: process.env.STRIPE_FREE_PLAN_ID,
      PRO: process.env.STRIPE_PRO_PLAN_ID,
      ENTERPRISE: process.env.STRIPE_ENTERPRISE_PLAN_ID
    });
    
    if (planId === 'pro') {
      // Use the Pro plan price ID from environment variables
      priceId = process.env.STRIPE_PRO_PLAN_ID || '';
      console.log('Using Pro plan price ID:', priceId);
    } else if (planId === 'enterprise') {
      // Use the Enterprise plan price ID from environment variables
      priceId = process.env.STRIPE_ENTERPRISE_PLAN_ID || '';
      console.log('Using Enterprise plan price ID:', priceId);
    } else {
      priceId = process.env.STRIPE_FREE_PLAN_ID || '';
      console.log('Using Free plan price ID:', priceId);
    }

    // Check if we have a valid price ID
    if (!priceId) {
      console.error(`No price ID found for plan: ${planId}`);
      console.log('Available environment variables:', {
        STRIPE_FREE_PLAN_ID: process.env.STRIPE_FREE_PLAN_ID ? 'Set' : 'Not set',
        STRIPE_PRO_PLAN_ID: process.env.STRIPE_PRO_PLAN_ID ? 'Set' : 'Not set',
        STRIPE_ENTERPRISE_PLAN_ID: process.env.STRIPE_ENTERPRISE_PLAN_ID ? 'Set' : 'Not set'
      });
      return NextResponse.json(
        { error: `No price ID found for plan: ${planId}. Please check your environment variables.` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user email for the account
    let accountData;

    try {
      // Try basejump schema first
      const { data: basejumpAccountData } = await supabase
        .schema('basejump')
        .from('accounts')
        .select('created_by')
        .eq('account_id', accountId)
        .single();

      if (basejumpAccountData) {
        accountData = basejumpAccountData;
      } else {
        // Try public schema if basejump fails
        const { data: publicAccountData } = await supabase
          .from('accounts')
          .select('created_by')
          .eq('account_id', accountId)
          .single();

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
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }
    }

    const userId = accountData.created_by;

    // Get user email
    let userData;

    try {
      // Try public schema first
      const { data: publicUserData } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (publicUserData) {
        userData = publicUserData;
      } else {
        // Try basejump schema if public fails
        const { data: basejumpUserData } = await supabase
          .schema('basejump')
          .from('users')
          .select('email')
          .eq('id', userId)
          .single();

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
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Create or retrieve customer
    let customerId: string;

    // Check if customer already exists
    const { data: customerData } = await supabase
      .schema('basejump')
      .from('billing_customers')
      .select('customer_id')
      .eq('account_id', accountId)
      .single();

    if (customerData?.customer_id) {
      customerId = customerData.customer_id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          account_id: accountId
        }
      });

      // Save customer ID
      await supabase
        .schema('basejump')
        .from('billing_customers')
        .insert({
          account_id: accountId,
          customer_id: customer.id,
          email: userData.email
        });

      customerId = customer.id;
    }

    // Create checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
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
      // Allow promotion codes to be entered at checkout
      allow_promotion_codes: true
    };
    
    // If promo code is provided, pre-fill it
    if (promoCode) {
      console.log(`Pre-filling promo code: ${promoCode}`);
      sessionConfig.discounts = [
        {
          promotion_code: promoCode
        }
      ];
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('Stripe session created:', {
      id: session.id,
      url: session.url,
      customer: session.customer,
      status: session.status,
      promoApplied: promoCode ? true : false
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
