'use client';

import { Button } from '@/components/ui/button';
import { createPortalSession, SubscriptionStatus } from '@/lib/api';
import { useSubscription } from '@/hooks/react-query';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OpenInNewWindowIcon } from '@radix-ui/react-icons';
import { PricingSection } from '@/components/home/sections/pricing-section';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  accountId: string;
  returnUrl: string;
}

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

export default function AccountBillingStatus({ accountId, returnUrl }: Props) {
  const { data: subscriptionData, isLoading, refetch } = useSubscription();
  const [isManaging, setIsManaging] = useState(false);
  const [isAddingMinutes, setIsAddingMinutes] = useState(false);

  // Add the keyframes animation to the document head
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = progressBarStyles;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleManageSubscription = async () => {
    try {
      setIsManaging(true);
      const result = await createPortalSession({ return_url: returnUrl });
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
    } finally {
      setIsManaging(false);
    }
  };

  const handleBuyAdditionalMinutes = () => {
    setIsAddingMinutes(true);
    window.location.href = "https://buy.stripe.com/4gMdR9gyU22V5hC74i8AE02";
  };

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

  // Function to estimate minutes used based on cost
  // Average cost per minute is roughly $0.10-$0.20, so we'll use $0.15 as a rough estimate
  const getEstimatedMinutes = (currentUsage?: number) => {
    if (!currentUsage || currentUsage === 0) return 0;
    const averageCostPerMinute = 0.15; // Rough estimate
    return Math.round(currentUsage / averageCostPerMinute);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
        <div className="h-96 bg-muted animate-pulse rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
                onClick={handleManageSubscription}
                disabled={isManaging}
                className="whitespace-nowrap"
              >
                {isManaging ? 'Loading...' : 'Manage Subscription'}
              </Button>
            )}
          </div>
        </div>

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
                  Estimated: <span className="font-medium text-purple-600 dark:text-purple-400">
                    ~{getEstimatedMinutes(subscriptionData?.current_usage)} minutes
                  </span> used this month
                </p>
              </div>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleBuyAdditionalMinutes}
                    disabled={isAddingMinutes}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md transition-all whitespace-nowrap"
                  >
                    {isAddingMinutes ? 'Redirecting...' : 'Buy Additional Credits'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="w-64 p-2">
                  <p className="text-sm text-center">$10 of credits costs $10 and is roughly 1 hour of usage. You can purchase up to 500 additional credits. If you need more, please reach out to support.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
          returnUrl={returnUrl} 
          showTitleAndTabs={false} 
          isCompact={true}
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
    </div>
  );
}
