"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, useMotionValue, useSpring, animate, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Shield, Zap, Target, MessageSquare, BarChart3, Sparkles, Brain, Search, Activity, Database
} from "lucide-react";

// ─── Animated Counter ─────────────────────────────────────────────────────
function AnimatedScore({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, target, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        if (ref.current) ref.current.textContent = Math.round(v).toString();
      },
    });
    return controls.stop;
  }, [inView, target]);

  return <span ref={ref}>0</span>;
}

// ─── Radial Score Ring ─────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const inView = useInView(useRef<HTMLDivElement>(null), { once: true });
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative w-36 h-36 shrink-0">
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
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-light text-white tracking-tighter leading-none">
          <AnimatedScore target={score} />
        </span>
        <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Score</span>
      </div>
    </div>
  );
}

// ─── Glow Card (individual bento card with mouse spotlight) ────────────────
function GlowCard({
  children,
  className = "",
  mouseX,
  mouseY,
}: {
  children: React.ReactNode;
  className?: string;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [localX, setLocalX] = useState(0);
  const [localY, setLocalY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setLocalX(e.clientX - rect.left);
    setLocalY(e.clientY - rect.top);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`relative rounded-2xl border border-white/[0.07] bg-[#0d0d0d] overflow-hidden group ${className}`}
    >
      {/* Emerald spotlight on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: isHovered
            ? `radial-gradient(400px circle at ${localX}px ${localY}px, rgba(52,211,153,0.07), transparent 65%)`
            : "none",
        }}
      />
      {/* Subtle top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </motion.div>
  );
}

// ─── Main Bento Component ─────────────────────────────────────────────────
export default function PrismScoreBento() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const SIGNALS = [
    {
      icon: TrendingUp,
      label: "Sentiment Trajectory",
      color: "text-emerald-400",
      glow: "bg-emerald-500/10",
      value: "Mapped",
      valueColor: "text-emerald-400",
      desc: "Watch how user feelings evolve over time.",
    },
    {
      icon: Zap,
      label: "Contradiction Analysis",
      color: "text-amber-400",
      glow: "bg-amber-500/10",
      value: "High Signal",
      valueColor: "text-amber-400",
      desc: "Catch when users say one thing but mean another.",
    },
    {
      icon: MessageSquare,
      label: "Emotional Triggers",
      color: "text-sky-400",
      glow: "bg-sky-500/10",
      value: "Precise",
      valueColor: "text-sky-400",
      desc: "Pinpoint exactly what sparks joy or frustration.",
    },
    {
      icon: Target,
      label: "Strategic Coverage",
      color: "text-violet-400",
      glow: "bg-violet-500/10",
      value: "Prioritized",
      valueColor: "text-violet-400",
      desc: "Know exactly which features to prioritize next.",
    },
    {
      icon: Shield,
      label: "Churn Risk Detection",
      color: "text-rose-400",
      glow: "bg-rose-500/10",
      value: "Alert",
      valueColor: "text-rose-400",
      desc: "Spot the signs of cancellation before it happens.",
    },
    {
      icon: Sparkles,
      label: "Psychographic Segments",
      color: "text-cyan-400",
      glow: "bg-cyan-500/10",
      value: "Resolved",
      valueColor: "text-cyan-400",
      desc: "Understand your users by how they think, not just who they are.",
    },
  ];

  const SCORE_COMPONENTS = [
    { label: "Signal Clarity", value: 92, color: "#34d399" },
    { label: "Contradiction Depth", value: 88, color: "#06b6d4" },
    { label: "Strategic Coverage", value: 94, color: "#a78bfa" },
    { label: "Emotional Precision", value: 85, color: "#fb923c" },
    { label: "Churn Exposure", value: 78, color: "#f43f5e" },
    { label: "Segment Resolution", value: 82, color: "#818cf8" },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
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
              Two systems working together to give you the full picture. The Score tells you exactly how your product is doing. The Signals tell you why—and what to build next.
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
          {/* ── HERO: Prism Score Card (spans 2 cols × 2 rows) ── */}
          <motion.div variants={cardVariants} className="md:col-span-2 md:row-span-2">
            <GlowCard mouseX={mouseX} mouseY={mouseY} className="h-full min-h-[340px] p-8 flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Prism Score™</span>
                <h3 className="text-2xl font-semibold text-white tracking-tight leading-tight">
                  The heartbeat<br />of your product.
                </h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-xs mt-1">
                  Stop guessing how your customers feel. Prism turns thousands of messy, chaotic reviews into one simple, accurate number so you always know exactly where you stand.
                </p>
              </div>

              <div className="flex items-end justify-between mt-6">
                <div className="flex flex-col gap-3 flex-1">
                  {SCORE_COMPONENTS.map((c) => (
                    <div key={c.label} className="flex items-center gap-3">
                      <span className="text-[10px] sm:text-[11px] text-white/40 w-28 shrink-0 truncate">{c.label}</span>
                      <div className="flex-1 h-[3px] bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: c.color }}
                          initial={{ width: "0%" }}
                          animate={isInView ? { width: `${c.value}%` } : {}}
                          transition={{ duration: 1.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <span className="text-[11px] text-white/50 w-7 text-right">{c.value}</span>
                    </div>
                  ))}
                </div>
                <div className="ml-8 shrink-0">
                  <ScoreRing score={87} />
                </div>
              </div>

              {/* Decorative bottom badge */}
              <div className="mt-6 flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-medium">Category: Strong &amp; Improving</span>
              </div>
            </GlowCard>
          </motion.div>

          {/* ── Prism Signals header card ── */}
          <motion.div variants={cardVariants} className="md:col-span-2">
            <GlowCard mouseX={mouseX} mouseY={mouseY} className="p-7 flex flex-col gap-3 h-full">
              <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Prism Signals™</span>
              <h3 className="text-xl font-semibold text-white tracking-tight leading-tight">
                Understand what your users actually mean.
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Prism looks past the simple star ratings to find the real emotions—frustration, delight, and everything in between. It catches the issues your team can&apos;t see, before they turn into crises.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Say vs. Do Gaps", "Churn Signals", "Psychographics", "Emotional Triggers", "Strategic Actions"].map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/40 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </GlowCard>
          </motion.div>

          {/* ── 6 Signal Cards ── */}
          {SIGNALS.map((signal) => (
            <motion.div key={signal.label} variants={cardVariants}>
              <GlowCard mouseX={mouseX} mouseY={mouseY} className="p-5 flex flex-col gap-3 h-full min-h-[140px]">
                <div className="flex items-start justify-between">
                  <div className={`w-8 h-8 rounded-xl ${signal.glow} flex items-center justify-center shrink-0`}>
                    <signal.icon className={`w-4 h-4 ${signal.color}`} />
                  </div>
                  <span className={`text-xs font-semibold ${signal.valueColor} tabular-nums`}>
                    {signal.value}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-white/80">{signal.label}</span>
                  <p className="text-xs text-white/35 leading-relaxed">{signal.desc}</p>
                </div>
                {/* Subtle bottom bar */}
                <div className="mt-auto h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${signal.glow.replace("bg-", "bg-").replace("/10", "/50")}`}
                    initial={{ width: "0%" }}
                    animate={isInView ? { width: `${60 + Math.random() * 35}%` } : {}}
                    transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </GlowCard>
            </motion.div>
          ))}

          {/* ── Wide bottom card: How we calculate the score ── */}
          <motion.div variants={cardVariants} className="md:col-span-2 lg:col-span-4">
            <GlowCard mouseX={mouseX} mouseY={mouseY} className="p-7 flex flex-col sm:flex-row items-center gap-8">
              <div className="flex flex-col gap-2 flex-1">
                <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">The Engine</span>
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  Prism does the heavy lifting.
                </h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-lg">
                  You bring the raw data. Behind the scenes, three specialized systems work in perfect harmony: one cleans the noise, one analyzes the emotion, and one synthesizes the final report. It even understands the nuances of local Indian languages and slang, effortlessly turning messy reviews into a polished presentation.
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0 bg-[#0A0A0A] border border-white/[0.08] rounded-2xl p-4 w-full sm:w-[220px] relative overflow-hidden">
                {/* Subtle animated background gradient for the active step */}
                <div 
                  className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 via-emerald-500/[0.03] to-emerald-500/0 transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateY(${activeStep * 25 - 50}%)` }}
                />

                {[
                  { title: "Extract", icon: Search, desc: "Cleaning noise" },
                  { title: "Synthesise", icon: Brain, desc: "Applying NLP" },
                  { title: "Structure", icon: Database, desc: "Mapping JSON" },
                  { title: "Score", icon: Activity, desc: "Calculating" }
                ].map((step, i) => {
                  const isActive = activeStep === i;
                  const Icon = step.icon;
                  return (
                    <div 
                      key={step.title} 
                      className={`relative flex items-center gap-3 p-2.5 rounded-xl transition-all duration-500 ${isActive ? 'bg-white/[0.04] border border-white/10 shadow-[0_0_15px_rgba(52,211,153,0.05)]' : 'border border-transparent opacity-40'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${isActive ? 'bg-emerald-500/20 border border-emerald-500/50 scale-110' : 'bg-white/5 border border-white/10'}`}>
                        {isActive ? (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          >
                            <Icon className="w-3.5 h-3.5 text-emerald-400" />
                          </motion.div>
                        ) : (
                          <span className="text-[11px] text-white/40 font-bold">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-sm font-medium transition-colors duration-500 ${isActive ? 'text-white' : 'text-white/70'}`}>
                          {step.title}
                        </span>
                        <AnimatePresence>
                          {isActive && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0, y: -5 }}
                              animate={{ opacity: 1, height: 'auto', y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -5 }}
                              className="text-[10px] text-emerald-400/80 mt-0.5 whitespace-nowrap"
                            >
                              {step.desc}
                              <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              >...</motion.span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlowCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
