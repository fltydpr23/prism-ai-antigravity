"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Cpu, Check, FileSpreadsheet, Database, Play } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";

// ─── Mock Reports ────────────────────────────────────────────────────────
const REPORT_HOTEL = {
  title: "chennai_hotel_reviews.csv Prism Intelligence",
  date: "June 2026",
  prismScore: 60,
  band: "Mixed Sentiment",
  summary:
    "Hotel customers in Chennai express mixed sentiments, with top-performing hotels like Accord Metropolitan and Savera, and worst-performing ones like The Park Chennai, citing common issues such as cleanliness, service quality, and food quality. There is a critical need for improvement in these areas to enhance customer satisfaction.",
  opportunities: [
    {
      text: "Invest in staff training to improve service.",
      proof: "Strategic Priority 1. Expected outcome: 25% increase in positive reviews.",
      quote: '"romba slow service" — High Severity Reality Check',
    },
    {
      text: "Upgrade food options and quality.",
      proof: "To attract foodies and improve overall customer experience.",
      quote: '"Morning Breakfast quality needs lot of improvement" — Priority Request',
    },
  ],
  churnRisks: [
    {
      text: "Poor cleanliness and hygiene.",
      proof: "High-severity contradiction detected between initial tone and core message.",
      quote: '"Cleanliness is very poor & below average service" — Churn Risk: High',
    },
    {
      text: "Extremely slow room service.",
      proof: "High intensity frustration triggered.",
      quote: '"The room service is also poor. Bathroom cud\'ve been much cleaner." — Insight',
    },
  ],
  scoreBreakdown: [
    { label: "Signal Clarity", value: 92 },
    { label: "Passion Index", value: 60 },
    { label: "Contradiction Depth", value: 88 },
    { label: "Strategic Coverage", value: 94 },
  ],
};

const REPORT_GAMING = {
  title: "gaming_academic_performance.csv Prism Intelligence",
  date: "June 2026",
  prismScore: 85,
  band: "Strong Correlation",
  summary:
    "The data exhibits a negative correlation between gaming hours and study hours, as well as a positive correlation between sleep hours and attendance. As gaming hours increase, study hours tend to decrease, indicating a potential trade-off between leisure time and academic engagement.",
  opportunities: [
    {
      text: "Targeted interventions for high-FPS, low-sleep students.",
      proof: "Predictive Insight. Actionable recommendation to balance habits.",
      quote: '"Students should be encouraged to balance gaming with academic responsibilities."',
    },
    {
      text: "Promote sleep to improve attendance.",
      proof: "Strong positive correlation detected.",
      quote: '"Students who get adequate sleep will likely have better attendance."',
    },
  ],
  churnRisks: [
    {
      text: "High Gamers Cluster Risk.",
      proof: "Cluster Profile: High gaming hours, low study hours, low sleep hours.",
      quote: '"Unusually high number of gaming hours indicative of lifestyle imbalance."',
    },
    {
      text: "Severe grade drops linked to sleep.",
      proof: "Negative correlation with study and sleep hours.",
      quote: '"As gaming hours increase, study hours will likely decrease... poor performance."',
    },
  ],
  scoreBreakdown: [
    { label: "Signal Clarity", value: 98 },
    { label: "Statistical Significance", value: 95 },
    { label: "Outlier Detection", value: 82 },
    { label: "Predictive Confidence", value: 91 },
  ],
};

const STAGES = [
  { id: "chunking", label: "Ingesting dataset", icon: "⬡", duration: 800 },
  { id: "synthesis", label: "Running LLM analysis", icon: "◈", duration: 1200 },
  { id: "structuring", label: "Structuring insights", icon: "⬙", duration: 700 },
  { id: "scoring", label: "Calculating Prism Score", icon: "◎", duration: 500 },
];

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

function InsightItem({ text, proof, quote, color, dotColor, visible }: any) {
  const [hovered, setHovered] = useState(false);
  const { displayed, done } = useTypewriter(text, visible, 20);

  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={visible ? { opacity: 1 } : {}}
      className="relative flex items-start gap-2.5 group cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span className={`text-sm leading-relaxed relative flex-1 ${done ? `border-b border-dashed ${color} text-white/80` : "text-white/30"}`}>
        {displayed}
        {done && hovered && (
          <ProofTooltip proof={proof} quote={quote} color={color === "border-emerald-400/40" ? "border-emerald-500/20" : "border-rose-500/20"} />
        )}
      </span>
      {done && <Cpu className={`ml-auto w-3 h-3 opacity-30 group-hover:opacity-100 ${color.replace("border-", "text-").replace("/40", "")}`} />}
    </motion.li>
  );
}

export default function PrismReportPreview() {
  const [dataset, setDataset] = useState<"hotel" | "gaming">("gaming");
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [stage, setStage] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const ACTIVE_REPORT = dataset === "hotel" ? REPORT_HOTEL : REPORT_GAMING;
  const CSV_FILE = dataset === "hotel" ? "/chennai_hotel_reviews.csv" : "/gaming_academic_performance.csv";

  // Load CSV snippet
  useEffect(() => {
    fetch(CSV_FILE)
      .then(res => res.text())
      .then(text => {
        const rows = text.split(/\r?\n/).filter(Boolean).slice(0, 100).map(line => {
          const row: string[] = [];
          let inQuotes = false;
          let current = "";
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { row.push(current); current = ""; }
            else current += char;
          }
          row.push(current);
          return row;
        });
        setCsvRows(rows);
      })
      .catch(err => {
        // Fallback for demo if file doesn't exist in public
        if (dataset === "hotel") {
           setCsvRows([
             ["id", "hotel_name", "review_text", "rating", "date"],
             ["1", "Accord Metropolitan", "The room was great but service was slow", "4", "2024-05-12"],
             ["2", "The Park Chennai", "Cleanliness is very poor & below average service", "2", "2024-05-11"],
             ["3", "Savera", "Nice stay and good services", "5", "2024-05-10"],
             ["4", "The Iris", "Bathroom cud've been much cleaner.", "3", "2024-05-09"]
           ]);
        } else {
           setCsvRows([
             ["student_id", "gaming_hours", "study_hours", "sleep_hours", "attendance"],
             ["S101", "8.5", "1.2", "4.5", "65%"],
             ["S102", "2.0", "4.5", "8.0", "95%"],
             ["S103", "12.0", "0.5", "3.0", "45%"],
             ["S104", "4.0", "3.0", "7.5", "88%"]
           ]);
        }
      });
  }, [dataset]);

  const handleProcess = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsComplete(false);
    setStage(-1);

    let t = 0;
    const schedule = (fn: () => void, delay: number) => { t += delay; setTimeout(fn, t); };

    schedule(() => setStage(0), 200);
    schedule(() => setStage(1), STAGES[0].duration);
    schedule(() => setStage(2), STAGES[1].duration);
    schedule(() => setStage(3), STAGES[2].duration);
    schedule(() => {
      setStage(4);
      setIsComplete(true);
      setIsProcessing(false);
    }, STAGES[3].duration);
  };

  const reset = () => {
    setIsComplete(false);
    setIsProcessing(false);
    setStage(-1);
  };

  const { displayed: summaryText, done: summaryDone } = useTypewriter(ACTIVE_REPORT.summary, isComplete, 12);

  return (
    <section ref={sectionRef} className="py-24 px-6 max-w-6xl mx-auto w-full relative">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[11px] font-semibold tracking-widest uppercase text-emerald-400 mb-6">
          <Database className="w-3.5 h-3.5" /> Raw Data to Boardroom Ready
        </div>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter text-white mb-4">
          From Chaos to Clarity.
        </h2>
        <p className="text-white/40 max-w-xl mx-auto">
          Turn noise into narrative. Drop in raw, messy datasets and get perfectly structured strategic reports without the wait.
        </p>
      </div>

      {/* Dataset Selector */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => { setDataset("gaming"); reset(); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${dataset === "gaming" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white"}`}
          >
            Quantitative (Gaming Data)
          </button>
          <button
            onClick={() => { setDataset("hotel"); reset(); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${dataset === "hotel" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white"}`}
          >
            Qualitative (Hotel Reviews)
          </button>
        </div>
      </div>

      {/* macOS Window Container */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden"
      >
        {/* macOS Traffic Lights */}
        <div className="h-10 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
          <div className="ml-auto flex items-center gap-2 text-white/30 text-xs font-mono">
            {dataset === "hotel" ? "chennai_hotel_reviews.csv" : "gaming_academic_performance.csv"}
          </div>
        </div>

        {/* The Interaction Canvas */}
        <div className="relative p-8 md:p-12 min-h-[500px] flex flex-col justify-center items-center overflow-hidden">
          
          {/* Background Skeleton Illusion */}
          <AnimatePresence>
            {!isComplete && (
              <motion.div
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 p-8 md:p-12 pointer-events-none flex flex-col"
              >
                <div className="blur-[8px] opacity-20 transition-all duration-1000 w-full h-full">
                  <div className="h-8 w-1/2 bg-white/20 rounded-md mb-6" />
                  <div className="h-4 w-full bg-white/10 rounded-md mb-3" />
                  <div className="h-4 w-5/6 bg-white/10 rounded-md mb-8" />
                  <div className="grid grid-cols-2 gap-8 w-full">
                    <div>
                      <div className="h-6 w-1/2 bg-white/20 rounded-md mb-4" />
                      <div className="h-4 w-full bg-white/10 rounded-md mb-2" />
                      <div className="h-4 w-full bg-white/10 rounded-md mb-2" />
                    </div>
                    <div>
                      <div className="h-6 w-1/2 bg-white/20 rounded-md mb-4" />
                      <div className="h-4 w-full bg-white/10 rounded-md mb-2" />
                      <div className="h-4 w-full bg-white/10 rounded-md mb-2" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Central Action Pill & Preview */}
          <AnimatePresence>
            {!isProcessing && !isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                className="relative z-10 flex flex-col items-center gap-6 w-full max-w-2xl"
              >
                {/* Data Preview Table */}
                <div className="w-full bg-[#111] border border-white/5 rounded-lg overflow-hidden shadow-2xl mb-4">
                  <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <span className="text-xs text-white/50 font-mono flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5" /> RAW DATA PREVIEW (First 100 rows)</span>
                  </div>
                  <div className="overflow-x-auto overflow-y-auto max-h-64 custom-scrollbar">
                    <table className="w-full text-left text-[10px] text-white/40 font-mono">
                      <thead className="bg-[#111] sticky top-0 border-b border-white/5 text-white/60 shadow-sm z-10">
                        <tr>
                          {csvRows[0]?.slice(0, 5).map((h, i) => <th key={i} className="p-2 whitespace-nowrap">{h}</th>)}
                          <th className="p-2">...</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(1).map((row, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                            {row.slice(0, 5).map((cell, j) => <td key={j} className="p-2 truncate max-w-[120px]">{cell}</td>)}
                            <td className="p-2">...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <button
                  onClick={handleProcess}
                  className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white text-black font-medium hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                >
                  <Play className="w-4 h-4 fill-black" />
                  Analyze My Data
                  <div className="absolute inset-0 rounded-full border border-white opacity-0 group-hover:animate-ping" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing Stages */}
          <AnimatePresence>
            {isProcessing && !isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                className="relative z-10 w-full max-w-md bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <span className="text-sm font-mono text-emerald-400">Prism Pipeline Active</span>
                </div>
                <div className="space-y-4">
                  {STAGES.map((s, i) => {
                    const active = stage === i;
                    const passed = stage > i;
                    return (
                      <div key={s.id} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${passed ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : active ? 'border-white/20 text-white animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-white/5 text-white/20'}`}>
                          {passed ? <Check className="w-4 h-4" /> : <span className="text-xs font-mono">{s.icon}</span>}
                        </div>
                        <span className={`text-sm font-mono transition-colors ${passed ? 'text-white/50' : active ? 'text-white' : 'text-white/20'}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Final Report */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative z-20 w-full h-full text-left"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 pb-8 border-b border-white/10">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-2">
                      {ACTIVE_REPORT.title}
                    </h3>
                    <p className="text-white/40 text-sm">Generated on {ACTIVE_REPORT.date} • {dataset === "hotel" ? "38,146 rows analyzed" : "8,000 rows analyzed"}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-white/40 font-mono mb-1 uppercase">Prism Score</div>
                      <div className="text-3xl font-bold text-emerald-400">{ACTIVE_REPORT.prismScore}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-10">
                  <h4 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Executive Summary</h4>
                  <p className="text-base text-white/80 leading-relaxed max-w-4xl">
                    {summaryText}
                    {summaryDone && <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse" />}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <h4 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
                      Strategic Opportunities
                    </h4>
                    <ul className="space-y-6">
                      {ACTIVE_REPORT.opportunities.map((item, i) => (
                        <InsightItem key={i} {...item} color="border-emerald-400/40" dotColor="bg-emerald-400" visible={isComplete} />
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500/50" />
                      Critical Risks
                    </h4>
                    <ul className="space-y-6">
                      {ACTIVE_REPORT.churnRisks.map((item, i) => (
                        <InsightItem key={i} {...item} color="border-rose-400/40" dotColor="bg-rose-400" visible={isComplete} />
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </section>
  );
}
