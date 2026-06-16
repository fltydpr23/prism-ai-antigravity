"use client";

import { motion } from "framer-motion";

interface PricingToggleProps {
  value: "monthly" | "annual";
  onChange: (v: "monthly" | "annual") => void;
}

export default function PricingToggle({ value, onChange }: PricingToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange("monthly")}
        className={`text-sm font-medium transition-colors ${value === "monthly" ? "text-white" : "text-white/35 hover:text-white/60"}`}
      >
        Monthly
      </button>

      {/* Pill toggle */}
      <button
        onClick={() => onChange(value === "monthly" ? "annual" : "monthly")}
        className="relative w-11 h-6 rounded-full transition-colors"
        style={{
          background: value === "annual"
            ? "linear-gradient(135deg, hsl(162,85%,48%), hsl(195,90%,58%))"
            : "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        aria-label="Toggle billing period"
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
          style={{ left: value === "annual" ? "calc(100% - 1.375rem)" : "0.125rem" }}
        />
      </button>

      <button
        onClick={() => onChange("annual")}
        className={`text-sm font-medium transition-colors flex items-center gap-2 ${value === "annual" ? "text-white" : "text-white/35 hover:text-white/60"}`}
      >
        Annual
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: "hsla(162,85%,48%,0.15)",
            color: "hsl(162,85%,48%)",
            border: "1px solid hsla(162,85%,48%,0.25)",
          }}
        >
          Save 20%
        </span>
      </button>
    </div>
  );
}
