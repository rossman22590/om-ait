'use client';

import { SectionHeader } from '@/components/home/section-header';
import type { PricingTier } from '@/lib/home';
import { siteConfig } from '@/lib/home';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  createCheckoutSession,
  SubscriptionStatus,
  CreateCheckoutSessionResponse,
} from '@/lib/api';
import { toast } from 'sonner';
import { isLocalMode } from '@/lib/config';
import { useSubscription } from '@/hooks/react-query';

// Constants
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO: 'base',
  ENTERPRISE: 'extra',
};

// Types
type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'link'
  | null;

interface PricingTabsProps {
  activeTab: 'cloud' | 'self-hosted';
  setActiveTab: (tab: 'cloud' | 'self-hosted') => void;
  className?: string;
}

interface PriceDisplayProps {
  price: string;
  isCompact?: boolean;
}

interface PricingTierProps {
  tier: PricingTier;
  isCompact?: boolean;
  currentSubscription: SubscriptionStatus | null;
  isLoading: Record<string, boolean>;
  isFetchingPlan: boolean;
  selectedPlan?: string;
  onPlanSelect?: (planId: string) => void;
  onSubscriptionUpdate?: () => void;
  isAuthenticated?: boolean;
  returnUrl: string;
  insideDialog?: boolean;
}

// Components
function PricingTabs({ activeTab, setActiveTab, className }: PricingTabsProps) {
  return (
    <div
      className={cn(
        'relative flex w-fit items-center rounded-full border p-0.5 backdrop-blur-sm cursor-pointer h-9 flex-row bg-muted',
        className,
      )}
    >
      {['cloud', 'self-hosted'].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab as 'cloud' | 'self-hosted')}
          className={cn(
            'relative z-[1] px-3 h-8 flex items-center justify-center cursor-pointer',
            {
              'z-0': activeTab === tab,
            },
          )}
        >
          {activeTab === tab && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 rounded-full bg-white dark:bg-[#3F3F46] shadow-md border border-border"
              transition={{
                duration: 0.2,
                type: 'spring',
                stiffness: 300,
                damping: 25,
                velocity: 2,
              }}
            />
          )}
          <span
            className={cn(
              'relative block text-sm font-medium duration-200 shrink-0',
              activeTab === tab ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {tab === 'cloud' ? 'Cloud' : 'Self-Hosted'}
          </span>
        </button>
      ))}
    </div>
  );
}

function PriceDisplay({ price, isCompact = false }: PriceDisplayProps) {
  return (
    <div className="flex items-baseline">
      <span
        className={cn(
          'font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent',
          isCompact ? 'text-2xl' : 'text-3xl',
        )}
      >
        {price}
      </span>
      {price !== '$0' && (
        <span className="text-gray-500 dark:text-gray-400 text-sm ml-1 font-medium">/month</span>
      )}
    </div>
  );
}

function PricingTier({
  tier,
  isCompact = false,
  currentSubscription,
  isLoading,
  isFetchingPlan,
  selectedPlan,
  onPlanSelect,
  onSubscriptionUpdate,
  isAuthenticated = false,
  returnUrl,
  insideDialog = false,
}: PricingTierProps) {
  const handleSelectPlan = async () => {
    if (!tierPriceId) return;

    onPlanSelect?.(tierPriceId);

    if (!isAuthenticated) {
      window.location.href = '/auth';
      return;
    }

    if (tier.price === '$0') {
      window.location.href = '/dashboard';
      return;
    }

    try {
      const result: CreateCheckoutSessionResponse = await createCheckoutSession(
        {
          price_id: tierPriceId,
          success_url: returnUrl || `${window.location.origin}/dashboard`,
          cancel_url: window.location.href,
        },
      );

      if (result.status === 'new' && result.url) {
        window.location.href = result.url;
      } else if (result.status === 'upgraded') {
        toast.success('Plan upgraded successfully!');
        onSubscriptionUpdate?.();
      } else if (result.status === 'downgrade_scheduled') {
        toast.success('Downgrade scheduled for the end of your billing period.');
        onSubscriptionUpdate?.();
      } else if (result.status === 'no_change') {
        toast.info('You are already on this plan.');
        onSubscriptionUpdate?.();
      } else if (result.status === 'scheduled') {
        toast.success(
          `Plan change scheduled. Your new plan will be active on ${result.effective_date}.`,
        );
        onSubscriptionUpdate?.();
      } else {
        console.log('Checkout session result:', result);
        toast.success('Subscription updated successfully!');
        onSubscriptionUpdate?.();
      }
    } catch (error: any) {
      console.error('Error processing subscription:', error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to process subscription. Please try again.';
      toast.error(errorMessage);
    }
  };

  const tierPriceId = tier.stripePriceId;
  const displayPrice = tier.price;

  // Find the current tier (moved outside conditional for JSX access)
  const currentTier = siteConfig.cloudPricingItems.find(
    (p) => p.stripePriceId === currentSubscription?.price_id,
  );

  const isCurrentActivePlan =
    isAuthenticated && currentSubscription?.price_id === tierPriceId;
  const isScheduled = isAuthenticated && currentSubscription?.has_schedule;
  const isScheduledTargetPlan =
    isScheduled && currentSubscription?.scheduled_price_id === tierPriceId;
  const isPlanLoading = isLoading[tierPriceId];

  let buttonText = isAuthenticated ? 'Select Plan' : 'Start Free';
  let buttonDisabled = isPlanLoading;
  let buttonVariant: ButtonVariant = null;
  let ringClass = '';
  let statusBadge = null;
  let buttonClassName = '';

  if (isAuthenticated) {
    if (isCurrentActivePlan) {
      buttonText = 'Current Plan';
      buttonDisabled = true;
      buttonVariant = 'secondary';
      ringClass = isCompact ? 'ring-1 ring-primary' : 'ring-2 ring-primary';
      statusBadge = (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
            Current Plan
          </span>
        </div>
      );
    } else if (isScheduledTargetPlan) {
      buttonText = 'Scheduled';
      buttonDisabled = true;
      buttonVariant = 'outline';
      ringClass = isCompact ? 'ring-1 ring-orange-500' : 'ring-2 ring-orange-500';
      statusBadge = (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
            Scheduled
          </span>
        </div>
      );
    }
  }

  if (isPlanLoading) {
    buttonText = 'Processing...';
  }

  // Determine card styling
  const cardClass = cn(
    'relative h-full border rounded-2xl transition-all duration-300',
    'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm hover:shadow-xl',
    {
      [ringClass]: isCurrentActivePlan || isScheduledTargetPlan,
      'border-primary shadow-xl ring-2 ring-primary/20 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-950/30': 
        tier.isPopular && !isCurrentActivePlan && !isScheduledTargetPlan,
      'hover:scale-[1.02] hover:shadow-xl': !isCurrentActivePlan && !isScheduledTargetPlan,
      'border-gray-200 dark:border-gray-700': !tier.isPopular && !isCurrentActivePlan && !isScheduledTargetPlan,
    },
  );

  const contentPadding = isCompact ? 'p-4' : 'p-6';

  return (
    <div className={cardClass}>
      {statusBadge}
      
      {tier.isPopular && !isCurrentActivePlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap">
            Most Popular
          </span>
        </div>
      )}

      <div className={cn('flex flex-col h-full', contentPadding)}>
        <div className="flex-1">
          <div className="mb-4">
            <h3 className={cn('font-semibold text-foreground', isCompact ? 'text-lg' : 'text-xl')}>
              {tier.name}
            </h3>
            <p className={cn('text-muted-foreground mt-1', isCompact ? 'text-xs' : 'text-sm')}>
              {tier.description}
            </p>
          </div>

          <div className="mb-6">
            <PriceDisplay price={displayPrice} isCompact={isCompact} />
          </div>

          <ul className="space-y-2 mb-6">
            {tier.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckIcon className="h-4 w-4 text-primary mt-0.5 mr-2 flex-shrink-0" />
                <span className={cn('text-foreground', isCompact ? 'text-xs' : 'text-sm')}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={handleSelectPlan}
          disabled={buttonDisabled || isFetchingPlan}
          variant={buttonVariant || 'default'}
          className={cn('w-full', buttonClassName)}
          size={isCompact ? 'sm' : 'default'}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
}

interface PricingSectionProps {
  deploymentType?: 'cloud' | 'self-hosted';
  setDeploymentType?: (type: 'cloud' | 'self-hosted') => void;
  showTitleAndTabs?: boolean;
  insideDialog?: boolean;
  isCompact?: boolean;
  hideFree?: boolean;
  returnUrl?: string;
}

export function PricingSection({
  deploymentType: propDeploymentType,
  setDeploymentType: propSetDeploymentType,
  showTitleAndTabs = true,
  insideDialog = false,
  isCompact = false,
  hideFree = false,
  returnUrl = '/dashboard',
}: PricingSectionProps) {
  const { data: currentSubscription, isLoading: isFetchingSubscription, refetch: refetchSubscription } = useSubscription();
  const isAuthenticated = !!currentSubscription;

  const [deploymentType, setDeploymentType] = useState<'cloud' | 'self-hosted'>(
    propDeploymentType || 'cloud',
  );
  const [planLoadingStates, setPlanLoadingStates] = useState<Record<string, boolean>>({});

  const handlePlanSelect = (planId: string) => {
    setPlanLoadingStates((prev) => ({ ...prev, [planId]: true }));
  };

  const handleSubscriptionUpdate = () => {
    refetchSubscription();
    // The useSubscription hook will automatically refetch, so we just need to clear loading states
    setTimeout(() => {
      setPlanLoadingStates({});
    }, 1000);
  };

  const handleTabChange = (tab: 'cloud' | 'self-hosted') => {
    if (tab === 'self-hosted') {
      const openSourceSection = document.getElementById('open-source');
      if (openSourceSection) {
        const rect = openSourceSection.getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const offsetPosition = scrollTop + rect.top - 100;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    } else {
      setDeploymentType(tab);
    }
  };

  return (
    <section
      id="pricing"
      className={cn("flex flex-col items-center justify-center gap-10 w-full relative pb-12")}
    >
      {showTitleAndTabs && (
        <>
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
              Choose the right plan for your needs
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Start with our free plan or upgrade for more AI token credits
            </p>
          </SectionHeader>
          <div className="relative w-full h-full">
            <div className="absolute -top-14 left-1/2 -translate-x-1/2">
              <PricingTabs
                activeTab={deploymentType}
                setActiveTab={handleTabChange}
                className="mx-auto"
              />
            </div>
          </div>
        </>
      )}

      {deploymentType === 'cloud' && (
        <div className="w-full">
          {/* Mobile: Horizontal scroll carousel */}
          <div className="md:hidden">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Swipe to see all plans →
              </p>
            </div>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 pb-4">
              {siteConfig.cloudPricingItems
                .filter((tier) => (!hideFree || tier.price !== '$0'))
                .map((tier) => (
                  <div 
                    key={tier.name}
                    className="flex-shrink-0 w-72 snap-center"
                  >
                    <PricingTier
                      tier={tier}
                      currentSubscription={currentSubscription}
                      isLoading={planLoadingStates}
                      isFetchingPlan={isFetchingSubscription}
                      onPlanSelect={handlePlanSelect}
                      onSubscriptionUpdate={handleSubscriptionUpdate}
                      isAuthenticated={isAuthenticated}
                      returnUrl={returnUrl}
                      insideDialog={insideDialog}
                      isCompact={isCompact}
                    />
                  </div>
                ))}
            </div>
            
            {/* Scroll indicator dots for mobile */}
            <div className="flex justify-center gap-2 mt-4">
              {siteConfig.cloudPricingItems
                .filter((tier) => (!hideFree || tier.price !== '$0'))
                .map((_, index) => (
                  <div 
                    key={index}
                    className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"
                  />
                ))}
            </div>
          </div>

          {/* Desktop/Tablet: Grid layout */}
          <div className={cn(
            "hidden md:grid gap-4 w-full mx-auto",
            {
              "px-6 max-w-7xl": !insideDialog,
              "max-w-7xl": insideDialog
            },
            insideDialog
              ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            "items-stretch"
          )}>
            {siteConfig.cloudPricingItems
              .filter((tier) => (!hideFree || tier.price !== '$0'))
              .map((tier) => (
                <PricingTier
                  key={tier.name}
                  tier={tier}
                  currentSubscription={currentSubscription}
                  isLoading={planLoadingStates}
                  isFetchingPlan={isFetchingSubscription}
                  onPlanSelect={handlePlanSelect}
                  onSubscriptionUpdate={handleSubscriptionUpdate}
                  isAuthenticated={isAuthenticated}
                  returnUrl={returnUrl}
                  insideDialog={insideDialog}
                  isCompact={isCompact}
                />
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
