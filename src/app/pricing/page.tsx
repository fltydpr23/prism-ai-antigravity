"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, HelpCircle, Database } from "lucide-react";
import Link from "next/link";
import PricingCard, { type PricingFeature } from "@/components/PricingCard";
import PricingToggle from "@/components/PricingToggle";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Script from "next/script";
import toast from "react-hot-toast";



const FREE_FEATURES: PricingFeature[] = [
  { label: "3 analyses / month", included: true },
  { label: "Accelerated Sample Analysis", included: "20 rows/segment" },
  { label: "Comprehensive Background Analysis", included: "locked" },
  { label: "Standard insights & PDF export", included: true },
  { label: "7-day report retention", included: true },
  { label: "Emerging Customer Issues", included: true },
  { label: "Why Customers Stay", included: true },
  { label: "Competitive Blind Spots", included: "locked" },
  { label: "Churn Risk Detection", included: "locked" },
  { label: "Unmet Customer Demand", included: "locked" },
];

const STARTER_FEATURES: PricingFeature[] = [
  { label: "Unlimited analyses", included: "5,000 rows/ea" },
  { label: "Comprehensive Background Analysis", included: "10 / month" },
  { label: "Clean, watermark-free PDFs", included: true },
  { label: "Shareable read-only links", included: true },
  { label: "90-day report archive", included: true },
  { label: "Competitive Blind Spots", included: true },
  { label: "Churn Risk Detection", included: true },
  { label: "White-label client reporting", included: "locked" },
  { label: "Market Opportunity Detection", included: "locked" },
];

const PRO_FEATURES: PricingFeature[] = [
  { label: "Unlimited data ingestion", included: true },
  { label: "Comprehensive Background Analysis", included: "Unlimited" },
  { label: "3 Team Seats included", included: true },
  { label: "White-label generation", included: true },
  { label: "Client portal sharing", included: true },
  { label: "1-year report archive", included: true },
  { label: "Market Opportunity Detection", included: true },
  { label: "Unmet Customer Demand", included: true },
];

const AGENCY_FEATURES: PricingFeature[] = [
  { label: "Unlimited team seats", included: true },
  { label: "API access", included: true },
  { label: "Custom LLM instructions", included: true },
  { label: "Proprietary frameworks", included: true },
  { label: "Unlimited archive", included: true },
  { label: "Dedicated account manager", included: true },
  { label: "Priority support + SLA", included: true },
];

const FAQ = [
  {
    q: "What is 'Accelerated Sample' analysis?",
    a: "For speed, the free Explorer plan randomly samples up to 20 rows per data segment and analyzes that subset. This surfaces macro-level trends in seconds. Analyst and above gets Comprehensive Analysis — processing your entire dataset in the background and emailing you a complete boardroom-ready report.",
  },
  {
    q: "What is Comprehensive Analysis?",
    a: "Comprehensive Analysis processes 100% of your dataset with no row limits, running in the background so you can close the tab and get on with your day. Once complete, Prism emails you a full intelligence report with a direct link. This is available on the Analyst plan (₹999/mo) and above.",
  },
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
    a: "On Agency Partner+, you get white-label PDF exports with your own logo and brand colors — ready to send to clients as a professional deliverable.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleCheckout = async (planId: string) => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, isAnnual: billing === 'annual' })
      });
      const order = await res.json();
      if (order.error) throw new Error(order.details || order.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy", 
        amount: order.amount,
        currency: order.currency,
        name: "Prism Intelligence",
        description: `Upgrade: ${planId}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const res = await fetch('/api/billing/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                tier: planId,
                billingPeriod: billing === 'annual' ? 'annual' : 'monthly',
              }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            toast.success("Payment successful! Your account is now updated.");
            router.push("/dashboard");
          } catch (err: any) {
            console.error(err);
            toast.error(`Payment verification failed: ${err.message}`);
          }
        },
        theme: {
          color: "#10b981"
        }
      };
      
      // Load script dynamically if missing
      // @ts-ignore
      if (typeof window !== "undefined" && !window.Razorpay) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to initiate checkout: ${err.message || String(err)}`);
    }
  };

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
            Clarity at any scale.
          </h1>
          <p className="text-base text-white/50 max-w-xl mx-auto leading-relaxed">
            Understand every nuance in your data instantly. Designed to bring human-like intuition to the world's most complex datasets.
          </p>
          <div className="flex justify-center mt-8">
            <PricingToggle value={billing} onChange={setBilling} />
          </div>
        </motion.div>

        {/* Social Proof Strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-16 mb-16"
        >
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold tracking-tighter text-white/90">47,000+</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1 font-semibold">Signals Processed</div>
          </div>
          <div className="w-px h-8 bg-white/10 hidden md:block" />
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold tracking-tighter text-white/90">12+</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1 font-semibold">Sectors Analyzed</div>
          </div>
          <div className="w-px h-8 bg-white/10 hidden md:block" />
          <div className="flex flex-col items-center max-w-[280px] text-center">
            <div className="text-sm font-medium italic text-white/80">"Surfaces insights that take 2 days to compile manually."</div>
            <div className="text-[10px] tracking-widest mt-1.5 uppercase text-white/40 font-semibold">— Strategy Lead, ZoomRx</div>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          <PricingCard
            tier="Enterprise"
            tagline="Uncompromising scale and precision for global organizations."
            monthlyPrice={0}
            annualPrice={0}
            billingPeriod={billing}
            ctaLabel="Get in Touch"
            ctaHref="mailto:hello@prismintel.co?subject=Enterprise Enquiry"
            ctaVariant="ghost"
            features={AGENCY_FEATURES}
            accentColor="265,80%,65%"
            index={0}
          />
          <PricingCard
            tier="Agency Partner"
            tagline="For strategy consultancies. (3 seats inc. — ₹1,667/analyst/mo)"
            monthlyPrice={4999}
            annualPrice={3999}
            billingPeriod={billing}
            ctaLabel="Start 14-Day Free Trial"
            ctaHref="#"
            ctaOnClick={() => handleCheckout("agency")}
            ctaVariant="ghost"
            features={PRO_FEATURES}
            accentColor="162,85%,48%"
            index={1}
          />
          <PricingCard
            tier="Analyst"
            tagline="For CX leads and solo researchers running weekly reports."
            monthlyPrice={999}
            annualPrice={799}
            billingPeriod={billing}
            isPopular
            ctaLabel="Start 7-Day Trial"
            ctaHref="#"
            ctaOnClick={() => handleCheckout("analyst")}
            ctaVariant="primary"
            features={STARTER_FEATURES}
            accentColor="195,90%,58%"
            index={2}
          />
          <PricingCard
            tier="Explorer"
            tagline="For PMs and founders validating an idea or dataset."
            monthlyPrice={null}
            annualPrice={null}
            billingPeriod={billing}
            ctaLabel="Start Free"
            ctaHref="/"
            ctaVariant="ghost"
            features={FREE_FEATURES}
            accentColor="162,85%,48%"
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
              99.9% SLA, and a dedicated Customer Success manager.
            </p>
          </div>
          <a
            href="mailto:hello@prismintel.co?subject=Enterprise Enquiry"
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white whitespace-nowrap transition-all glass-pill"
          >
            Talk to Sales <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Add-ons Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-20">
          {/* 1 Credit Add-on Banner */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-6 flex flex-col justify-between gap-6"
            style={{
              background: "#0A0A0A",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-white mb-1">
                  One-off Analysis Credit
                </h3>
                <p className="text-sm text-white/50">
                  Explorer users can run a one-off analysis instantly for ₹249. No subscription required.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCheckout("credit")}
              className="self-start flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white whitespace-nowrap transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Buy 1 Credit
            </button>
          </motion.div>

          {/* Row Overage Banner */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-6 flex flex-col justify-between gap-6"
            style={{
              background: "#0A0A0A",
              border: "1px solid rgba(195, 144, 88, 0.2)",
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/10 shrink-0">
                <Database className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-white mb-1">
                  Data Row Top-up
                </h3>
                <p className="text-sm text-white/50">
                  Analyzing a massive dataset that exceeds your 5,000-row cap? Top up for ₹99 per 5,000 extra rows.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCheckout("rows")}
              className="self-start flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white whitespace-nowrap transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Add 5,000 Rows
            </button>
          </motion.div>
        </div>

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
                  {["Explorer", "Analyst", "Agency", "Enterprise"].map(t => (
                    <th key={t} className="py-4 px-4 text-center text-white/70 font-semibold text-xs tracking-wider uppercase">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Analyses / month", "3", "Unlimited", "Unlimited", "Custom"],
                  ["Comprehensive Analysis", "—", "10 / mo", "Unlimited", "Unlimited"],
                  ["File size limit", "2MB", "10MB", "50MB", "200MB"],
                  ["Industry modes", "All 6", "All 6", "All 6", "Custom"],
                  ["PDF export", "Watermarked", "Clean", "White-label", "White-label"],
                  ["History archive", "7 days", "90 days", "12 months", "Unlimited"],
                  ["Team seats", "—", "1", "3", "Unlimited"],
                  ["Competitive Blind Spots", "—", "—", "✓", "✓"],
                  ["Emerging Customer Issues", "—", "—", "✓", "✓"],
                  ["Churn Risk Detection", "—", "—", "—", "✓"],
                  ["Unmet Customer Demand", "—", "—", "—", "✓"],
                  ["Shareable report links", "—", "✓", "✓", "✓"],
                  ["API access", "—", "—", "—", "Custom volume"],
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
