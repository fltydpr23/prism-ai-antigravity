"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useAnimation, useInView, useMotionValue, useSpring } from "framer-motion";
import { Sparkles, ArrowRight, BarChart3, Users, Zap, Shield, ChevronRight } from "lucide-react";
import MagneticButton from "./MagneticButton";
import SampleReportOverlay from "./SampleReportOverlay";

interface Props {
  onStart: () => void;
}

// ─── Data Constellation Config ─────────────────────────────────────────────
const DATA_SOURCES = [
  "WhatsApp Chat: Query Resolved",
  "FoodDash Rating: 1★ (Cold food)",
  "Flipkart App: 5★ (Fast delivery)",
  "Razorpay Ticket: Payment issue",
  "X (Twitter) Trend: Brand Mention",
  "Play Store Review: 4★",
];

const COLORS = [
  "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  "text-rose-400 border-rose-500/30 bg-rose-500/10",
  "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  "text-amber-400 border-amber-500/30 bg-amber-500/10",
  "text-white/60 border-white/10 bg-white/5",
];

function DataChip({ text, delay, colorIdx, xOffset, duration }: any) {
  const colorClass = colorIdx > 1 ? COLORS[4] : COLORS[colorIdx]; // mostly neutral, some colored

  return (
    <motion.div
      initial={{ opacity: 0, y: "120vh", x: xOffset }}
      animate={{ opacity: [0, 1, 1, 0], y: "-20vh" }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "linear",
      }}
      className={`absolute left-1/2 whitespace-nowrap px-3 py-1.5 rounded-full border text-[10px] font-mono tracking-tight backdrop-blur-sm ${colorClass}`}
      style={{ zIndex: 0 }}
    >
      {text}
    </motion.div>
  );
}

// ─── Spotlight Dashboard ───────────────────────────────────────────────────
function SpotlightDashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 300, y: 200 }); // Default center-ish
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Loading animation state
  const [score, setScore] = useState(73);
  const [sources, setSources] = useState(847);
  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    // Hardcoded static values as per GTM strategy to build immediate trust
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Calculate 3D tilt
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -5; // max 5deg tilt
    const tiltY = ((x - centerX) / centerX) * 5;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    // Keep spotlight at last position but softly ease it
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
      }}
      transition={{ type: "spring", stiffness: 100, damping: 30, mass: 0.5 }}
      style={{ transformStyle: "preserve-3d" }}
      className="relative w-full aspect-[4/3] rounded-2xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-3xl shadow-2xl flex flex-col group cursor-crosshair overflow-hidden"
    >
      {/* ── Spotlight Mask ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-50 mix-blend-overlay"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.15), transparent 40%)`,
        }}
      />
      
      {/* ── Subtle Border Highlight ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-50 rounded-2xl"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.05)`,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(52,211,153,0.1), transparent 40%)`,
        }}
      />

      {/* Mockup Header */}
      <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02] shrink-0" style={{ transform: "translateZ(10px)" }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        </div>
        <div className="ml-4 h-5 w-48 bg-white/5 rounded text-[10px] text-white/30 flex items-center px-2 font-mono">
          prismintel.co/app/dashboard
        </div>
      </div>

      {/* Mockup Body */}
      <div className="flex-1 p-6 flex flex-col gap-6" style={{ transform: "translateZ(20px)" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white/90 font-medium text-sm">Consumer Intelligence</h3>
            <p className="text-white/40 text-[11px] mt-0.5">Last 30 Days · Enterprise Segment</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-2 py-1 rounded border border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-400 font-mono">
              Live Sync
            </div>
            <div className="w-6 h-6 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Prism Score", val: score, icon: Sparkles, color: "text-emerald-400" },
            { label: "Analyzed Sources", val: sources.toLocaleString(), icon: Users, color: "text-cyan-400" },
            { label: "Friction Points", val: isLoaded ? "12" : "0", icon: Zap, color: "text-amber-400" }
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <stat.icon className={`w-4 h-4 ${stat.color} ${isLoaded ? 'opacity-100' : 'opacity-30'} transition-opacity duration-500`} />
              </div>
              <div>
                <div className="text-2xl font-semibold text-white tracking-tight">{stat.val}</div>
                <div className="text-[10px] text-white/40 mt-1">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.01] p-4 flex flex-col">
          <div className="text-[11px] text-white/50 mb-4 flex items-center gap-2">
            <BarChart3 className="w-3 h-3" /> Sentiment Trajectory
          </div>
          <div className="flex-1 flex items-end gap-2">
            {/* Fake chart bars */}
            {[40, 65, 45, 80, 55, 90, 75, 100, 85].map((h, i) => (
              <motion.div 
                key={i} 
                initial={{ height: "0%" }}
                animate={{ height: isLoaded ? `${h}%` : "0%" }}
                transition={{ duration: 0.8, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 bg-gradient-to-t from-emerald-500/20 to-emerald-400/50 rounded-t-sm" 
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Hero Component ───────────────────────────────────────────────────
export default function PrismHero({ onStart }: Props) {
  const [chips, setChips] = useState<any[]>([]);
  const [isSampleOpen, setIsSampleOpen] = useState(false);

  // Mouse parallax for constellation
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = ((clientX / innerWidth) - 0.5) * 50; // Max 25px shift
    const y = ((clientY / innerHeight) - 0.5) * 50;
    mouseX.set(-x);
    mouseY.set(-y);
  };

  // Generate constellation chips on mount
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const numChips = isMobile ? 12 : 40;
    
    const newChips = Array.from({ length: numChips }).map((_, i) => ({
      id: i,
      text: DATA_SOURCES[Math.floor(Math.random() * DATA_SOURCES.length)],
      delay: Math.random() * 15,
      duration: 15 + Math.random() * 15,
      xOffset: `${(Math.random() - 0.5) * 120}vw`,
      colorIdx: Math.floor(Math.random() * COLORS.length),
    }));
    setChips(newChips);
  }, []);

  return (
    <>
    <motion.section 
      animate={{ scale: isSampleOpen ? 0.95 : 1, opacity: isSampleOpen ? 0.4 : 1, filter: isSampleOpen ? 'blur(8px)' : 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      className="relative flex flex-col items-center justify-center min-h-screen pt-24 pb-12 overflow-hidden"
      style={{ perspective: 1000 }}
    >
      
      {/* ── Background Glows ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full" />
      </div>

      {/* ── Live Data Constellation ── */}
      <motion.div 
        style={{ 
          x: springX, 
          y: springY,
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)"
        }}
        className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      >
        {chips.map((chip) => (
          <DataChip key={chip.id} {...chip} />
        ))}
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 w-full flex flex-col lg:flex-row items-center gap-16 relative z-10">
        
        {/* Left Column: Copy & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start gap-8 w-full lg:w-1/2"
        >
          <div className="badge border border-white/10 bg-white/5 backdrop-blur-md text-white/70 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-cyan-400" /> AI Consumer Intelligence
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tighter leading-[1.05] text-white mix-blend-plus-lighter">
            Turn 10,000 messy reviews into 1 undeniable roadmap in <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">4 minutes.</span>
          </h1>

          <p className="text-lg sm:text-xl font-normal text-white/50 max-w-lg leading-relaxed">
            Drop in any CSV, review export, or survey. Walk out in 4 minutes with a churn signal report, a competitor teardown, and a boardroom directive — in your customer's actual language.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
            <MagneticButton
              onClick={onStart}
              intensity={0.2}
              className="bg-white text-black hover:bg-white/90 transition-colors px-6 py-3 rounded-md text-sm font-semibold tracking-tight flex items-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            >
              Start Free Analysis <ArrowRight className="w-4 h-4" />
            </MagneticButton>
            <button onClick={() => setIsSampleOpen(true)} className="text-white/60 hover:text-white transition-colors text-sm font-medium px-4 py-3 flex items-center gap-2 border border-white/5 hover:border-white/10 rounded-md bg-white/5 backdrop-blur-sm group cursor-pointer z-50">
              View Sample Report <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Right Column: Spotlight Dashboard */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-1/2 relative"
          style={{ perspective: 1200 }}
        >
          <SpotlightDashboard />
        </motion.div>
      </div>
    </motion.section>
    <SampleReportOverlay isOpen={isSampleOpen} onClose={() => setIsSampleOpen(false)} />
    </>
  );
}
