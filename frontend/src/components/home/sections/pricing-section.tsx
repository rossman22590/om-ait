'use client';

import type { PricingTier } from '@/lib/home';
import { siteConfig } from '@/lib/home';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import {
  CheckIcon,
  Clock,
  Bot,
  FileText,
  Settings,
  Grid3X3,
  Image,
  Video,
  Presentation,
  Diamond,
  Heart,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { isLocalMode, config } from '@/lib/config';
import { useAuth } from '@/components/AuthProvider';
import posthog from 'posthog-js';
import { Badge } from '@/components/ui/badge';
import { AnimatedBg } from '@/components/home/ui/AnimatedBg';

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



interface PriceDisplayProps {
  price: string;
  isCompact?: boolean;
}

interface PricingTierProps {
  tier: PricingTier;
  isCompact?: boolean;
  currentSubscription: any; // Use 'any' or a custom type if needed
  isLoading: Record<string, boolean>;
  isFetchingPlan: boolean;
  selectedPlan?: string;
  onPlanSelect?: (planId: string) => void;
  onSubscriptionUpdate?: () => void;
  isAuthenticated?: boolean;
  returnUrl: string;
  insideDialog?: boolean;
  billingPeriod?: 'monthly' | 'yearly' | 'yearly_commitment';
}

// Helper function to get plan icon
function getPlanIcon(planName: string, isLocal: boolean = false) {
  if (isLocal) return '/plan-icons/ultra.svg';

  const plan = planName?.toLowerCase();
  if (plan?.includes('ultra')) return '/plan-icons/ultra.svg';
  if (plan?.includes('pro')) return '/logo.png';
  if (plan?.includes('plus')) return '/plan-icons/plus.svg';
  return '/plan-icons/plus.svg'; // default
}

// Feature icon mapping
const getFeatureIcon = (feature: string) => {
  const featureLower = feature.toLowerCase();

  if (featureLower.includes('token credits') || featureLower.includes('ai token')) {
    return <Clock className="size-4" />;
  }
  if (featureLower.includes('custom agents') || featureLower.includes('agents')) {
    return <Bot className="size-4" />;
  }
  if (featureLower.includes('private projects') || featureLower.includes('public projects')) {
    return <FileText className="size-4" />;
  }
  if (featureLower.includes('custom abilities') || featureLower.includes('basic abilities')) {
    return <Settings className="size-4" />;
  }
  if (featureLower.includes('integrations') || featureLower.includes('100+')) {
    return <Grid3X3 className="size-4" />;
  }
  if (featureLower.includes('premium ai models')) {
    return <Diamond className="size-4" />;
  }
  if (featureLower.includes('community support') || featureLower.includes('priority support')) {
    return <Heart className="size-4" />;
  }
  if (featureLower.includes('image') || featureLower.includes('video') || featureLower.includes('slides') || featureLower.includes('generation')) {
    return <Image className="size-4" />;
  }
  if (featureLower.includes('dedicated account manager')) {
    return <Zap className="size-4" />;
  }

  // Default icon
  return <CheckIcon className="size-4" />;
};

// Components

function PriceDisplay({ price, isCompact }: PriceDisplayProps) {
  return (
    <motion.span
      key={price}
      className={isCompact ? 'text-xl font-medium' : 'text-[48px] font-medium leading-none'}
      initial={{
        opacity: 0,
        x: 10,
        filter: 'blur(5px)',
      }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {price}
    </motion.span>
  );
}

function BillingPeriodToggle({
  billingPeriod,
  setBillingPeriod
}: {
  billingPeriod: 'monthly' | 'yearly_commitment';
  setBillingPeriod: (period: 'monthly' | 'yearly_commitment') => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 w-full">
      <div className="flex gap-2 justify-end w-full">
        <Button
          variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
          onClick={() => setBillingPeriod('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={billingPeriod === 'yearly_commitment' ? 'default' : 'outline'}
          onClick={() => setBillingPeriod('yearly_commitment')}
          className="flex items-center gap-1.5"
        >
          Yearly
          <span className="text-[10px] font-semibold">
            Save 15%
          </span>
        </Button>
      </div>
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
  billingPeriod = 'monthly' as const,
}: PricingTierProps) {

  // Determine the price to display based on billing period
  const getDisplayPrice = () => {
    return tier.price;
  };

  // Remove logic for yearlyStripeId, monthlyCommitmentStripePriceId
  // Only use tier.tierKey for priceId and plan logic
  const getPriceId = () => tier.tierKey;
  const priceId = getPriceId();

  // Find the current tier
  const currentTier = siteConfig.cloudPricingItems.find(
    (p) => currentSubscription && p.tierKey === currentSubscription.price_id
  );

  // Remove all logic for currentIsYearly, currentIsYearlyCommitment, targetIsYearly, targetIsYearlyCommitment
  // Only use currentIsMonthly and targetIsMonthly
  const currentIsMonthly = currentTier && currentSubscription?.price_id === currentTier.tierKey;
  const targetIsMonthly = priceId === tier.tierKey;

  const displayPrice = getDisplayPrice();

  // Handle subscription/trial start
  const handleSubscribe = async (planTierKey: string) => {
    toast.info(`Selected plan: ${planTierKey}`);
  };

  const displayPriceMonthly = tier.price;

  // Find the current tier (moved outside conditional for JSX access)
  const userPlanName = currentSubscription?.plan_name || 'none';
  const isCurrentActivePlan = isAuthenticated && (
    currentSubscription?.price_id === priceId ||
    (userPlanName === 'trial' && tier.price === '$20' && billingPeriod === 'monthly') ||
    (userPlanName === 'tier_2_20' && tier.price === '$20' && billingPeriod === 'monthly') ||
    (currentSubscription?.subscription &&
      userPlanName === 'tier_2_20' &&
      tier.price === '$20' &&
      currentSubscription?.subscription?.status === 'active')
  );

  const isScheduled = isAuthenticated && currentSubscription?.has_schedule;
  const isScheduledTargetPlan =
    isScheduled && currentSubscription?.scheduled_price_id === priceId;
  const isPlanLoading = isLoading[priceId];

  let buttonText = isAuthenticated ? 'Select Plan' : tier.buttonText;
  let buttonDisabled = isPlanLoading;
  let buttonVariant: ButtonVariant = null;
  let ringClass = '';
  let statusBadge = null;
  let buttonClassName = '';

  // Default allowed state
  const planChangeValidation = { allowed: true };

  if (isAuthenticated) {
    if (isCurrentActivePlan) {
      if (userPlanName === 'trial') {
        buttonText = 'Trial Active';
        statusBadge = (
          <span className="bg-green-500/10 text-green-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
            7-Day Trial
          </span>
        );
      } else {
        buttonText = 'Current Plan';
        statusBadge = (
          <span className="bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0.5 rounded-full">
            Current
          </span>
        );
      }
      buttonDisabled = true;
      buttonVariant = 'secondary';
      ringClass = isCompact ? 'ring-1 ring-primary' : 'ring-2 ring-primary';
      buttonClassName = 'bg-primary/5 hover:bg-primary/10 text-primary';
    } else if (isScheduledTargetPlan) {
      buttonText = 'Scheduled';
      buttonDisabled = true;
      buttonVariant = 'outline';
      ringClass = isCompact
        ? 'ring-1 ring-yellow-500'
        : 'ring-2 ring-yellow-500';
      buttonClassName =
        'bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      statusBadge = (
        <span className="bg-yellow-500/10 text-yellow-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
          Scheduled
        </span>
      );
    } else if (isScheduled && currentSubscription?.price_id === priceId) {
      buttonText = 'Change Scheduled';
      buttonVariant = 'secondary';
      ringClass = isCompact ? 'ring-1 ring-primary' : 'ring-2 ring-primary';
      buttonClassName = 'bg-primary/5 hover:bg-primary/10 text-primary';
      statusBadge = (
        <span className="bg-yellow-500/10 text-yellow-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
          Downgrade Pending
        </span>
      );
    } else {
      const currentPriceString = currentSubscription
        ? currentTier?.price || '$0'
        : '$0';
      const selectedPriceString = displayPrice;
      const currentAmount =
        currentPriceString === '$0'
          ? 0
          : parseFloat(currentPriceString.replace(/[^\d.]/g, '') || '0') * 100;
      const targetAmount =
        selectedPriceString === '$0'
          ? 0
          : parseFloat(selectedPriceString.replace(/[^\d.]/g, '') || '0') * 100;

      // Since we only support monthly subscriptions, simplify the logic
      const currentIsMonthly = currentTier && currentSubscription?.price_id === currentTier.tierKey;
      const targetIsMonthly = priceId === tier.tierKey;

      if (
        currentAmount === 0 &&
        targetAmount === 0 &&
        currentSubscription?.status !== 'no_subscription'
      ) {
        buttonText = 'Select Plan';
        buttonDisabled = true;
        buttonVariant = 'secondary';
        buttonClassName = 'bg-primary/5 hover:bg-primary/10 text-primary';
      } else if (!planChangeValidation.allowed) {
        // Plan change not allowed due to business rules
        buttonText = 'Not Available';
        buttonDisabled = true;
        buttonVariant = 'secondary';
        buttonClassName = 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground';
      } else {
        if (targetAmount > currentAmount) {
          // Allow upgrade to higher tier
          buttonText = 'Upgrade';
          buttonVariant = tier.buttonColor as ButtonVariant;
          buttonClassName = 'bg-primary hover:bg-primary/90 text-primary-foreground';
        } else if (targetAmount < currentAmount) {
          // Prevent downgrades
          buttonText = 'Not Available';
          buttonDisabled = true;
          buttonVariant = 'secondary';
          buttonClassName = 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground';
        } else {
          buttonText = 'Select Plan';
          buttonVariant = tier.buttonColor as ButtonVariant;
          buttonClassName = 'bg-primary hover:bg-primary/90 text-primary-foreground';
        }
      }
    }

    if (isPlanLoading) {
      buttonText = 'Loading...';
      buttonClassName = 'opacity-70 cursor-not-allowed';
    }
  } else {
    // Non-authenticated state styling
    buttonVariant = tier.buttonColor as ButtonVariant;
    buttonClassName =
      tier.buttonColor === 'default'
        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
        : 'bg-primary hover:bg-primary/90 text-primary-foreground';
  }

  const isUltraPlan = tier.name === 'Ultra';

  return (
    <div
      className={cn(
        'rounded-[18px] flex flex-col relative overflow-hidden',
        insideDialog
          ? 'min-h-[300px]'
          : 'h-full min-h-[300px]',
        tier.isPopular && !insideDialog
          ? 'bg-card border border-border'
          : 'bg-card border border-border',
        !insideDialog && ringClass,
        isCurrentActivePlan && 'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800',
      )}
    >
      {/* AnimatedBg for Ultra plan */}
      {isUltraPlan && (
        <AnimatedBg
          variant="header"
          blurMultiplier={0.8}
          sizeMultiplier={0.7}
          customArcs={{
            left: [
              {
                pos: { left: -120, top: -30 },
                size: 350,
                tone: 'light',
                opacity: 0.15,
                delay: 0.02,
                x: [0, 12, -6, 0],
                y: [0, 8, -4, 0],
                scale: [0.85, 1.05, 0.95, 0.85],
                blur: ['10px', '15px', '12px', '10px'],
              },
            ],
            right: [
              {
                pos: { right: -110, top: 200 },
                size: 380,
                tone: 'dark',
                opacity: 0.2,
                delay: 1.0,
                x: [0, -15, 8, 0],
                y: [0, 10, -6, 0],
                scale: [0.9, 1.1, 0.98, 0.9],
                blur: ['8px', '4px', '6px', '8px'],
              },
            ],
          }}
        />
      )}

      <div className={cn(
        "flex flex-col gap-3 relative z-10",
        insideDialog ? "p-3" : "p-4"
      )}>
        <div className="flex items-center gap-2">
          <div className="bg-black dark:bg-white rounded-full px-3 py-1.5 flex items-center gap-2 w-fit">
            <NextImage
              src="/logo.png"
              alt="Machine Logo"
              width={20}
              height={20}
              className="h-[16px] w-auto"
            />
            <span className="text-white dark:text-black text-sm font-medium">
              {tier.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {tier.isPopular && (
              <Badge variant='outline'>Popular</Badge>
            )}
            {/* Show upgrade badge for yearly commitment plans when user is on monthly */}
            {isAuthenticated && statusBadge}
          </div>
        </div>
        <div className="flex items-baseline mt-2 min-h-[80px]">
          {/* Remove reference to monthlyCommitmentStripePriceId, just show monthly/yearly price logic */}
          {billingPeriod === 'yearly_commitment' ? (
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <PriceDisplay price={displayPrice} isCompact={insideDialog} />
                <span className="text-xs line-through text-muted-foreground">
                  ${tier.price.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
            </div>
          ) : billingPeriod === 'yearly' && tier.yearlyPrice && displayPrice !== '$0' ? (
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <PriceDisplay price={`$${Math.round(parseFloat(tier.yearlyPrice.slice(1)) / 12)}`} isCompact={insideDialog} />
                {tier.discountPercentage && (
                  <span className="text-xs line-through text-muted-foreground">
                    ${Math.round(parseFloat(tier.originalYearlyPrice?.slice(1) || '0') / 12)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">/month</span>
                <span className="text-xs text-muted-foreground">billed yearly</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <PriceDisplay price={displayPrice} isCompact={insideDialog} />
              </div>
              <div className="flex items-center gap-1 mt-1">
                {displayPrice !== '$0' && (
                  <span className="text-xs text-muted-foreground">/month</span>
                )}
              </div>
            </div>
          )}
        </div>
        <p className="hidden text-sm mt-2">{tier.description}</p>
      </div>

      <div className={cn(
        "flex-grow relative z-10",
        insideDialog ? "px-3 pb-2" : "px-4 pb-3"
      )}>
        {tier.features && tier.features.length > 0 && (
          <ul className="space-y-3">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <div className="size-5 min-w-5 flex items-center justify-center text-muted-foreground">
                  {getFeatureIcon(feature)}
                </div>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cn(
        "mt-auto relative z-10",
        insideDialog ? "px-3 pt-1 pb-3" : "px-4 pt-2 pb-4"
      )}>
        <Button
          onClick={() => handleSubscribe(priceId)}
          disabled={buttonDisabled}
          variant={buttonVariant || 'default'}
          className={cn(
            'w-full font-medium transition-all duration-200',
            isCompact || insideDialog ? 'h-8 text-xs' : 'h-10 text-sm',
            buttonClassName,
            isPlanLoading && 'animate-pulse',
          )}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
}

interface PricingSectionProps {
  returnUrl?: string;
  showTitleAndTabs?: boolean;
  hideFree?: boolean;
  insideDialog?: boolean;
  showInfo?: boolean;
  noPadding?: boolean;
  onSubscriptionUpdate?: () => void;
}

export function PricingSection({
  returnUrl = typeof window !== 'undefined' ? window.location.href : '/',
  showTitleAndTabs = true,
  hideFree = false,
  insideDialog = false,
  showInfo = true,
  noPadding = false,
  onSubscriptionUpdate,
}: PricingSectionProps) {
  const { user } = useAuth();
  const isUserAuthenticated = !!user;

  // Use currentSubscription as null or any
  const currentSubscription = null;
  const isAuthenticated = isUserAuthenticated;

  // Remove getDefaultBillingPeriod logic that uses stripePriceId
  const getDefaultBillingPeriod = useCallback((): 'monthly' | 'yearly' | 'yearly_commitment' => {
    return 'monthly';
  }, []);

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly' | 'yearly_commitment'>('monthly');
  const [planLoadingStates, setPlanLoadingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setBillingPeriod(getDefaultBillingPeriod());
  }, [getDefaultBillingPeriod]);

  const handlePlanSelect = (planId: string) => {
    setPlanLoadingStates((prev) => ({ ...prev, [planId]: true }));
  };

  const handleSubscriptionUpdate = () => {
    setTimeout(() => {
      setPlanLoadingStates({});
    }, 1000);
    if (onSubscriptionUpdate) {
      onSubscriptionUpdate();
    }
  };

  if (isLocalMode()) {
    return (
      <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          Running in local development mode - billing features are disabled
        </p>
      </div>
    );
  }

  return (
    <section
      id="pricing"
      className={cn(
        "flex flex-col items-center justify-center w-full relative",
        noPadding ? "" : "pb-12",
        insideDialog ? "gap-4" : "gap-10"
      )}
    >
      <div className={cn(
        "w-full max-w-6xl mx-auto",
        insideDialog ? "px-2" : "px-6"
      )}>
        {showTitleAndTabs && (
          <div className={cn(
            "w-full flex justify-center",
            insideDialog ? "mt-2 mb-4" : "mt-8 mb-6"
          )}>
            <h2 className="text-2xl md:text-4xl font-medium tracking-tight text-center text-balance leading-tight max-w-2xl">
              Pick the plan that works for you.
            </h2>
          </div>
        )}



        <div className={cn(
          "grid w-full",
          insideDialog
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-3"
            : "min-[650px]:grid-cols-2 lg:grid-cols-3 gap-6",
          !insideDialog && "grid-rows-1 items-stretch"
        )}>
          {siteConfig.cloudPricingItems
            .filter((tier) => !tier.hidden && (!hideFree || tier.price !== '$0'))
            .map((tier) => (
              <PricingTier
                key={tier.name}
                tier={tier}
                currentSubscription={currentSubscription}
                isLoading={planLoadingStates}
                isFetchingPlan={false}
                onPlanSelect={handlePlanSelect}
                onSubscriptionUpdate={handleSubscriptionUpdate}
                isAuthenticated={isAuthenticated}
                returnUrl={returnUrl}
                insideDialog={insideDialog}
                billingPeriod={billingPeriod as 'monthly' | 'yearly_commitment'}
              />
            ))}
        </div>
      </div>
      {showInfo && (
        <div className="mt-4 p-4 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm text-pink-800 dark:text-pink-200 text-center">
            <strong>What are AI tokens?</strong> Tokens are units of text that AI models process.
            Your plan includes credits to spend on various AI models - the more complex the task,
            the more tokens used.
          </p>
        </div>
      )}
    </section>
  );
}
