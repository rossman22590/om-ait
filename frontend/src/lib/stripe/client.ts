import Stripe from 'stripe';

// Initialize Stripe with the secret key
export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('Missing Stripe secret key. Please check your environment variables.');
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2025-03-31.basil',
  });
}

// Get publishable key for frontend
export function getStripePublishableKey() {
  return process.env.STRIPE_PUBLISHABLE_KEY || '';
}

// Define plan tiers and their limits
export const SUBSCRIPTION_TIERS = {
  [process.env.STRIPE_FREE_PLAN_ID || 'price_1RGtl4G23sSyONuFYWYsA0HK']: { 
    name: 'free', 
    minutes: 50,
    displayName: 'Free'
  },
  [process.env.STRIPE_PRO_PLAN_ID || 'price_1RGtkVG23sSyONuF8kQcAclk']: { 
    name: 'pro', 
    minutes: 300,
    displayName: 'Pro'
  },
  [process.env.STRIPE_ENTERPRISE_PLAN_ID || 'price_1RGtkVG23sSyONuF8kQcAclk']: { 
    name: 'enterprise', 
    minutes: 2400,
    displayName: 'Enterprise'
  }
};

// Helper function to get plan details by ID
export function getPlanDetails(planId: string) {
  return SUBSCRIPTION_TIERS[planId] || SUBSCRIPTION_TIERS[process.env.STRIPE_FREE_PLAN_ID || 'price_1RGtkVG23sSyONuF8kQcAclk'];
}
