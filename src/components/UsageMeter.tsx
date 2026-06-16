"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

interface UsageData {
  used: number;
  limit: number;
  tier: string;
  resetsAt: string | null;
}

function getDaysUntilReset(resetsAt: string | null): number {
  if (!resetsAt) return 0;
  const diff = new Date(resetsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getMeterColor(pct: number): string {
  if (pct >= 0.9) return "hsl(0,82%,58%)";   // red
  if (pct >= 0.7) return "hsl(38,95%,58%)";  // amber
  return "hsl(162,85%,48%)";                  // emerald
}

export default function UsageMeter() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage")
      .then(r => r.json())
      .then(d => { setUsage(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !usage) return null;

  const pct = Math.min(1, usage.used / usage.limit);
  const barColor = getMeterColor(pct);
  const daysLeft = getDaysUntilReset(usage.resetsAt);
  const isNearLimit = pct >= 0.7;
  const isAtLimit = usage.used >= usage.limit;

  return (
    <div className="flex items-center gap-3">
      {/* Bar + count */}
      <div className="flex flex-col gap-1 min-w-[120px]">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-[11px] text-white/35">
            {usage.used}/{usage.limit} reports
          </span>
          {daysLeft > 0 && (
            <span className="text-[10px] text-white/25">
              Resets in {daysLeft}d
            </span>
          )}
        </div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.08)", width: 120 }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(2, pct * 100)}%`,
              background: barColor,
              boxShadow: isAtLimit ? `0 0 8px ${barColor}` : undefined,
            }}
          />
        </div>
      </div>

      {/* Upgrade CTA — shown at 70%+ */}
      {isNearLimit && (
        <Link
          href="/pricing"
          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all whitespace-nowrap"
          style={{
            background: isAtLimit
              ? `hsla(0,82%,58%,0.15)`
              : `hsla(162,85%,48%,0.12)`,
            color: isAtLimit ? "hsl(0,82%,58%)" : "hsl(162,85%,48%)",
            border: `1px solid ${isAtLimit ? "hsla(0,82%,58%,0.25)" : "hsla(162,85%,48%,0.25)"}`,
          }}
        >
          <Zap className="w-2.5 h-2.5" />
          {isAtLimit ? "Limit reached" : "Upgrade"}
          <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      )}
    </div>
  );
}
