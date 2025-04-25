"use server";

import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "../ui/submit-button";
import { manageSubscription } from "@/lib/actions/billing";
import { PlanComparison, SUBSCRIPTION_PLANS } from "../billing/plan-comparison";
import { isLocalMode } from "@/lib/config";

// Import client component for plan display
import { DynamicPlanHeader } from "../billing/dynamic-plan-header";

type Props = {
    accountId: string;
    returnUrl: string;
}

export default async function AccountBillingStatus({ accountId, returnUrl }: Props) {
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

    const supabaseClient = await createClient();
    
    // Get account subscription and usage data
    const { data: subscriptionData } = await supabaseClient
        .schema('basejump')
        .from('billing_subscriptions')
        .select('*')
        .eq('account_id', accountId)
        .eq('status', 'active')
        .limit(1)
        .order('created_at', { ascending: false })
        .single();
    
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
    startOfMonth.setHours(0, 0, 0, 0); // Match the exact pattern in ThreadPage
    const isoStartOfMonth = startOfMonth.toISOString();
    
    let totalAgentTime = 0;
    let usageDisplay = "No usage this month";
    
    // Set the total minutes based on plan
    let totalPlanMinutes = 25; // Default free plan minutes
    if (subscriptionData?.price_id === SUBSCRIPTION_PLANS.PRO) {
        totalPlanMinutes = 500; // Pro plan
    } else if (subscriptionData?.price_id === SUBSCRIPTION_PLANS.ENTERPRISE) {
        totalPlanMinutes = 3000; // Enterprise plan
    }
    
    if (threadIds.length > 0) {
        // COPY EXACT CODE FROM THREADPAGE - using same variable names, spacing, everything
        const { data: agentRunData } = await supabaseClient
          .from('agent_runs')
          .select('started_at, completed_at')
          .in('thread_id', threadIds)
          .gte('started_at', startOfMonth.toISOString());
        
        console.log('[DEBUG] Found agent runs:', agentRunData?.length);
        
        let totalSeconds = 0;
        if (agentRunData) {
          totalSeconds = agentRunData.reduce((acc, run) => {
            const start = new Date(run.started_at);
            const end = run.completed_at ? new Date(run.completed_at) : new Date();
            const seconds = (end.getTime() - start.getTime()) / 1000;
            return acc + seconds;
          }, 0);
        }
        
        // Convert seconds to minutes
        const totalMinutes = Math.round(totalSeconds / 60);
        const remainingMinutes = Math.max(0, totalPlanMinutes - totalMinutes);
        usageDisplay = `${totalMinutes}/${totalPlanMinutes} minutes (${remainingMinutes} remaining)`;
    } else {
        usageDisplay = `0/${totalPlanMinutes} minutes (${totalPlanMinutes} remaining)`;
    }
    
    // Determine plan name based on total minutes
    let planName = "Free";
    if (subscriptionData) {
        if (subscriptionData.price_id === SUBSCRIPTION_PLANS.PRO) {
            planName = "Pro";
        } else if (subscriptionData.price_id === SUBSCRIPTION_PLANS.ENTERPRISE) {
            planName = "Enterprise";
        }
    }

    return (
        <div className="rounded-xl border shadow-sm bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
            
            {subscriptionData ? (
                <>
                    <div className="mb-6">
                        <div className="rounded-lg border bg-background p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DynamicPlanHeader initialUsage={Math.round(totalAgentTime / 60)} fallbackPlan={planName} />
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
                </>
            ) : (
                <>
                    <div className="mb-6">
                        <div className="rounded-lg border bg-background p-4 gap-4">
                            <DynamicPlanHeader initialUsage={0} fallbackPlan="Free" />
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
                </>
            )}
        </div>
    )
}
