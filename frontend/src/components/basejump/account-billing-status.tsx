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

export default function AccountBillingStatus({ accountId, returnUrl }: Props) {
    // Setup state for client-side rendering
    const [planName, setPlanName] = useState<string>("Free");
    const [usageDisplay, setUsageDisplay] = useState<string>("Calculating...");
    const [planLimit, setPlanLimit] = useState<number>(PLAN_LIMITS["Free"]);

    // Define calculateUsage in a useCallback - MUST BE BEFORE ANY RETURNS
    const calculateUsage = useCallback(async () => {
        try {
            // Get the current plan from window global (set by PlanComparison component) 
            // The PlanComparison component should be the source of truth for plan status
            const currentPlan = typeof window !== 'undefined' && window.omCurrentPlan 
                ? window.omCurrentPlan 
                : "Free"; // Default to Free if not set
                
            console.log("Current plan from window:", currentPlan);
            setPlanName(currentPlan);

            // Determine plan limit (Free=25, Pro=500, Enterprise=3000)
            const limit = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.Free;
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
            const remaining = Math.max(0, planLimit - minutes);
            
            const formattedUsage = minutes > 0 
                ? `${minutes}/${planLimit} minutes (${remaining} remaining)` 
                : "No usage this month";
                
            setUsageDisplay(formattedUsage);
        } catch (error) {
            console.error("Error calculating usage:", error);
            setUsageDisplay("Error calculating usage");
        }
    }, [accountId, planLimit]); // Properly include accountId dependency

    // Use effect to calculate usage - MUST BE BEFORE ANY RETURNS
    useEffect(() => {
        // Initial calculation
        calculateUsage();
        
        // Set up a listener for the PlanComparison component to set the plan
        // This ensures our header always matches what's shown in the plan comparison
        const checkInterval = setInterval(() => {
            if (typeof window !== 'undefined' && window.omCurrentPlan) {
                const windowPlan = window.omCurrentPlan;
                // Only recalculate if the plan changed
                if (windowPlan !== planName) {
                    console.log("Plan changed from window:", windowPlan);
                    calculateUsage();
                }
            }
        }, 500);
        
        return () => clearInterval(checkInterval);
    }, [calculateUsage, planName]);

    // In local development mode, show a simplified component
    if (false && isLocalMode()) { // Temporarily disable development mode check
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

            <div className="flex gap-2 mb-6">
                {/* Top Up Minutes Button */}
                <div className="w-1/3">
                    <a
                        href="https://buy.stripe.com/dR63cQee4dtVclqbII"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-10 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-all"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Top Up Minutes
                    </a>
                </div>

                {/* Gift Minutes Button */}
                <div className="w-1/3">
                    <a
                        href="https://buy.stripe.com/5kAdRuc5W2Phdpu6op"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-10 w-full bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md transition-all"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="8" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 8v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M16 8V6c0-2-1.5-4-4-4S8 4 8 6v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Gift Minutes
                    </a>
                </div>

                {/* Manage Subscription Button */}
                <div className="w-1/3">
                    <form>
                        <input type="hidden" name="accountId" value={accountId} />
                        <input type="hidden" name="returnUrl" value={returnUrl} />
                        <SubmitButton
                            pendingText="Loading..."
                            formAction={manageSubscription}
                            className="w-full bg-primary text-white hover:bg-primary/90 rounded-md h-10"
                        >
                            Manage Subscription
                        </SubmitButton>
                    </form>
                </div>
            </div>
        </div>
    )
}
