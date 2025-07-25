'use client';

import React, { useEffect, useState } from 'react';
import { Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUsageLogs } from '@/hooks/react-query/subscriptions/use-billing';
import { Badge } from '@/components/ui/badge';

interface UsageDisplayProps {
  threadId: string;
  projectId: string;
  accountId?: string;
  className?: string;
}

// Helper to format minutes as h:mm
function formatMinutes(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export const UsageDisplay: React.FC<UsageDisplayProps> = ({
  threadId,
  projectId,
  accountId,
  className,
}) => {
  // Fetch usage logs for the account (could filter by thread if needed)
  // For per-thread usage, filter logs for this threadId
  const { data: usageLogsData, isLoading } = useUsageLogs(0, 1000);

  // State for this thread's usage
  const [threadMinutes, setThreadMinutes] = useState(0);
  const [threadCost, setThreadCost] = useState(0);

  useEffect(() => {
    if (!usageLogsData?.logs) return;
    // Filter logs for the current thread
    const threadLogs = usageLogsData.logs.filter(
      log => log.thread_id === threadId
    );
    // Sum up durations and costs
    let totalSeconds = 0;
    let totalCost = 0;
    threadLogs.forEach(log => {
      // If you have duration in seconds, use it; otherwise estimate from tokens
      // Here, we estimate 1 minute per 4000 tokens (adjust as needed)
      const tokens = log.total_tokens || 0;
      totalSeconds += tokens / 4000 * 60;
      totalCost += typeof log.estimated_cost === 'number' ? log.estimated_cost : 0;
    });
    setThreadMinutes(totalSeconds / 60);
    setThreadCost(totalCost);
  }, [usageLogsData, threadId]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 text-xs">
        <Clock className="h-3 w-3 text-blue-600" />
        {isLoading ? '—' : formatMinutes(threadMinutes)}
      </Badge> */}
      <Badge variant="highlight" className="flex items-center gap-1 px-2 py-1 text-xs">
        Usage:
        {isLoading ? '—' : ` $${threadCost.toFixed(3)}`}
      </Badge>
    </div>
  );
};
