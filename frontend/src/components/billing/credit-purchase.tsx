'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { billingApi } from '@/lib/api/billing';
import { toast } from 'sonner';
import { formatCredits } from '@/lib/utils/credit-formatter';

interface CreditPurchaseProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentBalance?: number;
    canPurchase: boolean;
    onPurchaseComplete?: () => void;
    onUpgradeClick?: () => void;
}

interface CreditPackage {
    amount: number;
    price: number;
    popular?: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
    { amount: 10, price: 10 },
    { amount: 25, price: 25 },
    { amount: 50, price: 50 },
    { amount: 100, price: 100, popular: true },
    { amount: 250, price: 250 },
    { amount: 500, price: 500 },
];

export function CreditPurchaseModal({
    open,
    onOpenChange,
    currentBalance = 0,
    canPurchase,
    onPurchaseComplete,
    onUpgradeClick,
}: CreditPurchaseProps) {
    const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-select popular package when modal opens
    useEffect(() => {
        if (open) {
            const popularPackage = CREDIT_PACKAGES.find(pkg => pkg.popular);
            setSelectedPackage(popularPackage || CREDIT_PACKAGES[0]);
            setCustomAmount('');
            setError(null);
        }
    }, [open]);

    const handlePurchase = async (amount: number) => {
        if (amount < 10) {
            setError('Minimum purchase amount is $10');
            return;
        }
        if (amount > 5000) {
            setError('Maximum purchase amount is $5000');
            return;
        }
        setIsProcessing(true);
        setError(null);
        try {
            const response = await billingApi.purchaseCredits({
                amount: amount,
                success_url: `${window.location.origin}/dashboard?credit_purchase=success`,
                cancel_url: `${window.location.origin}/dashboard?credit_purchase=cancelled`
            });
            if (response.checkout_url) {
                window.location.href = response.checkout_url;
            } else {
                console.error('Invalid response structure:', response);
                throw new Error('No checkout URL received from server');
            }
        } catch (err: any) {
            console.error('Credit purchase error:', err);
            const errorMessage = err.details?.detail || err.message || 'Failed to create checkout session';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePackageSelect = (pkg: CreditPackage) => {
        setSelectedPackage(pkg);
        setCustomAmount('');
        setError(null);
    };

    const handleCustomAmountChange = (value: string) => {
        setCustomAmount(value);
        setSelectedPackage(null);
        setError(null);
    };

    const handleConfirmPurchase = () => {
        const amount = selectedPackage ? selectedPackage.amount : parseFloat(customAmount);
        if (!isNaN(amount)) {
            handlePurchase(amount);
        } else {
            setError('Please select a package or enter a valid amount');
        }
    };

    if (!canPurchase) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            Credits Not Available
                        </DialogTitle>
                        <DialogDescription>
                            Credit purchases are only available for users on the $200/month subscription tier.
                        </DialogDescription>
                    </DialogHeader>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Please upgrade your subscription to the $200/month tier to unlock credit purchases for unlimited usage.
                        </AlertDescription>
                    </Alert>
                    <div className="flex justify-between gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                        <Button 
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            onClick={() => {
                                onOpenChange(false);
                                if (onUpgradeClick) {
                                    onUpgradeClick();
                                }
                            }}
                        >
                            Upgrade Plan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Get additional credits</DialogTitle>
                    <DialogDescription>
                        Add credits to your account for usage beyond your subscription limit. Credits never expire and are used automatically when you exceed your monthly allowance.
                    </DialogDescription>
                </DialogHeader>

                {currentBalance > 0 && (
                    <div className="text-sm text-muted-foreground">
                        Current balance: {formatCredits(currentBalance, { showDecimals: true })}
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {CREDIT_PACKAGES.map((pkg) => (
                                <Card
                                    key={pkg.amount}
                                    className={`cursor-pointer transition-all ${selectedPackage?.amount === pkg.amount
                                        ? 'ring-2 ring-border'
                                        : 'hover:border-border/80'
                                        }`}
                                    onClick={() => handlePackageSelect(pkg)}
                                >
                                    <CardContent className="p-4 text-center">
                                        <div className="text-xl font-medium">${pkg.amount}</div>
                                        <div className="text-xs text-muted-foreground mt-1">Credits</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Information Section */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How Credits Work</h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• Credits are used automatically when you exceed your monthly subscription limit</li>
                            <li>• 1 credit = $1 of AI usage (approximately 6-7 minutes of agent time)</li>
                            <li>• Credits never expire and roll over month to month</li>
                            <li>• Credits are deducted in real-time as you use agents</li>
                        </ul>
                    </div>
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>
                <div className="flex justify-center mt-6">
                    <Button
                        onClick={handleConfirmPurchase}
                        disabled={isProcessing || (!selectedPackage && !customAmount)}
                        className="w-full sm:w-auto min-w-[120px]"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            'Continue'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function CreditBalanceDisplay({ balance, canPurchase, onPurchaseClick }: {
    balance: number;
    canPurchase: boolean;
    onPurchaseClick?: () => void;
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Credit Balance</span>
                    {canPurchase && onPurchaseClick && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onPurchaseClick}
                        >
                            Add Credits
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-medium">
                    {formatCredits(balance)}
                </div>
            </CardContent>
        </Card>
    );
}
