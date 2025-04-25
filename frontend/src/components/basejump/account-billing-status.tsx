'use client';

import { SubmitButton } from "../ui/submit-button";
import { manageSubscription } from "@/lib/actions/billing";
import { PlanComparison } from "../billing/plan-comparison";
import { isLocalMode } from "@/lib/config";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
    accountId: string;
    returnUrl: string;
}

// Plan limits mapping
const PLAN_LIMITS = {
    "Free": 25,
    "Pro": 500,
    "Enterprise": 3000
};

export default function AccountBillingStatus({ accountId, returnUrl }: Props) {
    // Setup state for client-side rendering
    const [planName, setPlanName] = useState<string>("Free");
    const [usageDisplay, setUsageDisplay] = useState<string>("Calculating...");

    // In local development mode, show a simplified component
    if (isLocalMode()) {
        return (
            <div className="rounded-xl border shadow-sm bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
                <div className="p-4 mb-4 bg-muted/30 border border-border rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                        Running in local development mode - billing features are disabled
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Agent usage limits are not enforced in this environment
                    </p>
                </div>
            </div>
        );
    }

    // Define calculateUsage in a useCallback
    const calculateUsage = useCallback(async () => {
        try {
            // Get the current plan from window global (set by PlanComparison component)
            const currentPlan = window.omCurrentPlan || "Free";
            setPlanName(currentPlan);

            // Get agent runs for this account
            const supabase = createClient();
            
            // Get the account's threads
            const { data: threads } = await supabase
                .from('threads')
                .select('thread_id')
                .eq('account_id', accountId);
            
            const threadIds = threads?.map(t => t.thread_id) || [];
            
            // Get current month usage
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const isoStartOfMonth = startOfMonth.toISOString();
            
            // Calculate usage in minutes
            let minutes = 0;
            
            if (threadIds.length > 0) {
                const { data: agentRuns } = await supabase
                    .from('agent_runs')
                    .select('started_at, completed_at')
                    .in('thread_id', threadIds)
                    .gte('started_at', isoStartOfMonth);
                
                if (agentRuns && agentRuns.length > 0) {
                    const nowTimestamp = now.getTime();
                    
                    const totalAgentTime = agentRuns.reduce((total, run) => {
                        const startTime = new Date(run.started_at).getTime();
                        const endTime = run.completed_at 
                            ? new Date(run.completed_at).getTime()
                            : nowTimestamp;
                        
                        return total + (endTime - startTime) / 1000; // In seconds
                    }, 0);
                    
                    // Convert to minutes
                    minutes = Math.round(totalAgentTime / 60);
                }
            }

            // Format usage based on the current plan limit
            const planLimit = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.Free;
            const remaining = Math.max(0, planLimit - minutes);
            
            const formattedUsage = minutes > 0 
                ? `${minutes}/${planLimit} minutes (${remaining} remaining)` 
                : "No usage this month";
                
            setUsageDisplay(formattedUsage);
        } catch (error) {
            console.error("Error calculating usage:", error);
            setUsageDisplay("Error calculating usage");
        }
    }, [accountId]); // Properly include accountId dependency

    // Use effect to calculate usage and read the plan from window after component mounts
    useEffect(() => {
        calculateUsage();
    }, [calculateUsage]); // This ensures proper dependency tracking

    return (
        <div className="rounded-xl border shadow-sm bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
            
            <div className="mb-6">
                <div className="rounded-lg border bg-background p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-foreground/90">Current Plan</span>
                            <span className="text-sm font-medium text-card-title">{planName}</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground/90">Agent Usage This Month</span>
                        <span className="text-sm font-medium text-card-title">{usageDisplay}</span>
                    </div>
                </div>
            </div>

            {/* Plans Comparison */}
            <PlanComparison
                accountId={accountId}
                returnUrl={returnUrl}
                className="mb-6"
            />

            {/* Manage Subscription Button */}
            <form>
                <input type="hidden" name="accountId" value={accountId} />
                <input type="hidden" name="returnUrl" value={returnUrl} />
                <SubmitButton
                    pendingText="Loading..."
                    formAction={manageSubscription}
                    className="w-full bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                >
                    Manage Subscription
                </SubmitButton>
            </form>
        </div>
    )
}
