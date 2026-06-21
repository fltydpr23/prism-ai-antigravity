"use client";
import React, { useState } from "react";
import posthog from "posthog-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, AlertCircle, CheckCircle2,
  Activity, Download, Copy, UploadCloud, Brain,
  FileText, ArrowRight, X,
  TrendingUp, TrendingDown, Users, AlertTriangle, Zap,
  BarChart3, Target, Heart,
  ShieldAlert, Globe, Eye, Check, ChevronDown,
  Crosshair, Layers, Flame, TriangleAlert, MessageSquare,
  Share2, Printer, Link as LinkIcon, Loader2, Bot, Clock
} from "lucide-react";
import MagneticButton from "./MagneticButton";
import { calculatePrismScore } from "../../lib/prismScore";
import { INDUSTRY_MAP } from "../../lib/industryConfig";


import PrismPaywall from "./PrismPaywall";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LocalModel = Record<string, any> | undefined;
type AnalysisResponse = {
  ok?: boolean;
  analysis?: {
    luneSignature?: { hue?: number };
    metrics?: Record<string, unknown>;
    localModel?: { parsed?: unknown; parseError?: string; ok?: boolean; error?: string; raw?: string } | null;
    [key: string]: unknown;
  } | null;
  saved?: boolean | null;
  id?: string | null;
  persistError?: string;
  error?: string;
};

interface Props {
  response: AnalysisResponse | null;
  onReset: () => void;
  isReadOnly?: boolean;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  
  React.useEffect(() => {
    let startTime: number | null = null;
    const duration = 1600; // Matches score-draw animation
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setCount(Math.round(ease * value));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <>{count}</>;
}

function PanelLabel({ icon: Icon, label, accent = "text-white/30" }: { icon: React.ElementType; label: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon style={{ width: 11, height: 11 }} className={accent} />
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">{label}</span>
    </div>
  );
}

function EmptySlot({ msg }: { msg: string }) {
  return <p className="text-xs text-white/20 italic py-2">{msg}</p>;
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────

function RadarChart({ dimensions }: { dimensions: ReturnType<typeof calculatePrismScore>["dimensions"] }) {
  const SIZE = 200;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 78;

  const axes = [
    { key: "SIG", label: "Signal",      color: "#34d399" },
    { key: "CON", label: "Contradict.", color: "#22d3ee" },
    { key: "EMO", label: "Emotion",     color: "#fbbf24" },
    { key: "STR", label: "Strategy",    color: "#22d3ee" },
    { key: "CHR", label: "Churn",       color: "#f87171" },
    { key: "SEG", label: "Segments",    color: "#34d399" },
  ] as const;

  const angleStep = (2 * Math.PI) / axes.length;
  const startAngle = -Math.PI / 2;

  const toXY = (angle: number, r: number) => ({
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  });

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1];

  const ringPoints = (fraction: number) =>
    axes.map((_, i) => {
      const { x, y } = toXY(startAngle + i * angleStep, R * fraction);
      return `${x},${y}`;
    }).join(" ");

  // Score polygon
  const scorePts = axes.map((a, i) => {
    const dim = dimensions[a.key as keyof typeof dimensions];
    const frac = dim ? dim.score / dim.max : 0;
    const { x, y } = toXY(startAngle + i * angleStep, R * frac);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
      {/* Grid rings */}
      {rings.map((r, ri) => (
        <polygon key={ri}
          points={ringPoints(r)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.8}
        />
      ))}

      {/* Axis spokes */}
      {axes.map((_, i) => {
        const { x, y } = toXY(startAngle + i * angleStep, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} />;
      })}

      {/* Score filled polygon */}
      <polygon
        points={scorePts}
        fill="rgba(52,211,153,0.12)"
        stroke="rgba(52,211,153,0.6)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        className="radar-polygon"
      />

      {/* Score dots */}
      {axes.map((a, i) => {
        const dim = dimensions[a.key as keyof typeof dimensions];
        const frac = dim ? dim.score / dim.max : 0;
        const { x, y } = toXY(startAngle + i * angleStep, R * frac);
        return (
          <circle key={i} cx={x} cy={y} r={3.5}
            fill={a.color}
            style={{ filter: `drop-shadow(0 0 4px ${a.color}80)`, animationDelay: `${i * 0.08}s` }}
            className="radar-dot"
          />
        );
      })}

      {/* Axis labels */}
      {axes.map((a, i) => {
        const { x, y } = toXY(startAngle + i * angleStep, R + 16);
        return (
          <text key={i} x={x} y={y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={8} fontWeight={600}
            letterSpacing="0.08em"
            fill="rgba(255,255,255,0.35)"
            style={{ textTransform: "uppercase" }}
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Expandable Card ─────────────────────────────────────────────────────────

function ExpandableCard({ title, icon: Icon, badge, children, accentClass = "panel-cyan", defaultOpen = false }:
  { title: string; icon: React.ElementType; badge?: string; children: React.ReactNode; accentClass?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`intel-panel ${accentClass}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Icon style={{ width: 13, height: 13 }} className="text-white/40" />
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">{title}</span>
          {badge && <span className="badge badge-emerald text-[9px] px-2">{badge}</span>}
        </div>
        <ChevronDown
          style={{ width: 14, height: 14 }}
          className={`text-white/25 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <div className="border-t border-white/5 pt-4">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Evidence Drawer ─────────────────────────────────────────────────────────

function EvidenceDrawer({ item }: { item: any }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-rose-500/5 border border-rose-500/10 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-1">
          <p className="text-[11px] text-white/40 mb-1.5">
            Say: <span className="italic text-white/60">&ldquo;{item.what_they_say}&rdquo;</span>
          </p>
          <p className="text-[11px] text-rose-400">
            Actually: <span className="text-rose-300/70 italic">&ldquo;{item.what_they_do}&rdquo;</span>
          </p>
          {item.severity && (
            <span className={`mt-2 inline-block badge text-[9px] ${item.severity === "high" ? "badge-crimson" : "badge-amber"}`}>
              {item.severity} severity
            </span>
          )}
        </div>
        <div className="shrink-0 pt-1">
          <ChevronDown 
            className={`w-3.5 h-3.5 text-white/20 transition-transform duration-300 ${open ? "rotate-180 text-rose-400" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-4 pb-4 pt-1">
              <div className="bg-black/30 rounded-lg p-3 border border-white/5 shadow-inner">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Eye className="w-3 h-3 text-rose-400/70" />
                  <span className="text-[9px] font-semibold tracking-wider uppercase text-rose-400/70">Strategic Impact</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed italic">
                  {item.why_it_matters || "This behavioral gap indicates a hidden friction point where actual user actions diverge from stated preferences."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PrismResults({ response, onReset, isReadOnly = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  // Track the report ID — either from the initial save or from an on-demand save
  const [resolvedId, setResolvedId] = useState<string | null>(response?.id ?? null);
  const analysis = response?.analysis;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseLm = analysis?.localModel?.parsed as LocalModel;
  
  // Variant Support
  const variants = baseLm?.variants as Record<string, LocalModel> | undefined;
  const variantKeys = variants ? Object.keys(variants) : [];
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  
  const lm = (selectedVariant && variants ? variants[selectedVariant] : baseLm) as Record<string, any>;

  const downloadRaw = () => {
    const d = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response, null, 2));
    const a = document.createElement("a"); a.href = d; a.download = "prism-analysis.json"; a.click();
    posthog.capture("report_downloaded", { report_id: resolvedId });
  };

  const copyReport = () => {
    let md = "# Prism Intelligence Report\n\n";
    if (baseLm?.executive_summary) md += `## Executive Summary\n${baseLm.executive_summary}\n\n`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    posthog.capture("report_copied", { report_id: resolvedId });
  };

  const shareLink = () => {
    const id = resolvedId;
    const url = id
      ? `${window.location.origin}/report/${id}`
      : window.location.href;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
    posthog.capture("report_shared", { report_id: id, has_saved_id: !!id });
  };

  // Save on-demand then open the premium print page
  const openPdf = async () => {
    if (pdfLoading) return;
    let id = resolvedId;

    // If we already have an ID, go straight to print
    if (id) {
      posthog.capture("report_exported_pdf", { report_id: id, on_demand_save: false });
      window.open(`/report/${id}/print`, "_blank");
      return;
    }

    // No saved ID — save on-the-fly
    setPdfLoading(true);
    try {
      const text = analysis ? JSON.stringify(analysis) : "";
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, persist: true, skipLocalModel: true }),
      });
      const data = await res.json();
      if (data?.id) {
        setResolvedId(data.id);
        posthog.capture("report_exported_pdf", { report_id: data.id, on_demand_save: true });
        window.open(`/report/${data.id}/print`, "_blank");
      } else {
        // Fallback: pass raw analysis via sessionStorage and open generic print
        sessionStorage.setItem("prism_print_data", JSON.stringify(response));
        window.open("/print-preview", "_blank");
      }
    } catch {
      alert("Could not prepare PDF. Please ensure Supabase is configured.");
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Paywall states ─────────────────────────────────────────────────────────
  if (response?.error === "limit_reached" || (response as any)?.requiresSignup) {
    return <PrismPaywall mode="signup" visible={true} />;
  }

  if ((response as any)?.requiresUpgrade) {
    return <PrismPaywall mode="upgrade" visible={true} onDismiss={onReset} />;
  }

  if (response?.error) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-6 py-24">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white/80">Analysis Failed</h2>
        <p className="text-sm text-white/40 max-w-sm">{response.error}</p>
        <MagneticButton onClick={onReset} className="glass-pill px-5 py-2.5 text-sm font-medium text-white">Try Again</MagneticButton>
      </motion.div>
    );
  }

  if (!baseLm) {
    const isMissingConfig = analysis && !("localModel" in analysis);
    const parseErr = analysis?.localModel?.parseError || analysis?.localModel?.error;
    const title = isMissingConfig ? "LLM Analysis Unconfigured" : "Unexpected Response Structure";
    const desc = isMissingConfig 
      ? "The server completed basic metrics analysis but skipped LLM generation because the local LLM environment variables (e.g. LOCAL_LLM_ENABLED, TOGETHER_API_KEY) are not set on Vercel."
      : "The model completed analysis but the output couldn't be parsed into the expected report structure.";

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="prism-card p-10 text-center flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>
        <h2 className="text-lg text-white/80">{title}</h2>
        <p className="text-sm text-white/45 max-w-md">{desc}</p>
        {parseErr && (
          <div className="mt-2 p-3 bg-black/40 rounded-xl border border-white/5 text-left max-w-lg w-full">
            <span className="label block mb-1">Parse Error</span>
            <code className="text-xs text-rose-300 font-mono">{parseErr}</code>
          </div>
        )}
        <div className="flex gap-4">
          <MagneticButton onClick={onReset} className="glass-pill px-5 py-2 text-sm font-medium text-white">Try Again</MagneticButton>
          <MagneticButton onClick={downloadRaw} className="glass-pill px-5 py-2 text-sm font-medium text-white/50 hover:text-white flex items-center gap-2">
            <Download className="w-4 h-4" /> Raw Output
          </MagneticButton>
        </div>
      </motion.div>
    );
  }

  // ── Data extraction ───────────────────────────────────────────────────────
  const scoreResult = calculatePrismScore(analysis || {}, lm || {});
  const qa = lm.quantitative_analysis || {};
  const isQuantitative = Object.keys(qa).length > 0;
  
  const cf = lm.consumer_feedback || {};
  const wm = lm.workforce_metrics || {};
  const sentiment = cf.sentiment_trajectory || {};
  const contradictions: any[] = cf.contradiction_analysis || [];
  const features: any[] = cf.feature_requests || [];
  const emotions: any[] = cf.emotions || lm.emotions || [];
  const segments: any[] = cf.psychographic_segments || lm.psychographic_segments || [];
  const churnAnalysis = cf.churn_risk_analysis || lm.churn_risk_analysis || {};
  const churnSignals: any[] = churnAnalysis.high_risk_signals || [];
  const recommendations: any[] = cf.strategic_recommendations || lm.strategic_recommendations || [];
  const automationRisk: any[] = lm.automation_risk_by_sector || [];
  const sectors: any[] = lm.opportunity_sectors || [];
  const reskilling: any[] = lm.reskilling_readiness_gap || [];
  const passionIndex = cf.passion_index || lm.passion_index;
  const realityChecks: any[] = cf.reality_checks || lm.reality_checks || [];

  // Quantitative fields
  const statSummary = qa.statistical_summary || "";
  const keyCorrelations = qa.key_correlations || [];
  const outliers = qa.outlier_detection || [];
  const clusters = qa.cluster_profiles || [];
  const predictiveInsights = qa.predictive_insights || [];

  const sentimentColor = sentiment.overall_sentiment === "positive" ? "text-emerald-400" :
    sentiment.overall_sentiment === "negative" ? "text-rose-400" : "text-amber-400";

  const displayScore = scoreResult.total;
  const r = 52, circ = 2 * Math.PI * r;
  const offset = circ - (displayScore / 100) * circ;
  const ringColor = displayScore >= 75 ? "#34d399" : displayScore >= 60 ? "#f59e0b" : displayScore >= 40 ? "#f97316" : "#f87171";

  const subscores = [
    { key: "SIG", label: "Signal Clarity",      score: scoreResult.dimensions.SIG.score, max: scoreResult.dimensions.SIG.max, color: "bg-emerald-400" },
    { key: "CON", label: "Contradiction Depth", score: scoreResult.dimensions.CON.score, max: scoreResult.dimensions.CON.max, color: "bg-cyan-400"    },
    { key: "EMO", label: "Emotional Precision", score: scoreResult.dimensions.EMO.score, max: scoreResult.dimensions.EMO.max, color: "bg-amber-400"   },
    { key: "STR", label: "Market Opportunity Detection", score: scoreResult.dimensions.STR.score, max: scoreResult.dimensions.STR.max, color: "bg-cyan-400"    },
    { key: "CHR", label: "Churn Exposure",      score: scoreResult.dimensions.CHR.score, max: scoreResult.dimensions.CHR.max, color: "bg-rose-400"    },
    { key: "SEG", label: "Segment Resolution",  score: scoreResult.dimensions.SEG.score, max: scoreResult.dimensions.SEG.max, color: "bg-violet-400"  },
  ];

  const dimensionLabels: Record<string, string> = {
    'Signal Clarity': 'SIG', 'Contradiction Depth': 'CON', 'Emotional Precision': 'EMO',
    'Market Opportunity Detection': 'STR', 'Churn Exposure': 'CHR', 'Segment Resolution': 'SEG'
  };
  const weakestKey = dimensionLabels[scoreResult.weakest] as keyof typeof scoreResult.dimensions | undefined;
  const weakestTip = weakestKey ? scoreResult.dimensions[weakestKey].tip : "";

  // Extract company name from summary
  const summaryWords = (lm.executive_summary || "").split(" ");
  const companyGuess = summaryWords[0] || "PRISM";

  // Extract industry from analysis response
  const industryMeta = (response?.analysis as any)?.industry as {
    id: string; label: string; emoji: string;
    detectionMethod: "user_selected" | "auto_detected"; confidence: string;
  } | undefined;
  const industryDef = industryMeta?.id ? INDUSTRY_MAP[industryMeta.id as keyof typeof INDUSTRY_MAP] : undefined;
  const panelLabels = industryDef?.panelLabels ?? {
    emotions: "Emotional Signals",
    features: "Feature Requests",
    churn: "Churn Risk Signals",
    segments: "Psychographic Segments",
    contradictions: "Contradiction Map",
  };


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4 pb-16"
    >
      {/* ── Sticky War Room Header ─────────────────────────────────────── */}
      <div className="war-room-header -mx-4 px-6 py-3 flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 neon-dot" />
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30">Prism Live</span>
          <span className="text-[10px] text-white/15 mx-1">·</span>
          <span className="text-xs font-medium text-white/50 truncate max-w-[180px]">{companyGuess} Intelligence Report</span>
          {/* Industry Badge */}
          {industryMeta && industryMeta.id !== "auto" && (
            <>
              <span className="text-[10px] text-white/10 mx-1">|</span>
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-white/5 text-white/50"
                title={industryMeta.detectionMethod === "user_selected" ? "Manually selected" : `Auto-detected (${industryMeta.confidence} confidence)`}
              >
                <span>{industryMeta.emoji}</span>
                <span>{industryMeta.label}</span>
                {industryMeta.detectionMethod === "auto_detected" && (
                  <span className="text-white/20 text-[9px] ml-0.5">auto</span>
                )}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">

          <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase bg-gradient-to-r ${scoreResult.bandColor} text-white shadow-sm`}>
            {scoreResult.band} · {displayScore}
          </div>
          {response?.saved && <span className="badge badge-emerald gap-1 text-[9px]"><CheckCircle2 style={{ width: 9, height: 9 }} /> Saved</span>}
          <MagneticButton onClick={copyReport} intensity={0.1} className="glass-pill px-3 py-1.5 text-[11px] font-medium text-white/50 hover:text-white gap-1.5 transition-colors">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <FileText className="w-3 h-3" />} {copied ? "Copied" : "Copy"}
          </MagneticButton>
          <MagneticButton onClick={shareLink} intensity={0.1} className="glass-pill px-3 py-1.5 text-[11px] font-medium text-white/50 hover:text-white gap-1.5 transition-colors">
            {linkCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <LinkIcon className="w-3 h-3" />} {linkCopied ? "Copied!" : "Share"}
          </MagneticButton>
          <MagneticButton onClick={openPdf} intensity={0.1} className="glass-pill px-3 py-1.5 text-[11px] font-medium text-white/50 hover:text-white gap-1.5 transition-colors">
            {pdfLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />} {pdfLoading ? "Saving…" : "PDF"}
          </MagneticButton>
          <MagneticButton onClick={downloadRaw} intensity={0.1} className="glass-pill px-3 py-1.5 text-[11px] font-medium text-white/50 hover:text-white gap-1.5 transition-colors">
            <Download className="w-3 h-3" /> JSON
          </MagneticButton>
          {!isReadOnly && (
            <button onClick={onReset} className="text-[11px] text-white/25 hover:text-white transition-colors flex items-center gap-1 ml-1">
              <ArrowRight className="w-3 h-3 rotate-180" /> New
            </button>
          )}
        </div>
      </div>
      
      {/* ── Coverage Stats ───────────────────────────────── */}
      {baseLm?.coverage && (
        <div className="flex flex-wrap items-center gap-3 px-1 mb-2 text-[10px] text-white/50 tracking-wider">
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <span className="font-semibold text-white/70">Rows Analyzed:</span>
            <span className="text-emerald-400 font-mono">{(baseLm.coverage.totalRowsProcessed || 0).toLocaleString()} <span className="text-white/20">/ {(baseLm.coverage.totalRowsAvailable || 0).toLocaleString()}</span></span>
          </div>
          {baseLm.coverage.mode === "parallel_sampled" && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-amber-400">
               <Zap className="w-3 h-3" /> Accelerated Sample
            </div>
          )}
          {baseLm.coverage.mode === "background" && (
             <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-emerald-400">
               <CheckCircle2 className="w-3 h-3" /> Comprehensive Analysis
             </div>
          )}
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <span className="font-semibold text-white/70">Variants Analyzed:</span>
            <span className="text-cyan-400 font-mono">{baseLm.coverage.variantsAnalyzed || 0} <span className="text-white/20">/ {baseLm.coverage.totalVariantsFound || 0}</span></span>
          </div>
        </div>
      )}

      {/* ── Variant Tabs (if applicable) ───────────────────────────────── */}
      {variantKeys.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1 mb-2">
          <button
            onClick={() => setSelectedVariant(null)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wider transition-all border ${
              selectedVariant === null 
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10"
            }`}
          >
            OVERALL MARKET
          </button>
          
          {variantKeys.map(key => (
            <button
              key={key}
              onClick={() => setSelectedVariant(key)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wider transition-all border ${
                selectedVariant === key 
                  ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]" 
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10"
              }`}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* ── Hero Panel: Score Ring + Radar Chart ───────────────────────── */}
      <div className="intel-panel panel-emerald bg-grid-subtle p-0 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-0">

          {/* Score Ring column */}
          <div className="flex flex-col items-center justify-center gap-5 px-10 py-8 border-b lg:border-b-0 lg:border-r border-white/5">
            <div className="relative w-32 h-32">
              <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90 absolute inset-0">
                <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="9" />
                <circle cx="64" cy="64" r={r} fill="none" stroke={ringColor} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={offset} className="score-draw"
                  style={{ filter: `drop-shadow(0 0 12px ${ringColor}70)` }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="stat-number text-white" style={{ fontSize: "2rem" }}>
                  <AnimatedCounter value={displayScore} />
                </span>
                <span className="text-[9px] text-white/25 uppercase tracking-widest">/ 100</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r ${scoreResult.bandColor} text-white shadow-md`}>
              {scoreResult.band}
            </div>
            <div className="text-center">
              <p className="text-xs text-white/50 leading-relaxed max-w-[140px]">{scoreResult.interpretation}</p>
            </div>
            {passionIndex && passionIndex.score && (
              <div className="mt-2 flex flex-col items-center gap-1 group relative">
                <div className="flex items-center gap-1.5 text-[10px] text-white/50 tracking-wider">
                  <Flame className="w-3 h-3 text-rose-500" /> Passion Index: <span className="font-mono text-white/90">{passionIndex.score}/100</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-full mt-1 w-48 bg-black/80 border border-white/10 rounded-md p-2 text-[10px] text-white/60 leading-tight z-10 text-center pointer-events-none shadow-xl">
                  {passionIndex.reasoning}
                </div>
              </div>
            )}
          </div>

          {/* Subscores column */}
          <div className="flex flex-col justify-center gap-3 px-8 py-8 border-b lg:border-b-0 lg:border-r border-white/5">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/25 mb-1">Intelligence Dimensions</p>
            {subscores.map((s) => (
              <div key={s.key}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[11px] text-white/50">{s.label}</span>
                  <span className="text-[11px] font-medium font-mono" style={{ color: s.color.replace("bg-", "").includes("emerald") ? "#34d399" : s.color.includes("cyan") ? "#22d3ee" : s.color.includes("amber") ? "#fbbf24" : s.color.includes("rose") ? "#f87171" : "#a78bfa" }}>
                    {s.score}<span className="text-white/20">/{s.max}</span>
                  </span>
                </div>
                <div className="progress-bar-thick">
                  <div className={`progress-fill progress-fill-animated ${s.color}`}
                    style={{ width: `${Math.round((s.score / s.max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Radar chart column */}
          <div className="flex flex-col items-center justify-center gap-3 px-8 py-8">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/25 self-start">Signal Map</p>
            <RadarChart dimensions={scoreResult.dimensions} />
          </div>
        </div>

        {/* Improvement tip */}
        {weakestTip && (
          <div className="border-t border-white/5 px-8 py-3 flex items-center gap-2.5">
            <TriangleAlert style={{ width: 13, height: 13 }} className="text-amber-400 shrink-0" />
            <span className="text-[11px] text-white/45">
              <span className="font-semibold text-white/65">Weakest: {scoreResult.weakest} —</span> {weakestTip}
            </span>
          </div>
        )}
      </div>

      {/* ── Row 2: Executive Summary + Dynamic Trajectory ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">

        {/* Executive Summary */}
        <div className="intel-panel panel-emerald p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><Sparkles className="w-40 h-40" /></div>
          <PanelLabel icon={Eye} label="Executive Summary" accent="text-emerald-400/60" />
          <p className="text-xl lg:text-2xl font-medium tracking-tight leading-relaxed text-white/95 relative z-10">
            {lm.executive_summary || "No executive summary generated."}
          </p>
        </div>

        {/* Trajectory / Core Context (Dynamic) */}
        {isQuantitative ? (
           <div className="intel-panel panel-cyan p-6">
             <PanelLabel icon={Activity} label="Statistical Overview" accent="text-cyan-400/60" />
             <div className="flex flex-col gap-3">
               <p className="text-sm text-white/55 leading-relaxed">{statSummary || "No summary provided."}</p>
             </div>
           </div>
        ) : (
          <div className="intel-panel panel-amber p-6">
            <PanelLabel icon={Heart} label="Sentiment Trajectory" accent="text-amber-400/60" />
            {sentiment.overall_sentiment ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-semibold tracking-tight capitalize ${sentimentColor}`}>
                    {sentiment.overall_sentiment}
                  </span>
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    {sentiment.trajectory === "declining" ? <TrendingDown style={{ width: 12, height: 12 }} /> : <TrendingUp style={{ width: 12, height: 12 }} />}
                    {sentiment.trajectory || "--"}
                  </span>
                </div>
                <div className="h-px bg-white/5 w-full" />
                <p className="text-sm text-white/55 leading-relaxed">{sentiment.insight || "No insight available."}</p>
              </div>
            ) : <EmptySlot msg="No emotion data detected." />}
          </div>
        )}
      </div>

      {isQuantitative ? (
        // ── Quantitative Dashboard ──────────────────────────────────────────
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Key Correlations */}
            <div className="intel-panel panel-violet p-5">
              <PanelLabel icon={Layers} label="Key Correlations" accent="text-violet-400/60" />
              {keyCorrelations.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {keyCorrelations.map((c: any, i: number) => (
                    <div key={i} className="flex flex-col gap-1 py-2 border-b border-white/5 last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-white/80">{c.variables_involved?.join(" ↔ ") || "Correlation"}</span>
                        <span className={`badge shrink-0 text-[9px] ${c.strength === "strong" ? "badge-emerald" : c.strength === "weak" ? "badge-crimson" : "badge-amber"}`}>
                          {c.strength} correlation
                        </span>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">{c.insight}</p>
                    </div>
                  ))}
                </div>
              ) : <EmptySlot msg="No correlations detected." />}
            </div>

            {/* Cluster Profiles */}
            <div className="intel-panel panel-emerald p-5">
              <PanelLabel icon={Users} label="Cluster Profiles" accent="text-emerald-400/60" />
              {clusters.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {clusters.map((c: any, i: number) => (
                    <div key={i} className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3.5">
                      <p className="text-sm font-semibold text-white/85 mb-1">{c.cluster_name}</p>
                      <p className="text-xs text-emerald-400/70 mb-2">{c.characteristics}</p>
                      {c.business_implication && (
                        <p className="text-[11px] text-white/40 leading-snug">→ {c.business_implication}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : <EmptySlot msg="No clusters detected." />}
            </div>

            {/* Outliers */}
            <div className="intel-panel panel-crimson p-5">
              <PanelLabel icon={AlertTriangle} label="Outliers & Anomalies" accent="text-rose-400/60" />
              {outliers.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {outliers.map((o: any, i: number) => (
                    <div key={i} className="rounded-xl bg-rose-500/5 border border-rose-500/10 p-3.5">
                      <p className="text-xs font-semibold text-white/80 mb-1">{o.description}</p>
                      <p className="text-[11px] text-white/40 mb-1.5">{o.potential_cause}</p>
                      <span className={`inline-block badge text-[9px] ${o.severity === "high" ? "badge-crimson" : "badge-amber"}`}>
                        {o.severity} severity
                      </span>
                    </div>
                  ))}
                </div>
              ) : <EmptySlot msg="No outliers detected." />}
            </div>
          </div>

          {/* Predictive Insights */}
          {predictiveInsights.length > 0 && (
            <ExpandableCard title="Predictive Insights" icon={Activity} badge={`${predictiveInsights.length} forecasts`} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictiveInsights.map((pi: any, i: number) => (
                  <div key={i} className="rounded-xl bg-cyan-500/5 border border-cyan-500/10 p-4 relative group hover:bg-cyan-500/10 transition-colors">
                    <p className="text-sm font-medium text-white/80 mb-2">{pi.prediction}</p>
                    <div className="text-[11px] text-cyan-400/60 flex items-center gap-1.5 font-semibold uppercase tracking-wider mb-2">
                      <Check className="w-3 h-3" /> {pi.confidence_level} Confidence
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">{pi.recommended_action}</p>
                  </div>
                ))}
              </div>
            </ExpandableCard>
          )}
        </div>
      ) : (
        // ── Qualitative Dashboard (Legacy) ──────────────────────────────────
        <>
          {/* Row 3.5: Reality Checks (Code-Mixing / Sarcasm) */}
          {realityChecks.length > 0 && (
            <div className="intel-panel panel-amber p-5 mb-4 mt-4">
              <PanelLabel icon={MessageSquare} label="Raw Reality vs. Sanitized" accent="text-amber-400/60" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                {realityChecks.map((item: any, i: number) => (
                  <div key={i} className="group relative w-full h-36 rounded-xl overflow-hidden cursor-pointer border border-white/5 bg-white/5">
                    {/* Sanitized (Default view) */}
                    <div className="absolute inset-0 p-4 flex flex-col justify-center bg-black/40 transition-opacity duration-300 ease-in-out group-hover:opacity-0">
                      <div className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">Sanitized Report</div>
                      <p className="text-xs text-white/70 leading-relaxed">&ldquo;{item.sanitized_english}&rdquo;</p>
                      <p className="text-[9px] text-white/30 absolute bottom-3 right-4 mt-2">(Hover for Reality)</p>
                    </div>
                    
                    {/* Raw Reality (Hover view) */}
                    <div className="absolute inset-0 p-4 flex flex-col justify-center bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[10px] text-amber-400/60 uppercase tracking-widest font-semibold">Raw Quote</div>
                        {item.severity && <span className={`badge text-[9px] ${item.severity === "high" ? "badge-crimson" : "badge-amber"}`}>{item.severity}</span>}
                      </div>
                      <p className="text-sm font-medium text-amber-100 leading-relaxed italic drop-shadow-md">&ldquo;{item.raw_native_quote}&rdquo;</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row 3: Contradiction Map + Feature Requests + Emotions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Contradiction Map */}
            <div className="intel-panel panel-crimson p-5">
              <PanelLabel icon={Zap} label={panelLabels.contradictions} accent="text-rose-400/60" />
              {contradictions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {contradictions.map((item: any, i: number) => (
                    <EvidenceDrawer key={i} item={item} />
                  ))}
                </div>
              ) : <EmptySlot msg="No contradictions detected." />}
            </div>

            {/* Feature Requests */}
            <div className="intel-panel panel-cyan p-5">
              <PanelLabel icon={Target} label={panelLabels.features} accent="text-cyan-400/60" />
              {features.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {features.map((f: any, i: number) => (
                    <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-sm text-white/75 leading-snug flex-1">{f.feature}</span>
                      <span className={`badge shrink-0 text-[9px] ${f.build_priority === "critical" ? "badge-crimson" : f.build_priority === "high" ? "badge-amber" : "badge-cyan"}`}>
                        {f.build_priority}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <EmptySlot msg="No feature requests detected." />}
            </div>

            {/* Emotions */}
            <div className="intel-panel panel-violet p-5">
              <PanelLabel icon={Flame} label={panelLabels.emotions} accent="text-violet-400/60" />
              {emotions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {emotions.slice(0, 4).map((e: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className={`badge text-[9px] shrink-0 mt-0.5 ${e.intensity === "high" ? "badge-crimson" : e.intensity === "medium" ? "badge-amber" : "badge-cyan"}`}>
                        {e.intensity}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-white/75 capitalize">{e.emotion}</p>
                        {e.trigger && <p className="text-[11px] text-white/35 mt-0.5 leading-snug">{e.trigger}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptySlot msg="No emotional signals detected." />}
            </div>
          </div>

          {/* Row 4: Psychographic Segments + Churn Signals */}
          {(segments.length > 0 || churnSignals.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Segments */}
              {segments.length > 0 && (
                <div className="intel-panel panel-emerald p-5">
                  <PanelLabel icon={Users} label={panelLabels.segments} accent="text-emerald-400/60" />
                  <div className="flex flex-col gap-3">
                    {segments.map((s: any, i: number) => (
                      <div key={i} className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3.5">
                        <p className="text-sm font-semibold text-white/85 mb-1">{s.segment_name}</p>
                        {s.how_to_win_them && (
                          <p className="text-[11px] text-emerald-400/70 leading-snug">→ {s.how_to_win_them}</p>
                        )}
                        {s.retention_likelihood && (
                          <span className={`mt-2 inline-block badge text-[9px] ${s.retention_likelihood === "high" ? "badge-emerald" : s.retention_likelihood === "medium" ? "badge-amber" : "badge-crimson"}`}>
                            {s.retention_likelihood} retention
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Churn Signals */}
              {churnSignals.length > 0 && (
                <div className="intel-panel panel-crimson p-5">
                  <PanelLabel icon={ShieldAlert} label={panelLabels.churn} accent="text-rose-400/60" />
                  <div className="flex flex-col gap-3">
                    {churnSignals.map((s: any, i: number) => (
                      <div key={i} className="rounded-xl bg-rose-500/5 border border-rose-500/10 p-3.5">
                        <p className="text-xs font-medium text-white/80 mb-1.5">{s.signal}</p>
                        {s.retention_action && (
                          <p className="text-[11px] text-emerald-400/70 leading-snug">Fix: {s.retention_action}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Row 5: Strategic Recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-4">
              <ExpandableCard title="Strategic Recommendations" icon={Brain} badge={`${recommendations.length} actions`} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recommendations.map((r: any, i: number) => (
                    <div key={i} className="rounded-xl bg-black/25 border border-white/5 p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="priority-badge">{r.priority || i + 1}</span>
                        <p className="text-sm text-white/85 font-medium leading-snug">{r.action || r.recommendation}</p>
                      </div>
                      {r.why && <p className="text-[11px] text-white/40 mb-2 leading-relaxed ml-[34px]">Why: {r.why}</p>}
                      <div className="flex flex-wrap gap-1.5 ml-[34px]">
                        {r.timeline && <span className={`badge text-[9px] ${r.timeline === "now" ? "badge-crimson" : "badge-amber"}`}>{r.timeline}</span>}
                        {r.expected_outcome && <span className="badge badge-emerald text-[9px]">{r.expected_outcome}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </ExpandableCard>
            </div>
          )}
        </>
      )}

      {/* ── Row 6: Workforce / Automation (only if present) ─────────────── */}
      {(wm.workers_at_risk && wm.workers_at_risk !== "Not detected") && (
        <ExpandableCard title="Workforce & Automation Metrics" icon={BarChart3} accentClass="panel-amber" defaultOpen={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "At Risk", value: wm.workers_at_risk, trend: wm.workers_at_risk_trend, accent: "text-rose-400" },
                { label: "Automation Risk", value: wm.avg_automation_risk, trend: wm.avg_automation_risk_trend, accent: "text-amber-400" },
                { label: "Net New Roles", value: wm.net_new_roles, trend: wm.net_new_roles_trend, accent: "text-emerald-400" },
                { label: "Reskilling Ready", value: wm.reskilling_readiness, trend: wm.reskilling_readiness_trend, accent: "text-cyan-400" },
              ].map((m, i) => m.value && m.value !== "Not detected" ? (
                <div key={i} className="rounded-xl bg-black/25 border border-white/5 p-3">
                  <div className="label mb-1">{m.label}</div>
                  <div className={`text-xl font-medium tracking-tight font-mono ${m.accent}`}>{m.value}</div>
                  {m.trend && <p className="text-[10px] text-white/30 mt-1 leading-tight">{m.trend}</p>}
                </div>
              ) : null)}
            </div>
            {automationRisk.filter((s: any) => s.label !== "Not detected").length > 0 && (
              <div className="flex flex-col gap-3">
                {automationRisk.filter((s: any) => s.label !== "Not detected").map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-white/50 w-32 shrink-0 truncate">{s.label}</span>
                    <div className="progress-bar flex-1">
                      <div className="progress-fill bg-amber-500" style={{ width: s.pct || `${(s.val || 0) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-amber-400 w-9 text-right">{s.pct}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ExpandableCard>
      )}

      {/* ── Row 7: Opportunity Sectors + Reskilling (if present) ────────── */}
      {(sectors.filter((s: any) => s.name !== "Not detected").length > 0 || reskilling.filter((r: any) => r.label !== "Not detected").length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectors.filter((s: any) => s.name !== "Not detected").length > 0 && (
            <div className="intel-panel panel-emerald p-5">
              <PanelLabel icon={TrendingUp} label="Opportunity Sectors" accent="text-emerald-400/60" />
              <div className="flex flex-wrap gap-2.5">
                {sectors.filter((s: any) => s.name !== "Not detected").map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-emerald-500/8 border border-emerald-500/15 px-4 py-2.5">
                    <span className="text-sm text-white/80">{s.name}</span>
                    {s.change && <span className="text-xs font-medium text-emerald-400">{s.change}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {reskilling.filter((r: any) => r.label !== "Not detected").length > 0 && (
            <div className="intel-panel panel-cyan p-5">
              <PanelLabel icon={Layers} label="Reskilling Readiness Gap" accent="text-cyan-400/60" />
              <div className="flex flex-col gap-3">
                {reskilling.filter((r: any) => r.label !== "Not detected").map((item: any, i: number) => {
                  const val = parseInt(item.pct) || 0;
                  const color = val > 60 ? "bg-sky-500" : val > 30 ? "bg-amber-500" : "bg-rose-500";
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-white/50 w-32 shrink-0 truncate">{item.label}</span>
                      <div className="progress-bar flex-1"><div className={`progress-fill ${color}`} style={{ width: item.pct }} /></div>
                      <span className="text-xs font-medium text-white/70 w-9 text-right">{item.val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </motion.div>
  );
}
