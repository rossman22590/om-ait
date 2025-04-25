'use client';

// Add TypeScript declarations for our global variables
declare global {
  interface Window {
    omCurrentPlan?: string;
    omPlanMinutes?: number;
  }
}

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PLAN_METADATA, getPlanMetadata, isPlanActive } from "@/lib/plan-labels";
import { Button } from "@/components/ui/button";

export const SUBSCRIPTION_PLANS = {
  FREE: process.env.NEXT_PUBLIC_STRIPE_FREE_PLAN_ID,
  PRO: process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_ID,
  ENTERPRISE: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PLAN_ID,
} as const;

interface PlanComparisonProps {
  accountId: string;
  returnUrl?: string;
  isManaged?: boolean;
  onPlanSelect?: (plan: string) => void;
  className?: string;
  isCompact?: boolean;
}

export function PlanComparison({
  accountId,
  returnUrl = typeof window !== 'undefined' ? window.location.href : '',
  isManaged = true,
  onPlanSelect,
  className = "",
  isCompact = false
}: PlanComparisonProps) {
  const [currentPlanId, setCurrentPlanId] = useState<string | undefined>();
  const [currentPlanName, setCurrentPlanName] = useState<string>("Free");

  useEffect(() => {
    async function fetchCurrentPlan() {
      if (accountId) {
        const supabase = createClient();
        let data;
        
        try {
          // Try basejump schema first
          const result = await supabase
            .schema('basejump')
            .from('billing_subscriptions')
            .select('price_id, status')
            .eq('account_id', accountId)
            .eq('status', 'active')
            .single();
            
          data = result.data;
        } catch (err) {
          console.log('[CLIENT] Error with basejump schema, falling back to public schema:', err.message);
          
          // Fallback to public schema
          const result = await supabase
            .from('billing_subscriptions')
            .select('price_id, status')
            .eq('account_id', accountId)
            .eq('status', 'active')
            .single();
            
          data = result.data;
        }
        
        if (data?.price_id && data.status === 'active') {
          setCurrentPlanId(data.price_id);
          
          // Determine plan name based on price_id
          if (data.price_id === SUBSCRIPTION_PLANS.FREE) {
            setCurrentPlanName("Free");
          } else if (data.price_id === SUBSCRIPTION_PLANS.PRO) {
            setCurrentPlanName("Pro");
          } else if (data.price_id === SUBSCRIPTION_PLANS.ENTERPRISE) {
            setCurrentPlanName("Enterprise");
          }
        } else {
          setCurrentPlanName("Free");
        }
      }
    }

    fetchCurrentPlan();
  }, [accountId]);

  const handlePlanClick = async (planId: string, planName: string) => {
    if (onPlanSelect) {
      onPlanSelect(planId);
      return;
    }

    if (!isManaged) return;

    const supabase = createClient();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: planId,
          accountId,
          returnUrl
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const planList = ["Free", "Pro", "Enterprise"];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {planList.map((planName) => {
        const planMeta = getPlanMetadata(planName);
        const isActive = isPlanActive(currentPlanName, planName);
        
        return (
          <div
            key={planName}
            className={cn(
              "rounded-xl border p-6",
              isActive && "ring-2 ring-primary",
              planMeta.popular && !isActive && "ring-1 ring-muted-foreground/20"
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{planMeta.displayName}</h3>
                {planMeta.popular && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">
                    Popular
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{planMeta.price}</span>
                {planMeta.period && (
                  <span className="text-muted-foreground">{planMeta.period}</span>
                )}
              </div>

              <div className="rounded-lg bg-muted/30 px-3 py-1 text-center">
                <span className="text-sm text-muted-foreground">
                  {planMeta.minutesDisplay}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                {planMeta.description}
              </p>

              <ul className="flex flex-col gap-2 min-h-[80px]">
                {planMeta.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  "w-full",
                  isActive && "ring-2 ring-primary pointer-events-none"
                )}
                variant={planMeta.buttonVariant}
                onClick={() => handlePlanClick(SUBSCRIPTION_PLANS[planName.toUpperCase()], planName)}
              >
                {isActive ? "Current Plan" : planMeta.buttonText}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}