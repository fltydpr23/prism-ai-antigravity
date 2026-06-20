"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { AlertTriangle, TrendingUp, Zap, Globe } from "lucide-react";
import { INDIA_PATH } from "./IndiaMapPath";

type SignalType = "churn" | "friction" | "opportunity" | "quality";

interface Region {
  id: string;
  name: string;
  city: string;
  language: string;
  languageCode: string;
  dot: { cx: number; cy: number };
  color: string;
  glow: string;
  feedback: string;
  translation: string;
  signal: string;
  signalType: SignalType;
  confidence: number;
  reviewCount: number;
}

const REGIONS: Region[] = [
  {
    id: "punjab",
    name: "Punjab",
    city: "Amritsar",
    language: "Punjabi-English",
    languageCode: "PA",
    dot: { cx: 280, cy: 250 },
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.5)",
    feedback: '"product bahut achha hai yaar, delivery thodi slow si"',
    translation: "Product is great, delivery was a bit slow",
    signal: "Ops Bottleneck",
    signalType: "friction",
    confidence: 94,
    reviewCount: 2847,
  },
  {
    id: "delhi",
    name: "Delhi NCR",
    city: "New Delhi",
    language: "Hinglish",
    languageCode: "HI",
    dot: { cx: 330, cy: 310 },
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.5)",
    feedback: '"bhai ekdum solid product hai but customer care ka reply hi nahi aata kabhi"',
    translation: "Solid product, but customer care never replies",
    signal: "Support Failure",
    signalType: "churn",
    confidence: 97,
    reviewCount: 8291,
  },
  {
    id: "gujarat",
    name: "Gujarat",
    city: "Ahmedabad",
    language: "Gujarati-English",
    languageCode: "GU",
    dot: { cx: 140, cy: 500 },
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.5)",
    feedback: '"quality toh dhamaal chhe, pan price thodi vadhu lagyo"',
    translation: "Quality is fantastic, price feels a bit high",
    signal: "Price Sensitivity",
    signalType: "friction",
    confidence: 91,
    reviewCount: 3102,
  },
  {
    id: "maharashtra",
    name: "Maharashtra",
    city: "Mumbai",
    language: "Marathi-English",
    languageCode: "MR",
    dot: { cx: 230, cy: 630 },
    color: "#34d399",
    glow: "rgba(52,211,153,0.5)",
    feedback: '"product khupach changla aahe pan delivery che kaahich update milat nahi"',
    translation: "Product is excellent, but no delivery updates were shared",
    signal: "Delivery Gap",
    signalType: "friction",
    confidence: 88,
    reviewCount: 5634,
  },
  {
    id: "telangana",
    name: "Telangana",
    city: "Hyderabad",
    language: "Telugu-English",
    languageCode: "TE",
    dot: { cx: 380, cy: 680 },
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.5)",
    feedback: '"bagundi but support chala slow ga undi, frustrated feel avutunna boss"',
    translation: "Product is good, but support is very slow. Feeling frustrated",
    signal: "Churn Risk",
    signalType: "churn",
    confidence: 96,
    reviewCount: 4210,
  },
  {
    id: "karnataka",
    name: "Karnataka",
    city: "Bengaluru",
    language: "Kannada-English",
    languageCode: "KN",
    dot: { cx: 330, cy: 780 },
    color: "#f43f5e",
    glow: "rgba(244,63,94,0.5)",
    feedback: '"product super aagide, but subscription pricing thumba dhenga aagide maga"',
    translation: "Product is great, but subscription pricing is very expensive",
    signal: "Pricing Resistance",
    signalType: "churn",
    confidence: 93,
    reviewCount: 6738,
  },
  {
    id: "tamilnadu",
    name: "Tamil Nadu",
    city: "Chennai",
    language: "Tanglish",
    languageCode: "TA",
    dot: { cx: 410, cy: 810 },
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.5)",
    feedback: '"product romba nalla irukku, aaana delivery vera level slow da. follow up pannanum"',
    translation: "Product is really good, but delivery is another level of slow",
    signal: "Ops Bottleneck",
    signalType: "friction",
    confidence: 92,
    reviewCount: 7891,
  },
  {
    id: "kerala",
    name: "Kerala",
    city: "Kochi",
    language: "Malayalam-English",
    languageCode: "ML",
    dot: { cx: 310, cy: 860 },
    color: "#10b981",
    glow: "rgba(16,185,129,0.5)",
    feedback: '"product nannayittundu, pero delivery veganam aakende. overall satisfied"',
    translation: "Product is good, but delivery needs to be faster. Overall satisfied",
    signal: "Opportunity Signal",
    signalType: "opportunity",
    confidence: 89,
    reviewCount: 2156,
  },
  {
    id: "westbengal",
    name: "West Bengal",
    city: "Kolkata",
    language: "Bangla-English",
    languageCode: "BN",
    dot: { cx: 650, cy: 480 },
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.5)",
    feedback: '"product ta ektu slow kintu quality osadharon. daam ta ektu beshi"',
    translation: "Product is a bit slow but quality is extraordinary. Price is a bit high",
    signal: "Quality ✓ Price ✗",
    signalType: "friction",
    confidence: 90,
    reviewCount: 3847,
  },
];

const SIGNAL_CONFIG: Record<SignalType, { icon: any; textColor: string; bg: string; border: string }> = {
  churn: {
    icon: AlertTriangle,
    textColor: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
  },
  friction: {
    icon: Zap,
    textColor: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
  },
  opportunity: {
    icon: TrendingUp,
    textColor: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
  quality: {
    icon: Globe,
    textColor: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
  },
};

// ─── Typewriter Hook ──────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return displayed;
}

// ─── Panel Component ──────────────────────────────────────────────────────
function RegionPanel({ region }: { region: Region }) {
  const typedText = useTypewriter(region.feedback, 22);
  const cfg = SIGNAL_CONFIG[region.signalType];
  const Icon = cfg.icon;

  return (
    <motion.div
      key={region.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5 h-full"
    >
      {/* Region header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: region.color }}
            />
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
              {region.city}, {region.name}
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-full w-fit border"
            style={{
              backgroundColor: `${region.color}15`,
              borderColor: `${region.color}30`,
            }}
          >
            <Globe className="w-3 h-3" style={{ color: region.color }} />
            <span className="text-[11px] font-semibold" style={{ color: region.color }}>
              {region.language}
            </span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <span className="text-[10px] text-white/25 uppercase tracking-widest">Confidence</span>
          <span className="text-2xl font-light text-white/80 leading-none">{region.confidence}%</span>
        </div>
      </div>

      {/* Raw feedback (typewriter) */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5 flex flex-col gap-3">
        <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Raw Customer Feedback</span>
        <p className="text-sm sm:text-base font-medium text-white/90 leading-relaxed min-h-[3.5rem]">
          {typedText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.7 }}
            className="inline-block w-[2px] h-[1em] bg-white/60 ml-0.5 align-middle"
          />
        </p>
        <div className="pt-2 border-t border-white/[0.06]">
          <span className="text-[10px] text-white/25 uppercase tracking-widest">Prism Translation</span>
          <p className="text-xs text-white/45 mt-1 italic">{region.translation}</p>
        </div>
      </div>

      {/* Extracted signal */}
      <div className={`flex items-center justify-between rounded-xl border ${cfg.bg} ${cfg.border} px-4 py-3`}>
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 ${cfg.textColor}`} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Signal Detected</span>
            <span className={`text-sm font-semibold ${cfg.textColor}`}>{region.signal}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] text-white/30 uppercase tracking-widest">Reviews</span>
          <span className="text-sm font-medium text-white/60">{region.reviewCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <span className="text-[10px] text-white/25 uppercase tracking-widest">Signal Confidence</span>
          <span className="text-[10px] text-white/40">{region.confidence}%</span>
        </div>
        <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            key={region.id + "_bar"}
            className="h-full rounded-full"
            style={{ backgroundColor: region.color }}
            initial={{ width: "0%" }}
            animate={{ width: `${region.confidence}%` }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function PrismLanguageMap() {
  const [activeId, setActiveId] = useState<string>(REGIONS[0].id);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });

  const activeRegion = REGIONS.find((r) => r.id === activeId) ?? REGIONS[0];

  // Auto-cycle
  useEffect(() => {
    if (isPaused || !isInView) return;
    const timer = setInterval(() => {
      setActiveId((prev) => {
        const idx = REGIONS.findIndex((r) => r.id === prev);
        return REGIONS[(idx + 1) % REGIONS.length].id;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, isInView]);

  const handleDotHover = useCallback((id: string) => {
    setActiveId(id);
    setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-32 border-b border-white/5 relative overflow-hidden bg-[#030305]"
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{
            background: activeRegion.glow.replace("0.5", "0.06"),
            left: "20%",
            top: "20%",
          }}
          animate={{ background: activeRegion.glow.replace("0.5", "0.06") }}
          transition={{ duration: 1.2 }}
        />
        <div className="absolute right-0 top-1/3 w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-semibold tracking-widest uppercase text-white/50 mb-6">
            <Globe className="w-3 h-3 text-emerald-400" /> Linguistic Coverage
          </div>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tighter text-white mb-4 leading-[1.05]">
            The only AI that thinks<br />
            <span className="text-white/35">in your customer&apos;s language.</span>
          </h2>
          <p className="text-base text-white/40 max-w-xl mx-auto leading-relaxed">
            Prism natively understands code-switching, mixed scripts, and regional slang — from Tanglish to Hinglish to Bangla-English — without losing a single signal.
          </p>
        </motion.div>

        {/* ── Main Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-center">

          {/* LEFT: India Map SVG */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg mx-auto lg:mx-0"
            onMouseLeave={handleMouseLeave}
          >
            <svg
              viewBox="0 0 1000 1000"
              className="w-full h-auto select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Subtle inner glow behind map */}
              <defs>
                <filter id="glow-filter">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="mapFill" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
                </radialGradient>
              </defs>

              {/* India silhouette */}
              <path
                d={INDIA_PATH}
                fill="url(#mapFill)"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />

              {/* Active region glow spread (behind dots) */}
              {REGIONS.map((r) => {
                const isActive = r.id === activeId;
                return isActive ? (
                  <motion.circle
                    key={r.id + "_spread"}
                    cx={r.dot.cx}
                    cy={r.dot.cy}
                    initial={{ r: 0, opacity: 0 }}
                    animate={{ r: 40, opacity: 0.12 }}
                    transition={{ duration: 0.6 }}
                    fill={r.color}
                  />
                ) : null;
              })}

              {/* Connection line to panel — horizontal line going right */}
              {REGIONS.map((r) => {
                const isActive = r.id === activeId;
                return isActive ? (
                  <motion.line
                    key={r.id + "_line"}
                    x1={r.dot.cx}
                    y1={r.dot.cy}
                    x2={1000}
                    y2={r.dot.cy}
                    stroke={r.color}
                    strokeWidth="1.5"
                    strokeDasharray="8 6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.35 }}
                    transition={{ duration: 0.5 }}
                  />
                ) : null;
              })}

              {/* Dots for all regions */}
              {REGIONS.map((r) => {
                const isActive = r.id === activeId;
                return (
                  <g
                    key={r.id}
                    className="cursor-pointer"
                    onMouseEnter={() => handleDotHover(r.id)}
                    onClick={() => handleDotHover(r.id)}
                  >
                    {/* Outer pulse ring */}
                    {isActive && (
                      <>
                        <motion.circle
                          cx={r.dot.cx}
                          cy={r.dot.cy}
                          fill="none"
                          stroke={r.color}
                          strokeWidth="3"
                          initial={{ r: 16, opacity: 0.6 }}
                          animate={{ r: 40, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                        />
                        <motion.circle
                          cx={r.dot.cx}
                          cy={r.dot.cy}
                          fill="none"
                          stroke={r.color}
                          strokeWidth="2"
                          initial={{ r: 16, opacity: 0.4 }}
                          animate={{ r: 56, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.4 }}
                        />
                      </>
                    )}

                    {/* Middle ring */}
                    <circle
                      cx={r.dot.cx}
                      cy={r.dot.cy}
                      r={isActive ? 14 : 10}
                      fill={`${r.color}25`}
                      stroke={r.color}
                      strokeWidth={isActive ? 3 : 2}
                      style={{ transition: "all 0.3s ease" }}
                    />

                    {/* Core dot */}
                    <circle
                      cx={r.dot.cx}
                      cy={r.dot.cy}
                      r={isActive ? 7 : 5}
                      fill={r.color}
                      filter={isActive ? "url(#glow-filter)" : undefined}
                      style={{ transition: "all 0.3s ease" }}
                    />

                    {/* Language code label (active only) */}
                    {isActive && (
                      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <rect
                          x={r.dot.cx + 20}
                          y={r.dot.cy - 18}
                          width={52}
                          height={32}
                          rx={8}
                          fill={r.color}
                          opacity={0.9}
                        />
                        <text
                          x={r.dot.cx + 46}
                          y={r.dot.cy + 3}
                          textAnchor="middle"
                          fontSize="16"
                          fontWeight="700"
                          fill="#000"
                          fontFamily="monospace"
                        >
                          {r.languageCode}
                        </text>
                      </motion.g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Bottom stat strip */}
            <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
              {[
                { value: "9", label: "Languages" },
                { value: "47k+", label: "Reviews / mo" },
                { value: "~99%", label: "Signal Accuracy" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-0.5">
                  <span className="text-lg font-semibold text-white tracking-tight">{s.value}</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT: Active Region Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Glowing border accent */}
            <div
              className="absolute -inset-px rounded-2xl pointer-events-none transition-all duration-700"
              style={{ boxShadow: `0 0 40px 0 ${activeRegion.glow.replace("0.5", "0.15")}` }}
            />

            <div className="relative rounded-2xl border border-white/[0.08] bg-[#0d0d0f] p-7 h-full min-h-[400px] flex flex-col">
              {/* Top inset highlight */}
              <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Region selector dots (bottom nav) */}
              <div className="flex items-center gap-1.5 mb-6 flex-wrap">
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setActiveId(r.id); setIsPaused(true); }}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: r.id === activeId ? r.color : "rgba(255,255,255,0.15)",
                      transform: r.id === activeId ? "scale(1.4)" : "scale(1)",
                    }}
                  />
                ))}
                <span className="ml-2 text-[10px] text-white/25 uppercase tracking-widest">
                  {REGIONS.findIndex((r) => r.id === activeId) + 1} / {REGIONS.length}
                </span>
              </div>

              {/* Animated content */}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <RegionPanel key={activeId} region={activeRegion} />
                </AnimatePresence>
              </div>

              {/* Progress bar (auto-cycle indicator) */}
              {!isPaused && (
                <div className="mt-6 h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    key={activeId + "_progress"}
                    className="h-full rounded-full"
                    style={{ backgroundColor: activeRegion.color }}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4.5, ease: "linear" }}
                  />
                </div>
              )}
              {isPaused && (
                <div className="mt-6 flex items-center gap-2">
                  <div className="h-[2px] flex-1 rounded-full" style={{ backgroundColor: `${activeRegion.color}30` }} />
                  <span className="text-[9px] text-white/20 uppercase tracking-widest">Paused</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
