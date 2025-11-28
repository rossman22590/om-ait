import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '@/lib/api/billing';

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
    queryFn: async () => {
      const safeLimit = Math.min(itemsPerPage, 100);
      const offset = page * safeLimit;
      const resp: any = await getTransactions(safeLimit, offset);
      const transactions = resp?.transactions || [];
      const pagination = resp?.pagination || {};
      const usage_logs = transactions
        .filter((t: any) => t?.type === 'usage')
        .filter((t: any) => (threadId ? (t?.metadata?.thread_id === threadId) : true))
        .map((t: any) => ({
          amount: Math.abs(Number(t.amount)) || 0,
          timestamp: t.created_at,
          reference_type: t?.metadata?.thread_id ? `thread:${t.metadata.thread_id}` : undefined,
        }));

      return {
        usage_logs,
        has_more: Boolean(pagination?.has_more ?? (transactions.length === safeLimit)),
        total_count: pagination?.total,
      };
    },
    enabled,
    staleTime: 30_000,
  });
}

// Data shape expected by consumers (e.g., UsageDisplay)
export interface UsageLogsResponse {
  usage_logs: Array<{
    amount: number;
    timestamp?: string;
    balance_after?: number;
    reference_type?: string;
  }>;
  has_more?: boolean;
  total_count?: number;
}
