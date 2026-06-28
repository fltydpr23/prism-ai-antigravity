"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, AlertTriangle, TrendingUp, Zap, Languages,
  ChevronRight, ChevronLeft, BookOpen, ChevronDown,
} from "lucide-react";
import { INDIA_PATH } from "./IndiaMapPath";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SampleQuote {
  quote: string;
  sentiment: "positive" | "negative" | "neutral";
}

export interface KeySignal {
  term: string;
  meaning: string;
  sentiment_weight: "positive" | "negative" | "neutral";
}

export interface SentimentBreakdown {
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
}

export interface DetectedLanguage {
  language: string;
  language_code: string;
  region_hint?: string;
  review_count_percentage: number;
  review_count_estimate?: number;
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  sentiment_intensity?: "high" | "medium" | "low";
  sentiment_breakdown?: SentimentBreakdown;
  top_themes: string[];
  // New: array of quotes
  sample_quotes?: SampleQuote[];
  // Legacy fallback
  sample_quote?: string;
  key_signals?: KeySignal[];
  script_type?: "latin_romanized" | "native_script" | "mixed";
}

export interface LanguageIntelligenceData {
  primary_language?: string;
  detected_languages?: DetectedLanguage[];
  regional_insight?: string;
  native_script_detected?: boolean;
}

interface Props {
  data: LanguageIntelligenceData;
  totalReviews?: number;
}

// ─── Map dot positions (SVG viewBox 0 0 1000 1000) ───────────────────────────
const LANGUAGE_DOT_MAP: Record<string, { cx: number; cy: number; color: string; glow: string }> = {
  TA: { cx: 410, cy: 810, color: "#3b82f6",  glow: "rgba(59,130,246,0.5)" },
  HI: { cx: 330, cy: 310, color: "#06b6d4",  glow: "rgba(6,182,212,0.5)" },
  TE: { cx: 380, cy: 680, color: "#fbbf24",  glow: "rgba(251,191,36,0.5)" },
  KN: { cx: 330, cy: 780, color: "#f43f5e",  glow: "rgba(244,63,94,0.5)" },
  ML: { cx: 310, cy: 860, color: "#10b981",  glow: "rgba(16,185,129,0.5)" },
  MR: { cx: 230, cy: 630, color: "#34d399",  glow: "rgba(52,211,153,0.5)" },
  GU: { cx: 140, cy: 500, color: "#a78bfa",  glow: "rgba(167,139,250,0.5)" },
  PA: { cx: 280, cy: 250, color: "#f59e0b",  glow: "rgba(245,158,11,0.5)" },
  BN: { cx: 650, cy: 480, color: "#8b5cf6",  glow: "rgba(139,92,246,0.5)" },
  EN: { cx: 500, cy: 460, color: "#94a3b8",  glow: "rgba(148,163,184,0.5)" },
  DE: { cx: 360, cy: 330, color: "#e879f9",  glow: "rgba(232,121,249,0.5)" }, // Devanagari Hindi
};
const DEFAULT_DOT = { cx: 400, cy: 500, color: "#94a3b8", glow: "rgba(148,163,184,0.5)" };

// ─── Sentiment config ─────────────────────────────────────────────────────────
const SENTIMENT_CFG = {
  positive: { label: "Positive", color: "#34d399", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", Icon: TrendingUp },
  negative: { label: "Negative", color: "#f87171", bg: "bg-rose-500/10",    border: "border-rose-500/20",    text: "text-rose-400",    Icon: AlertTriangle },
  mixed:    { label: "Mixed",    color: "#fbbf24", bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   Icon: Zap },
  neutral:  { label: "Neutral",  color: "#94a3b8", bg: "bg-slate-500/10",   border: "border-slate-500/20",   text: "text-slate-400",   Icon: Globe },
};

const SIGNAL_COLORS = { positive: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", negative: "text-rose-400 bg-rose-500/10 border-rose-500/20", neutral: "text-slate-400 bg-slate-500/10 border-slate-500/20" };

// ─── Quote Carousel ───────────────────────────────────────────────────────────
function QuoteCarousel({ quotes, dotColor }: { quotes: SampleQuote[]; dotColor: string }) {
  const [idx, setIdx] = useState(0);
  if (!quotes.length) return null;

  const q = quotes[idx];
  const sentCfg = SENTIMENT_CFG[q.sentiment] ?? SENTIMENT_CFG.neutral;

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
          Customer Voices
        </span>
        <div className="flex items-center gap-2">
          {/* Pagination dots */}
          <div className="flex items-center gap-1">
            {quotes.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: i === idx ? dotColor : "rgba(255,255,255,0.15)",
                  transform: i === idx ? "scale(1.3)" : "scale(1)",
                }}
              />
            ))}
          </div>
          {/* Prev/next */}
          <button
            onClick={() => setIdx((i) => (i - 1 + quotes.length) % quotes.length)}
            className="p-0.5 rounded text-white/20 hover:text-white/60 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % quotes.length)}
            className="p-0.5 rounded text-white/20 hover:text-white/60 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="px-4 pb-4 pt-2"
        >
          <p className="text-sm font-medium text-white/90 leading-relaxed">
            &ldquo;{q.quote}&rdquo;
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: sentCfg.color }}
            />
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${sentCfg.text}`}>
              {sentCfg.label}
            </span>
            <span className="text-[10px] text-white/20 ml-1">
              {idx + 1} of {quotes.length}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Sentiment Heat Bar ───────────────────────────────────────────────────────
function SentimentHeatBar({ breakdown }: { breakdown: SentimentBreakdown }) {
  const { positive_pct = 0, neutral_pct = 0, negative_pct = 0 } = breakdown;

  const segments = [
    { pct: negative_pct, color: "#f87171", label: "Neg" },
    { pct: neutral_pct,  color: "#94a3b8", label: "Neutral" },
    { pct: positive_pct, color: "#34d399", label: "Pos" },
  ].filter((s) => s.pct > 0);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">Sentiment Split</span>
      {/* Bar */}
      <div className="h-2 rounded-full overflow-hidden flex gap-0.5">
        {segments.map((s, i) => (
          <motion.div
            key={i}
            className="h-full rounded-full"
            style={{ backgroundColor: s.color, width: `${s.pct}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${s.pct}%` }}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </div>
      {/* Labels */}
      <div className="flex items-center gap-3 flex-wrap">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] text-white/40">{s.label} <span className="text-white/60 font-medium">{s.pct}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Key Signals Glossary ─────────────────────────────────────────────────────
function KeySignalsGlossary({ signals, dotColor }: { signals: KeySignal[]; dotColor: string }) {
  const [open, setOpen] = useState(false);
  if (!signals.length) return null;

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-3 h-3 text-white/30" />
          <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
            Key Signals Glossary
          </span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: `${dotColor}20`, color: dotColor }}
          >
            {signals.length}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/20 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-2 border-t border-white/5 pt-3">
              {signals.map((s, i) => (
                <div key={i} className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`shrink-0 text-[10px] px-2 py-0.5 rounded border font-mono font-semibold ${SIGNAL_COLORS[s.sentiment_weight]}`}
                    >
                      {s.term}
                    </span>
                    <span className="text-[11px] text-white/45 truncate">{s.meaning}</span>
                  </div>
                  <div
                    className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                    style={{
                      backgroundColor:
                        s.sentiment_weight === "positive" ? "#34d399" :
                        s.sentiment_weight === "negative" ? "#f87171" : "#94a3b8",
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Language Detail Panel ─────────────────────────────────────────────────────
function LanguageDetailPanel({ lang, dotColor, totalReviews }: { lang: DetectedLanguage; dotColor: string; totalReviews?: number }) {
  const sentCfg = SENTIMENT_CFG[lang.sentiment] ?? SENTIMENT_CFG.neutral;
  const SentIcon = sentCfg.Icon;

  // Resolve quotes — support both new array and legacy single quote
  const quotes: SampleQuote[] =
    lang.sample_quotes?.length
      ? lang.sample_quotes
      : lang.sample_quote
        ? [{ quote: lang.sample_quote, sentiment: lang.sentiment === "mixed" ? "neutral" : lang.sentiment }]
        : [];

  // Absolute count
  const absCount = lang.review_count_estimate && lang.review_count_estimate > 0
    ? lang.review_count_estimate
    : totalReviews
      ? Math.round((lang.review_count_percentage / 100) * totalReviews)
      : null;

  return (
    <motion.div
      key={lang.language_code}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4 h-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: dotColor }} />
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
              {lang.region_hint || lang.language}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
              style={{ backgroundColor: `${dotColor}15`, borderColor: `${dotColor}30` }}
            >
              <Languages className="w-3 h-3" style={{ color: dotColor }} />
              <span className="text-[11px] font-semibold" style={{ color: dotColor }}>
                {lang.language}
              </span>
            </div>
            {/* Script badge */}
            {lang.script_type === "native_script" && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400 font-bold tracking-wider">
                अ Native Script
              </span>
            )}
            {lang.script_type === "latin_romanized" && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/35 font-semibold">
                Aa Romanized
              </span>
            )}
            {lang.script_type === "mixed" && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/70 font-semibold">
                अ/Aa Mixed
              </span>
            )}
          </div>
        </div>

        {/* Review count — absolute + percentage */}
        <div className="text-right flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-2xl font-light text-white/80 leading-none">
            {lang.review_count_percentage}%
          </span>
          {absCount !== null && (
            <span className="text-[10px] text-white/25">
              ~{absCount.toLocaleString()} reviews
            </span>
          )}
        </div>
      </div>

      {/* Sentiment badge */}
      <div className={`flex items-center gap-3 rounded-xl border ${sentCfg.bg} ${sentCfg.border} px-4 py-2.5`}>
        <SentIcon className={`w-4 h-4 ${sentCfg.text} shrink-0`} />
        <div className="flex flex-col gap-0.5 flex-1">
          <span className="text-[10px] text-white/30 uppercase tracking-widest">Sentiment</span>
          <span className={`text-sm font-semibold ${sentCfg.text}`}>
            {sentCfg.label}
            {lang.sentiment_intensity && (
              <span className="text-[10px] font-normal text-white/30 ml-1.5">
                · {lang.sentiment_intensity} intensity
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Sentiment heat bar */}
      {lang.sentiment_breakdown && (
        <SentimentHeatBar breakdown={lang.sentiment_breakdown} />
      )}

      {/* Quote carousel */}
      {quotes.length > 0 && <QuoteCarousel quotes={quotes} dotColor={dotColor} />}

      {/* Top themes */}
      {lang.top_themes?.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">Key Themes</span>
          <div className="flex flex-wrap gap-1.5">
            {lang.top_themes.map((theme, i) => (
              <span
                key={i}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/[0.08] text-white/55"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key signals glossary */}
      {lang.key_signals?.length ? (
        <KeySignalsGlossary signals={lang.key_signals} dotColor={dotColor} />
      ) : null}

      {/* Review share bar */}
      <div className="flex flex-col gap-1.5 mt-auto pt-1">
        <div className="flex justify-between">
          <span className="text-[10px] text-white/25 uppercase tracking-widest">Review Share</span>
          <span className="text-[10px] text-white/40">{lang.review_count_percentage}%</span>
        </div>
        <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            key={lang.language_code + "_bar"}
            className="h-full rounded-full"
            style={{ backgroundColor: dotColor }}
            initial={{ width: "0%" }}
            animate={{ width: `${lang.review_count_percentage}%` }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LanguageIntelligencePanel({ data, totalReviews }: Props) {
  const langs = (data.detected_languages ?? [])
    .filter((l) => l.review_count_percentage > 0)
    .sort((a, b) => b.review_count_percentage - a.review_count_percentage);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const activeLang = langs[activeIndex] ?? langs[0];
  const activeDot = activeLang ? (LANGUAGE_DOT_MAP[activeLang.language_code] ?? DEFAULT_DOT) : DEFAULT_DOT;

  const handleDotClick = useCallback((index: number) => setActiveIndex(index), []);

  if (!langs.length) return null;

  const langDots = langs.map((l) => ({ ...l, dot: LANGUAGE_DOT_MAP[l.language_code] ?? DEFAULT_DOT }));

  return (
    <div className="intel-panel panel-cyan overflow-hidden">

      {/* ── Panel Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Globe className="w-[11px] h-[11px] text-cyan-400/70" />
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">
            Language Intelligence
          </span>
          {data.native_script_detected && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400 font-bold tracking-wider">
              अ Native Script Detected
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/20">
            {langs.length} language{langs.length !== 1 ? "s" : ""} detected
          </span>
          {totalReviews && (
            <span className="text-[10px] text-white/15">
              {totalReviews.toLocaleString()} total reviews
            </span>
          )}
        </div>
      </div>

      {/* ── Main Layout ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-0">

        {/* LEFT: India Map */}
        <div className="relative p-5 lg:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5">
          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-1000"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 45% 55%, ${activeDot.glow.replace("0.5", "0.06")} 0%, transparent 70%)`,
            }}
          />

          <div className="relative w-full max-w-[340px] mx-auto">
            <svg
              viewBox="0 0 1000 1000"
              className="w-full h-auto select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="li-glow-v2">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <radialGradient id="li-mapFill-v2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
                </radialGradient>
              </defs>

              {/* India silhouette */}
              <path d={INDIA_PATH} fill="url(#li-mapFill-v2)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" strokeLinejoin="round" />

              {/* Active glow spread */}
              <motion.circle
                key={activeIndex + "_spread"}
                cx={activeDot.cx} cy={activeDot.cy}
                initial={{ r: 0, opacity: 0 }}
                animate={{ r: 50, opacity: 0.15 }}
                transition={{ duration: 0.5 }}
                fill={activeDot.color}
              />

              {/* Pulse rings */}
              <motion.circle key={activeIndex + "_r1"} cx={activeDot.cx} cy={activeDot.cy} fill="none" stroke={activeDot.color} strokeWidth="2.5" initial={{ r: 14, opacity: 0.7 }} animate={{ r: 50, opacity: 0 }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }} />
              <motion.circle key={activeIndex + "_r2"} cx={activeDot.cx} cy={activeDot.cy} fill="none" stroke={activeDot.color} strokeWidth="1.5" initial={{ r: 14, opacity: 0.4 }} animate={{ r: 68, opacity: 0 }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut", delay: 0.45 }} />

              {/* All language dots */}
              {langDots.map((l, i) => {
                const isActive = i === activeIndex;
                const sentColor = l.sentiment === "positive" ? "#34d399" : l.sentiment === "negative" ? "#f87171" : "#fbbf24";
                return (
                  <g key={`${l.language_code}_${i}`} className="cursor-pointer" onClick={() => handleDotClick(i)}>
                    {/* Hover glow on inactive */}
                    {!isActive && (
                      <circle cx={l.dot.cx} cy={l.dot.cy} r={22} fill={l.dot.color} opacity={0.04} className="transition-all" />
                    )}
                    {/* Outer ring */}
                    <circle cx={l.dot.cx} cy={l.dot.cy} r={isActive ? 15 : 10} fill={`${l.dot.color}22`} stroke={l.dot.color} strokeWidth={isActive ? 2.5 : 1.5} style={{ transition: "all 0.3s ease", filter: isActive ? "url(#li-glow-v2)" : undefined }} />
                    {/* Core */}
                    <circle cx={l.dot.cx} cy={l.dot.cy} r={isActive ? 7 : 5} fill={l.dot.color} style={{ transition: "all 0.3s ease" }} />
                    {/* Sentiment micro-dot on inactive */}
                    {!isActive && (
                      <circle cx={l.dot.cx} cy={l.dot.cy - 13} r={3.5} fill={sentColor} opacity={0.9} />
                    )}
                    {/* Language code pill on active */}
                    {isActive && (
                      <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                        <rect x={l.dot.cx + 18} y={l.dot.cy - 17} width={56} height={30} rx={8} fill={l.dot.color} opacity={0.92} />
                        <text x={l.dot.cx + 46} y={l.dot.cy + 3} textAnchor="middle" fontSize="15" fontWeight="800" fill="#000" fontFamily="monospace">{l.language_code}</text>
                      </motion.g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Language pill nav */}
            <div className="mt-4 flex items-center justify-center flex-wrap gap-1.5">
              {langDots.map((l, i) => {
                const isActive = i === activeIndex;
                // Absolute count for the pill
                const abs = l.review_count_estimate && l.review_count_estimate > 0
                  ? l.review_count_estimate
                  : totalReviews ? Math.round((l.review_count_percentage / 100) * totalReviews) : null;
                return (
                  <button
                    key={`${l.language_code}_${i}`}
                    onClick={() => handleDotClick(i)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: isActive ? `${l.dot.color}20` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isActive ? `${l.dot.color}50` : "rgba(255,255,255,0.08)"}`,
                      color: isActive ? l.dot.color : "rgba(255,255,255,0.35)",
                      transform: isActive ? "scale(1.06)" : "scale(1)",
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.dot.color }} />
                    {l.language_code}
                    {/* Show absolute count if available, else % */}
                    <span className="text-[9px] opacity-60">
                      {abs !== null ? `~${abs.toLocaleString()}` : `${l.review_count_percentage}%`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Detail panel */}
        <div className="relative p-5 lg:p-6 overflow-y-auto" style={{ maxHeight: "600px" }}>
          {/* Glowing accent */}
          <div
            className="absolute -inset-px rounded-br-2xl lg:rounded-tr-2xl pointer-events-none transition-all duration-700"
            style={{ boxShadow: `inset 0 0 60px 0 ${activeDot.glow.replace("0.5", "0.07")}` }}
          />
          <div className="min-h-[340px] flex flex-col relative">
            <AnimatePresence mode="wait">
              {activeLang && (
                <LanguageDetailPanel
                  key={`${activeLang.language_code}_${activeIndex}`}
                  lang={activeLang}
                  dotColor={activeDot.color}
                  totalReviews={totalReviews}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Regional Insight Footer ────────────────────────────────────────── */}
      {data.regional_insight && (
        <div className="border-t border-white/5 px-5 py-3 flex items-start gap-2.5">
          <Globe className="w-[13px] h-[13px] text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/45 leading-relaxed">
            <span className="font-semibold text-white/65">Regional Signal — </span>
            {data.regional_insight}
          </p>
        </div>
      )}
    </div>
  );
}
