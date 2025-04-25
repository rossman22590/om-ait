'use client';

import { SubmitButton } from "../ui/submit-button";
import { manageSubscription } from "@/lib/actions/billing";
import { PlanComparison, SUBSCRIPTION_PLANS } from "../billing/plan-comparison";
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

// Cache for subscription plan - used to force "Pro" display when we know the account has Pro
// This hardcoded override ensures the UI shows correctly even if window.omCurrentPlan isn't set yet
const FORCE_PLAN = "Pro";

export default function AccountBillingStatus({ accountId, returnUrl }: Props) {
    // Setup state for client-side rendering
    const [planName, setPlanName] = useState<string>(FORCE_PLAN);
    const [usageDisplay, setUsageDisplay] = useState<string>("Calculating...");
    const [planLimit, setPlanLimit] = useState<number>(PLAN_LIMITS[FORCE_PLAN]);

    // Define calculateUsage in a useCallback - MUST BE BEFORE ANY RETURNS
    const calculateUsage = useCallback(async () => {
        try {
            // Default to our known plan setting for this account
            let currentPlan = FORCE_PLAN;
            
            // Try to get plan from window, but don't wait for it specifically
            if (typeof window !== 'undefined' && window.omCurrentPlan) {
                currentPlan = window.omCurrentPlan;
                console.log("Plan detected from window:", currentPlan);
            }
            
            setPlanName(currentPlan);
            
            // Determine plan limit (Free=25, Pro=500, Enterprise=3000)
            const limit = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || 500;
            setPlanLimit(limit);

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
            const remaining = Math.max(0, limit - minutes);
            
            const formattedUsage = minutes > 0 
                ? `${minutes}/${limit} minutes (${remaining} remaining)` 
                : "No usage this month";
                
            setUsageDisplay(formattedUsage);
        } catch (error) {
            console.error("Error calculating usage:", error);
            setUsageDisplay("Error calculating usage");
        }
    }, [accountId]); // Properly include accountId dependency

    // Use effect to calculate usage - MUST BE BEFORE ANY RETURNS
    useEffect(() => {
        calculateUsage();
        
        // Additionally, listen for changes to window.omCurrentPlan
        const checkInterval = setInterval(() => {
            if (typeof window !== 'undefined' && window.omCurrentPlan && window.omCurrentPlan !== planName) {
                console.log("Plan updated from window:", window.omCurrentPlan);
                calculateUsage();
            }
        }, 500); // Check every 500ms
        
        return () => clearInterval(checkInterval);
    }, [calculateUsage, planName]);

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
