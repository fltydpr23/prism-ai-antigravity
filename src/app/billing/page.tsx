"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CreditCard, Zap, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import UsageMeter from "@/components/UsageMeter";

interface UsageData {
  used: number;
  limit: number;
  tier: string;
  resetsAt: string | null;
}

const TIER_DISPLAY: Record<string, { label: string; color: string; price: string }> = {
  free:       { label: "Free",    color: "hsl(162,85%,48%)",  price: "₹0 / month" },
  starter:    { label: "Starter", color: "hsl(195,90%,58%)",  price: "₹999 / month" },
  pro:        { label: "Pro",     color: "hsl(162,85%,48%)",  price: "₹3,499 / month" },
  agency:     { label: "Agency",  color: "hsl(265,80%,65%)",  price: "₹9,999 / month" },
  enterprise: { label: "Enterprise", color: "hsl(38,95%,58%)", price: "Custom" },
};

export default function BillingPage() {
  const { isLoaded, userId } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/usage")
      .then(r => r.json())
      .then(d => setUsage(d))
      .catch(() => {});
      
    fetch("/api/billing/history")
      .then(r => r.json())
      .then(d => {
        setHistory(d.items || []);
        setLoadingHistory(false);
      })
      .catch(() => {
        setLoadingHistory(false);
      });
  }, [userId]);

  if (!isLoaded) return null;
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#09090C" }}>
        <div className="text-center">
          <p className="text-white/50 text-sm mb-4">Sign in to manage your billing</p>
          <Link href="/" className="glass-pill px-5 py-2.5 text-sm font-semibold text-white">Go Home</Link>
        </div>
      </div>
    );
  }

  const tier = usage?.tier ?? "free";
  const tierInfo = TIER_DISPLAY[tier] ?? TIER_DISPLAY.free;
  const pct = usage ? Math.min(1, usage.used / usage.limit) : 0;

  const resetDate = usage?.resetsAt
    ? new Date(usage.resetsAt).toLocaleDateString("en-IN", { day: "numeric", month: "long" })
    : null;

  return (
    <div className="min-h-screen" style={{ background: "#09090C", color: "#fff" }}>
      <div className="aurora-bg" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-2xl bg-black/30">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 opacity-90" />
          <span className="text-sm font-semibold tracking-wide text-white/90">Prism</span>
        </Link>
        <div className="flex items-center gap-4">
          {usage && <UsageMeter />}
          <UserButton appearance={{ elements: { userButtonAvatarBox: "w-7 h-7" } }} />
        </div>
      </nav>

      <div className="pt-28 pb-24 px-4 max-w-3xl mx-auto relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="label mb-3">Account</div>
          <h1 className="text-3xl font-semibold tracking-tighter text-gradient mb-10">
            Billing & Subscription
          </h1>

          {/* Current plan card */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              background: "rgba(16,16,22,0.9)",
              border: `1px solid ${tierInfo.color}30`,
              backdropFilter: "blur(32px)",
              boxShadow: `0 0 60px ${tierInfo.color}08`,
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs text-white/35 uppercase tracking-widest mb-1">Current Plan</p>
                <div className="flex items-center gap-2">
                  <h2
                    className="text-2xl font-semibold tracking-tighter"
                    style={{ color: tierInfo.color }}
                  >
                    {tierInfo.label}
                  </h2>
                  {tier !== "free" && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-2.5 h-2.5" /> Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/40 mt-0.5">{tierInfo.price}</p>
              </div>
              <CreditCard className="w-6 h-6 text-white/20 mt-1" />
            </div>

            {/* Usage */}
            {usage && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-white/35 mb-2">
                  <span>{usage.used} of {usage.limit} analyses used this month</span>
                  {resetDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Resets {resetDate}
                    </span>
                  )}
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(2, pct * 100)}%`,
                      background: pct >= 0.9 ? "hsl(0,82%,58%)" : pct >= 0.7 ? "hsl(38,95%,58%)" : tierInfo.color,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              {tier === "free" && (
                <Link
                  href="/pricing"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold"
                  style={{
                    background: `linear-gradient(135deg, hsl(162,85%,48%), hsl(195,90%,58%))`,
                    color: "#000",
                  }}
                >
                  <Zap className="w-3.5 h-3.5" /> Upgrade Plan
                </Link>
              )}
              {tier !== "free" && tier !== "enterprise" && (
                <>
                  <Link
                    href="/pricing"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold glass-pill"
                  >
                    Change Plan <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    className="text-xs text-white/25 hover:text-white/50 transition-colors px-3 py-2"
                    onClick={() => alert("Cancellation — contact hello@prismintel.co")}
                  >
                    Cancel subscription
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Invoice history */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "rgba(16,16,22,0.85)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <h3 className="text-sm font-semibold text-white/70 mb-4">Invoice History</h3>
            {loadingHistory ? (
              <p className="text-sm text-white/30 animate-pulse">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-white/30">
                No invoices yet — upgrade to a paid plan to start billing.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm text-white/70 capitalize">{inv.description}</p>
                      <p className="text-xs text-white/30">
                        {new Date(inv.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white/80">
                        {inv.currency === "INR" ? "₹" : ""}{inv.amount.toLocaleString("en-IN")}
                      </p>
                      <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full capitalize">
                        {inv.status === "captured" ? "Paid" : inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GST note */}
          <p className="text-xs text-white/20 text-center mt-6">
            GST invoice generated automatically for Indian businesses. Contact hello@prismintel.co for billing queries.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
