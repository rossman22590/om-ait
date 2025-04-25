"use server";

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
    const isoStartOfMonth = startOfMonth.toISOString();
    
    let totalAgentTime = 0;
    let usageDisplay = "No usage this month";
    
    // Direct check for price_id against SUBSCRIPTION_PLANS constants
    let planName = "Free"; // Default
    
    // Add additional logging to help debug
    console.log('[Server] FULL subscription data:', JSON.stringify(subscriptionData));
    console.log('[Server] Checking subscription data:', 
                'price_id:', subscriptionData?.price_id,
                'status:', subscriptionData?.status,
                'PRO ID:', SUBSCRIPTION_PLANS.PRO, 
                'ENTERPRISE ID:', SUBSCRIPTION_PLANS.ENTERPRISE);
    
    // Print actual constants for debugging
    console.log('[Server] SUBSCRIPTION_PLANS constants:', {
      FREE: SUBSCRIPTION_PLANS.FREE,
      PRO: SUBSCRIPTION_PLANS.PRO,
      ENTERPRISE: SUBSCRIPTION_PLANS.ENTERPRISE
    });
    
    // Only consider active subscriptions with matching price IDs
    if (subscriptionData?.status === 'active') {
        // Log the exact values and types for comparison
        console.log('[Server] Comparison test:', {
            price_id: subscriptionData.price_id,
            pro_id: SUBSCRIPTION_PLANS.PRO,
            enterprise_id: SUBSCRIPTION_PLANS.ENTERPRISE,
            price_id_type: typeof subscriptionData.price_id,
            pro_id_type: typeof SUBSCRIPTION_PLANS.PRO,
            isPro: subscriptionData.price_id === SUBSCRIPTION_PLANS.PRO,
            isEnterprise: subscriptionData.price_id === SUBSCRIPTION_PLANS.ENTERPRISE
        });
        
        // Use string comparison as backup if direct equality fails
        const proIdString = String(SUBSCRIPTION_PLANS.PRO).trim();
        const enterpriseIdString = String(SUBSCRIPTION_PLANS.ENTERPRISE).trim();
        const priceIdString = String(subscriptionData.price_id || '').trim();
        
        console.log('[Server] String comparison:', {
          priceIdString,
          proIdString,
          enterpriseIdString,
          stringMatchPro: priceIdString === proIdString,
          stringMatchEnterprise: priceIdString === enterpriseIdString
        });
        
        // Try both direct comparison and string comparison
        if (subscriptionData.price_id === SUBSCRIPTION_PLANS.PRO || 
            priceIdString === proIdString) {
            planName = "Pro";
        } else if (subscriptionData.price_id === SUBSCRIPTION_PLANS.ENTERPRISE || 
                  priceIdString === enterpriseIdString) {
            planName = "Enterprise"; 
        } else {
            // If there's a subscription but not matching our known plans, default to Free
            planName = "Free";
        }
    } else {
        // No active subscription means Free plan
        planName = "Free";
    }
    
    console.log('[Server] Detected plan:', planName);

    // Set plan minutes based on detected plan
    let totalPlanMinutes = 25; // Default free plan
    
    // BETTER APPROACH: Use client-side globals on the server if available
    if (typeof window !== 'undefined' && window.omCurrentPlan) {
      console.log('[Server] Using client detection from window:', window.omCurrentPlan, window.omPlanMinutes);
      planName = window.omCurrentPlan;
      if (window.omPlanMinutes) {
        totalPlanMinutes = window.omPlanMinutes;
      }
    } else {
      // Fallback to more reliable string comparison for server
      if (subscriptionData?.status === 'active' && subscriptionData.price_id) {
        const priceIdString = String(subscriptionData.price_id).trim();
        const proIdString = String(SUBSCRIPTION_PLANS.PRO).trim();
        const enterpriseIdString = String(SUBSCRIPTION_PLANS.ENTERPRISE).trim();
        
        if (priceIdString === proIdString) {
          planName = "Pro";
          totalPlanMinutes = 500;
        } else if (priceIdString === enterpriseIdString) {
          planName = "Enterprise";
          totalPlanMinutes = 3000;
        }
      }
    }
    
    console.log('[Server] Final plan determination:', planName, totalPlanMinutes);
    
    // This is redundant but kept for safety
    if (planName === "Pro") {
        totalPlanMinutes = 500;
    } else if (planName === "Enterprise") {
        totalPlanMinutes = 3000;
    }
    
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
            const remainingMinutes = Math.max(0, totalPlanMinutes - totalMinutes);
            usageDisplay = `${totalMinutes}/${totalPlanMinutes} minutes (${remainingMinutes} remaining)`;
        } else {
            usageDisplay = `0/${totalPlanMinutes} minutes (${totalPlanMinutes} remaining)`;
        }
    } else {
        usageDisplay = `0/${totalPlanMinutes} minutes (${totalPlanMinutes} remaining)`;
    }

    return (
        <div className="not-prose grid gap-2">
            {/* Force reuse the client side detection result when rendering */}
            <ClientSideDetectionFallback 
                planName={planName} 
                totalPlanMinutes={totalPlanMinutes} 
                agentMinutesUsed={Math.round(totalAgentTime / 60)} 
                accountId={accountId}
                returnUrl={returnUrl}
            />
        </div>
    );
}

// Client-side component that will override server data with client data
function ClientSideDetectionFallback({ 
  planName: serverPlanName, 
  totalPlanMinutes: serverTotalMinutes,
  agentMinutesUsed,
  accountId,
  returnUrl
}: { 
  planName: string, 
  totalPlanMinutes: number,
  agentMinutesUsed: number,
  accountId: string,
  returnUrl: string
}) {
  const [planName, setPlanName] = useState(serverPlanName);
  const [totalPlanMinutes, setTotalPlanMinutes] = useState(serverTotalMinutes);
  
  useEffect(() => {
    // Use client-detected plan from window globals, which we know is accurate
    if (typeof window !== 'undefined') {
      console.log('[CLIENT FALLBACK] Overriding server detection with', {
        clientPlan: window.omCurrentPlan,
        clientMinutes: window.omPlanMinutes,
        serverPlan: serverPlanName,
        serverMinutes: serverTotalMinutes
      });
      
      // Always use client-side detection result (from plan-comparison.tsx)
      if (window.omCurrentPlan) {
        setPlanName(window.omCurrentPlan);
      }
      if (window.omPlanMinutes) {
        setTotalPlanMinutes(window.omPlanMinutes);
      }
    }
  }, [serverPlanName, serverTotalMinutes]);
  
  // Calculate remaining minutes
  const remainingMinutes = Math.max(0, totalPlanMinutes - agentMinutesUsed);

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
                  {agentMinutesUsed}/{totalPlanMinutes} minutes ({remainingMinutes} remaining)
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
