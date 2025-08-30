'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PricingSection } from '@/components/home/sections/pricing-section';

import { isLocalMode } from '@/lib/config';
import {
    createPortalSession,
    cancelSubscription,
    reactivateSubscription,
    SubscriptionStatus,
} from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useSubscriptionCommitment } from '@/hooks/react-query';
import { useSubscription } from '@/hooks/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { subscriptionKeys } from '@/hooks/react-query/subscriptions/keys';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    X, 
    Zap, 
    AlertTriangle, 
    Shield, 
    CheckCircle, 
    RotateCcw, 
    Clock 
} from 'lucide-react';
import { toast } from 'sonner';

interface BillingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    returnUrl?: string;
    showUsageLimitAlert?: boolean;
}

export function BillingModal({ open, onOpenChange, returnUrl = typeof window !== 'undefined' ? window?.location?.href || '/' : '/', showUsageLimitAlert = false }: BillingModalProps) {
    const { session, isLoading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    
    // Use the same hook as the dashboard for consistent data
    const { 
        data: subscriptionData, 
        isLoading, 
        error 
    } = useSubscription();
    
    const [isManaging, setIsManaging] = useState(false);
    const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Get commitment info for the subscription (only if we have a valid ID)
    const {
        data: commitmentInfo,
        isLoading: commitmentLoading,
        error: commitmentError,
        refetch: refetchCommitment
    } = useSubscriptionCommitment(subscriptionData?.subscription?.id || null);

    // Remove the manual fetchSubscriptionData function since useSubscription handles it

    // The useSubscription hook automatically fetches data when the component mounts and when session changes.
    // No need for manual useEffect here.

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatEndDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // Get the effective cancellation date (could be period end or cancel_at for yearly commitments)
    const getEffectiveCancellationDate = () => {
        if (subscriptionData?.subscription?.cancel_at) {
            // Yearly commitment cancellation - use cancel_at timestamp
            return formatDate(subscriptionData.subscription.cancel_at);
        }
        // Regular cancellation - use current period end
        return formatDate(subscriptionData?.subscription?.current_period_end || 0);
    };

    const handleManageSubscription = async () => {
        try {
            setIsManaging(true);
            const { url } = await createPortalSession({ return_url: returnUrl });
            window.location.href = url;
        } catch (err) {
            console.error('Failed to create portal session:', err);
            // setError(err instanceof Error ? err.message : 'Failed to create portal session');
        } finally {
            setIsManaging(false);
        }
    };

    const handleCancel = async () => {
        setIsCancelling(true);
        const originalState = subscriptionData;
        
        try {
            console.log('Cancelling subscription...');
            setShowCancelDialog(false);

            // Note: We can't do optimistic updates with useSubscription hook
            // The hook will automatically refetch and update the UI

            const response = await cancelSubscription();

            if (response.success) {
                toast.success(response.message);
                // Invalidate the subscription query to refetch data
                queryClient.invalidateQueries({ queryKey: subscriptionKeys.details() });
            } else {
                toast.error(response.message);
            }
        } catch (error: any) {
            console.error('Error cancelling subscription:', error);
            toast.error(error.message || 'Failed to cancel subscription');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleReactivate = async () => {
        setIsCancelling(true);
        
        try {
            console.log('Reactivating subscription...');

            // Note: We can't do optimistic updates with useSubscription hook
            // The hook will automatically refetch and update the UI

            const response = await reactivateSubscription();

            if (response.success) {
                toast.success(response.message);
                // Invalidate the subscription query to refetch data
                queryClient.invalidateQueries({ queryKey: subscriptionKeys.details() });
            } else {
                toast.error(response.message);
            }
        } catch (error: any) {
            console.error('Error reactivating subscription:', error);
            toast.error(error.message || 'Failed to reactivate subscription');
        } finally {
            setIsCancelling(false);
        }
    };

    // Local mode content
    // if (isLocalMode()) {
    //     return (
    //         <Dialog open={open} onOpenChange={onOpenChange}>
    //             <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    //                 <DialogHeader>
    //                     <DialogTitle>Billing & Subscription</DialogTitle>
    //                 </DialogHeader>
    //                 <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
    //                     <p className="text-sm text-muted-foreground">
    //                         Running in local development mode - billing features are disabled
    //                     </p>
    //                     <p className="text-xs text-muted-foreground mt-2">
    //                         All premium features are available in this environment
    //                     </p>
    //                 </div>
    //             </DialogContent>
    //         </Dialog>
    //     );
    // }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upgrade Your Plan</DialogTitle>
                </DialogHeader>

                <>
                    {/* Usage Limit Alert */}
                    {showUsageLimitAlert && (
                        <div className="mb-6">
                            <div className="flex items-start p-3 sm:p-4 bg-destructive/5 border border-destructive/50 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                                    </div>
                                    <div className="text-xs sm:text-sm min-w-0">
                                        <p className="font-medium text-destructive">Usage Limit Reached</p>
                                        <p className="text-destructive break-words">
                                            Your current plan has been exhausted for this billing period.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Usage section - show loading state or actual data */}
                    {isLoading || authLoading ? (
                        <div className="mb-6">
                            <div className="rounded-lg border bg-background p-4">
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        </div>
                    ) : subscriptionData && (
                        <div className="mb-6">
                            <div className="rounded-lg border bg-background p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-foreground/90">
                                        Agent Usage This Month
                                    </span>
                                    <span className="text-sm font-medium">
                                        ${(subscriptionData.current_usage || 0).toFixed(2)} /{' '}
                                        ${subscriptionData.cost_limit || 0}
                                    </span>
                                </div>
                                {/* Add progress bar like in dashboard */}
                                {subscriptionData.current_usage !== undefined && subscriptionData.cost_limit && (
                                    <div className="mt-2">
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div 
                                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                                style={{ 
                                                    width: `${Math.min((subscriptionData.current_usage / subscriptionData.cost_limit) * 100, 100)}%` 
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>${(subscriptionData.current_usage || 0).toFixed(2)}</span>
                                            <span>${(subscriptionData.cost_limit - (subscriptionData.current_usage || 0)).toFixed(2)} remaining</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Show pricing section immediately - no loading state */}
                    <PricingSection returnUrl={returnUrl} showTitleAndTabs={false} />

                    {/* Subscription Management Section - only show if there's actual subscription data */}
                    {error ? (
                        <div className="mt-6 pt-4 border-t border-border">
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                                <p className="text-sm text-destructive">Error loading billing status: {error.message || 'Unknown error'}</p>
                            </div>
                        </div>
                    ) : subscriptionData?.subscription && (
                        <div className="mt-6 pt-4 border-t border-border">
                            {/* Subscription Status Info Box */}
                            <div className="bg-muted/30 border border-border rounded-lg p-3 mb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium">
                                            {subscriptionData.subscription.cancel_at_period_end || subscriptionData.subscription.cancel_at 
                                                ? 'Plan Status' 
                                                : 'Current Plan'}
                                        </span>
                                        {commitmentInfo?.has_commitment && (
                                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                {commitmentInfo.months_remaining || 0}mo left
                                            </Badge>
                                        )}
                                    </div>
                                    <Badge variant={
                                        subscriptionData.subscription.cancel_at_period_end || subscriptionData.subscription.cancel_at 
                                            ? 'destructive' 
                                            : 'secondary'
                                    } className="text-xs px-2 py-0.5">
                                        {subscriptionData.subscription.cancel_at_period_end || subscriptionData.subscription.cancel_at
                                            ? 'Ending ' + getEffectiveCancellationDate()
                                            : 'Active'}
                                    </Badge>
                                </div>

                                {/* Cancellation Alert */}
                                {(subscriptionData.subscription.cancel_at_period_end || subscriptionData.subscription.cancel_at) && (
                                    <div className="mt-2 flex items-start gap-2 p-2 bg-destructive/5 border border-destructive/20 rounded">
                                        <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-destructive">
                                            {subscriptionData.subscription.cancel_at ? 
                                                'Your plan is scheduled to end at commitment completion. You can reactivate anytime.' : 
                                                'Your plan is scheduled to end at period completion. You can reactivate anytime.'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons underneath */}
                            <div className="flex gap-2 justify-center">
                                {/* Cancel/Reactivate Button */}
                                {!(subscriptionData.subscription.cancel_at_period_end || subscriptionData.subscription.cancel_at) ? (
                                    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                                        <DialogTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="text-xs"
                                                disabled={isCancelling}
                                            >
                                                {isCancelling ? (
                                                    <div className="flex items-center gap-1">
                                                        <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                                                        Processing...
                                                    </div>
                                                ) : (
                                                    commitmentInfo?.has_commitment && !commitmentInfo?.can_cancel 
                                                        ? 'Schedule End' 
                                                        : 'Cancel Plan'
                                                )}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-lg">
                                                    {commitmentInfo?.has_commitment && !commitmentInfo?.can_cancel
                                                        ? 'Schedule Cancellation' 
                                                        : 'Cancel Subscription'}
                                                </DialogTitle>
                                                <DialogDescription className="text-sm">
                                                    {commitmentInfo?.has_commitment && !commitmentInfo?.can_cancel ? (
                                                        <>
                                                            Your subscription will be scheduled to end on{' '}
                                                            {commitmentInfo?.commitment_end_date
                                                                ? formatEndDate(commitmentInfo.commitment_end_date)
                                                                : 'your commitment end date'}
                                                            . You'll keep full access until then.
                                                        </>
                                                    ) : (
                                                        <>
                                                            Your subscription will end on{' '}
                                                            {formatDate(subscriptionData.subscription.current_period_end)}. 
                                                            You'll keep access until then.
                                                        </>
                                                    )}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowCancelDialog(false)}
                                                    disabled={isCancelling}
                                                    size="sm"
                                                >
                                                    Keep Plan
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleCancel}
                                                    disabled={isCancelling}
                                                    size="sm"
                                                >
                                                    {isCancelling ? 'Processing...' : 'Confirm'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleReactivate}
                                        disabled={isCancelling}
                                        className="text-xs bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {isCancelling ? (
                                            <div className="flex items-center gap-1">
                                                <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
                                                Processing...
                                            </div>
                                        ) : (
                                            'Reactivate Plan'
                                        )}
                                    </Button>
                                )}

                                {/* Manage Subscription Button */}
                                <Button
                                    onClick={handleManageSubscription}
                                    disabled={isManaging}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                >
                                    {isManaging ? 'Loading...' : 'Dashboard'}
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            </DialogContent>

        </Dialog>
    );
} 