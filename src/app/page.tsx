"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import { FileText, FileAudio, ImageIcon, ArrowRight, UploadCloud, X, ChevronDown, Clock, Zap, Command, Check } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import PrismLanding from "@/components/PrismLanding";
import PrismResults from "@/components/PrismResults";
import MagneticButton from "@/components/MagneticButton";
import UsageMeter from "@/components/UsageMeter";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { INDUSTRIES, type IndustryId } from "../../lib/industryConfig";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

const ANON_LIMIT = 3;
const ANON_KEY = "prism_anon_uses";

// ─── Types ────────────────────────────────────────────────────────────────
type AnalysisResponse = {
  ok?: boolean;
  analysis?: {
    luneSignature?: { hue?: number };
    metrics?: Record<string, unknown>;
    localModel?: {
      parsed?: unknown;
      parseError?: string;
      ok?: boolean;
      error?: string;
      raw?: string;
    } | null;
    industry?: {
      id: string;
      label: string;
      emoji: string;
      detectionMethod: "user_selected" | "auto_detected";
      confidence: string;
    };
    [key: string]: unknown;
  } | null;
  saved?: boolean | null;
  id?: string | null;
  persistError?: string;
  error?: string;
};

type View = "landing" | "analysis" | "results";
type ProcessingStage = "idle" | "parsing" | "detecting" | "mapping" | "building" | "done";

// ─── Constants ────────────────────────────────────────────────────────────

const INDUSTRY_CHIPS = [
  { id: "d2c", label: "D2C Brand", text: "Ordered 3 t-shirts. Quality is nice but sizing is off, XL fits like an M. Tried to return on WhatsApp but bot keeps looping. Order #12345. Very disappointed." },
  { id: "fintech", label: "Fintech", text: "UPI payment failed 3 times at a petrol pump. Money deducted but merchant didn't receive. App just went to home screen with no status." },
  { id: "food", label: "Food Delivery", text: "Delivery guy was super polite but food was cold and gravy spilled inside the bag. Customer support only gave 50rs coupon for an 800rs order. Unacceptable." },
  { id: "saas", label: "SaaS", text: "New analytics dashboard is clean, love dark mode. But we need CSV export by pin code — state-level isn't granular enough. Also CSV takes 5 mins to generate." },
  { id: "beauty", label: "Beauty", text: "This serum broke me out badly. Sensitive skin — Nykaa didn't mention fragrance in ingredients. Gorgeous glass packaging but formulation needs to be fragrance-free." },
  { id: "edtech", label: "EdTech", text: "My son uses the app daily for math. Gamification is brilliant, he loves badges. But video player buffers on BSNL broadband where YouTube works fine." },
];

function parseCSV(text: string): Record<string, string>[] {
  const lines: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  
  const cleanText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  for (let i = 0; i < cleanText.length; i++) {
    const c = cleanText[i];
    const next = cleanText[i + 1];
    
    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
        if (field.trim() === "") {
          field = "";
        }
      } else if (c === ',') {
        row.push(field.trim());
        field = "";
      } else if (c === '\n') {
        row.push(field.trim());
        field = "";
        if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
          lines.push(row);
        }
        row = [];
      } else {
        field += c;
      }
    }
  }
  
  if (field !== "" || row.length > 0) {
    row.push(field.trim());
    if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
      lines.push(row);
    }
  }
  
  if (lines.length === 0) return [];
  
  const headers = lines[0].map(h => h.trim());
  const records: Record<string, string>[] = [];
  
  for (let r = 1; r < lines.length; r++) {
    const rowValues = lines[r];
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = rowValues[index] !== undefined ? rowValues[index] : "";
    });
    records.push(record);
  }
  
  return records;
}

function generateMockReport(file: File): AnalysisResponse {
  const isAudio = file.type.includes("audio") || file.name.endsWith(".mp3");
  const isImage = file.type.includes("image");
  const isPdf = file.name.endsWith(".pdf");
  const summary = isAudio ? "Voice note analysis reveals severe anxiety among transport workers regarding automated routing."
    : isImage ? "Chart shows a sharp spike in AI-driven task replacement in the clerical sector."
    : isPdf ? "PDF extraction indicates high automation risk in midwest manufacturing."
    : "Document analysis reveals critical displacement trends across administrative roles.";
  return {
    ok: true,
    analysis: {
      metrics: { lexicalDensity: 0.65, wordCount: 450 },
      localModel: {
        parsed: {
          executive_summary: summary,
          consumer_feedback: { sentiment_trajectory: { overall_sentiment: "negative", trajectory: "declining", insight: "Strong anxiety signals detected." }, contradiction_analysis: [], feature_requests: [] },
          strategic_recommendations: [{ action: "Reduce automation pace in transport roles", urgency: "high", expected_impact: "Reduces churn 12%", confidence: "high" }],
          workforce_metrics: { workers_at_risk: "14.2M", workers_at_risk_trend: "↑ 8% QoQ", avg_automation_risk: "0.61", avg_automation_risk_trend: "↑ 0.04 from baseline", net_new_roles: "+3.1M", net_new_roles_trend: "AI-adjacent roles", reskilling_readiness: "34%", reskilling_readiness_trend: "Below 50% threshold" },
          automation_risk_by_sector: [{ label: "Admin & Clerical", val: 0.79, pct: "79%" }, { label: "Manufacturing", val: 0.74, pct: "74%" }, { label: "Retail & Sales", val: 0.68, pct: "68%" }],
          opportunity_sectors: [{ name: "AI Safety", change: "+24%" }, { name: "Healthcare AI", change: "+18%" }],
          reskilling_readiness_gap: [{ label: "Digital Literacy", pct: "62%", val: "High" }, { label: "AI Tooling", pct: "28%", val: "Low" }],
        },
      },
    },
  };
}

const STAGE_LABELS: Partial<Record<ProcessingStage, string>> = {
  parsing: "Parsing unstructured data...",
  detecting: "Detecting behavioral signals...",
  mapping: "Mapping emotional resonance...",
  building: "Synthesizing executive report...",
};

const CinematicLoading = ({ stage }: { stage: ProcessingStage }) => {
  const stages = [
    { id: "parsing", label: "Parsing unstructured data" },
    { id: "detecting", label: "Detecting behavioral signals" },
    { id: "mapping", label: "Mapping emotional resonance" },
    { id: "building", label: "Synthesizing executive report" },
  ];
  
  const currentIndex = stages.findIndex(s => s.id === stage);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-8 py-12 relative">
      {/* Subtle background glow that follows the active item */}
      <motion.div 
        className="absolute left-[-20px] w-1 bg-emerald-500/50 rounded-full blur-[2px]"
        initial={false}
        animate={{
          top: `${currentIndex * (100 / (stages.length - 1))}%`,
          height: "24px",
          transform: "translateY(-50%)"
        }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
      />

      {stages.map((s, idx) => {
        const isCompleted = currentIndex > idx;
        const isActive = currentIndex === idx;
        
        return (
          <motion.div 
            key={s.id}
            initial={false}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.3 : 0.1,
              x: isActive ? 8 : 0,
              scale: isActive ? 1.02 : 1
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex items-center gap-5 relative"
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <AnimatePresence mode="popLayout">
                {isCompleted ? (
                  <motion.div 
                    key="check"
                    initial={{ scale: 0, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.15)]"
                  >
                    <Check className="w-3 h-3" />
                  </motion.div>
                ) : isActive ? (
                  <motion.div 
                    key="active"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative flex items-center justify-center w-full h-full"
                  >
                     <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                     <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="pending"
                    className="w-1.5 h-1.5 rounded-full bg-white/20"
                  />
                )}
              </AnimatePresence>
            </div>
            
            <span className={`text-xl tracking-tight ${isActive ? "font-medium text-white drop-shadow-md" : "font-normal text-white"}`}>
              {s.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};


// ─── Main Component ────────────────────────────────────────────────────────
export default function Home() {
  const { isLoaded, userId } = useAuth();
  const [view, setView] = useState<View>("landing");
  const [text, setText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [saveToSupabase, setSaveToSupabase] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryId>("auto");
  const [industryOpen, setIndustryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { activeWorkspace } = useWorkspace();

  // Dynamic aurora hue
  const hue = (response?.analysis?.luneSignature?.hue ?? 220).toString();
  useEffect(() => {
    document.documentElement.style.setProperty("--aurora-hue", hue);
  }, [hue]);

  // Keyboard Shortcuts (Command Center)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== "analysis") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (text || uploadedFile) submit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, text, uploadedFile]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file); setText("");
      posthog.capture("file_uploaded", { file_type: file.type || file.name.split(".").pop(), file_size_kb: Math.round(file.size / 1024), method: "drop" });
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      setUploadedFile(file); setText("");
      posthog.capture("file_uploaded", { file_type: file.type || file.name.split(".").pop(), file_size_kb: Math.round(file.size / 1024), method: "browse" });
    }
  };
  const removeFile = () => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const reset = () => { setView("landing"); setStage("idle"); setResponse(null); setText(""); setUploadedFile(null); };

  async function submit() {
    if (stage !== "idle" && stage !== "done") return;
    if (!text.trim() && !uploadedFile) return;

    // ── Anonymous gate: 3 free analyses tracked in localStorage ──
    if (!userId) {
      const used = parseInt(localStorage.getItem(ANON_KEY) ?? "0", 10);
      if (used >= ANON_LIMIT) {
        setResponse({
          error: "limit_reached",
        });
        setStage("done");
        setView("results");
        posthog.capture("anon_limit_reached", { used });
        return;
      }
      localStorage.setItem(ANON_KEY, String(used + 1));
    }
    setStage("parsing");
    setResponse(null);
    setView("results");
    posthog.capture("analysis_started", {
      input_type: uploadedFile ? "file" : "text",
      file_type: uploadedFile ? (uploadedFile.type || uploadedFile.name.split(".").pop()) : null,
      model: "openai/gpt-oss-120b:free",
      industry: selectedIndustry,
      save_enabled: saveToSupabase,
      text_length: text.length,
    });

    let extractedText = text;

    if (uploadedFile) {
      if (uploadedFile.name.endsWith(".pdf")) {
        try {
          const fd = new FormData(); fd.append("file", uploadedFile);
          const r = await fetch("/api/parse-pdf", { method: "POST", body: fd });
          const d = await r.json();
          if (d.error) throw new Error(d.error);
          extractedText = d.text;
        } catch { setResponse({ error: "Failed to extract text from PDF." }); setStage("done"); return; }
      } else if (uploadedFile.name.endsWith(".csv")) {
        const raw = await uploadedFile.text();
        const parsedData = parseCSV(raw);
        if (parsedData.length > 0) {
          extractedText = JSON.stringify(parsedData, null, 2);
        } else {
          extractedText = raw;
        }
      } else if (uploadedFile.name.endsWith(".txt")) {
        extractedText = await uploadedFile.text();
      } else if (uploadedFile.name.endsWith(".zip")) {
        try {
          const zip = new JSZip();
          const buf = await uploadedFile.arrayBuffer();
          const contents = await zip.loadAsync(buf);
          let combined = "";
          for (const [name, f] of Object.entries(contents.files)) {
            if (!f.dir && (name.endsWith(".txt") || name.endsWith(".csv"))) {
              combined += `\n\n--- ${name} ---\n${await f.async("text")}`;
            }
          }
          extractedText = combined;
        } catch { setResponse({ error: "Failed to extract ZIP." }); setStage("done"); return; }
      } else {
        // Mock for images/audio
        const stages: ProcessingStage[] = ["detecting", "mapping", "building"];
        let delay = 0;
        for (const s of stages) { delay += 1200; setTimeout(() => setStage(s), delay); }
        setTimeout(() => { setResponse(generateMockReport(uploadedFile)); setStage("done"); }, delay + 1200);
        return;
      }
    }

    if (!extractedText.trim()) { setResponse({ error: "No text could be extracted." }); setStage("done"); return; }

    setStage("detecting");
    try {
      const r = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText, persist: saveToSupabase, skipLocalModel: false, localLlmModel: "openai/gpt-oss-120b:free", industry: selectedIndustry, workspace_id: activeWorkspace?.id }),
      });
      const data = await r.json() as AnalysisResponse;
      setStage("building");
      setTimeout(() => {
        setResponse(data);
        setStage("done");
        if (data.error) {
          posthog.capture("analysis_failed", { error: data.error, model: "openai/gpt-oss-120b:free", industry: selectedIndustry });
        } else {
          posthog.capture("analysis_completed", {
            model: "openai/gpt-oss-120b:free",
            industry: data.analysis?.industry?.id ?? selectedIndustry,
            industry_detection_method: (data.analysis?.industry as { detectionMethod?: string } | undefined)?.detectionMethod,
            saved: data.saved ?? false,
            report_id: data.id ?? null,
          });
        }
      }, 800);
    } catch {
      setResponse({ error: "Request failed." });
      setStage("done");
      posthog.capture("analysis_failed", { error: "request_failed", model: "openai/gpt-oss-120b:free", industry: selectedIndustry });
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Remove aurora bg if we want pure dark command center, or keep it. Let's keep it but dimmer. */}
      <div className="aurora-bg opacity-50" />
      
      {/* Full screen drag handler for Command Center */}
      {view === "analysis" && (
         <div 
           className={`fixed inset-0 z-50 pointer-events-none transition-colors duration-300 ${isDragging ? "bg-emerald-900/20 backdrop-blur-[2px]" : ""}`}
         />
      )}
      
      <AnimatePresence mode="wait">

        {/* ── LANDING ─────────────────────────────────────────────── */}
        {view === "landing" && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <PrismLanding onStart={() => setView("analysis")} />
          </motion.div>
        )}

        {/* ── COMMAND CENTER INPUT ──────────────────────────────────────── */}
        {view === "analysis" && (
          <motion.div key="analysis" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative z-10"
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>

            {/* Back to landing */}
            <button onClick={() => setView("landing")} className="absolute top-6 left-6 text-xs text-white/30 hover:text-white transition-colors flex items-center gap-1.5 z-50">
              <ArrowRight className="w-3 h-3 rotate-180" /> Back
            </button>

            {/* Navigation links */}
            <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
              <Link href="/history" className="text-xs text-white/30 hover:text-white transition-colors flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Archive
              </Link>
              {userId && <WorkspaceSwitcher />}
              {userId && <UsageMeter />}
              {!userId && (
                <Link href="/pricing" className="text-xs text-white/30 hover:text-white transition-colors flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Pricing
                </Link>
              )}
              <div className="text-white">
                {isLoaded && !userId && (
                  <SignInButton mode="modal">
                    <button className="text-xs bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-full border border-white/5 font-medium">
                      Sign In
                    </button>
                  </SignInButton>
                )}
                {userId && (
                  <UserButton appearance={{ elements: { userButtonAvatarBox: "w-7 h-7" } }} />
                )}
              </div>
            </div>

            <div className="w-full max-w-3xl flex flex-col gap-6 relative z-40">
              
              {/* Command Center Input Panel */}
              <div
                className={`w-full bg-[#0a0a0a] backdrop-blur-3xl border transition-all duration-300 rounded-2xl overflow-visible flex flex-col shadow-2xl relative
                  ${isDragging ? "border-emerald-500/50 shadow-[0_0_40px_rgba(52,211,153,0.15)] ring-1 ring-emerald-500/20 scale-[1.02]" : "border-white/10 hover:border-white/20"}
                `}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"
                  accept=".txt,.csv,.pdf,.zip,image/*,audio/*" />

                <div className="relative min-h-[140px] flex flex-col">
                  {uploadedFile ? (
                    <div className="flex items-center gap-4 p-8 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                        {uploadedFile.type.includes("audio") ? <FileAudio className="w-7 h-7 text-emerald-400" />
                          : uploadedFile.type.includes("image") ? <ImageIcon className="w-7 h-7 text-emerald-400" />
                          : <FileText className="w-7 h-7 text-emerald-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xl font-medium text-white truncate tracking-tight">{uploadedFile.name}</p>
                        <p className="text-sm text-white/40 mt-1 font-mono">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button onClick={removeFile} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <textarea
                      ref={textareaRef}
                      value={text} onChange={e => setText(e.target.value)}
                      placeholder="Press ⌘K or paste data to begin..."
                      rows={text.split('\n').length > 3 ? Math.min(10, text.split('\n').length) : 3}
                      className="w-full flex-1 bg-transparent border-none px-8 py-8 text-2xl tracking-tight font-light text-white placeholder:text-white/20 focus:ring-0 resize-none outline-none leading-relaxed"
                    />
                  )}

                  {isDragging && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl">
                      <div className="flex flex-col items-center gap-3">
                        <UploadCloud className="w-12 h-12 text-emerald-400 animate-bounce" />
                        <span className="text-xl font-medium tracking-tight text-white">Drop to analyze</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Command Bar Footer */}
                <div className="bg-white/[0.02] border-t border-white/5 px-4 py-3 flex items-center justify-between rounded-b-2xl">
                  
                  {/* Left: Tools & Industry */}
                  <div className="flex items-center gap-2">
                     {!uploadedFile && (
                        <button onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                          <UploadCloud className="w-4 h-4" /> File
                        </button>
                     )}
                     
                     <div className="h-4 w-px bg-white/10 mx-1" />

                     {/* Industry Selector */}
                     <div className="relative">
                        <button
                          onClick={() => setIndustryOpen(o => !o)}
                          className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5"
                        >
                          <span className="text-[14px]">
                            {INDUSTRIES.find(i => i.id === selectedIndustry)?.emoji ?? "🔍"}
                          </span>
                          <span>{INDUSTRIES.find(i => i.id === selectedIndustry)?.label ?? "Auto-Detect"}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${industryOpen ? "rotate-180" : ""}`} />
                        </button>

                        {industryOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full mb-2 left-0 z-50 min-w-[200px] rounded-xl border border-white/10 bg-[#111] backdrop-blur-xl shadow-2xl overflow-hidden py-1"
                          >
                            {INDUSTRIES.map(industry => (
                              <button
                                key={industry.id}
                                onClick={() => { setSelectedIndustry(industry.id); setIndustryOpen(false); posthog.capture("industry_selected", { industry: industry.id, label: industry.label }); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs transition-colors ${
                                  selectedIndustry === industry.id
                                    ? "bg-white/10 text-white"
                                    : "text-white/50 hover:text-white hover:bg-white/5"
                                }`}
                              >
                                <span className="text-[14px]">{industry.emoji}</span>
                                <span>{industry.label}</span>
                                {selectedIndustry === industry.id && <Check className="ml-auto w-3 h-3 text-emerald-400" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                     </div>

                     <div className="h-4 w-px bg-white/10 mx-1" />

                     {/* Save Toggle */}
                     <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                        <input type="checkbox" className="hidden" checked={saveToSupabase} onChange={e => setSaveToSupabase(e.target.checked)} />
                        <div className={`w-6 h-3.5 rounded-full relative transition-colors ${saveToSupabase ? "bg-emerald-500/80" : "bg-white/10"}`}>
                          <div className={`absolute top-[2px] left-[2px] w-2.5 h-2.5 rounded-full bg-white transition-transform ${saveToSupabase ? "translate-x-2.5" : ""}`} />
                        </div>
                        <span className="text-xs text-white/40">Archive</span>
                      </label>
                  </div>

                  {/* Right: Submit */}
                  <MagneticButton onClick={submit} disabled={!text && !uploadedFile} intensity={0.15}
                    className="flex items-center gap-3 px-5 py-2 text-sm font-medium tracking-tight text-white bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-xl border border-white/10">
                    Analyze
                    <div className="flex items-center gap-1 opacity-50">
                      <Command className="w-3 h-3" />
                      <span className="text-[10px] font-mono tracking-widest mt-[1px]">ENTER</span>
                    </div>
                  </MagneticButton>

                </div>
              </div>

              {/* Minimal Example Chips - Only show when empty */}
              {!text && !uploadedFile && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                  {INDUSTRY_CHIPS.slice(0, 4).map(c => (
                    <button key={c.id} onClick={() => { setText(c.text); posthog.capture("example_used", { industry_chip: c.id, label: c.label }); }}
                      className="px-3 py-1.5 text-[11px] text-white/30 hover:text-white/80 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full cursor-pointer transition-all">
                      Try "{c.label}" example
                    </button>
                  ))}
                </motion.div>
              )}

            </div>
          </motion.div>
        )}

        {/* ── RESULTS & GENERATIVE CODE STREAM ──────────────────────────────── */}
        {view === "results" && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen px-4 py-12 flex flex-col items-center justify-center relative z-10">
            <div className="w-full max-w-7xl flex flex-col items-center gap-5">

              {/* Processing state — Cinematic Loading Screen */}
              {stage !== "done" && (
                <motion.div key="processing" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="w-full flex flex-col items-center gap-8 relative py-20">
                  <CinematicLoading stage={stage} />
                </motion.div>
              )}

              {/* Results */}
              {stage === "done" && response && (
                <div className="w-full">
                  <PrismResults response={response} onReset={reset} />
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </>
  );
}
