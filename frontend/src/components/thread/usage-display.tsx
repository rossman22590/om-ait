'use client';

import React, { useEffect, useState } from 'react';
import { Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUsageLogs } from '@/hooks/react-query/subscriptions/use-billing';
import { useCreditBalance } from '@/hooks/react-query/use-billing-v2';
import { useMessagesQuery } from '@/hooks/react-query/threads/use-messages';
import { Badge } from '@/components/ui/badge';

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
  // Fetch usage logs for the account (could filter by thread if needed)
  // For per-thread usage, filter logs for this threadId
  const { data: usageLogsData, isLoading } = useUsageLogs(0, 1000);
  
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
    
    if (!usageLogsData?.logs) {
      console.log(`[UsageDisplay] No usage logs data available`);
      // Still continue to check messages for fallback
    }
    
    // Filter logs for the current thread
    const threadLogs = usageLogsData?.logs?.filter(
      log => log.thread_id === threadId
    ) || [];
    
    // Debug: Log what we found
    console.log(`[UsageDisplay] Found ${threadLogs.length} logs for thread ${threadId}`, threadLogs);
    
    // Sum up durations and costs
    let totalSeconds = 0;
    let totalCost = 0;
    
    threadLogs.forEach(log => {
      // Calculate tokens
      const tokens = log.total_tokens || 0;
      totalSeconds += tokens / 4000 * 60;
      
      // Handle estimated_cost (can be number or string)
      let cost = 0;
      if (typeof log.estimated_cost === 'number') {
        cost = log.estimated_cost;
      } else if (typeof log.estimated_cost === 'string') {
        cost = parseFloat(log.estimated_cost) || 0;
      }
      
      // Also try credit_used field as fallback
      if (cost === 0 && log.credit_used) {
        cost = typeof log.credit_used === 'number' ? log.credit_used : parseFloat(log.credit_used) || 0;
      }
      
      totalCost += cost;
      
      // Debug individual log
      console.log(`[UsageDisplay] Log ${log.message_id}: tokens=${tokens}, estimated_cost=${log.estimated_cost}, credit_used=${log.credit_used}, calculated_cost=${cost}`);
    });
    
    console.log(`[UsageDisplay] Thread ${threadId} total cost from logs: ${totalCost}`);
    
    // Always check for fallback estimation based on messages
    const actualMessageCount = messagesData?.length || messageCount || 0;
    console.log(`[UsageDisplay] Messages data:`, { actualMessageCount, messagesData });
    
    if (totalCost === 0 && actualMessageCount > 0) {
      // Rough estimate: $0.01-0.05 per message depending on length
      // Assistant messages typically cost more than user messages
      const assistantMessages = messagesData?.filter(m => m.role === 'assistant')?.length || Math.ceil(actualMessageCount / 2);
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

  // Format balance for display
  const formatBalance = (balance: number) => {
    return balance >= 1 ? balance.toFixed(2) : balance.toFixed(3);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Show account balance */}
      <Badge variant="highlight" className="flex items-center gap-1 px-2 py-1 text-xs">
        <DollarSign className="h-3 w-3" />
        Balance:
        {isBalanceLoading ? '—' : ` $${formatBalance(balanceData?.balance || 0)}`}
      </Badge>
      
      {/* Show thread cost - always visible */}
      <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 text-xs">
        <Clock className="h-3 w-3 text-blue-600" />
        Thread:
        {isLoading ? ' —' : ` $${threadCost.toFixed(3)}`}
      </Badge>
    </div>
  );
};
