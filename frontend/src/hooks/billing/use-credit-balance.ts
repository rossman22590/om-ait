'use client';

/**
 * Credit Balance Hook - Backward compatibility layer
 * 
 * Wraps useAccountState to provide credit balance data
 * for components that expect the old interface.
 */

import { useAccountState } from './use-account-state';

/**
 * Hook to get credit balance from unified account state
 */
export function useCreditBalance() {
  const { data: accountState, isLoading, error, refetch } = useAccountState();
  
  return {
    data: accountState ? {
      balance: accountState.credits.total,
      total: accountState.credits.total,
      daily: accountState.credits.daily,
      monthly: accountState.credits.monthly,
      extra: accountState.credits.extra,
      can_run: accountState.credits.can_run,
      can_purchase_credits: accountState.subscription.can_purchase_credits,
    } : null,
    balance: accountState?.credits.total ?? 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
