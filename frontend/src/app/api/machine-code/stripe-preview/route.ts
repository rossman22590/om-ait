import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { priceId, promoCode } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
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
            discountAmount = coupon.amount_off;
          }
          finalAmount = Math.max(0, originalAmount - discountAmount);
        } else {
          return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
        }
      } catch (promoError: any) {
        console.error("Error applying promo code:", promoError);
        return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
      }
    }

    return NextResponse.json({
      originalAmount,
      discountAmount,
      finalAmount,
    });
  } catch (e: any) {
    console.error("Error calculating pricing:", e);
    return NextResponse.json({ error: e.message || "Failed to calculate pricing" }, { status: 500 });
  }
}
