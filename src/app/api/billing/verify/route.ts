import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { createSupabaseServer } from "../../../../../lib/supabase-server.js";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      razorpay_payment_id?: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
      tier?: string;
      billingPeriod?: string;
      isMock?: boolean;
    };

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      tier,
      billingPeriod = "monthly",
      isMock = false,
    } = body;

    // ── Mock verification for dev ──
    if (isMock) {
      console.warn("[billing] Mock payment verification — skipping signature check");
      return NextResponse.json({ success: true, tier, mock: true });
    }

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeySecret) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    // ── Verify Razorpay signature (HMAC-SHA256) ──
    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("[billing] Signature mismatch — potential fraud attempt");
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // ── Upsert subscription in Supabase ──
    const supabase = createSupabaseServer();
    
    if (tier === "credit") {
      // Fetch current user
      const { data: userDoc, error: fetchError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("[billing] User fetch error:", fetchError);
        return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
      }

      const currentCredits = userDoc?.credits || 0;
      const { error: updateError } = await supabase
        .from('users')
        .update({ credits: currentCredits + 1 })
        .eq('id', userId);

      if (updateError) {
        console.error("[billing] Credit update error:", updateError);
        return NextResponse.json({ error: "Failed to add credit" }, { status: 500 });
      }
    } else {
      // ── Upsert subscription in Supabase ──
      const now = new Date();
      const periodEnd = billingPeriod === "annual"
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const { error: upsertError } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          tier: tier ?? "starter",
          billing_period: billingPeriod,
          razorpay_subscription_id: razorpay_payment_id,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("[billing] Subscription upsert error:", upsertError);
        return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, tier, billingPeriod });
  } catch (error) {
    console.error("[billing] verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
