"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { X, Check } from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────

const rows = [
  {
    dimension: "Data Scale",
    generic: "Summarises the first ~50 rows. Silently drops the rest.",
    prism: "Processes every row. Surfaces weak signals buried in row 8,000.",
  },
  {
    dimension: "Language Fidelity",
    generic:
      "Hallucination on Hinglish, Tanglish, and code-mixed dialects. Critical cultural signals are lost.",
    prism:
      "Native understanding of 14 languages & dialects — including Hinglish and Tanglish — via specialised extraction models.",
  },
  {
    dimension: "Output Format",
    generic:
      "A wall of chat text. You copy-paste into a deck. You lose context. You start over.",
    prism:
      "Structured JSON intelligence: Prism Score, churn signals, competitor blind spots — ready for your board or your API.",
  },
  {
    dimension: "Consistency",
    generic:
      "Re-running the same prompt gives different answers. Every. Single. Time.",
    prism:
      "Deterministic extraction pipeline. Same data, same methodology, reproducible results.",
  },
  {
    dimension: "Workflow Automation",
    generic: "Manual. Every analysis is a fresh chat session from scratch.",
    prism:
      "Scheduled automated analysis via API or Dashboard. Agencies get weekly client reports without manual re-uploads.",
  },
  {
    dimension: "Behavioural Correlation",
    generic:
      "No concept of what users actually do — only what they say in the text you pasted.",
    prism:
      "Say vs. Do Gaps engine correlates uploaded feedback with Segment/Mixpanel telemetry to expose the truth behind the words.",
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function PrismVsGenericAI() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section
      ref={ref}
      className="relative py-28 bg-[#05050A] border-t border-white/[0.04] overflow-hidden"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="w-[600px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mb-5"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-bold uppercase tracking-widest text-white/40">
            WHY PRISM?
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="text-center text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-[1.1]"
        >
          Not another AI chatbot.
        </motion.h2>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center text-base text-white/40 max-w-xl mx-auto mb-16 leading-relaxed"
        >
          You already know how to paste a CSV into ChatGPT. Here's what happens after you hit enter.
        </motion.p>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-white/[0.07] overflow-hidden bg-white/[0.02] backdrop-blur-sm"
        >
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-white/[0.07]">
            <div className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-white/30">
              Capability
            </div>
            <div className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-white/30 border-l border-white/[0.07]">
              ChatGPT / Claude with CSV
            </div>
            <div className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-emerald-400 border-l border-emerald-500/20 bg-emerald-500/[0.03]">
              Prism Intelligence
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.dimension}
              className={`grid grid-cols-[1fr_1fr_1fr] ${i < rows.length - 1 ? "border-b border-white/[0.05]" : ""
                } group hover:bg-white/[0.015] transition-colors duration-200`}
            >
              {/* Dimension */}
              <div className="px-6 py-5 flex items-start">
                <span className="text-sm font-semibold text-white/70 leading-snug">
                  {row.dimension}
                </span>
              </div>

              {/* Generic AI */}
              <div className="px-6 py-5 flex items-start gap-3 border-l border-white/[0.05]">
                <X className="w-4 h-4 text-red-400/60 mt-0.5 shrink-0" />
                <span className="text-sm text-white/35 leading-relaxed">
                  {row.generic}
                </span>
              </div>

              {/* Prism */}
              <div className="px-6 py-5 flex items-start gap-3 border-l border-emerald-500/10 bg-emerald-500/[0.02] group-hover:bg-emerald-500/[0.04] transition-colors duration-200">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-sm text-white/75 leading-relaxed">
                  {row.prism}
                </span>
              </div>
            </div>
          ))}
        </motion.div>


      </div>
    </section>
  );
}
