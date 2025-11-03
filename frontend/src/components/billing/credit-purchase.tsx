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
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, AlertCircle, Zap, AlertCircleIcon } from 'lucide-react';
import { apiClient, backendApi } from '@/lib/api-client';
import { toast } from 'sonner';

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
            console.log('Purchasing credits:', { amount });
            const response = await backendApi.post('/billing/purchase-credits', {
                amount_dollars: amount,
                success_url: `${window.location.origin}/dashboard?credit_purchase=success`,
                cancel_url: `${window.location.origin}/dashboard?credit_purchase=cancelled`
            });
            
            console.log('API Response:', response.data);
            
            const checkoutUrl = response.data?.url || response.data?.checkout_url;
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                console.error('Invalid response structure:', response.data);
                throw new Error('No checkout URL received from server');
            }
        } catch (err: any) {
            console.error('Credit purchase error:', err);
            console.error('Error response:', err.response?.data);
            
            let errorMessage = 'Failed to create checkout session';
            
            if (err.response?.status === 403) {
                errorMessage = 'Credit purchases are currently restricted. Please contact support.';
            } else if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
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
                            Credit purchases are only available for users on the highest subscription tier.
                        </DialogDescription>
                    </DialogHeader>
                    <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-800 dark:text-amber-200">
                            <strong>Upgrade Required:</strong> Please upgrade to the Premium tier ($1000/month) to unlock credit purchases for unlimited usage beyond your subscription limit.
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
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                        Purchase Credits
                    </DialogTitle>
                    <DialogDescription>
                        Add credits to your account for usage beyond your subscription limit. Credits never expire and are used automatically when you exceed your monthly allowance.
                    </DialogDescription>
                </DialogHeader>

                {currentBalance > 0 && (
                    <Alert className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-950/20 dark:to-green-950/20 dark:border-emerald-800">
                        <AlertCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                            <strong>Current balance:</strong> ${currentBalance.toFixed(2)} in credits available
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <Label className="text-base font-semibold">Select a Credit Package</Label>
                            {selectedPackage?.popular && (
                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                    ✅ Popular choice selected
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {CREDIT_PACKAGES.map((pkg) => (
                                <Card
                                    key={pkg.amount}
                                    className={`cursor-pointer transition-all ${selectedPackage?.amount === pkg.amount
                                        ? 'ring-2 ring-primary'
                                        : 'hover:shadow-md'
                                        }`}
                                    onClick={() => handlePackageSelect(pkg)}
                                >
                                    <CardContent className="p-4 text-center relative">
                                        {pkg.popular && (
                                            <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600" variant="default">
                                                Popular
                                            </Badge>
                                        )}
                                        <div className="text-2xl font-medium">${pkg.amount}</div>
                                        <div className="text-sm text-muted-foreground">credits</div>
                                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                            ≈ {Math.round(pkg.amount / 0.15)} minutes
                                        </div>
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
                <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmPurchase}
                        disabled={isProcessing || (!selectedPackage && (!customAmount || customAmount.trim() === ''))}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-4 w-4 mr-2" />
                                {selectedPackage || customAmount 
                                    ? `Purchase $${selectedPackage ? selectedPackage.amount : customAmount} Credits`
                                    : 'Select Package to Continue'
                                }
                            </>
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
                    <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Credit Balance
                    </span>
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
                    ${(balance / 100).toFixed(2)}
                </div>
            </CardContent>
        </Card>
    );
}
