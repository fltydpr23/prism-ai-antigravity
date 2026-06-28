"use client";

import { Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export type PrismTier = "free" | "explorer" | "starter" | "analyst" | "pro" | "agency" | "enterprise" | "admin";

const TIER_RANK: Record<PrismTier, number> = {
  free: 0,
  explorer: 0,
  starter: 1,
  analyst: 2,
  pro: 2,
  agency: 3,
  enterprise: 4,
  admin: 5,
};

const TIER_LABELS: Record<PrismTier, string> = {
  free: "Free",
  explorer: "Free",
  starter: "Starter",
  analyst: "Analyst",
  pro: "Pro",
  agency: "Agency",
  enterprise: "Enterprise",
  admin: "Admin",
};

interface GatedFeatureProps {
  requiredTier: PrismTier;
  userTier?: PrismTier; // optional override — if not provided, fetched from /api/usage
  children: React.ReactNode;
  label?: string;
}

export default function GatedFeature({
  requiredTier,
  userTier: userTierProp,
  children,
  label,
}: GatedFeatureProps) {
  const [fetchedTier, setFetchedTier] = useState<PrismTier | null>(null);

  useEffect(() => {
    if (userTierProp) return;
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => {
        if (d?.tier) setFetchedTier(d.tier as PrismTier);
      })
      .catch(() => setFetchedTier("free"));
  }, [userTierProp]);

  // While fetching, render children (optimistic — avoids flash of paywall)
  const resolvedTier = userTierProp ?? fetchedTier;
  if (resolvedTier === null) return <>{children}</>;

  const hasAccess = TIER_RANK[resolvedTier] >= TIER_RANK[requiredTier];
  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred children — users see what they're missing */}
      <div className="pointer-events-none select-none" style={{ filter: "blur(6px)", opacity: 0.45 }}>
        {children}
      </div>

      {/* Glass overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl"
        style={{
          background: "rgba(9, 9, 12, 0.72)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Lock className="w-4 h-4 text-white/50" />
        </div>

        <div className="text-center flex flex-col gap-1">
          <p className="text-sm font-semibold text-white/90">
            {label ? `${label} — ` : ""}Available on {TIER_LABELS[requiredTier]}
          </p>
          <p className="text-xs text-white/40">
            Upgrade to unlock this intelligence module
          </p>
        </div>

        <Link
          href="/pricing"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, hsl(162,85%,48%) 0%, hsl(195,90%,58%) 100%)",
            boxShadow: "0 0 20px hsla(162,85%,48%,0.3)",
          }}
        >
          Upgrade to {TIER_LABELS[requiredTier]} <ArrowRight className="w-3 h-3" />
        </Link>
      </motion.div>
    </div>
  );
}
