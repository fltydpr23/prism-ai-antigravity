"use client";

import { useState } from "react";
import {
  Sparkles, Brain, Zap, Users,
  FileText, MessageSquare, Mic, Globe, BarChart3, Shield,
  Upload, FlaskConical, TrendingUp, Check, Target, Layers
} from "lucide-react";
import Link from "next/link";
import MagneticButton from "./MagneticButton";
import PricingCard from "./PricingCard";
import PricingToggle from "./PricingToggle";
import PrismHero from "./PrismHero";
import PrismHeader from "./PrismHeader";
import PrismFooter from "./PrismFooter";
import { SignInButton, useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";

const PrismScoreBento = dynamic(() => import("./PrismScoreBento"));
const PrismLanguageMap = dynamic(() => import("./PrismLanguageMap"));
const PrismReportPreview = dynamic(() => import("./PrismReportPreview"));
const PrismAgencyAdvantage = dynamic(() => import("./PrismAgencyAdvantage"));

const SOURCES = [
  { icon: MessageSquare, label: "WhatsApp Chats" },
  { icon: FileText, label: "Play Store Reviews" },
  { icon: FileText, label: "App Store Reviews" },
  { icon: FileText, label: "Support Tickets" },
  { icon: Mic, label: "Call Transcripts" },
  { icon: FileText, label: "PDFs & Reports" },
  { icon: Globe, label: "Social Comments" },
  { icon: FileText, label: "CSV Exports" },
  { icon: MessageSquare, label: "Interview Notes" },
  { icon: Globe, label: "Hinglish Feedback" },
];

const BENTO = [
  {
    id: "consumer", col: "md:col-span-2", accent: "emerald", icon: Users,
    title: "Consumer Intelligence",
    desc: "Extract sentiment trajectories, contradiction maps, churn signals, and strategic opportunities from thousands of raw reviews in seconds.",
    stat: null,
  },
  {
    id: "speed", col: "", accent: "cyan", icon: Zap,
    title: "Real-Time", desc: "Average processing time per document", stat: "< 60s",
  },
  {
    id: "multilingual", col: "", accent: "amber", icon: Globe,
    title: "Multilingual AI", desc: null, stat: null, multilingual: true,
  },
  {
    id: "orchestration", col: "md:col-span-2", accent: "emerald", icon: Brain,
    title: "Multi-Model Orchestration",
    desc: "Route tasks across local and cloud LLMs. Fast models for chunked extraction, 120B+ frontier models for deep strategic synthesis.",
    stat: null,
  },
  {
    id: "macro_segments", col: "md:col-span-2", accent: "crimson", icon: BarChart3,
    title: "Macro & Segment Depth",
    desc: "Track geographic hotspot shifts, displacement trends, and behavioral signatures across Tier-1, Tier-2, and Tier-3 consumer archetypes.",
    stat: null,
  },
  {
    id: "trust", col: "", accent: "cyan", icon: Shield,
    title: "Churn Risk Detection",
    desc: "Identify when brand trust is silently declining before it becomes visible in churn data. Get ahead of the crisis.",
    stat: null,
  },
];

const ACCENT_CLASSES: Record<string, { icon: string; badge: string; glow: string }> = {
  emerald: { icon: "text-emerald-400", badge: "badge-emerald", glow: "glow-hover-emerald" },
  cyan: { icon: "text-cyan-400", badge: "badge-cyan", glow: "glow-hover-cyan" },
  amber: { icon: "text-amber-400", badge: "badge-amber", glow: "glow-hover-amber" },
  crimson: { icon: "text-rose-400", badge: "badge-crimson", glow: "glow-hover-crimson" },
};

const MULTILINGUAL_QUOTES = [
  { raw: "bagundi but konchem costly", lang: "Telugu-English", signal: "Quality ✓ Price ✗" },
  { raw: "support romba weak da", lang: "Tanglish", signal: "Support Failure" },
  { raw: "acha hai but delivery slow", lang: "Hinglish", signal: "Ops Bottleneck" },
];

const HOW_IT_WORKS = [
  {
    icon: Upload,
    step: "01",
    title: "Drop your feedback",
    desc: "CSV, PDF, TXT, WhatsApp exports, app store reviews — any format. Paste text or upload files up to 200MB.",
  },
  {
    icon: FlaskConical,
    step: "02",
    title: "Prism analyses",
    desc: "Multi-model orchestration extracts sentiment, contradictions, churn signals, competitor mentions, and strategic patterns.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Get intelligence",
    desc: "A scored, structured report ready to share with clients or present to your leadership team — in under 60 seconds.",
  },
];

// SOCIAL_PROOF removed as per feedback

const PRICING_EXPLORER = [
  { label: "3 full analyses / month", included: true },
  { label: "All 6 industry modes", included: true },
  { label: "Standard PDF export", included: true },
  { label: "Prism watermark included", included: true },
  { label: "7-day report retention", included: true },
  { label: "Unlimited ingestion", included: "locked" },
  { label: "White-label reports", included: "locked" },
  { label: "Team collaboration", included: "locked" },
];

const PRICING_ANALYST = [
  { label: "Unlimited analyses", included: true },
  { label: "5,000 row cap / analysis", included: true },
  { label: "No Prism watermark", included: true },
  { label: "Clean PDF export", included: true },
  { label: "90-day report archive", included: true },
  { label: "Shareable read-only links", included: true },
  { label: "White-label reports", included: "locked" },
  { label: "Team collaboration", included: "locked" },
];

const PRICING_AGENCY = [
  { label: "Unlimited analyses", included: true },
  { label: "Unlimited ingestion", included: true },
  { label: "White-Label generation", included: true },
  { label: "Up to 3 team seats included", included: true },
  { label: "Client portal sharing", included: true },
  { label: "1-year report archive", included: true },
  { label: "API access", included: "locked" },
  { label: "Custom LLM instructions", included: "locked" },
];

const PRICING_ENTERPRISE = [
  { label: "Unlimited team seats", included: true },
  { label: "API access (custom volume)", included: true },
  { label: "Custom LLM instructions", included: true },
  { label: "Proprietary frameworks", included: true },
  { label: "Unlimited archive", included: true },
  { label: "Dedicated account manager", included: true },
  { label: "Priority support + SLA", included: true },
];

interface Props { onStart: () => void; }

export default function PrismLanding({ onStart }: Props) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const { isLoaded, userId } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Header ────────────────────────────────────────────── */}
      <PrismHeader onStart={onStart} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <PrismHero onStart={onStart} />

      {/* ── Trust Section ─────────────────────────────────────── */}
      <section className="py-16 border-y border-white/5 px-6 bg-[#0A0A0A]/50">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-8">
          <p className="text-sm md:text-base font-medium text-white/50">
            Built for modern brands, agencies and research teams.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale">
            <span className="text-lg md:text-xl font-bold tracking-tight">Consumer Intelligence</span>
            <span className="text-lg md:text-xl font-bold tracking-tight">Voice of Customer</span>
            <span className="text-lg md:text-xl font-bold tracking-tight">Community Intelligence</span>
            <span className="text-lg md:text-xl font-bold tracking-tight">Competitive Analysis</span>
          </div>
        </div>
      </section>

      {/* ── India Language Coverage Map ─────────────────────────────────── */}
      <PrismLanguageMap />

      {/* ── Prism Score & Signals Bento ─────────────────────────────────── */}
      <PrismScoreBento />

      {/* ── Feature: Intelligence Reports ────────────────────────────── */}
      <PrismReportPreview />

      {/* ── Agency Advantage ────────────────────────────── */}
      <PrismAgencyAdvantage />

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-32 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-semibold tracking-widest uppercase text-white/50 mb-6">
            Pricing
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tighter text-white pb-1 mb-6">
            Start free. Upgrade when you<br />
            <span className="text-white/35">need the intelligence.</span>
          </h2>
          <p className="text-base text-white/45 max-w-lg mx-auto mb-10 leading-relaxed">
            Every tier is a complete product. Unlock deeper intelligence, longer memory, and team collaboration as you scale.
          </p>
          <div className="flex justify-center">
            <PricingToggle value={billing} onChange={setBilling} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 items-start">
          <PricingCard
            tier="Explorer" tagline="3 full analyses to experience the platform."
            monthlyPrice={null} annualPrice={null} billingPeriod={billing}
            ctaLabel="Start Free" ctaHref="/sign-up" ctaVariant="ghost"
            features={PRICING_EXPLORER} accentColor="162,85%,48%" index={0}
          />
          <PricingCard
            tier="Analyst" tagline="For solo analysts needing unlimited insights."
            monthlyPrice={999} annualPrice={799} billingPeriod={billing}
            ctaLabel="Start 7-Day Trial" ctaHref="/sign-up" ctaVariant="ghost"
            features={PRICING_ANALYST} accentColor="195,90%,58%" index={1}
          />
          <PricingCard
            tier="Agency Partner" tagline="For agencies delivering client strategies."
            monthlyPrice={4999} annualPrice={3999} billingPeriod={billing}
            isPopular ctaLabel="Start 14-Day Free Trial" ctaHref="/sign-up?plan=agency" ctaVariant="primary"
            features={PRICING_AGENCY} accentColor="162,85%,48%" index={2}
          />
          <PricingCard
            tier="Enterprise" tagline="For large consultancies (e.g. ZoomRx scale)."
            monthlyPrice={0} annualPrice={0} billingPeriod={billing}
            ctaLabel="Get in Touch" ctaHref="mailto:hello@prismintel.co?subject=Enterprise Plan" ctaVariant="ghost"
            features={PRICING_ENTERPRISE} accentColor="265,80%,65%" index={3}
          />
        </div>

        {/* PAYG Add-on Banner */}
        <div className="max-w-2xl mx-auto mb-10 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-white/90">Need just one more analysis?</h4>
              <p className="text-xs text-white/50">Explorer users can run a one-off analysis instantly for ₹249. No subscription required.</p>
            </div>
          </div>
          <MagneticButton
            intensity={0.1}
            onClick={() => {}}
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 shrink-0 transition-colors"
          >
            Buy 1 Credit
          </MagneticButton>
        </div>

        {/* Bottom trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-6 border-t border-white/5">
          {[
            "No credit card for Free tier",
            "Cancel anytime",
            "Annual plans save up to 20%",
            "Upgrade or downgrade instantly",
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-xs text-white/30">
              <Check className="w-3 h-3 text-emerald-500/70" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── Footer (CTA + Editorial) ─────────────────────────────────── */}
      <PrismFooter onStart={onStart} />
    </div>
  );
}
