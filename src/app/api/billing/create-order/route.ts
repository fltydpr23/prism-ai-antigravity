import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const TIER_PRICES: Record<string, Record<string, number>> = {
  starter: { monthly: 99900, annual: 79900 },   // paise (₹999, ₹799)
  pro:     { monthly: 349900, annual: 279900 }, // paise (₹3,499, ₹2,799)
  agency:  { monthly: 999900, annual: 799900 }, // paise (₹9,999, ₹7,999)
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { tier?: string; billingPeriod?: string };
    const { tier, billingPeriod = "monthly" } = body;

    if (!tier || !TIER_PRICES[tier]) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const amount = TIER_PRICES[tier][billingPeriod] ?? TIER_PRICES[tier].monthly;

    // ── If Razorpay keys are missing, return a mock order for dev ──
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.warn("[billing] Razorpay keys not set — returning mock order for dev");
      return NextResponse.json({
        orderId: `mock_order_${Date.now()}`,
        amount,
        currency: "INR",
        tier,
        billingPeriod,
        isMock: true,
      });
    }

    // ── Real Razorpay order creation ──
    const authHeader = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");
    const rzResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `prism_${userId}_${Date.now()}`,
        notes: { tier, billingPeriod, userId },
      }),
    });

    if (!rzResponse.ok) {
      const error = await rzResponse.text();
      console.error("[billing] Razorpay order creation failed:", error);
      return NextResponse.json({ error: "Payment gateway error" }, { status: 502 });
    }

    const order = await rzResponse.json() as { id: string };
    return NextResponse.json({
      orderId: order.id,
      amount,
      currency: "INR",
      tier,
      billingPeriod,
      isMock: false,
    });
  } catch (error) {
    console.error("[billing] create-order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
