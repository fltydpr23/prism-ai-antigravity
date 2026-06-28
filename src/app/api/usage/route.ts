import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServer } from "../../../../lib/supabase-server.js";

export const runtime = "nodejs";

const TIER_LIMITS: Record<string, number> = {
  explorer: 3,
  free: 3,
  starter: 15,
  pro: 60,
  agency: 200,
  enterprise: 99999,
};

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServer();

    // Get user's subscription tier and credits
    const { data: userProfile } = await supabase
      .from("users")
      .select("tier, subscription_end_date, credits, analyses_count, trial_ends_at, subscription_status")
      .eq("id", userId)
      .single();

    const tier = userProfile?.tier ?? "explorer";
    const limit = TIER_LIMITS[tier] ?? 3;
    const credits = userProfile?.credits ?? 0;
    const analyses_count = userProfile?.analyses_count ?? 0;
    const subscription_status = userProfile?.subscription_status ?? "inactive";
    const trial_ends_at = userProfile?.trial_ends_at ?? null;

    // We can use the global analyses_count if we are not doing windowed limits,
    // but the codebase is doing month-start/end counts.
    // Let's keep the month count for subscription limits, but credits are absolute.
    
    // Calculate current month window
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Count analyses this month
    const { count, error } = await supabase
      .from("analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart)
      .lte("created_at", monthEnd);

    const resetsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    return NextResponse.json({
      used: count ?? 0,
      limit,
      tier,
      credits,
      resetsAt,
      subscription_status,
      trial_ends_at,
    });
  } catch (error) {
    console.error("Usage API error:", error);
    // Safe fallback
    return NextResponse.json({ used: 0, limit: 3, tier: "explorer", credits: 0, resetsAt: null, subscription_status: "inactive", trial_ends_at: null });
  }
}
