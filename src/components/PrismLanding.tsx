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
const PrismPrivacySection = dynamic(() => import("./PrismPrivacySection"));

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
  { label: "3 analyses / month", included: true },
  { label: "All 6 industry modes", included: true },
  { label: "Standard PDF export", included: true },
  { label: "Prism watermark included", included: true },
  { label: "7-day report retention", included: true },
  { label: "Accelerated Sample analysis", included: "20 rows / segment" },
  { label: "Comprehensive analysis", included: false },
  { label: "Unlimited ingestion", included: false },
  { label: "White-label reports", included: false },
  { label: "Team collaboration", included: false },
];

const PRICING_ANALYST = [
  { label: "Unlimited analyses", included: true },
  { label: "5,000 row cap / analysis", included: true },
  { label: "No Prism watermark", included: true },
  { label: "Clean PDF export", included: true },
  { label: "90-day report archive", included: true },
  { label: "Shareable read-only links", included: true },
  { label: "Comprehensive background analysis", included: "10 / month" },
  { label: "Email report delivery", included: true },
  { label: "White-label reports", included: false },
  { label: "Team collaboration", included: false },
];

const PRICING_AGENCY = [
  { label: "Unlimited analyses", included: true },
  { label: "Unlimited ingestion", included: true },
  { label: "White-Label generation", included: true },
  { label: "Up to 3 team seats included", included: true },
  { label: "Client portal sharing", included: true },
  { label: "Comprehensive background analysis", included: "Unlimited" },
  { label: "Email report delivery", included: true },
  { label: "1-year report archive", included: true },
  { label: "API access", included: false },
  { label: "Custom LLM instructions", included: false },
];

const PRICING_ENTERPRISE = [
  { label: "Unlimited team seats", included: true },
  { label: "API access (custom volume)", included: true },
  { label: "Custom LLM instructions", included: true },
  { label: "Proprietary frameworks", included: true },
  { label: "Unlimited archive", included: true },
  { label: "Comprehensive background analysis", included: "Unlimited" },
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

      {/* ── India Language Coverage Map ─────────────────────────────────── */}
      <PrismLanguageMap />

      {/* ── Feature: Intelligence Reports ────────────────────────────── */}
      <PrismReportPreview />

      {/* ── Prism Score & Signals Bento ─────────────────────────────────── */}
      <PrismScoreBento />

      {/* ── Agency Advantage ────────────────────────────── */}
      <PrismAgencyAdvantage />

      {/* ── Enterprise Privacy Section ────────────────────────────────────── */}
      <PrismPrivacySection />



      {/* ── Footer (CTA + Editorial) ─────────────────────────────────── */}
      <PrismFooter onStart={onStart} />
    </div>
  );
}
