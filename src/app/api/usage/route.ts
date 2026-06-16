import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServer } from "../../../../lib/supabase-server.js";

export const runtime = "nodejs";

const TIER_LIMITS: Record<string, number> = {
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

    // Get user's subscription tier
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("tier, current_period_end")
      .eq("user_id", userId)
      .single();

    const tier = sub?.tier ?? "free";
    const limit = TIER_LIMITS[tier] ?? 3;

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

    if (error) {
      console.error("Usage count error:", error);
      // Return safe defaults on error — never block the user
      return NextResponse.json({ used: 0, limit, tier, resetsAt: monthEnd });
    }

    // Calculate reset date (1st of next month)
    const resetsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    return NextResponse.json({
      used: count ?? 0,
      limit,
      tier,
      resetsAt,
    });
  } catch (error) {
    console.error("Usage API error:", error);
    // Safe fallback
    return NextResponse.json({ used: 0, limit: 3, tier: "free", resetsAt: null });
  }
}
