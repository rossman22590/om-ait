'use client';

/**
 * Subscription Hooks - Backward compatibility layer
 * 
 * These hooks wrap useAccountState to provide subscription-specific data
 * for components that expect the old interface.
 */

import { useAccountState, accountStateKeys } from './use-account-state';

// Query keys for subscription-related queries (re-export accountStateKeys for compatibility)
export const subscriptionKeys = {
  all: accountStateKeys.all,
  detail: () => [...accountStateKeys.all, 'detail'] as const,
  commitment: (subscriptionId: string | null) => [...accountStateKeys.all, 'commitment', subscriptionId] as const,
};

/**
 * Hook to get subscription data from unified account state
 * Provides backward compatibility for components expecting useSubscription interface
 */
export function useSubscription() {
  const { data: accountState, isLoading, error, refetch } = useAccountState();
  
  // Transform account state into subscription data format
  const subscriptionData = accountState ? {
    subscription: {
      id: accountState.subscription.subscription_id,
      status: accountState.subscription.status,
      cancel_at_period_end: accountState.subscription.is_cancelled,
      cancel_at: accountState.subscription.cancellation_effective_date 
        ? new Date(accountState.subscription.cancellation_effective_date).getTime() / 1000 
        : null,
      current_period_end: accountState.subscription.current_period_end,
    },
    tier: {
      name: accountState.subscription.tier_key,
      display_name: accountState.subscription.tier_display_name,
    },
    credits: {
      ...accountState.credits,
      balance: accountState.credits.total, // Alias for backward compatibility
      can_purchase_credits: accountState.subscription.can_purchase_credits,
    },
    scheduled_change: accountState.subscription.scheduled_change,
    commitment: accountState.subscription.commitment,
  } : null;
  
  return {
    data: subscriptionData,
    subscriptionData, // Keep for backward compatibility
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook to get subscription commitment details (for annual plans)
 * Uses data already available in account state
 */
export function useSubscriptionCommitment(subscriptionId: string | null) {
  const { data: accountState, isLoading, error, refetch } = useAccountState();
  
  // Commitment data is already part of account state
  const commitmentData = accountState?.subscription?.commitment ?? null;
  
  return {
    data: commitmentData,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
