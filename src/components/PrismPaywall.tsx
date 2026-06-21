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
            {/* Frosted backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            {/* Ambient radial glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, delay: 0.2 }}
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.08) 0%, rgba(34, 211, 238, 0.03) 40%, transparent 80%)",
              }}
            />

            {/* Floating Glass Card */}
            <div className="relative z-10 flex flex-col items-center text-center p-10 md:p-14 max-w-[560px] w-[calc(100%-2rem)] mx-4 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/[0.08] rounded-[24px] shadow-[0_0_80px_rgba(52,211,153,0.12),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden">

              {/* Card internal subtle grid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              {/* Eyebrow */}
              <motion.p
                className="relative text-[11px] font-semibold tracking-[0.3em] uppercase text-emerald-400/80 mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                Prism Intel
              </motion.p>

              {/* Headline */}
              <motion.h1
                className="relative text-3xl md:text-4xl font-semibold tracking-tight text-white leading-[1.15] mb-4"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {isSignup ? (
                  <>Analysis Capacity Reached.</>
                ) : (
                  <>Analyst tier required</>
                )}
              </motion.h1>

              {/* Body */}
              <motion.p
                className="relative text-[15px] text-white/50 leading-relaxed max-w-[380px] mb-10 mx-auto"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {isSignup
                  ? "Your 3 free analyses are complete. Secure your account now to save your history and unlock unlimited intelligence."
                  : "You've used all 3 free analyses included with your Explorer account. Upgrade to Analyst to run unlimited reports."}
              </motion.p>

              {/* CTA group */}
              <motion.div
                className="relative flex flex-col sm:flex-row gap-4 items-center w-full justify-center"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {isSignup ? (
                  <>
                    <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
                      <button
                        className="group flex items-center justify-center gap-2.5 bg-emerald-500 text-emerald-950 text-sm font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:bg-emerald-400 active:scale-[0.98] shadow-[0_0_20px_rgba(52,211,153,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] tracking-tight w-full sm:w-auto"
                      >
                        Create Free Account
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </button>
                    </SignUpButton>
                    <SignInButton mode="redirect">
                      <button className="text-sm font-medium text-white/40 hover:text-white transition-colors duration-200 px-4 py-3.5 tracking-tight w-full sm:w-auto">
                        Sign in instead
                      </button>
                    </SignInButton>
                  </>
                ) : (
                  <>
                    <a
                      href="/pricing"
                      className="group flex items-center justify-center gap-2.5 bg-emerald-500 text-emerald-950 text-sm font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:bg-emerald-400 active:scale-[0.98] shadow-[0_0_20px_rgba(52,211,153,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] tracking-tight w-full sm:w-auto"
                    >
                      Upgrade to Analyst
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </a>
                    {onDismiss && (
                      <button
                        onClick={onDismiss}
                        className="text-sm font-medium text-white/40 hover:text-white transition-colors duration-200 px-4 py-3.5 tracking-tight w-full sm:w-auto"
                      >
                        Maybe later
                      </button>
                    )}
                  </>
                )}
              </motion.div>

              {/* Bottom proof line */}
              <motion.div
                className="relative mt-12 flex items-center gap-5 text-[10px] text-white/20 font-medium tracking-widest uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.85 }}
              >

                <span>Enterprise Grade Security</span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <span>India Native</span>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
