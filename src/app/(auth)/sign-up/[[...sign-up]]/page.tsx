"use client";
import { SignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";

const clerkAppearance = {
  layout: {
    logoPlacement: "none" as const,
    showOptionalFields: false,
  },
  variables: {
    colorPrimary: "#ffffff",
    colorBackground: "#050505",
    colorInputBackground: "#0f0f0f",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "rgba(255,255,255,0.45)",
    colorNeutral: "rgba(255,255,255,0.12)",
    borderRadius: "10px",
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    card: "bg-transparent shadow-none border-none !p-0 w-full",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    header: "hidden",
    socialButtonsBlockButton:
      "bg-[#0f0f0f] border border-white/[0.08] border-t-white/[0.13] text-white/80 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.18] transition-all duration-200 rounded-[10px] h-11 text-sm font-medium",
    socialButtonsBlockButtonText: "text-white/80 font-medium text-sm",
    socialButtonsBlockButtonArrow: "text-white/30",
    dividerLine: "bg-white/[0.07]",
    dividerText: "text-white/25 text-xs tracking-widest uppercase",
    formFieldLabel: "text-white/40 text-xs tracking-widest uppercase font-medium mb-1.5",
    formFieldInput:
      "bg-[#0f0f0f] border border-white/[0.08] border-t-white/[0.04] text-white placeholder:text-white/20 rounded-[10px] h-11 px-4 text-sm focus:border-white/25 focus:ring-0 focus:outline-none transition-all duration-200",
    formButtonPrimary:
      "bg-white text-black font-semibold text-sm rounded-[10px] h-11 hover:bg-white/90 active:bg-white/80 transition-all duration-150 tracking-tight shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
    footerActionText: "text-white/30 text-xs",
    footerActionLink: "text-white/60 hover:text-white text-xs font-medium transition-colors",
    identityPreviewText: "text-white/70",
    identityPreviewEditButtonIcon: "text-white/40",
    formFieldAction: "text-white/30 hover:text-white/70 text-xs transition-colors",
    alternativeMethodsBlockButton:
      "bg-[#0f0f0f] border border-white/[0.08] text-white/70 hover:bg-white/[0.06] rounded-[10px] text-sm transition-all",
    otpCodeFieldInput:
      "bg-[#0f0f0f] border border-white/[0.08] text-white rounded-[10px] text-xl font-mono",
    badge: "hidden",
    logoBox: "hidden",
    logoImage: "hidden",
  },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,255,255,0.025) 0%, transparent 100%)",
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
      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Headline block */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/25 mb-5">
            Intelligence Platform
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white leading-tight">
            Claim your account.
          </h1>
          <p className="text-sm text-white/35 mt-2.5 leading-relaxed">
            Your 3 analyses are stored and waiting.
          </p>
        </motion.div>

        {/* Clerk form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <SignUp appearance={clerkAppearance} />
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
