import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-07-30.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { priceId, email, teamId, promoCode } = await req.json();

    if (!priceId || !email || !teamId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch the Price object to get the amount
    const price = await stripe.prices.retrieve(priceId);
    if (!price || !price.unit_amount) {
      return NextResponse.json({ error: "Invalid priceId or missing amount" }, { status: 400 });
    }

    let originalAmount = price.unit_amount; // Amount in cents
    let discountAmount = 0;
    let finalAmount = originalAmount;

    if (promoCode) {
      try {
        const promotionCodes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
        const promotionCode = promotionCodes.data[0];

        if (promotionCode && promotionCode.coupon) {
          const coupon = await stripe.coupons.retrieve(promotionCode.coupon.id);

          if (coupon.percent_off) {
            discountAmount = originalAmount * (coupon.percent_off / 100);
          } else if (coupon.amount_off) {
            discountAmount = coupon.amount_off; // amount_off is in cents
          }
          finalAmount = Math.max(0, originalAmount - discountAmount); // Ensure amount doesn't go below zero
        } else {
          console.warn(`Promo code '${promoCode}' not found or inactive.`);
        }
      } catch (promoError: any) {
        console.error("Error applying promo code:", promoError);
      }
    }

    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount), // Final amount after discount
      currency: "usd",
      customer: await getOrCreateStripeCustomer(email),
      setup_future_usage: "off_session",
      metadata: {
        teamId,
        email,
        pack: priceId,
        promoCode: promoCode || "none",
        originalAmount: originalAmount.toString(), // Store original amount for webhook
        discountAmount: discountAmount.toString(),
        finalAmount: finalAmount.toString(),
        // Store the budget increase amount (original amount in dollars)
        budgetIncreaseAmount: (originalAmount / 100).toString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      originalAmount: originalAmount,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
    });
  } catch (e: any) {
    console.error("Error creating Payment Intent:", e);
    return NextResponse.json({ error: e.message || "Failed to create Payment Intent" }, { status: 500 });
  }
}

// Helper function to get or create a Stripe Customer
async function getOrCreateStripeCustomer(email: string) {
  const customers = await stripe.customers.list({ email: email, limit: 1 });
  if (customers.data.length > 0) {
    return customers.data[0].id;
  } else {
    const customer = await stripe.customers.create({ email: email });
    return customer.id;
  }
}
