import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const PLAN_IDS: Record<string, Record<string, string>> = {
  pro: { 
    monthly: process.env.RAZORPAY_PLAN_PRO_MONTHLY || "plan_dummy_pro_monthly", 
    annual: process.env.RAZORPAY_PLAN_PRO_ANNUAL || "plan_dummy_pro_annual" 
  },
  agency: { 
    monthly: process.env.RAZORPAY_PLAN_AGENCY_MONTHLY || "plan_dummy_agency_monthly", 
    annual: process.env.RAZORPAY_PLAN_AGENCY_ANNUAL || "plan_dummy_agency_annual" 
  },
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { tier?: string; billingPeriod?: string };
    const { tier, billingPeriod = "monthly" } = body;

    if (!tier || !PLAN_IDS[tier] || !PLAN_IDS[tier][billingPeriod]) {
      return NextResponse.json({ error: "Invalid tier or billing period" }, { status: 400 });
    }

    const plan_id = PLAN_IDS[tier][billingPeriod];
    
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.warn("[billing] Razorpay keys not set — returning mock subscription");
      return NextResponse.json({
        subscriptionId: `sub_mock_${Date.now()}`,
        plan_id,
        tier,
        billingPeriod,
        isMock: true,
      });
    }

    // ── Real Razorpay subscription creation ──
    const authHeader = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");
    
    const rzResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        plan_id,
        total_count: billingPeriod === 'annual' ? 10 : 120, // max billing cycles
        customer_notify: 1,
        notes: { tier, billingPeriod, userId },
      }),
    });

    if (!rzResponse.ok) {
      const error = await rzResponse.text();
      console.error("[billing] Razorpay subscription creation failed:", error);
      return NextResponse.json({ error: "Payment gateway error" }, { status: 502 });
    }

    const subscription = await rzResponse.json() as { id: string };
    return NextResponse.json({
      subscriptionId: subscription.id,
      plan_id,
      tier,
      billingPeriod,
      isMock: false,
    });
  } catch (error) {
    console.error("[billing] create-subscription error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
