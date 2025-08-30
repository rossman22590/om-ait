'use client';

import { useMemo, useState, useEffect } from 'react';
import { BillingModal } from '@/components/billing/billing-modal';
import { CreditPurchaseModal } from '@/components/billing/credit-purchase';
import { useAccounts } from '@/hooks/use-accounts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { isLocalMode } from '@/lib/config';
import Link from 'next/link';
import { OpenInNewWindowIcon } from '@radix-ui/react-icons';
import { PricingSection } from '@/components/home/sections/pricing-section';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAgentLimits } from '@/hooks/react-query/agents/use-agents';

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

// CSS for the progress bar and keyframes animation for the gradient
const progressBarStyles = `
  .progress-bar-container {
    width: 100%;
    height: 0.75rem;
    background-color: rgba(75, 75, 75, 0.25);
    border-radius: 9999px;
    margin-top: 0.5rem;
    overflow: hidden;
  }

  @keyframes flow {
    0% { background-position: 200% 50%; }
    100% { background-position: 0% 50%; }
  }

  .progress-bar {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, 
      #8b5cf6, 
      #a855f7, 
      #c084fc, 
      #d946ef, 
      #f472b6, 
      #ec4899, 
      #d946ef, 
      #c084fc, 
      #a855f7, 
      #8b5cf6
    );
    background-size: 500% 100%;
    animation: flow 12s linear infinite;
    transition: width 0.3s ease-in-out;
  }
`;

export default function PersonalAccountBillingPage() {
  const { data: accounts, isLoading, error } = useAccounts();
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);

  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useSharedSubscription();

  // Fetch agent limits and usage
  const { data: agentLimitsData, isLoading: agentLimitsLoading, error: agentLimitsError } = useAgentLimits();

  // Debug log for subscription and agent limits
  useEffect(() => {
    if (subscriptionData) {
      console.log('[Billing] Subscription data loaded:', subscriptionData);
    }
    if (subscriptionError) {
      console.error('[Billing] Subscription error:', subscriptionError);
    }
    if (agentLimitsData) {
      console.log('[Billing] Agent limits data loaded:', agentLimitsData);
    }
    if (agentLimitsError) {
      console.error('[Billing] Agent limits error:', agentLimitsError);
    }
  }, [subscriptionData, subscriptionError, agentLimitsData, agentLimitsError]);

  const personalAccount = useMemo(
    () => accounts?.find((account) => account.personal_account),
    [accounts],
  );

  // Add the keyframes animation to the document head
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = progressBarStyles;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Function to get friendly plan name
  const getPlanDisplayName = (planName?: string) => {
    if (!planName) return 'Free';
    
    const planMap: { [key: string]: string } = {
      'free': 'Free',
      'tier_2_20': 'Plus',
      'tier_6_50': 'Pro', 
      'tier_12_100': 'Business',
      'tier_25_200': 'Ultra',
      'tier_50_400': 'Enterprise',
      'tier_125_800': 'Scale',
      'tier_200_1000': 'Premium'
    };
    
    return planMap[planName] || planName.charAt(0).toUpperCase() + planName.slice(1);
  };



  if (error) {
    return (
      <Alert
        variant="destructive"
        className="border-red-300 dark:border-red-800 rounded-xl"
      >
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load account data'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading || agentLimitsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
        <div className="h-96 bg-muted animate-pulse rounded-xl"></div>
      </div>
    );
  }

  if (!personalAccount) {
    return (
      <Alert
        variant="destructive"
        className="border-red-300 dark:border-red-800 rounded-xl"
      >
        <AlertTitle>Account Not Found</AlertTitle>
        <AlertDescription>
          Your personal account could not be found.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <BillingModal 
        open={showBillingModal} 
        onOpenChange={setShowBillingModal}
        returnUrl={`${returnUrl}/settings/billing`}
      />
      
      {/* Current Plan & Usage Header */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl border border-purple-200/50 dark:border-purple-800/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Billing & Usage
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {subscriptionData ? 'Manage your subscription and monitor usage' : 'Choose a plan to get started'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" asChild className="whitespace-nowrap">
              <Link href="/settings/usage-logs">
                View Usage Logs
              </Link>
            </Button>
            {subscriptionData && (
              <Button
                onClick={() => setShowBillingModal(true)}
                className="whitespace-nowrap"
              >
                Manage Subscription
              </Button>
            )}
          </div>
        </div>

        {isLocalMode() ? (
          <div className="bg-white/70 dark:bg-gray-900/40 rounded-xl p-6 border border-white/50 dark:border-gray-700/50">
            <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Running in local development mode - billing features are disabled
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Agent usage limits are not enforced in this environment
              </p>
            </div>
          </div>
        ) : subscriptionLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : subscriptionError ? (
          <div className="bg-white/70 dark:bg-gray-900/40 rounded-xl p-6 border border-white/50 dark:border-gray-700/50">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
              <p className="text-sm text-destructive">
                Error loading billing status: {subscriptionError.message}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Usage Progress Section */}
            <div className="bg-white/70 dark:bg-gray-900/40 rounded-xl p-6 border border-white/50 dark:border-gray-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Agent Usage This Month
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current Plan: <span className="font-medium">{getPlanDisplayName(subscriptionData?.plan_name)}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current Usage: <span className="font-medium text-purple-600 dark:text-purple-400">
                        ${subscriptionData?.current_usage?.toFixed(2) || '0.00'}
                      </span> this month
                    </p>
                  </div>
                </div>
                

              </div>

              {/* Usage Stats with Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ${subscriptionData?.current_usage?.toFixed(2) || '0.00'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">of</span>
                    <span className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                      ${subscriptionData?.cost_limit?.toFixed(2) || '5.00'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">budget</span>
                  </div>
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {subscriptionData?.cost_limit && subscriptionData?.current_usage 
                      ? `$${Math.max(0, (subscriptionData.cost_limit - subscriptionData.current_usage)).toFixed(2)} remaining`
                      : `$${subscriptionData?.cost_limit?.toFixed(2) || '5.00'} remaining`}
                  </div>
                </div>
                
                {/* Animated Progress Bar */}
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar"
                    style={{
                      width: `${Math.min(100, ((subscriptionData?.current_usage || 0) / (subscriptionData?.cost_limit || 5)) * 100)}%`
                    }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>$0</span>
                  <span>${subscriptionData?.cost_limit?.toFixed(2) || '5.00'}</span>
                </div>
              </div>
            </div>

            {/* Credit Balance and Agent Capacity Cards */}
            <div className="grid md:grid-cols-2 gap-6 mt-8 mb-8">
            
            {/* Credit Balance Display - Enhanced design */}
            <div className="bg-white/70 dark:bg-gray-900/40 rounded-xl p-6 border border-white/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Credit Balance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available for usage beyond subscription limits</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    ${subscriptionData?.credit_balance?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    credits available
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setShowCreditPurchaseModal(true)}
                size="sm"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                💳 Buy Credits
              </Button>
            </div>

            {/* Agent Capacity Section */}
            <div className="bg-white/70 dark:bg-gray-900/40 rounded-xl p-6 border border-white/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Agent Capacity</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Custom agents created vs your {getPlanDisplayName(subscriptionData?.plan_name)} plan limit
                  </p>
                </div>
                {agentLimitsLoading ? (
                  <div className="text-right">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                    <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-1"></div>
                  </div>
                ) : agentLimitsData ? (
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      <span className={agentLimitsData.current_count >= agentLimitsData.limit ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                        {agentLimitsData.current_count}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">/{agentLimitsData.limit}</span>
                      {agentLimitsData.current_count >= agentLimitsData.limit && (
                        <span className="ml-2 inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300">Limit Reached</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {getPlanDisplayName(agentLimitsData.tier_name)} plan • {Math.max(0, agentLimitsData.limit - agentLimitsData.current_count)} slots remaining
                    </div>
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600 dark:text-red-400">Error loading</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Check connection</div>
                  </div>
                )}
              </div>
              
              {agentLimitsData && (
                <>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${Math.min(100, agentLimitsData.usage_percentage)}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>0 agents</span>
                    <span>{agentLimitsData.limit} agent limit</span>
                  </div>
                  
                  {/* Show upgrade suggestion if approaching limit */}
                  {agentLimitsData.usage_percentage > 80 && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Almost at limit!</strong> Upgrade your plan to create more agents.
                      </p>
                      <Button
                        onClick={() => setShowBillingModal(true)}
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/20"
                      >
                        Upgrade Plan
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
            </div> {/* End grid */}
          </>
        )}
      </div>

      {/* Pricing Plans */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Choose Your Plan
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Select the perfect plan for your AI automation needs
          </p>
        </div>

        <PricingSection 
          returnUrl={`${returnUrl}/settings/billing`} 
          showTitleAndTabs={false} 
          insideDialog={true}
        />
      </div>

      {/* Model Pricing Link */}
      <div className="flex justify-center">
        <Button variant="outline" asChild className="gap-2">
          <Link href="/model-pricing">
            View Detailed Model Pricing
            <OpenInNewWindowIcon className="w-4 h-4" />
          </Link>
        </Button>
      </div>
      
      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        open={showCreditPurchaseModal}
        onOpenChange={setShowCreditPurchaseModal}
        currentBalance={subscriptionData?.credit_balance || 0}
        canPurchase={true}
        onPurchaseComplete={() => {
          // Optionally refresh subscription data here
          window.location.reload();
        }}
        onUpgradeClick={() => {
          setShowBillingModal(true);
        }}
      />
    </div>
  );
}
