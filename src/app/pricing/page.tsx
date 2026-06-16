"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, HelpCircle } from "lucide-react";
import Link from "next/link";
import PricingCard, { type PricingFeature } from "@/components/PricingCard";
import PricingToggle from "@/components/PricingToggle";



const FREE_FEATURES: PricingFeature[] = [
  { label: "Analyses per month", included: "3" },
  { label: "File size limit", included: "2MB" },
  { label: "All 6 industry modes", included: true },
  { label: "Watermarked PDF export", included: true },
  { label: "7-day history archive", included: true },
  { label: "Core intelligence suite", included: true },
  { label: "Clean PDF export", included: false },
  { label: "Multi-dataset comparison", included: false },
  { label: "Team seats", included: false },
  { label: "API access", included: false },
];

const STARTER_FEATURES: PricingFeature[] = [
  { label: "Analyses per month", included: "15" },
  { label: "File size limit", included: "10MB" },
  { label: "All 6 industry modes", included: true },
  { label: "Clean PDF export (no watermark)", included: true },
  { label: "90-day history archive", included: true },
  { label: "Full core intelligence suite", included: true },
  { label: "Email support (48hr)", included: true },
  { label: "Multi-dataset comparison", included: false },
  { label: "Team seats", included: false },
  { label: "API access", included: false },
];

const PRO_FEATURES: PricingFeature[] = [
  { label: "Analyses per month", included: "60" },
  { label: "File size limit", included: "50MB" },
  { label: "Team seats", included: "3 users" },
  { label: "White-label PDF export", included: true },
  { label: "Competitive Blind Spots", included: true },
  { label: "Emerging Customer Issues", included: true },
  { label: "Why Customers Stay", included: true },
  { label: "Shareable read-only report links", included: true },
  { label: "12-month history archive", included: true },
  { label: "Email support (24hr SLA) + Onboarding call", included: true },
];

const AGENCY_FEATURES: PricingFeature[] = [
  { label: "Analyses per month", included: "200" },
  { label: "File size limit", included: "200MB" },
  { label: "Team seats", included: "10 users" },
  { label: "API access", included: "1,000 calls/mo" },
  { label: "Everything in Pro", included: true },
  { label: "Churn Risk Detection", included: true },
  { label: "Unmet Customer Demand", included: true },
  { label: "Custom industry modes per client", included: true },
  { label: "Client workspace isolation", included: true },
  { label: "Priority Slack channel + 4hr SLA", included: true },
];

const FAQ = [
  {
    q: "Can I switch tiers anytime?",
    a: "Yes — upgrade or downgrade at any time. Changes take effect at the next billing cycle. Upgrades are prorated immediately.",
  },
  {
    q: "Do you support UPI and Indian debit cards?",
    a: "Yes. We use Razorpay for Indian payments, supporting UPI, all major Indian debit and credit cards, and net banking. GST invoices are generated automatically.",
  },
  {
    q: "What happens when I hit my monthly limit?",
    a: "You'll see a warning at 70% usage. At 100%, the analysis endpoint is paused until your plan resets on the 1st of the next month. You can upgrade instantly to continue.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is isolated per user with Row Level Security. Reports are stored encrypted. We never train on your data. Sentry captures errors with PII scrubbing.",
  },
  {
    q: "Can I export reports for my clients?",
    a: "On Pro+, you get white-label PDF exports with your own logo and brand colors — ready to send to clients as a professional deliverable.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
          <Link href="/" className="text-xs text-white/40 hover:text-white transition-colors">Home</Link>
          <Link href="/sign-in" className="glass-pill text-xs font-semibold px-4 py-2 text-white">Sign In</Link>
        </div>
      </nav>

      <div className="pt-32 pb-24 px-4 max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <div className="badge badge-emerald gap-1.5 inline-flex mb-5">
            <Sparkles className="w-3 h-3" /> Simple, transparent pricing
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter text-gradient pb-2 mb-4">
            Built for India.<br />Priced for India.
          </h1>
          <p className="text-base text-white/50 max-w-xl mx-auto leading-relaxed">
            An agency paying ₹3,499/month and billing ₹30,000 per Prism report
            has an infinite ROI. Start free, scale when you need to.
          </p>
          <div className="flex justify-center mt-8">
            <PricingToggle value={billing} onChange={setBilling} />
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          <PricingCard
            tier="Free"
            tagline="Get started, no card needed"
            monthlyPrice={null}
            annualPrice={null}
            billingPeriod={billing}
            ctaLabel="Start Free"
            ctaHref="/"
            ctaVariant="ghost"
            features={FREE_FEATURES}
            accentColor="162,85%,48%"
            index={0}
          />
          <PricingCard
            tier="Starter"
            tagline="Solo analysts and founders"
            monthlyPrice={999}
            annualPrice={799}
            billingPeriod={billing}
            ctaLabel="Start Trial"
            ctaHref="/sign-up"
            ctaVariant="ghost"
            features={STARTER_FEATURES}
            accentColor="195,90%,58%"
            index={1}
          />
          <PricingCard
            tier="Pro"
            tagline="For agencies and growth teams"
            monthlyPrice={2999}
            annualPrice={2399}
            billingPeriod={billing}
            isPopular
            ctaLabel="Start 14-Day Free Trial"
            ctaHref="/sign-up?plan=pro"
            ctaVariant="primary"
            features={PRO_FEATURES}
            accentColor="162,85%,48%"
            index={2}
          />
          <PricingCard
            tier="Agency"
            tagline="Research firms and large agencies"
            monthlyPrice={14999}
            annualPrice={11999}
            billingPeriod={billing}
            ctaLabel="Book a Demo"
            ctaHref="mailto:hello@prism.ai?subject=Agency Plan Enquiry"
            ctaVariant="ghost"
            features={AGENCY_FEATURES}
            accentColor="265,80%,65%"
            index={3}
          />
        </div>

        {/* Enterprise banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl p-8 mb-20 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{
            background: "rgba(16,16,22,0.85)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(32px)",
          }}
        >
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-white/35 mb-2">Enterprise</p>
            <h3 className="text-2xl font-semibold tracking-tighter text-white mb-1">
              Listed companies, banks, D2C conglomerates
            </h3>
            <p className="text-sm text-white/45 max-w-lg">
              Unlimited reports, SSO, custom LLM fine-tuning, India data residency,
              99.9% SLA, and a dedicated Customer Success manager. Starts at ₹30,000/mo.
            </p>
          </div>
          <a
            href="mailto:hello@prism.ai?subject=Enterprise Enquiry"
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white whitespace-nowrap transition-all glass-pill"
          >
            Talk to Sales <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Feature comparison table */}
        <div className="mb-20">
          <h2 className="text-2xl font-semibold tracking-tighter text-white mb-8 text-center">
            Full feature comparison
          </h2>
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  <th className="text-left py-4 px-5 text-white/40 font-medium text-xs tracking-wider uppercase w-1/3">Feature</th>
                  {["Free", "Starter", "Pro", "Agency"].map(t => (
                    <th key={t} className="py-4 px-4 text-center text-white/70 font-semibold text-xs tracking-wider uppercase">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Analyses / month", "3", "15", "60", "200"],
                  ["File size limit", "2MB", "10MB", "50MB", "200MB"],
                  ["Industry modes", "All 6", "All 6", "All 6", "Custom"],
                  ["PDF export", "Watermarked", "Clean", "White-label", "White-label"],
                  ["History archive", "7 days", "90 days", "12 months", "Unlimited"],
                  ["Team seats", "—", "1", "3", "10"],
                  ["Competitive Blind Spots", "—", "—", "✓", "✓"],
                  ["Emerging Customer Issues", "—", "—", "✓", "✓"],
                  ["Churn Risk Detection", "—", "—", "—", "✓"],
                  ["Unmet Customer Demand", "—", "—", "—", "✓"],
                  ["Shareable report links", "—", "—", "✓", "✓"],
                  ["API access", "—", "—", "—", "1,000 calls/mo"],
                  ["Support", "Community", "Email 48hr", "Email 24hr + Call", "Slack + 4hr SLA"],
                ].map(([feature, ...values], i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    }}
                  >
                    <td className="py-3.5 px-5 text-white/60">{feature}</td>
                    {values.map((v, j) => (
                      <td key={j} className="py-3.5 px-4 text-center text-white/80 font-medium">
                        {v === "✓" ? (
                          <span className="text-emerald-400 text-base">✓</span>
                        ) : v === "—" ? (
                          <span className="text-white/20">—</span>
                        ) : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tighter text-white mb-8 text-center flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-white/30" /> Frequently asked questions
          </h2>
          <div className="flex flex-col gap-3">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(16,16,22,0.8)" }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  {item.q}
                  <span className="text-white/30 shrink-0 text-lg leading-none transition-transform"
                    style={{ transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 0.2s" }}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="px-5 pb-4 text-sm text-white/45 leading-relaxed"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="pt-3">{item.a}</div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
