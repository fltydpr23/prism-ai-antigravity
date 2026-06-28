"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, useMotionValue, useSpring, animate, AnimatePresence, Variants } from "framer-motion";
import {
  TrendingUp, Shield, Zap, Target, MessageSquare, BarChart3, Sparkles, Brain, Search, Activity, Database, X, Briefcase, FileSpreadsheet, FileText, ArrowRight, Star
} from "lucide-react";

// ─── Animated Counter ─────────────────────────────────────────────────────
function AnimatedScore({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const timeout = setTimeout(() => {
      const controls = animate(0, target, {
        duration: 2.3,
        ease: [0.16, 1, 0.3, 1],
        onUpdate(v) {
          if (ref.current) ref.current.textContent = Math.round(v).toString();
        },
      });
      return () => controls.stop();
    }, 200);
    return () => clearTimeout(timeout);
  }, [inView, target]);

  return <span ref={ref}>{target}</span>;
}

// ─── Radial Score Ring ─────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div ref={ref} className="relative w-40 h-40 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <motion.circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={inView ? { strokeDashoffset: circ - dash } : { strokeDashoffset: circ }}
          transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-4xl font-light text-white tracking-tighter leading-none"
          animate={inView ? { opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 4, repeat: Infinity, delay: 2.8, ease: "easeInOut" }}
        >
          <AnimatedScore target={score} />
        </motion.span>
        <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1.5">Score</span>
      </div>
    </div>
  );
}

// ─── Dimension Bar (with hover tooltip) ────────────────────────────────────
function DimensionBar({ c, isInView }: { c: any, isInView: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const ptValue = parseInt(c.pts);
  const duration = 0.8 + (ptValue / 25) * 1.5;

  return (
    <div 
      className="relative flex items-center gap-3 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-[10px] sm:text-[11px] text-white/50 w-28 shrink-0 truncate transition-colors duration-300 group-hover:text-white/80">{c.label}</span>
      <div className="flex-1 h-[4px] bg-white/5 rounded-full overflow-hidden relative cursor-help">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: c.color, width: "100%", transformOrigin: "left" }}
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: c.value / 100 } : {}}
          transition={{ duration, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[10px] text-white/30 w-8 shrink-0">{c.pts}</span>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-32 bottom-full mb-3 w-max max-w-[220px] bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 shadow-xl z-50 pointer-events-none"
          >
            <p className="text-[11px] text-white/70 leading-relaxed font-medium">
              {c.tooltip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Glow Card (individual bento card with mouse spotlight) ────────────────
function GlowCard({
  children,
  className = "",
  mouseX,
  mouseY,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  onClick?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [localX, setLocalX] = useState(0);
  const [localY, setLocalY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // default to true to prevent hydration mismatch on server, then verify

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    checkMobile(); // Check on mount
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setLocalX(e.clientX - rect.left);
    setLocalY(e.clientY - rect.top);
  }, [isMobile]);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onClick={onClick}
      whileHover={!isMobile ? { scale: 1.01, y: -2 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`relative rounded-2xl border border-white/[0.07] bg-[#0d0d0d] overflow-hidden group ${className}`}
    >
      {/* Emerald spotlight on hover */}
      {!isMobile && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: isHovered
              ? `radial-gradient(400px circle at ${localX}px ${localY}px, rgba(52,211,153,0.07), transparent 65%)`
              : "none",
          }}
        />
      )}
      {/* Subtle top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </motion.div>
  );
}

// ─── Ambient Sentiment Interactive Card ──────────────────────────────────────
function AmbientSentimentCard({ mouseX, mouseY }: { mouseX: any, mouseY: any }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDecoded, setIsDecoded] = useState(false);

  const reviews = [
    { text: "app bilkul bakwas hai, paise wapas karo", emotion: "Frustration", color: "#f43f5e", bgGlow: "radial-gradient(circle at 50% 120%, rgba(244,63,94,0.3), transparent 70%)" },
    { text: "super ga undi mowa! delivery was fast", emotion: "Delight", color: "#34d399", bgGlow: "radial-gradient(circle at 50% 120%, rgba(52,211,153,0.3), transparent 70%)" },
    { text: "order innun varala bro, tension aaguthu", emotion: "Anxiety", color: "#fbbf24", bgGlow: "radial-gradient(circle at 50% 120%, rgba(251,191,36,0.3), transparent 70%)" },
  ];

  const current = reviews[activeIndex];

  const handleTap = () => {
    if (!isDecoded) {
      setIsDecoded(true);
    } else {
      setIsDecoded(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % reviews.length);
      }, 400); // wait for fade out
    }
  };

  return (
    <GlowCard mouseX={mouseX} mouseY={mouseY} className="p-0 flex flex-col h-full cursor-pointer overflow-hidden relative group" onClick={handleTap}>
      <div className="p-6 relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Emotional Precision</span>
            <h3 className="text-lg font-semibold text-white tracking-tight">Fluency in human.</h3>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-white/10 transition-colors">
            <motion.div 
              className="w-2 h-2 rounded-full" 
              animate={{ backgroundColor: isDecoded ? current.color : '#ffffff30' }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="mt-auto flex flex-col items-center justify-center gap-4 py-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeIndex}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.4 }}
              className="text-[13px] font-medium text-white/80 text-center leading-relaxed max-w-[200px]"
            >
              &quot;{current.text}&quot;
            </motion.p>
          </AnimatePresence>

          <div className="h-8 flex items-center justify-center">
            <AnimatePresence>
              {isDecoded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-black/60 backdrop-blur-md shadow-2xl"
                  style={{ borderColor: `${current.color}40`, boxShadow: `0 4px 20px -2px ${current.color}30` }}
                >
                  <Sparkles size={12} style={{ color: current.color }} />
                  <span className="text-[11px] font-medium tracking-wide" style={{ color: current.color }}>
                    Prism detected {current.emotion}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="text-center mt-auto">
          <span className="text-[9px] text-white/20 uppercase tracking-widest font-semibold transition-opacity group-hover:text-white/50">
            {isDecoded ? "Tap for next" : "Tap to decode"}
          </span>
        </div>
      </div>

      {/* Ambient Glow */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        animate={{ opacity: isDecoded ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{ background: current.bgGlow }}
      />
    </GlowCard>
  );
}

// ─── X-Ray Reveal Card ───────────────────────────────────────────────────────
function XRayRevealCard({ mouseX, mouseY }: { mouseX: any, mouseY: any }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <GlowCard 
      mouseX={mouseX} 
      mouseY={mouseY} 
      className="p-6 flex flex-col gap-4 h-full group"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Say vs. Do Gaps</span>
          <h3 className="text-lg font-semibold text-white tracking-tight">Actions &gt; Words.</h3>
        </div>
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
      </div>
      <p className="text-xs text-white/40 leading-relaxed mb-1">
        Prism automatically correlates your uploaded feedback with behavioral telemetry ingested via our Segment, Mixpanel, or custom APIs to reveal the gap between what users say and what they actually do.
      </p>

      <div 
        className="mt-auto relative rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden h-28 cursor-crosshair"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top Layer: "Said" (Positive review) */}
        <motion.div 
          className="absolute inset-0 p-4 flex flex-col justify-center"
          animate={{ opacity: isHovered ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
           <div className="flex text-amber-400 mb-2 gap-0.5">
             <Star className="w-3 h-3 fill-amber-400" />
             <Star className="w-3 h-3 fill-amber-400" />
             <Star className="w-3 h-3 fill-amber-400" />
             <Star className="w-3 h-3 fill-amber-400" />
             <Star className="w-3 h-3 fill-amber-400" />
           </div>
           <p className="text-[13px] font-medium text-white/80 italic">
             &quot;Great app, highly recommend! Perfect for emergencies.&quot;
           </p>
        </motion.div>

        {/* Bottom Layer: "Did" (Telemetry Reality) */}
        <motion.div 
          className="absolute inset-0 p-4 flex flex-col justify-center bg-rose-500/5"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
           <div className="text-[9px] text-rose-400/80 uppercase tracking-widest mb-1.5 font-bold flex items-center gap-1.5">
             <Activity className="w-3 h-3" /> Telemetry Data
           </div>
           <p className="text-xs font-mono text-rose-200/90 leading-relaxed">
             &gt; Action: Uninstalled app<br/>
             &gt; Time: 48h after first order<br/>
             &gt; Churn Risk: <span className="text-rose-500 font-bold">100%</span>
           </p>
        </motion.div>

        {/* The X-Ray Scanner Line */}
        <motion.div 
          className="absolute top-0 bottom-0 w-full border-t-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)] z-20 pointer-events-none"
          initial={{ y: "-100%", opacity: 0 }}
          animate={isHovered ? { y: ["-10%", "110%"], opacity: [0, 1, 1, 0] } : { y: "-100%", opacity: 0 }}
          transition={{ duration: 1.2, ease: "linear" }}
        >
          <div className="w-full h-12 bg-gradient-to-b from-rose-500/20 to-transparent" />
        </motion.div>
      </div>

      <div className="text-center mt-auto">
        <span className="text-[9px] text-white/20 uppercase tracking-widest font-semibold transition-opacity group-hover:opacity-0">
          Hover to X-Ray
        </span>
      </div>
    </GlowCard>
  );
}

// ─── Main Bento Component ─────────────────────────────────────────────────
export default function PrismScoreBento() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const SCORE_COMPONENTS = [
    { label: "Signal Clarity", value: 92, color: "#34d399", pts: "25pts", tooltip: "Finding the actual signal in a sea of noise." },
    { label: "Contradiction Depth", value: 88, color: "#06b6d4", pts: "20pts", tooltip: "Spotting when users say one thing, but do another." },
    { label: "Strategic Coverage", value: 94, color: "#a78bfa", pts: "20pts", tooltip: "Measuring how well your roadmap meets what users actually need." },
    { label: "Emotional Precision", value: 85, color: "#fb923c", pts: "15pts", tooltip: "Understanding how users truly feel, beyond just five stars." },
    { label: "Churn Exposure", value: 78, color: "#f43f5e", pts: "10pts", tooltip: "Catching the warning signs before they hit cancel." },
    { label: "Segment Resolution", value: 82, color: "#818cf8", pts: "10pts", tooltip: "Seeing your users as distinct personalities, not just numbers." },
  ];

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
  };

  return (
    <section
      ref={sectionRef}
      id="prism-score"
      className="py-32 border-b border-white/5 relative bg-[#050505] overflow-hidden"
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/4 w-[700px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6" ref={containerRef}>
        {/* ── Section Header ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] text-[11px] font-semibold tracking-widest uppercase text-emerald-400 mb-6">
            <Brain className="w-3 h-3" /> Prism Intelligence
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tighter text-white leading-[1.05] max-w-2xl">
              Every review tells a story.<br />
              <span className="text-white/35">Prism helps you read it.</span>
            </h2>
            <p className="text-base text-white/40 leading-relaxed max-w-sm lg:text-right">
              Prism structures your story into distinct signals—each one a strategic decision waiting to happen.
            </p>
          </div>
        </motion.div>

        {/* ── Bento Grid ─────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-auto"
        >
          {/* ── Score Card (HERO: spans 2 cols × 2 rows) ── */}
          <motion.div variants={cardVariants} className="md:col-span-2 lg:col-span-2 md:row-span-2">
            <GlowCard mouseX={mouseX} mouseY={mouseY} className="h-full min-h-[440px] p-8 flex flex-col justify-center gap-12">
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">The Prism Score™</span>
                <h3 className="text-3xl font-semibold text-white tracking-tight leading-tight">
                  Engineered precision.
                </h3>
                <p className="text-sm text-white/40 leading-relaxed mt-1 max-w-sm">
                  A score is only as good as the math behind it. By isolating contradictions, emotional triggers, and churn signals into six weighted dimensions, we’ve built a metric you can actually trust.
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-4 flex-1">
                  {SCORE_COMPONENTS.map((c, i) => (
                    <DimensionBar key={c.label} c={c} isInView={isInView} />
                  ))}
                </div>
                <div className="ml-8 shrink-0 pb-2">
                  <ScoreRing score={87} />
                </div>
              </div>
            </GlowCard>
          </motion.div>

          {/* ── Terminal Card (Top right, spans 2 cols) ── */}
          <motion.div variants={cardVariants} className="md:col-span-1 lg:col-span-2">
            <GlowCard mouseX={mouseX} mouseY={mouseY} className="h-full p-6 flex flex-col">
              <div className="flex flex-col gap-2 mb-4">
                <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Executive Summary</span>
                <h3 className="text-xl font-semibold text-white tracking-tight leading-tight">
                  Clarity out of chaos.
                </h3>
                <p className="text-sm text-white/40 leading-relaxed mt-1">
                  Thousands of noisy, unstructured reviews compressed into a single, undeniable directive for your team.
                </p>
              </div>
              <div className="mt-auto bg-[#050505] border border-white/10 rounded-xl p-4 font-mono text-xs shadow-inner relative overflow-hidden group">
                <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                  <span className="text-white/30 text-[9px] ml-1 tracking-widest uppercase font-sans">executive_summary.json</span>
                </div>
                <motion.div 
                  className="text-emerald-400/90 leading-relaxed"
                  initial={{ filter: "blur(10px)", opacity: 0 }}
                  animate={isInView ? { filter: "blur(0px)", opacity: 1 } : {}}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                >
                  <span className="text-white/30 mr-2">&gt;</span>
                  SwiftCart users love speed but are churning over slot availability — fix this before Q3.
                  <motion.span
                    className="w-1.5 h-3 bg-emerald-400/70 inline-block align-middle ml-1"
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  />
                </motion.div>
              </div>
            </GlowCard>
          </motion.div>

          {/* ── Emotion Card (Small square, 1 col) ── */}
          <motion.div variants={cardVariants} className="md:col-span-1 lg:col-span-1">
            <AmbientSentimentCard mouseX={mouseX} mouseY={mouseY} />
          </motion.div>

          {/* ── Contradiction Card (Small square, 1 col) ── */}
          <motion.div variants={cardVariants} className="md:col-span-1 lg:col-span-1">
            <XRayRevealCard mouseX={mouseX} mouseY={mouseY} />
          </motion.div>

          {/* ── Variant Card (Wide, 2 cols) ── */}
          <motion.div variants={cardVariants} className="md:col-span-2 lg:col-span-2">
            <GlowCard mouseX={mouseX} mouseY={mouseY} className="p-6 flex flex-col gap-4 h-full">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Variant Analysis</span>
                  <h3 className="text-lg font-semibold text-white tracking-tight">Compare in one run.</h3>
                </div>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <p className="text-sm text-white/40 leading-relaxed mb-2">
                Upload a combined dataset. Prism automatically splits, analyses, and ranks competitors.
              </p>
              
              <div className="mt-auto flex flex-col gap-2">
                {[
                  { name: "SwiftCart", score: 88, color: "bg-emerald-400", bg: "bg-emerald-500/20" },
                  { name: "QuickDrop", score: 84, color: "bg-amber-400", bg: "bg-amber-500/20" },
                  { name: "FoodDash", score: 79, color: "bg-rose-400", bg: "bg-rose-500/20" },
                ].map((v, i) => (
                  <div key={v.name} className="flex items-center gap-3 bg-[#0A0A0A] border border-white/5 rounded-lg p-2.5">
                    <span className="text-xs font-semibold text-white/30 w-3">{i + 1}</span>
                    <span className="text-sm font-medium text-white/80 w-16">{v.name}</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full ${v.color}`}
                        initial={{ width: "0%" }}
                        animate={isInView ? { width: `${v.score}%` } : {}}
                        transition={{ duration: 1, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs text-white/50 w-6 tabular-nums">{v.score}</span>
                  </div>
                ))}
              </div>
            </GlowCard>
          </motion.div>

          {/* ── Industry Card (Wide, 2 cols) ── */}
          <motion.div variants={cardVariants} className="md:col-span-1 lg:col-span-2">
            <GlowCard mouseX={mouseX} mouseY={mouseY} className="p-6 flex flex-col gap-4 h-full">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Category Lenses</span>
                  <h3 className="text-lg font-semibold text-white tracking-tight">Adapts to your category.</h3>
                </div>
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-violet-400" />
                </div>
              </div>
              <p className="text-sm text-white/40 leading-relaxed mb-4">
                Prism auto-detects your industry and applies the right analytical lens. It knows what matters for SaaS vs. Quick Commerce.
              </p>
              <div className="mt-auto bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-medium text-white/90">Quick Commerce</span>
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-medium">Confidence: High</span>
                  </div>
                </div>
              </div>
            </GlowCard>
          </motion.div>

          {/* ── Wide bottom card: Dual Modality Engine (4 cols) ── */}
          <motion.div variants={cardVariants} className="md:col-span-3 lg:col-span-4">
            <GlowCard mouseX={mouseX} mouseY={mouseY} className="p-8 flex flex-col lg:flex-row items-center gap-10">
              <div className="flex flex-col gap-3 flex-1 max-w-lg">
                <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Dual Modality Engine</span>
                <h3 className="text-2xl font-semibold text-white tracking-tight">
                  Structured data or raw text.<br/>Prism handles both.
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  Most tools force you to choose. Prism auto-detects your format. If it&apos;s numerical, it computes statistical distributions, Pearson correlations, and temporal trends. If it&apos;s text, it runs a 3-stage AI pipeline to clean, synthesise, and structure the sentiment.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto flex-1 justify-end">
                {/* Quant Block */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 w-full sm:w-48 relative overflow-hidden flex flex-col gap-3 h-32 justify-center">
                  <div className="absolute top-0 right-0 p-3 opacity-20"><FileSpreadsheet className="w-12 h-12 text-emerald-400" /></div>
                  <div className="relative z-10 flex flex-col gap-1">
                    <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Quantitative</span>
                    <span className="text-emerald-400 font-medium text-sm">Statistical Trends</span>
                    <span className="text-white/60 text-xs mt-1 font-mono">r = 0.84 (Strong)</span>
                  </div>
                </div>
                
                <div className="text-white/20 shrink-0 hidden sm:block">
                  <ArrowRight className="w-5 h-5" />
                </div>

                {/* Qual Block */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 w-full sm:w-48 relative overflow-hidden flex flex-col gap-3 h-32 justify-center">
                  <div className="absolute top-0 right-0 p-3 opacity-20"><FileText className="w-12 h-12 text-sky-400" /></div>
                  <div className="relative z-10 flex flex-col gap-1">
                    <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Qualitative</span>
                    <span className="text-sky-400 font-medium text-sm">NLP Pipeline</span>
                    <span className="text-white/60 text-xs mt-1 font-mono">{"{ emotion: true }"}</span>
                  </div>
                </div>
              </div>
            </GlowCard>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
