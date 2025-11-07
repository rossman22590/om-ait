import { useQuery } from '@tanstack/react-query';
import { billingApi, type UsageLogsResponse } from '@/lib/api/billing';

interface UseUsageLogsParams {
  page?: number;
  itemsPerPage?: number;
  threadId?: string;
  enabled?: boolean;
}

export function useUsageLogs({
  page = 0,
  itemsPerPage = 1000,
  threadId,
  enabled = true,
}: UseUsageLogsParams) {
  return useQuery<UsageLogsResponse>({
    queryKey: ['billing', 'usage-logs', { page, itemsPerPage, threadId }],
    queryFn: () => billingApi.getUsageLogs(page, itemsPerPage, threadId),
    enabled,
    staleTime: 30_000,
  });
}

export type { UsageLogsResponse };
