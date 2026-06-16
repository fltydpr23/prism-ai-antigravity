"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowRight, Brain, Zap, Users,
  FileText, MessageSquare, Mic, Globe, BarChart3, Shield,
  Upload, FlaskConical, TrendingUp, Check, Target, Layers
} from "lucide-react";
import Link from "next/link";
import MagneticButton from "./MagneticButton";
import PricingCard from "./PricingCard";
import PricingToggle from "./PricingToggle";
import { SignInButton, useAuth } from "@clerk/nextjs";

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

const SOCIAL_PROOF = [
  { quote: "We closed a ₹15L retainer based on a Prism report we generated in 4 hours.", author: "Priya S.", role: "Strategy Lead, D2C Agency" },
  { quote: "Replaced 3 weeks of manual analysis. Our clients think we hired a 10-person research team.", author: "Karan M.", role: "Founder, Growth Studio" },
  { quote: "The Churn Risk Detection caught a brand crisis 2 weeks before it went viral. Saved the client.", author: "Ananya R.", role: "CMO, HealthTech Startup" },
];

// Strategy 1: Taste Test - 5 full analyses, but intelligence is blurred past surface level
// Strategy 2: Archive as Currency - 7-day retention, forces upgrade for QBRs
// Strategy 4: Export as Luxury - "Web Report" only, no downloads
const PRICING_FREE = [
  { label: "5 full analyses / month", included: true },
  { label: "All 6 industry modes", included: true },
  { label: "Surface-level signals only", included: true },
  { label: "Web Report (browser only)", included: true },
  { label: "7-day report retention", included: true },
  { label: "Churn Risk Detection", included: "locked" },
  { label: "Competitor Blind Spots", included: "locked" },
  { label: "Strategic Recommendations", included: "locked" },
  { label: "PDF / Deck export", included: "locked" },
  { label: "Team sharing", included: "locked" },
];

// Strategy 2: 90-day archive unlocked
// Strategy 3: Shareable read-only links (no collaboration)
// Strategy 4: Clean PDF export unlocked
const PRICING_STARTER = [
  { label: "15 analyses / month", included: true },
  { label: "All 6 industry modes", included: true },
  { label: "Full intelligence suite", included: true },
  { label: "Clean PDF export", included: true },
  { label: "90-day report archive", included: true },
  { label: "Shareable read-only links", included: true },
  { label: "Churn Risk Detection", included: "locked" },
  { label: "Team collaboration", included: "locked" },
  { label: "White-Label Deck export", included: "locked" },
];

// Strategy 2: 1-year archive unlocked
// Strategy 3: 3 seats + full collaboration (comment, clone, edit)
// Strategy 4: White-Label Deck export
const PRICING_PRO = [
  { label: "60 analyses / month", included: true },
  { label: "3 team seats + collaboration", included: true },
  { label: "White-Label Deck export", included: true },
  { label: "Churn Risk Detection", included: true },
  { label: "Competitor Blind Spots", included: true },
  { label: "Emerging Customer Issues", included: true },
  { label: "1-year report archive", included: true },
  { label: "Shareable + collaborative links", included: true },
  { label: "API access", included: "locked" },
];

// Strategy 4: API + Custom Report Builder
const PRICING_AGENCY = [
  { label: "Unlimited analyses", included: true },
  { label: "Unlimited team seats", included: true },
  { label: "API access (custom volume)", included: true },
  { label: "Custom Report Builder", included: true },
  { label: "Custom industry modes", included: true },
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

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-2xl bg-black/30">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 opacity-90" />
          <span className="text-sm font-semibold tracking-wide text-white/90">Prism</span>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <Link href="#features" className="text-xs text-white/40 hover:text-white/70 transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-xs text-white/40 hover:text-white/70 transition-colors">How it works</Link>
          <Link href="/pricing" className="text-xs text-white/40 hover:text-white/70 transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-2">
          {isLoaded && !userId && (
            <SignInButton mode="modal">
              <button className="text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5">
                Sign In
              </button>
            </SignInButton>
          )}
          <MagneticButton
            onClick={onStart}
            intensity={0.15}
            className="glass-pill px-4 py-2 text-xs font-semibold tracking-tight text-white gap-1.5"
          >
            Start Free <ArrowRight className="w-3 h-3" />
          </MagneticButton>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex flex-col lg:flex-row items-center justify-between min-h-screen pt-24 pb-12 px-6 max-w-7xl mx-auto w-full gap-12">
        {/* Left Column: Copy & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start gap-8 w-full lg:w-1/2 z-10"
        >
          <div className="badge border border-white/10 bg-white/5 text-white/70 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-cyan-400" /> AI Consumer Intelligence
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tighter leading-[1.05] text-white">
            Turn Customer Feedback Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Strategic Intelligence.</span>
          </h1>

          <p className="text-lg sm:text-xl font-normal text-white/50 max-w-lg leading-relaxed">
            Upload reviews, surveys, support conversations and customer research. Prism transforms thousands of voices into executive-ready intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
            <MagneticButton
              onClick={onStart}
              intensity={0.2}
              className="bg-white text-black hover:bg-white/90 transition-colors px-6 py-3 rounded-md text-sm font-semibold tracking-tight flex items-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            >
              Start Free Analysis <ArrowRight className="w-4 h-4" />
            </MagneticButton>
            <button className="text-white/60 hover:text-white transition-colors text-sm font-medium px-4 py-3 flex items-center gap-2 border border-white/5 hover:border-white/10 rounded-md bg-white/5">
              View Sample Report
            </button>
          </div>
        </motion.div>

        {/* Right Column: Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-1/2 relative z-10"
        >
          <div className="relative w-full aspect-[4/3] rounded-2xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Mockup Header */}
            <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              <div className="ml-4 h-5 w-48 bg-white/5 rounded text-[10px] text-white/30 flex items-center px-2 font-mono">
                prismintel.co/app/dashboard
              </div>
            </div>

            {/* Mockup Body */}
            <div className="p-8 flex-1 flex flex-col gap-6 relative">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-1">Prism Score</h3>
                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-light tracking-tighter text-white">87</span>
                    <span className="text-emerald-400 text-sm font-medium flex items-center gap-1 mb-2">
                      <TrendingUp className="w-4 h-4" /> +6 this month
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-[3px] border-emerald-400/30 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-emerald-400/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border border-white/5 bg-white/[0.02] rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-semibold">3 Opportunities</span>
                  </div>
                  <div className="text-[10px] text-white/50 leading-relaxed">
                    Premium subscription demand detected in Tier-1 demographics.
                  </div>
                </div>
                <div className="border border-white/5 bg-white/[0.02] rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-rose-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-semibold">2 Churn Risks</span>
                  </div>
                  <div className="text-[10px] text-white/50 leading-relaxed">
                    Support response delays causing frustration in D2C segment.
                  </div>
                </div>
              </div>

              {/* Decorative gradients */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
            </div>
          </div>
        </motion.div>
      </section>

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

      {/* ── Universal Inputs & Multilingual ────────────────────────────── */}
      <section className="py-24 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tighter text-white mb-4">
              Upload anything.<br />
              <span className="text-white/40">In any Indian language.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Input formats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: MessageSquare, label: "WhatsApp Chats" },
                { icon: FileText, label: "App Store Reviews" },
                { icon: FileText, label: "CSV Exports" },
                { icon: Mic, label: "Call Transcripts" },
                { icon: FlaskConical, label: "Survey Data" },
                { icon: FileText, label: "PDF Reports" }
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-6 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors gap-3">
                  <s.icon className="w-6 h-6 text-white/40" />
                  <span className="text-xs font-medium text-white/50">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Right: Multilingual showcase */}
            <div className="flex flex-col gap-4 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-xl pointer-events-none" />
              {MULTILINGUAL_QUOTES.map((q, j) => (
                <div key={j} className="relative rounded-2xl bg-[#111111] border border-white/10 p-5 shadow-2xl flex flex-col gap-3">
                  <p className="text-sm font-medium text-white/90 italic">"{q.raw}"</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[11px] text-white/40 uppercase tracking-widest">{q.lang}</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-white/5 text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">
                      {q.signal}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature: Prism Score & Signals ────────────────────────────── */}
      <section id="features" className="py-32 border-b border-white/5 relative bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-32">
          
          {/* Prism Score Cinematic */}
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="w-full lg:w-1/2 order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] pointer-events-none" />
              <div className="relative rounded-3xl border border-white/10 bg-black p-10 flex flex-col items-center text-center gap-6 shadow-2xl">
                <h3 className="text-xs uppercase tracking-widest font-semibold text-white/40">Prism Score™</h3>
                <div className="text-[120px] font-light leading-none tracking-tighter text-white">87</div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                  <TrendingUp className="w-4 h-4" /> Category: Strong & Improving
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/2 order-1 lg:order-2 flex flex-col items-start gap-6">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tighter text-white">
                The ultimate metric for<br />
                <span className="text-white/40">customer truth.</span>
              </h2>
              <p className="text-lg text-white/50 leading-relaxed max-w-md">
                A proprietary intelligence score that measures customer health, satisfaction, and risk. Stop guessing if product changes are working—watch the Prism Score react in real-time.
              </p>
            </div>
          </div>

          {/* Prism Signals Grid */}
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="w-full lg:w-1/2 flex flex-col items-start gap-6">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tighter text-white">
                Prism Signals™<br />
                <span className="text-white/40">detect the invisible.</span>
              </h2>
              <p className="text-lg text-white/50 leading-relaxed max-w-md">
                Our AI continuously scans your feedback to extract high-leverage business signals. It connects the dots before a trend becomes a crisis.
              </p>
            </div>
            <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-white/80">Churn Risk</span>
                </div>
                <p className="text-sm text-white/50">Delivery delays rising in South India across Tier-2 demographics.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 flex flex-col gap-4 mt-0 sm:mt-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-white/80">Opportunity</span>
                </div>
                <p className="text-sm text-white/50">Price sensitivity increasing among family buyers. Consider a bundle tier.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-white/80">Friction Point</span>
                </div>
                <p className="text-sm text-white/50">Communication gaps impacting trust post-purchase.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 flex flex-col gap-4 mt-0 sm:mt-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-white/80">Emerging Trend</span>
                </div>
                <p className="text-sm text-white/50">Subscription demand detected in health/wellness segment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature: Intelligence Reports ────────────────────────────── */}
      <section className="py-32 border-b border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center flex flex-col items-center">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tighter text-white mb-6">
            Executive reports,<br />
            <span className="text-white/40">ready for the boardroom.</span>
          </h2>
          <p className="text-lg text-white/50 leading-relaxed max-w-2xl mb-16">
            Prism automatically synthesizes thousands of data points into a structured, highly polished strategic document. No manual formatting required.
          </p>

          {/* Report Mockup */}
          <div className="w-full max-w-4xl relative">
            <div className="absolute -inset-4 bg-white/5 blur-2xl pointer-events-none" />
            <div className="relative rounded-2xl border border-white/10 bg-black overflow-hidden shadow-2xl text-left">
              <div className="h-10 border-b border-white/5 bg-[#111111] flex items-center px-4 gap-2">
                <FileText className="w-4 h-4 text-white/40" />
                <span className="text-xs font-medium text-white/50">Q3 Consumer Intelligence Report.pdf</span>
              </div>
              <div className="p-8 md:p-12 bg-white flex flex-col gap-8">
                <h1 className="text-3xl font-bold text-black tracking-tight">Executive Summary</h1>
                <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-black pl-4">
                  Overall customer sentiment remains robust (Prism Score: 87), driven by core product reliability. However, we have detected a 14% rise in friction related to delayed onboarding sequences in the enterprise segment.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-bold text-black mb-3 uppercase tracking-wider">Key Opportunities</h3>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                      <li>Introduce tiered onboarding for enterprise.</li>
                      <li>Highlight 'Time-to-Value' in Q4 marketing.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black mb-3 uppercase tracking-wider">Churn Risks</h3>
                    <ul className="text-sm text-red-600 space-y-2 list-disc list-inside">
                      <li>Support ticket resolution time &gt; 48h.</li>
                      <li>Pricing confusion on the middle tier.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof & Use Cases ────────────────────────────── */}
      <section className="py-32 border-b border-white/5 bg-[#050505] relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          
          {/* Left: Use Cases */}
          <div className="flex flex-col gap-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tighter text-white mb-4">
                Who uses Prism?
              </h2>
              <p className="text-lg text-white/50 leading-relaxed max-w-md">
                Prism is built for the teams that define the product and revenue trajectory of a brand.
              </p>
            </div>
            <div className="flex flex-col gap-6">
              {[
                { title: "Growth Agencies", desc: "Turn raw client data into actionable retainers instantly.", icon: Target },
                { title: "Product Managers", desc: "Validate feature requests and detect friction points before they impact metrics.", icon: Layers },
                { title: "Founders & CXOs", desc: "Get an unbiased pulse on customer sentiment without reading thousands of tickets.", icon: Brain },
              ].map((uc, i) => (
                <div key={i} className="flex items-start gap-4 p-6 rounded-2xl bg-[#111111] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <uc.icon className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-white/90">{uc.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{uc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Testimonials */}
          <div className="flex flex-col gap-8">
                {SOCIAL_PROOF.map((proof, i) => (
              <div key={i} className="flex flex-col gap-6 p-8 rounded-2xl bg-gradient-to-b from-[#111111] to-[#0A0A0A] border border-white/5 shadow-xl relative">
                <div className="absolute top-6 right-6 text-6xl text-white/[0.03] font-serif leading-none">"</div>
                <p className="text-lg text-white/80 leading-relaxed font-medium">"{proof.quote}"</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-white/50">{proof.author.charAt(0)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white/90">{proof.author}</span>
                    <span className="text-xs text-white/40">{proof.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

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
            tier="Free" tagline="5 full analyses to experience the platform."
            monthlyPrice={null} annualPrice={null} billingPeriod={billing}
            ctaLabel="Start Free — No Card" ctaHref="#" ctaVariant="ghost"
            features={PRICING_FREE} accentColor="162,85%,48%" index={0}
          />
          <PricingCard
            tier="Starter" tagline="For solo analysts &amp; indie founders."
            monthlyPrice={999} annualPrice={799} billingPeriod={billing}
            ctaLabel="Start 7-Day Trial" ctaHref="/sign-up" ctaVariant="ghost"
            features={PRICING_STARTER} accentColor="195,90%,58%" index={1}
          />
          <PricingCard
            tier="Pro" tagline="For agencies &amp; growth teams."
            monthlyPrice={2999} annualPrice={2399} billingPeriod={billing}
            isPopular ctaLabel="Start 14-Day Free Trial" ctaHref="/sign-up?plan=pro" ctaVariant="primary"
            features={PRICING_PRO} accentColor="162,85%,48%" index={2}
          />
          <PricingCard
            tier="Enterprise" tagline="Tailored for research firms &amp; large agencies."
            monthlyPrice={0} annualPrice={0} billingPeriod={billing}
            ctaLabel="Get in Touch" ctaHref="mailto:hello@prism.ai?subject=Enterprise Plan" ctaVariant="ghost"
            features={PRICING_AGENCY} accentColor="265,80%,65%" index={3}
          />
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

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="px-6 py-32 text-center border-t border-white/5 bg-[#050505] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-8 max-w-3xl mx-auto relative z-10"
        >
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tighter text-white leading-[1.1]">
            Ready to hear what your customers are <span className="text-white/40">actually saying?</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
            <MagneticButton
              onClick={onStart}
              intensity={0.2}
              className="px-8 py-4 text-sm font-semibold tracking-tight text-black bg-white rounded-full flex items-center gap-2 hover:bg-white/90 transition-colors"
            >
              Begin Free Analysis <ArrowRight className="w-4 h-4" />
            </MagneticButton>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-white/40 mt-4 sm:mt-0 px-4">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> No card required</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> 3 free reports</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Enterprise Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-black py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="col-span-1 md:col-span-1 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400" />
              <span className="text-sm font-bold text-white tracking-widest uppercase">Prism</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed max-w-[200px]">
              The category-defining Consumer Intelligence platform. Built for modern brands.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Product</span>
            <Link href="#features" className="text-xs text-white/40 hover:text-white transition-colors">Prism Score™</Link>
            <Link href="#features" className="text-xs text-white/40 hover:text-white transition-colors">Prism Signals™</Link>
            <Link href="#features" className="text-xs text-white/40 hover:text-white transition-colors">Intelligence Reports</Link>
            <Link href="/pricing" className="text-xs text-white/40 hover:text-white transition-colors">Pricing</Link>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Resources</span>
            <Link href="/history" className="text-xs text-white/40 hover:text-white transition-colors">Report Archive</Link>
            <Link href="#" className="text-xs text-white/40 hover:text-white transition-colors">Case Studies</Link>
            <Link href="#" className="text-xs text-white/40 hover:text-white transition-colors">API Documentation</Link>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Company</span>
            <Link href="#" className="text-xs text-white/40 hover:text-white transition-colors">About Lune Labs</Link>
            <a href="mailto:hello@prism.ai" className="text-xs text-white/40 hover:text-white transition-colors">Contact Sales</a>
            <Link href="#" className="text-xs text-white/40 hover:text-white transition-colors">Privacy Policy</Link>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-white/30">© 2025 Lune Labs Inc. All rights reserved.</span>
          <div className="flex items-center gap-1 text-xs text-white/30">
            <Globe className="w-3 h-3" /> Operating in India
          </div>
        </div>
      </footer>
    </div>
  );
}
