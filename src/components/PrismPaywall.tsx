"use client";
import { motion, AnimatePresence } from "framer-motion";
import { SignUpButton, SignInButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

interface PrismPaywallProps {
  mode: "signup" | "upgrade";
  visible: boolean;
  onDismiss?: () => void;
}

/**
 * Executive Boardroom Paywall
 * Inspired by Apple product pages — maximum legibility, zero noise.
 * Appears over the existing UI with a cinematic, Jony Ive-esque transition.
 */
export default function PrismPaywall({ mode, visible, onDismiss }: PrismPaywallProps) {
  const isSignup = mode === "signup";

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Full-page overlay — fades in */}
          <motion.div
            key="paywall-overlay"
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Deep black bg */}
            <div className="absolute inset-0 bg-[#050505]" />

            {/* Ambient radial — barely visible, pure white, centered */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, delay: 0.2 }}
              style={{
                background:
                  "radial-gradient(ellipse 55% 45% at 50% 48%, rgba(255,255,255,0.032) 0%, transparent 100%)",
              }}
            />

            {/* Hairline grid */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.03 }}
              transition={{ duration: 1.8, delay: 0.3 }}
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />

            {/* Content block */}
            <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-[520px]">
              {/* Eyebrow */}
              <motion.p
                className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/20 mb-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                Prism Intelligence
              </motion.p>

              {/* Headline */}
              <motion.h1
                className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.1] mb-5"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {isSignup ? (
                  <>Free tier exhausted.</>
                ) : (
                  <>Analyst tier required.</>
                )}
              </motion.h1>

              {/* Body */}
              <motion.p
                className="text-base text-white/40 leading-relaxed max-w-[380px] mb-12"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {isSignup
                  ? "You've run 3 analyses. Create a free account to unlock your intelligence vault and continue generating reports."
                  : "You've used all 3 free analyses included with your Explorer account. Upgrade to Analyst to run unlimited reports."}
              </motion.p>

              {/* CTA group */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 items-center"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {isSignup ? (
                  <>
                    <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
                      <button
                        className="group flex items-center gap-2.5 bg-white text-black text-sm font-semibold px-8 py-3.5 rounded-full transition-all duration-200 hover:bg-white/90 active:scale-[0.98] shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] tracking-tight"
                      >
                        Create Free Account
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </button>
                    </SignUpButton>
                    <SignInButton mode="redirect">
                      <button className="text-sm text-white/30 hover:text-white/70 transition-colors duration-200 px-4 py-3.5 tracking-tight">
                        Already have an account? Sign in
                      </button>
                    </SignInButton>
                  </>
                ) : (
                  <>
                    <a
                      href="/pricing"
                      className="group flex items-center gap-2.5 bg-white text-black text-sm font-semibold px-8 py-3.5 rounded-full transition-all duration-200 hover:bg-white/90 active:scale-[0.98] shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] tracking-tight"
                    >
                      Upgrade to Analyst
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </a>
                    {onDismiss && (
                      <button
                        onClick={onDismiss}
                        className="text-sm text-white/30 hover:text-white/70 transition-colors duration-200 px-4 py-3.5 tracking-tight"
                      >
                        Maybe later
                      </button>
                    )}
                  </>
                )}
              </motion.div>

              {/* Bottom proof line */}
              <motion.div
                className="mt-16 flex items-center gap-6 text-[11px] text-white/15 font-medium tracking-widest uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.85 }}
              >
                <span>Research-grade precision</span>
                <span className="w-px h-3 bg-white/10" />
                <span>Enterprise security</span>
                <span className="w-px h-3 bg-white/10" />
                <span>India-native AI</span>
              </motion.div>
            </div>

            {/* Wordmark — bottom left */}
            <motion.span
              className="absolute bottom-8 left-10 text-[12px] font-semibold tracking-[0.25em] uppercase text-white/12 select-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.6 }}
            >
              PRISM
            </motion.span>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
