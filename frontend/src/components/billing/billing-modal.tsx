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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { CreditPurchaseModal } from '@/components/billing/credit-purchase';
import CreditTransactions from '@/components/billing/credit-transactions';

import { isLocalMode } from '@/lib/config';
import {
    createPortalSession,
    cancelSubscription,
    reactivateSubscription,
    SubscriptionStatus,
} from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useSubscriptionCommitment, useSubscription } from '@/hooks/react-query/subscriptions/use-subscriptions';
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
    Clock,
    Receipt
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
    const [activeTab, setActiveTab] = useState<string>('pricing');
    
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
                // Invalidate cancellation status query to update UI
                queryClient.invalidateQueries({ queryKey: ['subscription', 'cancellation-status'] });
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
                // Invalidate cancellation status query to update UI
                queryClient.invalidateQueries({ queryKey: ['subscription', 'cancellation-status'] });
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
                    <DialogTitle>Billing & Transactions</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pricing" className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Upgrade Plan
                        </TabsTrigger>
                        <TabsTrigger value="transactions" className="flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Transaction History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pricing" className="mt-6">
                        <PricingSection 
                            returnUrl={returnUrl} 
                            showTitleAndTabs={false}
                            onSubscriptionUpdate={() => {
                                // Invalidate subscription query to refetch data
                                queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="transactions" className="mt-6">
                        <CreditTransactions />
                    </TabsContent>
                </Tabs>
            </DialogContent>
            <CreditPurchaseModal
                open={showCreditPurchaseModal}
                onOpenChange={setShowCreditPurchaseModal}
                currentBalance={subscriptionData?.credit_balance || 0}
                canPurchase={subscriptionData?.can_purchase_credits || false}
                onPurchaseComplete={() => {
                    // Invalidate subscription query to refetch data
                    queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
                    setShowCreditPurchaseModal(false);
                }}
            />
        </Dialog>
    );
} 