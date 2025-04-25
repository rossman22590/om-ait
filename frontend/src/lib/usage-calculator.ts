// Helper functions for calculating usage metrics
import { createClient } from "@/lib/supabase/server";

interface UsageResult {
  totalMinutes: number;
  usageDisplay: string;
  remainingMinutes?: number;
  planTotalMinutes?: number;
}

/**
 * Calculate the agent usage for a specific account
 * @param accountId The account ID to calculate usage for
 * @param planTotalMinutes Optional total plan minutes (for calculating remaining)
 * @returns Usage information including total minutes and display string
 */
export async function calculateAgentUsage(accountId: string, planTotalMinutes?: number): Promise<UsageResult> {
  const supabaseClient = await createClient();
  
  // Get agent runs for this account
  // Get the account's threads
  const { data: threads } = await supabaseClient
    .from('threads')
    .select('thread_id')
    .eq('account_id', accountId);
  
  const threadIds = threads?.map(t => t.thread_id) || [];
  
  // Get current month usage
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const isoStartOfMonth = startOfMonth.toISOString();
  
  let totalAgentTime = 0;
  let totalMinutes = 0;
  let usageDisplay = "No usage this month";
  
  if (threadIds.length > 0) {
    const { data: agentRuns } = await supabaseClient
      .from('agent_runs')
      .select('started_at, completed_at')
      .in('thread_id', threadIds)
      .gte('started_at', isoStartOfMonth);
    
    if (agentRuns && agentRuns.length > 0) {
      const nowTimestamp = now.getTime();
      
      totalAgentTime = agentRuns.reduce((total, run) => {
        const startTime = new Date(run.started_at).getTime();
        const endTime = run.completed_at 
          ? new Date(run.completed_at).getTime()
          : nowTimestamp;
        
        return total + (endTime - startTime) / 1000; // In seconds
      }, 0);
      
      // Convert to minutes
      totalMinutes = Math.round(totalAgentTime / 60);
      
      // Format display based on whether we know the plan limits
      if (planTotalMinutes) {
        const remainingMinutes = Math.max(0, planTotalMinutes - totalMinutes);
        usageDisplay = `${totalMinutes}/${planTotalMinutes} minutes (${remainingMinutes} remaining)`;
        return {
          totalMinutes,
          usageDisplay,
          remainingMinutes,
          planTotalMinutes
        };
      } else {
        usageDisplay = `${totalMinutes} minutes`;
      }
    }
  }
  
  return {
    totalMinutes,
    usageDisplay,
    remainingMinutes: planTotalMinutes ? Math.max(0, planTotalMinutes - totalMinutes) : undefined,
    planTotalMinutes
  };
}

/**
 * Get the plan name based on subscription data
 * @param subscriptionData The subscription data from Supabase
 * @param plans The available subscription plan IDs 
 * @returns The plan name (Free, Pro, Enterprise, or Unknown)
 */
export function getPlanName(
  subscriptionData: { price_id: string; status: string } | null, 
  plans: { FREE: string; PRO: string; ENTERPRISE: string }
): string {
  if (!subscriptionData || subscriptionData.status !== 'active') {
    return "Free";
  }
  
  const isPlan = (planId: string) => subscriptionData.price_id === planId;
  
  return isPlan(plans.FREE) 
    ? "Free" 
    : isPlan(plans.PRO)
      ? "Pro"
      : isPlan(plans.ENTERPRISE)
        ? "Enterprise"
        : "Unknown";
}

/**
 * Get plan minutes based on the plan name
 */
export function getPlanMinutes(planName: string): number {
  switch (planName) {
    case "Pro":
      return 500;
    case "Enterprise":
      return 3000;
    case "Free":
    default:
      return 25;
  }
}
