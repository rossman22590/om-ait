'use client';

import React, { useEffect, useState } from 'react';
import { Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUsageLogs } from '@/hooks/billing/use-usage-logs';
import { useCreditBalance } from '@/hooks/billing/use-subscription';
import { useMessagesQuery } from '@/hooks/threads/use-messages';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UsageDisplayProps {
  threadId: string;
  projectId: string;
  accountId?: string;
  className?: string;
  // Add optional message count for fallback calculation
  messageCount?: number;
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
  messageCount = 0,
}) => {
  // Fetch usage logs (filter by thread when available)
  const { data: usageLogsData, isLoading } = useUsageLogs({ page: 0, itemsPerPage: 1000, threadId });
  
  // Fetch account balance
  const { data: balanceData, isLoading: isBalanceLoading } = useCreditBalance();
  
  // Fetch thread messages to count them for fallback estimation
  const { data: messagesData } = useMessagesQuery(threadId);

  // State for this thread's usage
  const [threadMinutes, setThreadMinutes] = useState(0);
  const [threadCost, setThreadCost] = useState(0);

  useEffect(() => {
    // Debug: Log all the data we have
    console.log(`[UsageDisplay] Debug data:`, {
      threadId,
      usageLogsData,
      messagesData,
      messageCount
    });
    
    if (!usageLogsData?.usage_logs) {
      console.log(`[UsageDisplay] No usage logs data available`);
      // Still continue to check messages for fallback
    }
    
    // In billing-v2, we may not have thread_id in the logs
    // Instead, we'll use the reference_type field if it contains the thread ID
    // or we'll show all logs if we can't filter by thread
    const threadLogs = (usageLogsData?.usage_logs || []).filter((log) => {
      if (!log.reference_type) return true;
      if (log.reference_type.startsWith('thread:')) {
        const logThreadId = log.reference_type.split(':')[1];
        return logThreadId === threadId;
      }
      return log.reference_type === threadId;
    });
    
    // Debug: Log what we found
    console.log(`[UsageDisplay] Found ${threadLogs.length} logs for thread ${threadId}`, threadLogs);
    
    // Sum up durations and costs
    let totalSeconds = 0;
    let totalCost = 0;
    
    threadLogs.forEach((log) => {
      const amount = log.amount || 0;
      totalCost += amount;
      
      // Debug individual log
      console.log(`[UsageDisplay] Log ${log.timestamp}: amount=${amount}, balance_after=${log.balance_after}`);
    });
    
    console.log(`[UsageDisplay] Thread ${threadId} total cost from logs: ${totalCost}`);
    
    // Always check for fallback estimation based on messages
    const actualMessageCount = messagesData?.length || messageCount || 0;
    console.log(`[UsageDisplay] Messages data:`, { actualMessageCount, messagesData });
    
    if (totalCost === 0 && actualMessageCount > 0) {
      // Rough estimate: $0.01-0.05 per message depending on length
      // Assistant messages typically cost more than user messages
      const assistantMessages = messagesData?.filter((m: any) => m.role === 'assistant')?.length || Math.ceil(actualMessageCount / 2);
      const estimatedCost = assistantMessages * 0.025; // $0.025 per assistant message average
      console.log(`[UsageDisplay] Using fallback estimation: ${assistantMessages} assistant messages from ${actualMessageCount} total = $${estimatedCost}`);
      totalCost = estimatedCost;
    } else if (actualMessageCount > 0) {
      console.log(`[UsageDisplay] Have ${actualMessageCount} messages but totalCost is ${totalCost}, not using fallback`);
    } else {
      console.log(`[UsageDisplay] No messages found for fallback estimation`);
    }
    
    console.log(`[UsageDisplay] Final thread cost: ${totalCost}`);
    
    setThreadMinutes(totalSeconds / 60);
    setThreadCost(totalCost);
  }, [usageLogsData, threadId, messagesData, messageCount]);

  // Format balance for display as credits
  const formatCredits = (credits: number) => {
    return Math.round(credits);
  };

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        {/* Credits pill with shadcn/ui tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="highlight" className="flex items-center gap-1 px-2 py-1 text-xs">
              <DollarSign className="h-3 w-3" />
              Credits:
              {isBalanceLoading ? '—' : ` ${formatCredits(balanceData?.balance || 0)}`}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Your current account balance in credits</p>
          </TooltipContent>
        </Tooltip>
        {/* Used pill with shadcn/ui tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 text-xs">
              <Clock className="h-3 w-3 text-blue-600" />
              Used:
              {isLoading ? ' —' : ` ${formatCredits(threadCost * 100)}`}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Credits spent on this thread</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
