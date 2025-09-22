'use client';

import { createMutationHook, createQueryHook } from '@/hooks/use-query';
import {
  createCheckoutSession,
  checkBillingStatus,
  CreateCheckoutSessionRequest
} from '@/lib/api';

// useAvailableModels has been moved to use-model-selection.ts for better consolidation

export const useBillingStatus = createQueryHook(
  ['billing', 'status'],
  checkBillingStatus,
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: true, // Only refetch when network reconnects
  }
);

export const useCreateCheckoutSession = createMutationHook(
  (request: CreateCheckoutSessionRequest) => createCheckoutSession(request),
  {
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    errorContext: {
      operation: 'create checkout session',
      resource: 'billing'
    }
  }
);

export const useUsageLogs = (page: number = 0, itemsPerPage: number = 1000) => 
  createQueryHook(
    usageKeys.logs(page, itemsPerPage),
    () => billingApi.getUsageLogs(page, itemsPerPage),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchInterval: 5 * 1000, // poll every 5s for near-real-time updates
    }
  )();