"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Clock,
  FileText,
  Zap,
  Plus,
  Users,
  LayoutGrid,
  ChevronRight,
  Loader2,
  ExternalLink,
  Sparkles,
  LogOut,
  CreditCard,
  X,
  Building,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useUser, UserButton, useClerk } from "@clerk/nextjs";
import { useWorkspace } from "../../providers/WorkspaceProvider";

// ─── Types ─────────────────────────────────────────────────────────────────
type HistoryItem = {
  id: string;
  createdAt: string;
  execSummary: string;
  industry: { id: string; label: string; emoji: string } | null;
  wordCount: number;
};

type UsageData = {
  used: number;
  limit: number;
  tier: string;
  resetsAt: string | null;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

function getMeterColor(pct: number): string {
  if (pct >= 0.9) return "hsl(0,82%,58%)";
  if (pct >= 0.7) return "hsl(38,95%,58%)";
  return "hsl(162,85%,48%)";
}

// ─── Upgrade Gate Modal ──────────────────────────────────────────────────────
function UpgradeGate({
  visible,
  onClose,
  feature,
}: {
  visible: boolean;
  onClose: () => void;
  feature: "workspaces" | "team";
}) {
  const featureLabel = feature === "workspaces" ? "Workspaces" : "Team Invites";
  const featureDesc =
    feature === "workspaces"
      ? "Organise analyses by client, brand, or project. White-label reports with custom branding."
      : "Invite colleagues to collaborate on reports, share intelligence, and manage access.";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="upgrade-gate"
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Sheet */}
          <motion.div
            className="relative z-10 w-full max-w-md"
            initial={{ y: 24, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="rounded-2xl p-8 relative overflow-hidden"
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.09)",
                borderTopColor: "rgba(255,255,255,0.14)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
              }}
            >
              {/* Ambient */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 60% at 50% -10%, hsla(162,85%,48%,0.07) 0%, transparent 70%)",
                }}
              />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-white/30 hover:text-white hover:bg-white/8 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  {feature === "workspaces" ? (
                    <Building className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Users className="w-5 h-5 text-emerald-400" />
                  )}
                </div>

                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/25 mb-2">
                  Analyst tier required
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-white mb-3">
                  Unlock {featureLabel}
                </h2>
                <p className="text-sm text-white/45 leading-relaxed mb-8">
                  {featureDesc}
                </p>

                {/* What you get */}
                <div className="flex flex-col gap-2 mb-8">
                  {[
                    "Unlimited analyses per month",
                    "Client workspaces with branding",
                    "Team collaboration & roles",
                    "Priority report generation",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-sm text-white/60">{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/pricing"
                  className="w-full flex items-center justify-center gap-2 bg-white text-black text-sm font-semibold py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)] tracking-tight"
                >
                  Upgrade to Analyst <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={onClose}
                  className="w-full text-sm text-white/25 hover:text-white/50 transition-colors mt-3 py-2"
                >
                  Continue with Explorer
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Report Vault Card ───────────────────────────────────────────────────────
function ReportCard({ item, index }: { item: HistoryItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/report/${item.id}`} className="group block">
        <div
          className="rounded-2xl p-5 transition-all duration-300 relative overflow-hidden"
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.06)",
            borderTopColor: "rgba(255,255,255,0.09)",
          }}
        >
          {/* Hover shimmer */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)" }}
          />

          <div className="flex items-start gap-4">
            {/* Industry icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {item.industry?.emoji ? (
                <span className="text-lg">{item.industry.emoji}</span>
              ) : (
                <FileText className="w-4 h-4 text-white/30" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/75 leading-snug line-clamp-2 group-hover:text-white transition-colors duration-200">
                {item.execSummary}
              </p>
              <div className="flex items-center gap-3 mt-2.5">
                {item.industry && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(16,185,129,0.08)",
                      color: "rgba(52,211,153,0.8)",
                      border: "1px solid rgba(16,185,129,0.15)",
                    }}
                  >
                    {item.industry.label}
                  </span>
                )}
                <span className="text-[10px] text-white/25 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {timeAgo(item.createdAt)}
                </span>
                {item.wordCount > 0 && (
                  <span className="text-[10px] text-white/20">
                    {item.wordCount.toLocaleString()} words
                  </span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <ExternalLink className="w-3.5 h-3.5 text-white/15 group-hover:text-white/50 shrink-0 transition-colors duration-200 mt-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Nav Item ────────────────────────────────────────────────────────────────
function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  href,
  locked,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  locked?: boolean;
}) {
  const cls = `
    group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative
    ${active
      ? "bg-white/8 text-white"
      : "text-white/40 hover:text-white hover:bg-white/5"
    }
  `;

  const inner = (
    <>
      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-white/35 group-hover:text-white/70"} transition-colors`} />
      <span className="flex-1">{label}</span>
      {locked && (
        <span
          className="text-[9px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded-full"
          style={{
            background: "rgba(245,158,11,0.12)",
            color: "rgba(245,158,11,0.8)",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          Pro
        </span>
      )}
      {active && (
        <div className="w-1 h-1 rounded-full bg-emerald-400" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"overview" | "history">("overview");
  const [upgradeGate, setUpgradeGate] = useState<null | "workspaces" | "team">(null);

  const tier = usage?.tier ?? "explorer";
  const isFreeTier = tier === "explorer" || tier === "free";

  // Fetch history + usage
  useEffect(() => {
    Promise.all([
      fetch("/api/history").then((r) => r.json()),
      fetch("/api/usage").then((r) => r.json()),
    ])
      .then(([hist, use]) => {
        if (hist.ok) setItems(hist.items ?? []);
        else setError(hist.error ?? "Failed to load.");
        setUsage(use);
      })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  }, []);

  const pct = usage ? Math.min(1, usage.used / usage.limit) : 0;
  const barColor = getMeterColor(pct);
  const firstName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "there";

  // Greet based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-[#050505] flex relative overflow-hidden">
      {/* Ambient */}
      <div
        className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 0% 0%, rgba(16,185,129,0.04) 0%, transparent 70%)",
        }}
      />

      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className="w-60 shrink-0 flex flex-col h-screen sticky top-0 overflow-hidden"
        style={{
          background: "#070707",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Wordmark */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(162,85%,48%) 0%, hsl(195,90%,58%) 100%)",
              boxShadow: "0 0 12px hsla(162,85%,48%,0.4)",
            }}
          >
            <Sparkles className="w-3 h-3 text-black" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white/90">Prism</span>
          <span
            className="ml-auto text-[9px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {tier}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto pt-1">
          <p className="px-3 text-[9px] font-semibold tracking-[0.18em] uppercase text-white/20 mb-1 mt-2">
            Intelligence
          </p>

          <NavItem
            icon={LayoutGrid}
            label="Overview"
            active={activeSection === "overview"}
            onClick={() => setActiveSection("overview")}
          />
          <NavItem
            icon={Plus}
            label="New Analysis"
            href="/analyse"
          />
          <NavItem
            icon={Clock}
            label="History"
            active={activeSection === "history"}
            onClick={() => setActiveSection("history")}
          />

          <div className="h-px bg-white/5 my-2" />

          <p className="px-3 text-[9px] font-semibold tracking-[0.18em] uppercase text-white/20 mb-1">
            Organisation
          </p>

          <NavItem
            icon={Building}
            label="Workspaces"
            locked={isFreeTier}
            onClick={() => isFreeTier ? setUpgradeGate("workspaces") : undefined}
            href={isFreeTier ? undefined : "/"}
          />
          <NavItem
            icon={Users}
            label="Team"
            locked={isFreeTier}
            onClick={() => isFreeTier ? setUpgradeGate("team") : undefined}
            href={isFreeTier ? undefined : "/"}
          />

          <div className="h-px bg-white/5 my-2" />

          <p className="px-3 text-[9px] font-semibold tracking-[0.18em] uppercase text-white/20 mb-1">
            Account
          </p>

          <NavItem icon={CreditCard} label="Billing" href="/billing" />
          <NavItem
            icon={LogOut}
            label="Sign out"
            onClick={() => signOut({ redirectUrl: "/" })}
          />
        </nav>

        {/* Usage bar */}
        {usage && (
          <div className="mx-3 mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-white/35">
                {usage.used} / {usage.limit} analyses
              </span>
              {isFreeTier && (
                <Link href="/pricing" className="text-[10px] font-semibold text-emerald-400/80 hover:text-emerald-400 transition-colors flex items-center gap-0.5">
                  Upgrade <ChevronRight className="w-2.5 h-2.5" />
                </Link>
              )}
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(2, pct * 100)}%`, background: barColor }}
              />
            </div>
          </div>
        )}

        {/* User */}
        <div
          className="mx-3 mb-4 p-3 rounded-xl flex items-center gap-2.5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "w-7 h-7",
              },
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80 truncate">{user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress}</p>
            <p className="text-[10px] text-white/30 truncate">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">

          {/* Header greeting */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10"
          >
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/20 mb-2">
              {greeting}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              {firstName}.
            </h1>
            <p className="text-sm text-white/35 mt-1.5">
              {items.length > 0
                ? `You've run ${items.length} ${items.length === 1 ? "analysis" : "analyses"} with Prism.`
                : "Your intelligence vault is empty. Run your first analysis."}
            </p>
          </motion.div>

          {/* ── OVERVIEW SECTION ── */}
          {activeSection === "overview" && (
            <AnimatePresence mode="wait">
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col gap-8"
              >
                {/* Stat cards row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Analyses Run",
                      value: loading ? "—" : usage?.used ?? 0,
                      sub: `of ${usage?.limit ?? "—"} this month`,
                      color: "hsl(162,85%,48%)",
                    },
                    {
                      label: "Reports Saved",
                      value: loading ? "—" : items.length,
                      sub: "in your vault",
                      color: "hsl(195,90%,58%)",
                    },
                    {
                      label: "Current Plan",
                      value: loading ? "—" : tier.charAt(0).toUpperCase() + tier.slice(1),
                      sub: isFreeTier ? "Upgrade to unlock more" : "Active subscription",
                      color: "hsl(265,80%,65%)",
                    },
                    {
                      label: "Workspaces",
                      value: isFreeTier ? "—" : workspaces.length,
                      sub: isFreeTier ? "Available on Analyst" : `${workspaces.length} active`,
                      color: "hsl(38,95%,58%)",
                    },
                  ].map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.4 }}
                      className="rounded-2xl p-5 relative overflow-hidden"
                      style={{
                        background: "#0d0d0d",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderTopColor: "rgba(255,255,255,0.09)",
                      }}
                    >
                      <div
                        className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
                        style={{
                          background: `radial-gradient(ellipse 80% 80% at 100% 0%, ${card.color}12 0%, transparent 70%)`,
                        }}
                      />
                      <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/25 mb-3">
                        {card.label}
                      </p>
                      <p className="text-2xl font-semibold tracking-tight text-white mb-1">
                        {card.value}
                      </p>
                      <p className="text-[11px] text-white/30">{card.sub}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/analyse"
                    className="group rounded-2xl p-6 flex items-center gap-4 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background: "linear-gradient(135deg, hsl(162,85%,48%) 0%, hsl(195,90%,58%) 100%)",
                      boxShadow: "0 0 32px hsla(162,85%,48%,0.2)",
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white tracking-tight">New Analysis</p>
                      <p className="text-xs text-white/60 mt-0.5">Upload data or paste text</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/60 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <button
                    onClick={() => isFreeTier ? setUpgradeGate("workspaces") : undefined}
                    className="group rounded-2xl p-6 flex items-center gap-4 text-left transition-all duration-200"
                    style={{
                      background: "#0d0d0d",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderTopColor: "rgba(255,255,255,0.09)",
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Building className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white/70 group-hover:text-white tracking-tight transition-colors">
                        Workspaces
                      </p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {isFreeTier ? "Requires Analyst tier" : `${workspaces.length} active`}
                      </p>
                    </div>
                    {isFreeTier ? (
                      <Zap className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 shrink-0 transition-colors" />
                    )}
                  </button>

                  <button
                    onClick={() => isFreeTier ? setUpgradeGate("team") : undefined}
                    className="group rounded-2xl p-6 flex items-center gap-4 text-left transition-all duration-200"
                    style={{
                      background: "#0d0d0d",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderTopColor: "rgba(255,255,255,0.09)",
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Users className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white/70 group-hover:text-white tracking-tight transition-colors">
                        Invite Team
                      </p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {isFreeTier ? "Requires Analyst tier" : "Manage members"}
                      </p>
                    </div>
                    {isFreeTier ? (
                      <Zap className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 shrink-0 transition-colors" />
                    )}
                  </button>
                </div>

                {/* Recent reports */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-white/70 tracking-tight">Recent Reports</h2>
                    {items.length > 4 && (
                      <button
                        onClick={() => setActiveSection("history")}
                        className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
                      >
                        View all <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {loading && (
                    <div className="flex items-center justify-center py-16 gap-3">
                      <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                      <span className="text-sm text-white/25">Loading vault...</span>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-2xl p-6 flex items-center gap-3"
                      style={{ background: "#0d0d0d", border: "1px solid rgba(239,68,68,0.15)" }}>
                      <AlertCircle className="w-4 h-4 text-red-400/60 shrink-0" />
                      <p className="text-sm text-white/40">{error}</p>
                    </div>
                  )}

                  {!loading && !error && items.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-2xl p-12 flex flex-col items-center text-center gap-4"
                      style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.06)", borderStyle: "dashed" }}
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Sparkles className="w-5 h-5 text-white/20" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/50">Vault is empty</p>
                        <p className="text-xs text-white/25 mt-1">Run an analysis with Archive enabled to see reports here.</p>
                      </div>
                      <Link href="/analyse" className="flex items-center gap-1.5 text-xs font-medium text-emerald-400/70 hover:text-emerald-400 transition-colors">
                        Run first analysis <ArrowRight className="w-3 h-3" />
                      </Link>
                    </motion.div>
                  )}

                  {!loading && !error && items.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {items.slice(0, 5).map((item, i) => (
                        <ReportCard key={item.id} item={item} index={i} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── HISTORY SECTION ── */}
          {activeSection === "history" && (
            <AnimatePresence mode="wait">
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold tracking-tight text-white/80">
                    Intelligence Vault
                  </h2>
                  <span className="text-xs text-white/25">{items.length} reports</span>
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-24 gap-3">
                    <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                    <span className="text-sm text-white/25">Loading archive...</span>
                  </div>
                )}

                {!loading && items.length === 0 && (
                  <div className="rounded-2xl p-16 flex flex-col items-center text-center gap-4"
                    style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.06)", borderStyle: "dashed" }}>
                    <Sparkles className="w-8 h-8 text-white/10" />
                    <p className="text-sm text-white/40">No saved analyses yet.</p>
                    <Link href="/analyse" className="text-xs font-medium text-emerald-400/70 hover:text-emerald-400 transition-colors flex items-center gap-1">
                      Start your first analysis <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {!loading && items.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {items.map((item, i) => (
                      <ReportCard key={item.id} item={item} index={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Upgrade Gate Modal */}
      <UpgradeGate
        visible={upgradeGate !== null}
        onClose={() => setUpgradeGate(null)}
        feature={upgradeGate ?? "workspaces"}
      />
    </div>
  );
}
