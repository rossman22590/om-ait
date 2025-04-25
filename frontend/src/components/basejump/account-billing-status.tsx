"use client";

import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "../ui/submit-button";
import { manageSubscription } from "@/lib/actions/billing";
import { PlanComparison, SUBSCRIPTION_PLANS } from "../billing/plan-comparison";
import { isLocalMode } from "@/lib/config";
import { useState, useEffect } from 'react';

type Props = {
    accountId: string;
    returnUrl: string;
}

// Client component wrapper
export default function AccountBillingStatus({ accountId, returnUrl }: Props) {
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

    // Otherwise use the client-side component directly
    return (
        <div className="not-prose grid gap-2">
            <BillingStatusContent accountId={accountId} returnUrl={returnUrl} />
        </div>
    );
}

// Client component that handles all the functionality
function BillingStatusContent({ accountId, returnUrl }: Props) {
    const [planName, setPlanName] = useState<string>("Free");
    const [totalPlanMinutes, setTotalPlanMinutes] = useState<number>(25);
    const [agentMinutesUsed, setAgentMinutesUsed] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Fetch data on component mount
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                // Need to await the client creation
                const supabase = await createClient();
                
                // Fetch subscription data
                const { data: subscriptionData } = await supabase
                    .from('billing_subscriptions')
                    .select('price_id, status')
                    .eq('account_id', accountId)
                    .eq('status', 'active')
                    .single();
                    
                console.log('[Client] Subscription data:', subscriptionData);
                
                // Fetch agent usage
                const { data: threads } = await supabase
                    .from('agent_threads')
                    .select('thread_id')
                    .eq('account_id', accountId);
                
                const threadIds = threads?.map(t => t.thread_id) || [];
                
                // Get current month usage
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const isoStartOfMonth = startOfMonth.toISOString();
                
                let totalAgentTime = 0;
                
                if (threadIds.length > 0) {
                    const { data: agentRuns } = await supabase
                        .from('agent_runs')
                        .select('run_time')
                        .in('thread_id', threadIds)
                        .gte('created_at', isoStartOfMonth);
                    
                    if (agentRuns && agentRuns.length > 0) {
                        totalAgentTime = agentRuns.reduce((sum, run) => {
                            return sum + (run.run_time || 0);
                        }, 0);
                    }
                }
                
                // Convert to minutes
                const totalMinutes = Math.round(totalAgentTime / 60);
                
                // Get current plan from client-side detection
                if (typeof window !== 'undefined' && window.omCurrentPlan) {
                    console.log('[Client] Using global plan:', window.omCurrentPlan, window.omPlanMinutes);
                    setPlanName(window.omCurrentPlan);
                    if (window.omPlanMinutes) {
                        setTotalPlanMinutes(window.omPlanMinutes);
                    }
                } else {
                    // Fallback to detection based on subscription data
                    let detectedPlan = "Free";
                    let detectedMinutes = 25;
                    
                    if (subscriptionData?.status === 'active' && subscriptionData.price_id) {
                        const priceIdString = String(subscriptionData.price_id).trim();
                        const proIdString = String(SUBSCRIPTION_PLANS.PRO).trim();
                        const enterpriseIdString = String(SUBSCRIPTION_PLANS.ENTERPRISE).trim();
                        
                        if (priceIdString === proIdString) {
                            detectedPlan = "Pro";
                            detectedMinutes = 500;
                        } else if (priceIdString === enterpriseIdString) {
                            detectedPlan = "Enterprise";
                            detectedMinutes = 3000;
                        }
                    }
                    
                    setPlanName(detectedPlan);
                    setTotalPlanMinutes(detectedMinutes);
                }
                
                setAgentMinutesUsed(totalMinutes);
            } catch (error) {
                console.error('Error fetching billing data:', error);
                // Set defaults on error
                setPlanName("Free");
                setTotalPlanMinutes(25);
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchData();
    }, [accountId]);
    
    // Calculate remaining minutes
    const remainingMinutes = Math.max(0, totalPlanMinutes - agentMinutesUsed);
    const usageDisplay = `${agentMinutesUsed}/${totalPlanMinutes} minutes (${remainingMinutes} remaining)`;
    
    if (isLoading) {
        return <div>Loading billing information...</div>;
    }

    return (
        <>
          <div className="rounded-lg border shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">
                Billing Status
              </h3>
            </div>
            <div className="p-6 pt-0">
              <div className="mb-4 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium leading-none">
                        Current Plan
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {planName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium leading-none">
                        Agent Usage This Month
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {usageDisplay}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <PlanComparison
            accountId={accountId}
            returnUrl={returnUrl}
            className="mb-6"
          />

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
    );
}
