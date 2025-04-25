import { createClient } from "@/lib/supabase/server";

export async function getAccountUsage(accountId: string) {
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
            const totalMinutes = Math.round(totalAgentTime / 60);
            usageDisplay = `${totalMinutes} minutes`;
        }
    }
    
    return { usageDisplay };
}
