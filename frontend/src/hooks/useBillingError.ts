import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkBillingStatus } from '@/lib/actions/billing-new';

interface BillingErrorState {
  message: string;
  currentUsage?: number;
  limit?: number;
  subscription: {
    price_id: string;
    plan_name: string;
    current_usage?: number;
    limit?: number;
  };
}

export function useBillingError(accountId?: string) {
  const [billingError, setBillingError] = useState<BillingErrorState | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // Check for Stripe success parameter in URL to force refresh after checkout
    const isReturningFromStripe = typeof window !== 'undefined' && 
      (window.location.search.includes('success=true') || 
       window.location.search.includes('session_id='));

    const checkBilling = async () => {
      if (!accountId) return;

      try {
        // Force cache bypass for billing data after returning from Stripe
        const data = await checkBillingStatus(accountId);
        
        // If returning from Stripe, clear any errors and refresh
        if (isReturningFromStripe) {
          console.log('Detected return from Stripe checkout, refreshing subscription status');
          if (isMounted) {
            setBillingError(null);
            // Remove the query parameters to avoid repeat refreshes
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.search = '';
              window.history.replaceState({}, '', url.toString());
            }
          }
          return;
        }

        // NEVER show billing alerts for Pro or Enterprise users
        const planName = data?.subscription?.plan_name?.toLowerCase() || '';
        const priceId = data?.subscription?.price_id || '';
        
        console.log('Billing check - plan details:', { planName, priceId });
        
        // Check if user is on Pro or Enterprise plan by name or price ID
        if (planName.includes('pro') || planName.includes('enterprise') ||
            priceId === 'price_1RGtkVG23sSyONuF8kQcAclk' || // Pro price ID
            priceId === 'price_1RGw3iG23sSyONuFGk8uD3XV') { // Enterprise price ID
          console.log('User is on paid plan, clearing any billing errors');
          if (isMounted) {
            setBillingError(null);
          }
          return;
        }

        // Only show billing alert when usage reaches 45 minutes (0.75 hours)
        const minimumUsageToShowAlert = 0.75; // 45 minutes in hours
        
        if (data.subscription.current_usage && data.subscription.current_usage >= minimumUsageToShowAlert) {
          if (isMounted) {
            setBillingError({
              message: data.message,
              currentUsage: data.subscription.current_usage,
              limit: data.subscription.limit,
              subscription: data.subscription
            });
          }
        } else {
          console.log(`Current usage (${data.subscription.current_usage ? data.subscription.current_usage * 60 : 0} minutes) is below threshold (45 minutes). Not showing billing alert.`);
          if (isMounted) {
            setBillingError(null);
          }
        }
      } catch (error) {
        console.error('Error in useBillingError hook:', error);
      }
    };

    checkBilling();

    return () => {
      isMounted = false;
    };
  }, [accountId]);

  const handleBillingError = useCallback((error: any) => {
    // Only show billing alert when usage reaches 45 minutes (0.75 hours)
    const minimumUsageToShowAlert = 45 / 60; // 45 minutes in hours

    // Extract usage information
    const currentUsage = error.currentUsage || error.subscription?.current_usage;

    // If usage is below 45 minutes, don't show the alert
    if (currentUsage && currentUsage < minimumUsageToShowAlert) {
      console.log(`Current usage (${currentUsage * 60} minutes) is below threshold (45 minutes). Not showing billing alert.`);
      return false;
    }

    // Case 1: Error is already a formatted billing error detail object
    if (error && (error.message || error.subscription)) {
      setBillingError({
        message: error.message || "You've reached your monthly usage limit.",
        currentUsage,
        limit: error.limit || error.subscription?.limit,
        subscription: error.subscription || {}
      });
      return true;
    }
    
    // Case 2: Error is an HTTP error response
    if (error.status === 402 || (error.message && error.message.includes('Payment Required'))) {
      // Try to get details from error.data.detail (common API pattern)
      const errorDetail = error.data?.detail || {};
      const subscription = errorDetail.subscription || {};
      
      setBillingError({
        message: errorDetail.message || "You've reached your monthly usage limit.",
        currentUsage: subscription.current_usage,
        limit: subscription.limit,
        subscription
      });
      return true;
    }

    // Not a billing error
    return false;
  }, []);

  const clearBillingError = useCallback(() => {
    setBillingError(null);
  }, []);

  return {
    billingError,
    handleBillingError,
    clearBillingError,
    subscription: billingError?.subscription
  };
}