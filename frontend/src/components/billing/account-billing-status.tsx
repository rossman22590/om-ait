'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { isLocalMode } from '@/lib/config';
import {
  getSubscription,
  createPortalSession,
  SubscriptionStatus,
} from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Props = {
  accountId: string;
  returnUrl: string;
};

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
      #ff5bce, 
      #da6ad5, 
      #c17afc, 
      #a46cf4, 
      #845ef7, 
      #a46cf4, 
      #c17afc, 
      #da6ad5, 
      #ff5bce
    );
    background-size: 500% 100%;
    animation: flow 12s linear infinite;
  }
`;

export default function AccountBillingStatus({ accountId, returnUrl }: Props) {
  // Add the keyframes animation to the document head
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = progressBarStyles;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const { session, isLoading: authLoading } = useAuth();
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const [isAddingMinutes, setIsAddingMinutes] = useState(false);

  useEffect(() => {
    async function fetchSubscription() {
      if (authLoading || !session) return;

      try {
        const data = await getSubscription();
        setSubscriptionData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to get subscription:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load subscription data',
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, [session, authLoading]);

  const handleManageSubscription = async () => {
    try {
      setIsManaging(true);
      const { url } = await createPortalSession({ return_url: returnUrl });
      window.location.href = url;
    } catch (err) {
      console.error('Failed to create portal session:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create portal session',
      );
    } finally {
      setIsManaging(false);
    }
  };

  const handleBuyAdditionalMinutes = () => {
    setIsAddingMinutes(true);
    window.location.href = "https://buy.stripe.com/4gMdR9gyU22V5hC74i8AE02";
  };

  // In local development mode, show a simplified component
  // if (isLocalMode()) {
  //   return (
  //     <div className="rounded-xl border shadow-sm bg-card p-6">
  //       <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
  //       <div className="p-4 mb-4 bg-muted/30 border border-border rounded-lg text-center">
  //         <p className="text-sm text-muted-foreground">
  //           Running in local development mode - billing features are disabled
  //         </p>
  //         <p className="text-xs text-muted-foreground mt-2">
  //           Agent usage limits are not enforced in this environment
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  // Show loading state
  if (isLoading || authLoading) {
    return (
      <div className="rounded-xl border shadow-sm bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="rounded-xl border shadow-sm bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
        <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
          <p className="text-sm text-destructive">
            Error loading billing status: {error}
          </p>
        </div>
      </div>
    );
  }

  const isPlan = (planId?: string) => {
    return subscriptionData?.plan_name === planId;
  };

  const planName = isPlan('free')
    ? 'Free'
    : isPlan('base')
      ? 'Pro'
      : isPlan('extra')
        ? 'Enterprise'
        : 'Unknown';

  return (
    <div className="rounded-xl border shadow-sm bg-card p-6">
      <h2 className="text-xl font-semibold mb-4">Billing Status</h2>

      {subscriptionData ? (
        <>
          <div className="mb-6">
            <div className="rounded-lg border bg-background p-6 space-y-4">
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-semibold text-foreground">
                    Agent Usage This Month
                  </h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleBuyAdditionalMinutes}
                          disabled={isAddingMinutes}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md transition-all"
                        >
                          {isAddingMinutes ? 'Redirecting...' : 'Buy Additional Minutes'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="w-64 p-2">
                        <p className="text-sm text-center">One hour costs $10. You can purchase up to 50 additional hours. If you need more, please reach out to support.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex flex-col space-y-1 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        {subscriptionData.current_usage?.toFixed(2) || '0'}
                      </span>
                      <span className="text-xs text-muted-foreground px-1">of</span>
                      <span className="text-lg font-semibold text-foreground/80">
                        {subscriptionData.minutes_limit || '0'}
                      </span>
                      <span className="text-xs text-muted-foreground">minutes</span>
                    </div>
                    <div className="text-sm font-medium text-primary">
                      {subscriptionData.minutes_limit && subscriptionData.current_usage 
                        ? `${Math.max(0, (subscriptionData.minutes_limit - subscriptionData.current_usage)).toFixed(2)} remaining`
                        : ''}
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar"
                    style={{
                      width: `${Math.min(100, ((subscriptionData.current_usage || 0) / (subscriptionData.minutes_limit || 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Plans Comparison */}
          <PricingSection returnUrl={returnUrl} showTitleAndTabs={false} />

          {/* Manage Subscription Button */}
          <Button
            onClick={handleManageSubscription}
            disabled={isManaging}
            className="w-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
          >
            {isManaging ? 'Loading...' : 'Manage Subscription'}
          </Button>
        </>
      ) : (
        <>
          <div className="mb-6">
            <div className="rounded-lg border bg-background p-6 space-y-4">
              <div className="flex justify-between items-center pb-1">
                <span className="text-md font-semibold text-foreground">
                  Current Plan
                </span>
                <span className="text-md font-bold py-1 px-3 bg-muted rounded-full">
                  Free
                </span>
              </div>

              <div className="flex flex-col space-y-1 pt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-semibold text-foreground">
                    Agent Usage This Month
                  </h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleBuyAdditionalMinutes}
                          disabled={isAddingMinutes}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md transition-all"
                        >
                          {isAddingMinutes ? 'Redirecting...' : 'Buy Additional Minutes'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="w-64 p-2">
                        <p className="text-sm text-center">One hour costs $10. You can purchase up to 50 additional hours. If you need more, please reach out to support.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex flex-col space-y-1 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        {subscriptionData?.current_usage?.toFixed(2) || '0'}
                      </span>
                      <span className="text-xs text-muted-foreground px-1">of</span>
                      <span className="text-lg font-semibold text-foreground/80">
                        {subscriptionData?.minutes_limit || '0'}
                      </span>
                      <span className="text-xs text-muted-foreground">minutes</span>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar"
                    style={{
                      width: `${Math.min(100, ((subscriptionData?.current_usage || 0) / (subscriptionData?.minutes_limit || 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Plans Comparison */}
          <PricingSection returnUrl={returnUrl} showTitleAndTabs={false} />

          {/* Manage Subscription Button */}
          <Button
            onClick={handleManageSubscription}
            disabled={isManaging}
            className="w-full bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
          >
            {isManaging ? 'Loading...' : 'Manage Subscription'}
          </Button>
        </>
      )}
    </div>
  );
}

// 'use client';

// import { useEffect, useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { PricingSection } from '@/components/home/sections/pricing-section';
// import { isLocalMode } from '@/lib/config';
// import {
//   getSubscription,
//   createPortalSession,
//   SubscriptionStatus,
// } from '@/lib/api';
// import { useAuth } from '@/components/AuthProvider';
// import { Skeleton } from '@/components/ui/skeleton';

// type Props = {
//   accountId: string;
//   returnUrl: string;
// };

// export default function AccountBillingStatus({ accountId, returnUrl }: Props) {
//   const { session, isLoading: authLoading } = useAuth();
//   const [subscriptionData, setSubscriptionData] =
//     useState<SubscriptionStatus | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isManaging, setIsManaging] = useState(false);

//   useEffect(() => {
//     async function fetchSubscription() {
//       if (authLoading || !session) return;

//       try {
//         const data = await getSubscription();
//         setSubscriptionData(data);
//         setError(null);
//       } catch (err) {
//         console.error('Failed to get subscription:', err);
//         setError(
//           err instanceof Error
//             ? err.message
//             : 'Failed to load subscription data',
//         );
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     fetchSubscription();
//   }, [session, authLoading]);

//   const handleManageSubscription = async () => {
//     try {
//       setIsManaging(true);
//       const { url } = await createPortalSession({ return_url: returnUrl });
//       window.location.href = url;
//     } catch (err) {
//       console.error('Failed to create portal session:', err);
//       setError(
//         err instanceof Error ? err.message : 'Failed to create portal session',
//       );
//     } finally {
//       setIsManaging(false);
//     }
//   };

//   // In local development mode, show a simplified component
//   // if (isLocalMode()) {
//   //   return (
//   //     <div className="rounded-xl border shadow-sm bg-card p-6">
//   //       <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
//   //       <div className="p-4 mb-4 bg-muted/30 border border-border rounded-lg text-center">
//   //         <p className="text-sm text-muted-foreground">
//   //           Running in local development mode - billing features are disabled
//   //         </p>
//   //         <p className="text-xs text-muted-foreground mt-2">
//   //           Agent usage limits are not enforced in this environment
//   //         </p>
//   //       </div>
//   //     </div>
//   //   );
//   // }

//   // Show loading state
//   if (isLoading || authLoading) {
//     return (
//       <div className="rounded-xl border shadow-sm bg-card p-6">
//         <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
//         <div className="space-y-4">
//           <Skeleton className="h-20 w-full" />
//           <Skeleton className="h-40 w-full" />
//           <Skeleton className="h-10 w-full" />
//         </div>
//       </div>
//     );
//   }

//   // Show error state
//   if (error) {
//     return (
//       <div className="rounded-xl border shadow-sm bg-card p-6">
//         <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
//         <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
//           <p className="text-sm text-destructive">
//             Error loading billing status: {error}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const isPlan = (planId?: string) => {
//     return subscriptionData?.plan_name === planId;
//   };

//   const planName = isPlan('free')
//     ? 'Free'
//     : isPlan('base')
//       ? 'Pro'
//       : isPlan('extra')
//         ? 'Enterprise'
//         : 'Unknown';

//   return (
//     <div className="rounded-xl border shadow-sm bg-card p-6">
//       <h2 className="text-xl font-semibold mb-4">Billing Status</h2>

//       {subscriptionData ? (
//         <>
//           <div className="mb-6">
//             <div className="rounded-lg border bg-background p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="flex justify-between items-center">
//                 <span className="text-sm font-medium text-foreground/90">
//                   Agent Usage This Month
//                 </span>
//                 <span className="text-sm font-medium text-card-title">
//                   {subscriptionData.current_usage?.toFixed(2) || '0'} /{' '}
//                   {subscriptionData.minutes_limit || '0'} minutes
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Plans Comparison */}
//           <PricingSection returnUrl={returnUrl} showTitleAndTabs={false} />

//           {/* Manage Subscription Button */}
//           <Button
//             onClick={handleManageSubscription}
//             disabled={isManaging}
//             className="w-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
//           >
//             {isManaging ? 'Loading...' : 'Manage Subscription'}
//           </Button>
//         </>
//       ) : (
//         <>
//           <div className="mb-6">
//             <div className="rounded-lg border bg-background p-4 gap-4">
//               <div className="flex justify-between items-center">
//                 <span className="text-sm font-medium text-foreground/90">
//                   Current Plan
//                 </span>
//                 <span className="text-sm font-medium text-card-title">
//                   Free
//                 </span>
//               </div>

//               <div className="flex justify-between items-center">
//                 <span className="text-sm font-medium text-foreground/90">
//                   Agent Usage This Month
//                 </span>
//                 <span className="text-sm font-medium text-card-title">
//                   {subscriptionData?.current_usage?.toFixed(2) || '0'} /{' '}
//                   {subscriptionData?.minutes_limit || '0'} minutes
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Plans Comparison */}
//           <PricingSection returnUrl={returnUrl} showTitleAndTabs={false} />

//           {/* Manage Subscription Button */}
//           <Button
//             onClick={handleManageSubscription}
//             disabled={isManaging}
//             className="w-full bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
//           >
//             {isManaging ? 'Loading...' : 'Manage Subscription'}
//           </Button>
//         </>
//       )}
//     </div>
//   );
// }

// 'use client';

// import { useEffect, useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { PricingSection } from '@/components/home/sections/pricing-section';
// import { isLocalMode } from '@/lib/config';
// import {
//   getSubscription,
//   createPortalSession,
//   SubscriptionStatus,
// } from '@/lib/api';
// import { useAuth } from '@/components/AuthProvider';
// import { Skeleton } from '@/components/ui/skeleton';

// type Props = {
//   accountId: string;
//   returnUrl: string;
// };

// export default function AccountBillingStatus({ accountId, returnUrl }: Props) {
//   const { session, isLoading: authLoading } = useAuth();
//   const [subscriptionData, setSubscriptionData] =
//     useState<SubscriptionStatus | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isManaging, setIsManaging] = useState(false);

//   useEffect(() => {
//     async function fetchSubscription() {
//       if (authLoading || !session) return;

//       try {
//         const data = await getSubscription();
//         setSubscriptionData(data);
//         setError(null);
//       } catch (err) {
//         console.error('Failed to get subscription:', err);
//         setError(
//           err instanceof Error
//             ? err.message
//             : 'Failed to load subscription data',
//         );
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     fetchSubscription();
//   }, [session, authLoading]);

//   const handleManageSubscription = async () => {
//     try {
//       setIsManaging(true);
//       const { url } = await createPortalSession({ return_url: returnUrl });
//       window.location.href = url;
//     } catch (err) {
//       console.error('Failed to create portal session:', err);
//       setError(
//         err instanceof Error ? err.message : 'Failed to create portal session',
//       );
//     } finally {
//       setIsManaging(false);
//     }
//   };

//   // In local development mode, show a simplified component
//   // if (isLocalMode()) {
//   //   return (
//   //     <div className="rounded-xl border shadow-sm bg-card p-6">
//   //       <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
//   //       <div className="p-4 mb-4 bg-muted/30 border border-border rounded-lg text-center">
//   //         <p className="text-sm text-muted-foreground">
//   //           Running in local development mode - billing features are disabled
//   //         </p>
//   //         <p className="text-xs text-muted-foreground mt-2">
//   //           Agent usage limits are not enforced in this environment
//   //         </p>
//   //       </div>
//   //     </div>
//   //   );
//   // }

//   // Show loading state
//   if (isLoading || authLoading) {
//     return (
//       <div className="rounded-xl border shadow-sm bg-card p-6">
//         <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
//         <div className="space-y-4">
//           <Skeleton className="h-20 w-full" />
//           <Skeleton className="h-40 w-full" />
//           <Skeleton className="h-10 w-full" />
//         </div>
//       </div>
//     );
//   }

//   // Show error state
//   if (error) {
//     return (
//       <div className="rounded-xl border shadow-sm bg-card p-6">
//         <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
//         <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
//           <p className="text-sm text-destructive">
//             Error loading billing status: {error}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const isPlan = (planId?: string) => {
//     return subscriptionData?.plan_name === planId;
//   };

//   const planName = isPlan('free')
//     ? 'Free'
//     : isPlan('base')
//       ? 'Pro'
//       : isPlan('extra')
//         ? 'Enterprise'
//         : 'Unknown';

//   return (
//     <div className="rounded-xl border shadow-sm bg-card p-6">
//       <h2 className="text-xl font-semibold mb-4">Billing Status</h2>

//       {subscriptionData ? (
//         <>
//           <div className="mb-6">
//             <div className="rounded-lg border bg-background p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="flex justify-between items-center">
//                 <span className="text-sm font-medium text-foreground/90">
//                   Agent Usage This Month
//                 </span>
//                 <span className="text-sm font-medium text-card-title">
//                   {subscriptionData.current_usage?.toFixed(2) || '0'} /{' '}
//                   {subscriptionData.minutes_limit || '0'} minutes
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Plans Comparison */}
//           <PricingSection returnUrl={returnUrl} showTitleAndTabs={false} />

//           {/* Manage Subscription Button */}
//           <Button
//             onClick={handleManageSubscription}
//             disabled={isManaging}
//             className="w-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
//           >
//             {isManaging ? 'Loading...' : 'Manage Subscription'}
//           </Button>
//         </>
//       ) : (
//         <>
//           <div className="mb-6">
//             <div className="rounded-lg border bg-background p-4 gap-4">
//               <div className="flex justify-between items-center">
//                 <span className="text-sm font-medium text-foreground/90">
//                   Current Plan
//                 </span>
//                 <span className="text-sm font-medium text-card-title">
//                   Free
//                 </span>
//               </div>

//               <div className="flex justify-between items-center">
//                 <span className="text-sm font-medium text-foreground/90">
//                   Agent Usage This Month
//                 </span>
//                 <span className="text-sm font-medium text-card-title">
//                   {subscriptionData?.current_usage?.toFixed(2) || '0'} /{' '}
//                   {subscriptionData?.minutes_limit || '0'} minutes
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Plans Comparison */}
//           <PricingSection returnUrl={returnUrl} showTitleAndTabs={false} />

//           {/* Manage Subscription Button */}
//           <Button
//             onClick={handleManageSubscription}
//             disabled={isManaging}
//             className="w-full bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
//           >
//             {isManaging ? 'Loading...' : 'Manage Subscription'}
//           </Button>
//         </>
//       )}
//     </div>
//   );
// }
