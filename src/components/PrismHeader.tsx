"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowRight } from "lucide-react";
import MagneticButton from "./MagneticButton";
import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import UsageMeter from "./UsageMeter";

interface Props {
  onStart: () => void;
}

export default function PrismHeader({ onStart }: Props) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const { isLoaded, userId } = useAuth();
  const isSignedIn = isLoaded && !!userId;

  // Trigger scroll state change after 100px
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100 && !scrolled) {
      setScrolled(true);
    } else if (latest <= 100 && scrolled) {
      setScrolled(false);
    }
  });

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        scrolled ? "bg-[#0A0A0A]/70 backdrop-blur-xl border-b border-white/5 shadow-2xl" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center">
            <div className="w-3 h-3 bg-black rounded-full" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight" style={{ fontFamily: "var(--font-basement)" }}>Prism</span>
        </div>

        {/* Center: Links */}
        <div className="hidden md:flex items-center justify-center relative flex-1">
          <div className="flex items-center gap-8 text-sm font-medium text-white/70">
            <Link href="/wash" className="hover:text-white transition-colors">Clean Data</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-4 flex-1">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:block">
                  Sign In
                </button>
              </SignInButton>
              <MagneticButton
                onClick={onStart}
                intensity={0.15}
                className={`px-4 py-2 text-xs font-semibold tracking-tight text-white gap-1.5 flex items-center transition-all duration-300 ${
                  scrolled ? "bg-white/10 hover:bg-white/20 border border-white/10 rounded-full" : "glass-pill"
                }`}
              >
                Start Free <ArrowRight className="w-3 h-3" />
              </MagneticButton>
            </>
          ) : (
            <>
              <div className="hidden lg:block mr-2 scale-90 origin-right">
                <UsageMeter />
              </div>
              <Link href="/dashboard" className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:block">
                Dashboard
              </Link>
              <MagneticButton
                onClick={onStart}
                intensity={0.15}
                className={`px-4 py-2 text-xs font-semibold tracking-tight text-white gap-1.5 flex items-center transition-all duration-300 ${
                  scrolled ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 rounded-full" : "glass-pill"
                }`}
              >
                New Analysis <ArrowRight className="w-3 h-3" />
              </MagneticButton>
            </>
          )}
        </div>

      </div>
    </motion.header>
  );
}

