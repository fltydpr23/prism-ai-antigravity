"use client";
import { SignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";

const clerkAppearance = {
  layout: {
    logoPlacement: "none" as const,
    showOptionalFields: false,
  },
  variables: {
    colorPrimary: "#10b981", // Emerald 500
    colorBackground: "transparent",
    colorInputBackground: "#0f0f0f",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "#a1a1aa",
    colorNeutral: "#3f3f46",
    borderRadius: "12px",
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    card: "!bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/[0.08] shadow-[0_0_80px_rgba(52,211,153,0.12),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-[24px] p-8 w-full",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    header: "hidden",
    socialButtonsBlockButton:
      "!bg-white/[0.08] !border-white/[0.2] hover:!bg-white/[0.12] hover:!border-white/[0.3] transition-all duration-200 rounded-xl h-12 text-sm font-medium",
    socialButtonsBlockButtonText: "!text-white/90 font-medium text-sm",
    socialButtonsBlockButtonArrow: "!text-white/40",
    dividerLine: "!bg-white/10",
    dividerText: "!text-zinc-500 text-xs tracking-widest uppercase",
    formFieldLabel: "!text-zinc-400 text-xs tracking-widest uppercase font-medium mb-1.5",
    formFieldInput:
      "!bg-[#0f0f0f] !border-white/10 !text-white placeholder:!text-zinc-600 rounded-xl h-12 px-4 text-sm focus:!border-emerald-500/50 focus:!ring-1 focus:!ring-emerald-500/50 focus:outline-none transition-all duration-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]",
    formButtonPrimary:
      "!bg-emerald-500 !text-emerald-950 font-semibold text-sm rounded-xl h-12 hover:!bg-emerald-400 active:!bg-emerald-600 transition-all duration-150 tracking-tight shadow-[0_0_20px_rgba(52,211,153,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] mt-2",
    footerActionText: "!text-zinc-500 text-sm",
    footerActionLink: "!text-emerald-400 hover:!text-emerald-300 text-sm font-medium transition-colors",
    identityPreviewText: "!text-white/70",
    identityPreviewEditButtonIcon: "!text-zinc-500",
    formFieldAction: "!text-zinc-500 hover:!text-zinc-300 text-xs transition-colors",
    alternativeMethodsBlockButton:
      "!bg-[#0f0f0f] !border-white/10 !text-white/70 hover:!bg-[#1a1a1a] rounded-[10px] text-sm transition-all",
    otpCodeFieldInput:
      "!bg-[#0f0f0f] !border-emerald-500/30 !text-emerald-400 rounded-xl text-xl font-mono focus:!border-emerald-500 focus:!ring-1 focus:!ring-emerald-500",
    badge: "hidden",
    logoBox: "hidden",
    logoImage: "hidden",
  },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.08) 0%, rgba(34, 211, 238, 0.03) 40%, transparent 80%)",
        }}
      />
      {/* Fine grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Wordmark */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-8 left-10"
      >
        <span className="text-[13px] font-semibold tracking-[0.2em] uppercase text-white/40 select-none">
          PRISM
        </span>
      </motion.div>

      {/* Main container */}
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center px-4">
        {/* Headline block */}
        <motion.div
          className="mb-8 flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-emerald-400/80 mb-4 text-center">
            PRISM INTEL
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white leading-tight text-center">
            Claim your account.
          </h1>
          <p className="text-sm text-white/35 mt-2.5 leading-relaxed text-center">
            Your 3 analyses are stored and waiting.
          </p>
        </motion.div>

        {/* Clerk form */}
        <motion.div
          className="w-full flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <SignUp appearance={clerkAppearance} forceRedirectUrl="/dashboard" />
        </motion.div>
      </div>

      {/* Bottom caption */}
      <motion.p
        className="absolute bottom-8 text-[11px] text-white/15 tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      >
        © 2026 PRISM INTELLIGENCE
      </motion.p>
    </div>
  );
}
