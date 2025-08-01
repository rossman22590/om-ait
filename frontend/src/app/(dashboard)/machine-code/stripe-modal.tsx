"use client";

import React, { useState, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

type Pack = {
  label: string;
  amount: number;
  priceId: string;
};

const getStripePacks = (): Pack[] => {
  return [
    {
      label: "$50 Pack",
      amount: 50,
      priceId: process.env.NEXT_PUBLIC_STRIPE_MACHINE_CODE_50 || "",
    },
    {
      label: "$100 Pack",
      amount: 100,
      priceId: process.env.NEXT_PUBLIC_STRIPE_MACHINE_CODE_100 || "",
    },
    {
      label: "$200 Pack",
      amount: 200,
      priceId: process.env.NEXT_PUBLIC_STRIPE_MACHINE_CODE_200 || "",
    },
  ].filter((p) => p.priceId);
};

export interface StripeModalProps {
  open: boolean;
  onClose: () => void;
  email: string | null;
  teamId: string | null;
  onCheckoutStarted?: () => void;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({
  selectedPack,
  appliedPromoCode,
  email,
  teamId,
  onClose,
  onCheckoutStarted,
}: {
  selectedPack: Pack | null;
  appliedPromoCode: string;
  email: string | null;
  teamId: string | null;
  onClose: () => void;
  onCheckoutStarted?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          if (onCheckoutStarted) onCheckoutStarted();
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe, onCheckoutStarted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !selectedPack || !email || !teamId) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Create Payment Intent only when user clicks "Pay now"
      const res = await fetch("/api/machine-code/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedPack.priceId,
          email,
          teamId,
          promoCode: appliedPromoCode || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setMessage(errorData.error || "Failed to create Payment Intent.");
        setIsLoading(false);
        return;
      }

      const { clientSecret } = await res.json();

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setMessage("Card information not found. Please refresh and try again.");
        setIsLoading(false);
        return;
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: email || undefined,
          },
        },
      });

      if (stripeError) {
        setMessage(stripeError.message || "An unexpected error occurred.");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setMessage("Payment succeeded!");
        if (onCheckoutStarted) onCheckoutStarted();
      }
    } catch (e: any) {
      setMessage(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="w-full">
      <div className="border border-gray-300 rounded-lg p-3 bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <button 
        disabled={isLoading || !stripe || !elements || !selectedPack} 
        id="submit"
        className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg shadow-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-60 mt-6"
      >
        <span id="button-text">
          {isLoading ? "Processing..." : "Pay now"}
        </span>
      </button>
      {message && <div id="payment-message" className="text-red-600 text-sm mt-2">{message}</div>}
    </form>
  );
}

export default function StripeModal({
  open,
  onClose,
  email,
  teamId,
  onCheckoutStarted,
}: StripeModalProps) {
  // Move all hooks to the top, before any conditional logic
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [promoCode, setPromoCode] = useState<string>("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>("");
  const [previewData, setPreviewData] = useState<{
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const packs = getStripePacks();

  // Initial preview when pack is selected (without promo code)
  const updateInitialPreview = React.useCallback(async () => {
    if (!selectedPack || !email || !teamId) {
      setPreviewData(null);
      return;
    }

    setIsPreviewLoading(true);
    setPreviewError(null);

    try {
      const res = await fetch("/api/machine-code/stripe-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedPack.priceId,
          promoCode: appliedPromoCode || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setPreviewError(errorData.error || "Failed to calculate pricing.");
        setPreviewData({
          originalAmount: selectedPack.amount * 100,
          discountAmount: 0,
          finalAmount: selectedPack.amount * 100,
        });
        return;
      }

      const { originalAmount, discountAmount, finalAmount } = await res.json();
      setPreviewData({ originalAmount, discountAmount, finalAmount });
      setPreviewError(null);
    } catch (e: any) {
      setPreviewError("Failed to calculate pricing.");
      setPreviewData({
        originalAmount: selectedPack.amount * 100,
        discountAmount: 0,
        finalAmount: selectedPack.amount * 100,
      });
    } finally {
      setIsPreviewLoading(false);
    }
  }, [selectedPack, appliedPromoCode, email, teamId]);

  // Apply promo code
  const handleApplyPromo = async () => {
    if (!selectedPack || !email || !teamId || !promoCode.trim()) {
      return;
    }

    setIsApplyingPromo(true);
    setPreviewError(null);

    try {
      const res = await fetch("/api/machine-code/stripe-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedPack.priceId,
          promoCode: promoCode.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setPreviewError(errorData.error || "Invalid promo code.");
        return;
      }

      const { originalAmount, discountAmount, finalAmount } = await res.json();
      setPreviewData({ originalAmount, discountAmount, finalAmount });
      setAppliedPromoCode(promoCode.trim());
      setPreviewError(null);
    } catch (e: any) {
      setPreviewError("Invalid promo code.");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Remove applied promo code
  const handleRemovePromo = () => {
    setAppliedPromoCode("");
    setPromoCode("");
    setPreviewError(null);
    // This will trigger updateInitialPreview via useEffect
  };

  // Update preview when pack or applied promo changes
  useEffect(() => {
    updateInitialPreview();
  }, [updateInitialPreview]);

  // Reset promo when pack changes
  useEffect(() => {
    setPromoCode("");
    setAppliedPromoCode("");
    setPreviewError(null);
  }, [selectedPack]);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Now handle the conditional rendering after all hooks are declared
  if (!open) return null;

  const appearance: StripeElementsOptions["appearance"] = {
    theme: isDarkMode ? "night" : "stripe",
    variables: {
      colorPrimary: "#a855f7",
      colorBackground: isDarkMode ? "#1f2937" : "#ffffff",
      colorText: isDarkMode ? "#e2e8f0" : "#1f2937",
      colorDanger: "#ef4444",
      fontFamily: 'Inter, sans-serif',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="stripe-modal-title">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 min-w-[1000px] max-w-5xl flex flex-col items-center relative"
        style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold z-10"
          onClick={onClose}
          aria-label="Close"
          style={{ lineHeight: 1, padding: 0, background: "none", border: "none" }}
        >
          ×
        </button>
        
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" id="stripe-modal-title">
          Get More Credits
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <div className="flex flex-col gap-4">
            {packs.map((pack) => (
              <button
                key={pack.priceId}
                className={`w-full px-6 py-4 rounded-xl border-2 font-semibold text-lg transition-all
                  ${
                    selectedPack?.priceId === pack.priceId
                      ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  }
                  hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/30`}
                onClick={() => {
                  setSelectedPack(pack);
                  setPreviewError(null);
                }}
                disabled={isPreviewLoading || isApplyingPromo}
              >
                {pack.label}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col">
            {/* Order Summary */}
            {selectedPack && (
              <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Order Summary</h3>
                
                {isPreviewLoading ? (
                  <div className="text-gray-500">Calculating...</div>
                ) : previewData ? (
                  <>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>Selected Pack:</span>
                      <span>${(previewData.originalAmount / 100).toFixed(2)}</span>
                    </div>
                    {previewData.discountAmount > 0 && (
                      <div className="flex justify-between text-gray-700 dark:text-gray-300 mt-1">
                        <span>Discount:</span>
                        <span className="text-green-600 dark:text-green-400">-${(previewData.discountAmount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold mt-2 text-gray-900 dark:text-gray-100">
                      <span>Total:</span>
                      <span>${(previewData.finalAmount / 100).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-xl font-bold mt-2 text-gray-900 dark:text-gray-100">
                    <span>Total:</span>
                    <span>${selectedPack.amount.toFixed(2)}</span>
                  </div>
                )}

                {/* Promo code section */}
                <div className="mt-4">
                  {appliedPromoCode ? (
                    // Show applied promo code with remove option
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-700 dark:text-green-400">
                          ✓ Promo code applied:
                        </span>
                        <span className="font-mono text-sm text-green-800 dark:text-green-300">
                          {appliedPromoCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    // Show promo code input with apply button
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={isApplyingPromo}
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoCode.trim()}
                        className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-60"
                      >
                        {isApplyingPromo ? "Applying..." : "Apply"}
                      </button>
                    </div>
                  )}
                </div>
                
                {previewError && (
                  <div className="text-xs text-red-600 mt-2">
                    {previewError}
                  </div>
                )}
              </div>
            )}

            {selectedPack ? (
              <Elements
                options={{ appearance }}
                stripe={stripePromise}
              >
                <CheckoutForm
                  selectedPack={selectedPack}
                  appliedPromoCode={appliedPromoCode}
                  email={email}
                  teamId={teamId}
                  onClose={onClose}
                  onCheckoutStarted={onCheckoutStarted}
                />
              </Elements>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                Please select a pack to proceed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
