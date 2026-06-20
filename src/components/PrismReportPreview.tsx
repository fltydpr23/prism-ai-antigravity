"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Sparkles, AlertTriangle, TrendingUp, ChevronRight, Check, Cpu, X, Database } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";

// ─── Report content — mirrors actual pipeline output structure ─────────────
const REPORT = {
  title: "blinkit_playstore_reviews_ Prism Intelligence Report",
  date: "June 2026",
  prismScore: 80,
  band: "Critical Alert",
  summary:
    "Blinkit faces significant customer dissatisfaction due to late deliveries, poor customer support, defective products, and issues with refunds and returns, necessitating immediate improvements in these areas to prevent further churn.",
  opportunities: [
    {
      text: "Drastically improve customer support resolution times.",
      proof: "Segment 'The Frustrated Customer' flagged as high-churn risk. Expected outcome: 25% complaint reduction.",
      proofQuote: '"worst customer care ever seen" — High Severity Reality Check',
    },
    {
      text: "Streamline the refund and return processes.",
      proof: "Strategic Priority 2. Expected outcome: 30% reduction in refund and return requests.",
      proofQuote: 'High intensity anger triggered by "defective products and issues with refunds".',
    },
  ],
  churnRisks: [
    {
      text: "Extreme contradiction in perceived vs actual service quality.",
      proof: "High-severity contradiction detected between initial tone and core message.",
      proofQuote: '"Blinkit It Wow 😂😂😂 A pathetic service provider" — Churn Risk: High',
    },
    {
      text: "Repeated complaints about poor customer support.",
      proof: "High-risk signal flagged. Trajectory is actively declining.",
      proofQuote: '"Customers are increasingly frustrated with Blinkit\'s service" — Sentiment insight',
    },
  ],
  scoreBreakdown: [
    { label: "Signal Clarity", value: 92 },
    { label: "Passion Index", value: 80 },
    { label: "Contradiction Depth", value: 88 },
    { label: "Strategic Coverage", value: 94 },
  ],
};



// ─── Typewriter hook ────────────────────────────────────────────────────────
function useTypewriter(text: string, active: boolean, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [active, text, speed]);
  return { displayed, done };
}

// ─── Tooltip component ──────────────────────────────────────────────────────
function ProofTooltip({ proof, quote, color }: { proof: string; quote: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-full left-0 mb-2 w-72 z-50 pointer-events-none"
    >
      <div className={`rounded-xl border ${color} bg-[#0d0d0d]/95 backdrop-blur-xl p-4 shadow-2xl`}>
        <div className="flex items-start gap-2 mb-3">
          <Cpu className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-white/60 leading-relaxed">{proof}</p>
        </div>
        <div className="border-l-2 border-white/10 pl-3">
          <p className="text-[11px] text-white/40 italic leading-relaxed">{quote}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Highlighted insight item ───────────────────────────────────────────────
function InsightItem({
  text, proof, quote, color, dotColor, visible,
}: {
  text: string; proof: string; quote: string;
  color: string; dotColor: string; visible: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const { displayed, done } = useTypewriter(text, visible, 20);

  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={visible ? { opacity: 1 } : {}}
      transition={{ duration: 0.3 }}
      className="relative flex items-start gap-2.5 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span
        className={`text-sm leading-relaxed cursor-default relative flex-1
          ${done
            ? `border-b border-dashed ${color} text-white/80 transition-all duration-200`
            : "text-white/30"
          }`}
      >
        {displayed}
        {done && hovered && (
          <ProofTooltip
            proof={proof}
            quote={quote}
            color={color === "border-emerald-400/40" ? "border-emerald-500/20" : "border-rose-500/20"}
          />
        )}
      </span>
      {done && (
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="ml-auto shrink-0"
        >
          <Cpu className={`w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity ${color.replace("border-", "text-").replace("/40", "")}`} />
        </motion.span>
      )}
    </motion.li>
  );
}

// ─── Animated score bar ─────────────────────────────────────────────────────
function ScoreBar({ label, value, delay, active }: { label: string; value: number; delay: number; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-gray-400 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-[2px] bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
          initial={{ width: 0 }}
          animate={active ? { width: `${value}%` } : {}}
          transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[10px] text-gray-500 w-6 text-right">{value}</span>
    </div>
  );
}

// ─── The generation stages ──────────────────────────────────────────────────
const STAGES = [
  { id: "chunking", label: "Chunking 1,361 reviews", icon: "⬡", duration: 900 },
  { id: "synthesis", label: "Synthesising insights", icon: "◈", duration: 1100 },
  { id: "structuring", label: "Structuring report", icon: "⬙", duration: 700 },
  { id: "scoring", label: "Calculating Prism Score", icon: "◎", duration: 600 },
  { id: "done", label: "Report complete", icon: "✓", duration: 0 },
];

// ─── Main Component ─────────────────────────────────────────────────────────
export default function PrismReportPreview() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const [fileDropped, setFileDropped] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<string[][]>([]);

  useEffect(() => {
    fetch('/blinkit_playstore_reviews_new.csv')
      .then(res => res.text())
      .then(text => {
        const rows = text.split(/\r?\n/).filter(Boolean).map(line => {
          const row: string[] = [];
          let inQuotes = false;
          let current = "";
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              row.push(current);
              current = "";
            } else {
              current += char;
            }
          }
          row.push(current);
          return row;
        });
        setCsvRows(rows.slice(1));
      })
      .catch(err => console.error("Error loading CSV:", err));
  }, []);

  const [stage, setStage] = useState(-1); // -1 = not started
  const [reportVisible, setReportVisible] = useState(false);
  const [summaryActive, setSummaryActive] = useState(false);
  const [oppActive, setOppActive] = useState(false);
  const [churnActive, setChurnActive] = useState(false);
  const [scoreActive, setScoreActive] = useState(false);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const { displayed: summaryText, done: summaryDone } = useTypewriter(
    REPORT.summary, summaryActive, 12
  );

  // Orchestrate the whole sequence on drop
  useEffect(() => {
    if (!fileDropped) return;

    let t = 0;
    const schedule = (fn: () => void, delay: number) => {
      t += delay;
      setTimeout(fn, t);
    };

    schedule(() => setStage(0), 200);
    schedule(() => setStage(1), STAGES[0].duration);
    schedule(() => setStage(2), STAGES[1].duration);
    schedule(() => setStage(3), STAGES[2].duration);
    schedule(() => setStage(4), STAGES[3].duration);

    schedule(() => {
      setReportVisible(true);
    }, STAGES[3].duration + 200);

    schedule(() => setSummaryActive(true), 400);
    schedule(() => setScoreActive(true), 300);
    schedule(() => {
      setOppActive(true);
    }, 600);
    schedule(() => {
      setChurnActive(true);
    }, 600);
    schedule(() => setBadgeVisible(true), 400);
  }, [fileDropped]);

  // Mouse glow tracking for the document card
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    setFileDropped(true);
  };

  // Lock body scroll when preview is open
  useEffect(() => {
    if (previewOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [previewOpen]);

  return (
    <section
      ref={sectionRef}
      className="py-32 border-b border-white/5 relative bg-[#050505] min-h-screen"
    >
      {/* ── Ambient bg glows ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/4 rounded-full blur-[120px]" />
      </div>

      {/* ── Data Preview Modal ─────────────────────────── */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setPreviewOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[90vw] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">blinkit_playstore_reviews_new.csv</h3>
                      <p className="text-[11px] text-white/40">Showing all {csvRows.length} rows</p>
                    </div>
                 </div>
                 <button onClick={() => setPreviewOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                 </button>
              </div>
              <div className="overflow-auto p-0 flex-1 custom-scrollbar">
                 <table className="w-full text-left text-[13px] border-collapse">
                    <thead className="sticky top-0 bg-[#0a0a0a] z-10 border-b border-white/10 shadow-sm">
                      <tr className="text-[11px] uppercase tracking-widest text-white/40">
                        <th className="py-4 px-6 font-medium whitespace-nowrap">Platform</th>
                        <th className="py-4 px-6 font-medium whitespace-nowrap">Company</th>
                        <th className="py-4 px-6 font-medium whitespace-nowrap">Score</th>
                        <th className="py-4 px-6 font-medium">Review Snippet</th>
                        <th className="py-4 px-6 font-medium whitespace-nowrap">Date</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/80">
                      {csvRows.map((row, i) => (
                        <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6 whitespace-nowrap text-white/60">{row[0]}</td>
                          <td className="py-4 px-6 whitespace-nowrap text-white/60">{row[1]}</td>
                          <td className="py-4 px-6 whitespace-nowrap text-emerald-400 font-medium">{row[3]}</td>
                          <td className="py-4 px-6 max-w-[500px] truncate" title={row[4]}>{row[4]}</td>
                          <td className="py-4 px-6 whitespace-nowrap text-white/40 font-mono text-[11px]">{row[6]}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] text-[11px] font-semibold tracking-widest uppercase text-emerald-400 mb-6">
            <FileText className="w-3 h-3" /> Intelligence Reports
          </div>
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tighter text-white leading-[1.02] mb-5">
            Executive reports,<br />
            <span className="text-white/35">ready for the boardroom.</span>
          </h2>
          <p className="text-lg text-white/45 leading-relaxed max-w-xl mx-auto">
            Prism synthesises thousands of raw data points into a structured,
            highly polished strategic document — in seconds, not days.
          </p>
        </motion.div>

        {/* ── Draggable Dataset Chip ────────────────────────── */}
        <div className="flex justify-center mb-16 h-14">
          <AnimatePresence>
            {!fileDropped && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="relative z-20"
              >
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", "blinkit_csv");
                    e.dataTransfer.effectAllowed = "copyMove";
                  }}
                  className="group cursor-grab active:cursor-grabbing flex items-center p-1.5 pr-4 gap-4 rounded-full border border-white/10 bg-[#141414] shadow-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:border-emerald-500/30"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                  
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex flex-col select-none">
                    <span className="text-sm font-semibold text-white tracking-tight">blinkit_playstore_reviews_new.csv</span>
                    <span className="text-[10px] text-white/40 font-mono mt-0.5">1,361 ROWS • 337KB</span>
                  </div>
                  
                  <div className="w-px h-8 bg-white/10 mx-2" />
                  
                  <button 
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest px-3 py-1.5 rounded-full hover:bg-emerald-500/10 transition-colors z-10 relative"
                  >
                    Preview
                  </button>
                </div>
                <div className="absolute -bottom-8 left-0 right-0 text-center">
                  <span className="text-[10px] font-semibold text-emerald-400/50 uppercase tracking-widest">↓ Drag to dropzone</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Two-column layout ──────────────────────────────── */}
        <div className="flex flex-col xl:flex-row gap-6 items-stretch">

          {/* Left: Generation pipeline status */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="xl:w-72 shrink-0 flex flex-col gap-3"
          >
            {/* Status card */}
            <div className={`rounded-2xl border transition-colors duration-500 p-5 ${fileDropped ? 'border-white/[0.07] bg-[#0d0d0d]' : 'border-white/[0.03] bg-[#0d0d0d]/50'}`}>
              <div className="flex items-center gap-2 mb-5">
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${fileDropped ? 'text-white/30' : 'text-white/20'}`}>Prism Engine</span>
                <motion.div
                  animate={fileDropped && stage >= 0 && stage < 4 ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                  transition={{ repeat: fileDropped && stage >= 0 && stage < 4 ? Infinity : 0, duration: 1.2 }}
                  className={`ml-auto w-2 h-2 rounded-full ${!fileDropped ? 'bg-white/10' : stage === 4 ? "bg-emerald-400" : stage >= 0 ? "bg-amber-400" : "bg-white/20"}`}
                />
              </div>
              <div className="flex flex-col gap-3">
                {!fileDropped ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                    <Database className="w-5 h-5 text-white/20" />
                    <span className="text-xs text-white/30">Awaiting dataset<br/>to begin generation</span>
                  </div>
                ) : (
                  STAGES.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[14px] shrink-0 transition-all duration-500 ${
                          stage > i
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                            : stage === i
                            ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                            : "bg-white/[0.03] border border-white/[0.06] text-white/20"
                        }`}
                      >
                        {stage > i ? <Check className="w-3.5 h-3.5" /> : s.icon}
                      </div>
                      <span
                        className={`text-xs transition-colors duration-300 ${
                          stage >= i ? "text-white/70" : "text-white/20"
                        }`}
                      >
                        {s.label}
                      </span>
                      {stage === i && (
                        <motion.div
                          className="ml-auto w-12 h-[2px] bg-white/5 rounded-full overflow-hidden"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            className="h-full bg-amber-400 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: (STAGES[i]?.duration ?? 600) / 1000, ease: "linear" }}
                          />
                        </motion.div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Score badge card */}
            <AnimatePresence>
              {badgeVisible && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-emerald-500/15 bg-[#0d0d0d] p-5"
                >
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest block mb-4">
                    Prism Score™
                  </span>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative w-16 h-16">
                      <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                        <motion.circle
                          cx="28" cy="28" r="22"
                          fill="none"
                          stroke="url(#scoreGrad)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 22}
                          initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - REPORT.prismScore / 100) }}
                          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        />
                        <defs>
                          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">{REPORT.prismScore}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-emerald-400">{REPORT.band}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">Strong signal</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {REPORT.scoreBreakdown.map((s, i) => (
                      <ScoreBar key={s.label} {...s} delay={i * 0.12} active={scoreActive} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hover hint */}
            <AnimatePresence>
              {reportVisible && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="mt-auto flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.05] bg-white/[0.02]"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-white/35">
                    Hover the insights to see the proof.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right: The Report Document OR Dropzone */}
          <div className="flex-1 min-w-0 flex flex-col relative h-[700px]">
            <AnimatePresence mode="wait">
              {!fileDropped ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed 
                    transition-all duration-300 overflow-hidden z-10
                    ${isHovering ? 'border-emerald-500/50 bg-emerald-500/[0.04]' : 'border-white/10 bg-[#0d0d0d] hover:border-white/20'}
                  `}
                >
                  <div className="relative z-10 flex flex-col items-center pointer-events-none">
                    <div className={`
                      w-20 h-20 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500
                      ${isHovering ? 'bg-emerald-500/20 shadow-[0_0_60px_rgba(16,185,129,0.3)] scale-110 border border-emerald-500/50' : 'bg-white/[0.02] border border-white/5'}
                    `}>
                      <Database className={`w-8 h-8 transition-colors duration-500 ${isHovering ? 'text-emerald-400' : 'text-white/20'}`} />
                    </div>
                    <h3 className={`text-2xl font-semibold mb-3 transition-colors duration-300 ${isHovering ? 'text-emerald-400' : 'text-white'}`}>
                      {isHovering ? "Drop to Ingest Data" : "Initialize Prism Engine"}
                    </h3>
                    <p className="text-sm text-white/40 text-center max-w-[280px] leading-relaxed">
                      Drag & drop the dataset here to instantly generate the executive intelligence report.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="report-document"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex flex-col h-full"
                >
                  {/* Browser chrome bar */}
                  <div className="rounded-t-2xl border border-white/[0.08] border-b-0 bg-[#141414] h-11 flex items-center px-4 gap-3 shrink-0">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <FileText className="w-3.5 h-3.5 text-white/35" />
                      <span className="text-[12px] font-medium text-white/40">{REPORT.title}.pdf</span>
                    </div>
                    <AnimatePresence>
                      {stage === 4 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-semibold">Generated</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Document body */}
                  <div
                    ref={cardRef}
                    onMouseMove={handleMouseMove}
                    className="relative flex-1 flex flex-col rounded-b-2xl border border-white/[0.08] overflow-hidden bg-gradient-to-br from-[#111111] to-[#050505]"
                  >
                    {/* Subtle mouse-follow glow on the surface */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-30 transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(52,211,153,0.12), transparent 60%)`,
                      }}
                    />

                    <AnimatePresence>
                      {!reportVisible ? (
                        <motion.div
                          key="skeleton"
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="p-10 md:p-14 flex flex-col gap-6 h-full"
                        >
                          {/* Skeleton loaders */}
                          {[...Array(4)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ opacity: [0.3, 0.7, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.15 }}
                              className="h-4 rounded-full bg-white/10"
                              style={{ width: `${60 + (i % 3) * 15}%` }}
                            />
                          ))}
                          <div className="h-px bg-white/5 my-2" />
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i + 10}
                              animate={{ opacity: [0.3, 0.7, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 + 0.3 }}
                              className="h-3 rounded-full bg-white/10"
                              style={{ width: `${75 + (i % 2) * 10}%` }}
                            />
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="report"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="flex-1 p-10 md:p-14 flex flex-col gap-8 relative overflow-y-auto custom-scrollbar"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2"
                              >
                                Prism Intelligence — {REPORT.date}
                              </motion.p>
                              <motion.h1
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
                              >
                                Executive Summary
                              </motion.h1>
                            </div>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 }}
                              className="flex flex-col items-end gap-1 shrink-0"
                            >
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <TrendingUp className="w-3 h-3 text-emerald-400" />
                                <span className="text-[11px] font-bold text-emerald-400">{REPORT.band}</span>
                              </div>
                              <span className="text-[10px] text-white/40">Score: {REPORT.prismScore}/100</span>
                            </motion.div>
                          </div>

                          {/* Summary paragraph — typewritten */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="border-l-[3px] border-white/10 pl-5"
                          >
                            <p className="text-sm text-white/60 leading-relaxed">
                              {summaryText}
                              {summaryActive && !summaryDone && (
                                <motion.span
                                  animate={{ opacity: [1, 0] }}
                                  transition={{ repeat: Infinity, duration: 0.6 }}
                                  className="inline-block w-[2px] h-3.5 bg-emerald-500 ml-0.5 align-middle"
                                />
                              )}
                            </p>
                          </motion.div>

                          {/* Two-column insights */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {/* Opportunities */}
                            <div>
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={oppActive ? { opacity: 1 } : {}}
                                className="flex items-center gap-2 mb-4"
                              >
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                <h3 className="text-[11px] font-bold text-white/80 uppercase tracking-widest">
                                  Key Opportunities
                                </h3>
                              </motion.div>
                              <ul className="flex flex-col gap-3">
                                {REPORT.opportunities.map((o, i) => (
                                  <InsightItem
                                    key={i}
                                    text={o.text}
                                    proof={o.proof}
                                    quote={o.proofQuote}
                                    color="border-emerald-400/40"
                                    dotColor="bg-emerald-500"
                                    visible={oppActive}
                                  />
                                ))}
                              </ul>
                            </div>

                            {/* Churn risks */}
                            <div>
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={churnActive ? { opacity: 1 } : {}}
                                className="flex items-center gap-2 mb-4"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                <h3 className="text-[11px] font-bold text-white/80 uppercase tracking-widest">
                                  Churn Risks
                                </h3>
                              </motion.div>
                              <ul className="flex flex-col gap-3">
                                {REPORT.churnRisks.map((c, i) => (
                                  <InsightItem
                                    key={i}
                                    text={c.text}
                                    proof={c.proof}
                                    quote={c.proofQuote}
                                    color="border-rose-400/40"
                                    dotColor="bg-rose-500"
                                    visible={churnActive}
                                  />
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Footer disclaimer */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                            className="mt-auto flex items-center gap-2 pt-4 border-t border-white/5"
                          >
                            <Sparkles className="w-3 h-3 text-white/30" />
                            <span className="text-[10px] text-white/30">
                              Generated by Prism Intelligence · Every insight is anchored in source data · Hover to verify.
                            </span>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
