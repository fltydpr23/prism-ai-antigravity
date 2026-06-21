"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import JSZip from "jszip";
import { FileText, FileAudio, ImageIcon, ArrowRight, UploadCloud, X, ChevronDown, Clock, Zap, Command, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import PrismResults from "@/components/PrismResults";
import MagneticButton from "@/components/MagneticButton";
import UsageMeter from "@/components/UsageMeter";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import { useWorkspace } from "../../providers/WorkspaceProvider";
import { INDUSTRIES, type IndustryId } from "../../../lib/industryConfig";
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

type View = "analysis" | "results";
type ProcessingStage = "idle" | "vector" | "transitions" | "interactions" | "realtime" | "design" | "done";

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

const ProgressCounter = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const display = useTransform(rounded, (v) => `${v}%`);

  useEffect(() => {
    if (isPast) {
      count.set(100);
    } else if (isActive) {
      count.set(0);
      const controls = animate(count, 99, { duration: 15, ease: "easeOut" });
      return controls.stop;
    } else {
      count.set(0);
    }
  }, [isActive, isPast, count]);

  return <motion.span>{display}</motion.span>;
};

const BrutalistLoading = ({ stage }: { stage: ProcessingStage }) => {
  const stages = [
    { id: "vector", label: "Data Extraction" },
    { id: "transitions", label: "Signal Detection" },
    { id: "interactions", label: "Churn Analysis" },
    { id: "realtime", label: "Strategy Synthesis" },
    { id: "design", label: "Executive Report" }
  ];

  const currentIndex = stages.findIndex(s => s.id === stage);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col font-['var(--font-vt323)',_monospace] uppercase tracking-wider relative bg-[#050505] py-4">
      {stages.map((s, idx) => {
        const isActive = currentIndex === idx;
        const isPast = currentIndex > idx;
        
        return (
          <div 
            key={s.id}
            className={`relative flex items-center justify-between px-5 py-3 border border-white/10 -mt-px overflow-hidden text-white`}
            style={{ fontSize: "28px" }}
          >
            <motion.div 
              className="absolute left-0 top-0 bottom-0 bg-white"
              initial={{ width: '0%' }}
              animate={{ width: isPast ? '100%' : isActive ? '99%' : '0%' }}
              transition={isActive ? { duration: 15, ease: "easeOut" } : { duration: 0.3 }}
              style={{ zIndex: 0 }}
            />
            
            <span className="relative z-10 drop-shadow-sm leading-none pt-1 mix-blend-difference font-bold opacity-90">{s.label}</span>
            <span className="relative z-10 pt-1 mix-blend-difference font-bold opacity-70">
              <ProgressCounter isActive={isActive} isPast={isPast} />
            </span>
          </div>
        );
      })}
    </div>
  );
};


// ─── Main Component ────────────────────────────────────────────────────────
export default function AnalysePage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [view, setView] = useState<View>("analysis");
  const [text, setText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [saveToSupabase, setSaveToSupabase] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryId>("auto");
  const [industryOpen, setIndustryOpen] = useState(false);
  const [showLargeFilePrompt, setShowLargeFilePrompt] = useState(false);
  const [pendingExtractedText, setPendingExtractedText] = useState<string | null>(null);
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
  
  // ── Sync local storage analyses to Supabase when user signs in ──
  useEffect(() => {
    if (!userId) return;
    const local = localStorage.getItem("prism_local_analyses");
    if (!local) return;
    
    try {
      const items = JSON.parse(local);
      if (items.length === 0) return;
      
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      })
      .then(res => res.json())
      .then(d => {
        if (d.ok) {
          console.log(`Synced ${d.synced} local analyses to your account.`);
          localStorage.removeItem("prism_local_analyses");
        }
      })
      .catch(err => console.error("Auto-sync failed", err));
    } catch (e) {
      console.error("Failed to parse local analyses for sync", e);
    }
  }, [userId]);

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

  const reset = () => { setView("analysis"); setStage("idle"); setLiveStatus(null); setResponse(null); setText(""); setUploadedFile(null); setShowLargeFilePrompt(false); setPendingExtractedText(null); };

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
    setStage("vector");
    setLiveStatus(null);
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
        if (parsedData.length > 2000) {
          setPendingExtractedText(JSON.stringify(parsedData, null, 2));
          setShowLargeFilePrompt(true);
          return; // Wait for user decision
        }
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
        const stages: ProcessingStage[] = ["transitions", "interactions", "realtime", "design"];
        let delay = 0;
        // Hold for 12 seconds total for the mock
        for (const s of stages) { delay += 3000; setTimeout(() => setStage(s), delay); }
        setTimeout(() => { 
          const mockReport = generateMockReport(uploadedFile);
          if (!userId && mockReport.ok) {
            const localId = `local_${Date.now()}`;
            const localAnalysis = {
              id: localId,
              createdAt: new Date().toISOString(),
              result: mockReport.analysis,
              input: `[Mock Analysis File: ${uploadedFile.name}]`,
            };
            const existing = JSON.parse(localStorage.getItem("prism_local_analyses") || "[]");
            existing.push(localAnalysis);
            localStorage.setItem("prism_local_analyses", JSON.stringify(existing));
            mockReport.id = localId;
          }
          setResponse(mockReport); 
          setStage("done"); 
        }, delay + 3000);
        return;
      }
    }

    if (!extractedText.trim()) { setResponse({ error: "No text could be extracted." }); setStage("done"); return; }

    await executeSubmit(extractedText, "parallel_sampled");
  }

  async function executeSubmit(extractedText: string, mode: "parallel_sampled" | "background") {
    setShowLargeFilePrompt(false);
    setPendingExtractedText(null);
    setStage("vector");
    setLiveStatus(null);
    setResponse(null);
    setView("results");
    
    posthog.capture("analysis_started", {
      input_type: uploadedFile ? "file" : "text",
      file_type: uploadedFile ? (uploadedFile.type || uploadedFile.name.split(".").pop()) : null,
      model: "openai/gpt-oss-120b:free",
      industry: selectedIndustry,
      save_enabled: saveToSupabase,
      text_length: extractedText.length,
      processing_mode: mode
    });

    try {
      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: extractedText, 
          persist: saveToSupabase, 
          skipLocalModel: false, 
          localLlmModel: "openai/gpt-oss-120b:free", 
          industry: selectedIndustry, 
          workspace_id: activeWorkspace?.id,
          mode: mode
        }),
      });

      if (mode === "background" && response.status === 202) {
        const data = await response.json();
        router.push(`/processing/${data.jobId}`);
        return;
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.trim().startsWith("data: ")) {
              try {
                const jsonStr = line.replace(/^data:\s*/, "").trim();
                if (!jsonStr) continue;
                const data = JSON.parse(jsonStr);
                
                if (data.type === "stage") {
                  if (data.stage.startsWith("Analyzed")) {
                    setLiveStatus(data.stage);
                  } else {
                    setStage(data.stage as ProcessingStage);
                  }
                } else if (data.type === "result") {
                  const resultData = data.data;
                  if (!userId && resultData.ok) {
                    const localId = `local_${Date.now()}`;
                    const localAnalysis = {
                      id: localId,
                      createdAt: new Date().toISOString(),
                      result: resultData.analysis,
                      input: extractedText,
                    };
                    const existing = JSON.parse(localStorage.getItem("prism_local_analyses") || "[]");
                    existing.push(localAnalysis);
                    localStorage.setItem("prism_local_analyses", JSON.stringify(existing));
                    
                    // Assign local ID so client routing routes to local path
                    resultData.id = localId;
                  }
                  setResponse(resultData);
                  setStage("done");
                  if (data.data.error) {
                    posthog.capture("analysis_failed", { error: data.data.error, model: "openai/gpt-oss-120b:free", industry: selectedIndustry });
                  } else {
                    posthog.capture("analysis_completed", {
                      model: "openai/gpt-oss-120b:free",
                      industry: data.data.analysis?.industry?.id ?? selectedIndustry,
                      industry_detection_method: (data.data.analysis?.industry as { detectionMethod?: string } | undefined)?.detectionMethod,
                      saved: data.data.saved ?? false,
                      report_id: data.data.id ?? null,
                    });
                  }
                } else if (data.type === "error") {
                  throw new Error(data.message);
                }
              } catch (e) {
                console.error("Failed to parse SSE line", line, e);
              }
            }
          }
        }
      }
    } catch {
      setResponse({ error: "Request failed." });
      setStage("done");
      posthog.capture("analysis_failed", { error: "request_failed", model: "openai/gpt-oss-120b:free", industry: selectedIndustry });
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="aurora-bg opacity-50" />
      
      {view === "analysis" && (
         <div 
           className={`fixed inset-0 z-50 pointer-events-none transition-colors duration-300 ${isDragging ? "bg-emerald-900/20 backdrop-blur-[2px]" : ""}`}
         />
      )}

      {/* Large File Prompt Modal */}
      <AnimatePresence>
        {showLargeFilePrompt && pendingExtractedText && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-xl w-full p-8 shadow-2xl relative"
            >
              <button onClick={() => { setShowLargeFilePrompt(false); setPendingExtractedText(null); }} className="absolute top-4 right-4 text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <UploadCloud className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white tracking-tight">Large Dataset Detected</h3>
                  <p className="text-sm text-white/50 mt-1">This file contains thousands of reviews.</p>
                </div>
              </div>

              <div className="grid gap-4 mt-8">
                <button 
                  onClick={() => executeSubmit(pendingExtractedText, "parallel_sampled")}
                  className="flex flex-col text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white group-hover:text-emerald-400 transition-colors">Fast Sampled Analysis</span>
                    <Zap className="w-4 h-4 text-white/40 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-sm text-white/50 mt-2">Analyzes a random sample of the top segments in parallel. Results in ~30 seconds.</span>
                </button>

                <button 
                  onClick={() => executeSubmit(pendingExtractedText, "background")}
                  className="flex flex-col text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white group-hover:text-emerald-400 transition-colors">Comprehensive Analysis</span>
                    <Clock className="w-4 h-4 text-white/40 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-sm text-white/50 mt-2">Analyzes the entire dataset in the background. We'll email you when it's ready.</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {/* ── COMMAND CENTER INPUT ──────────────────────────────────────── */}
        {view === "analysis" && (
          <motion.div key="analysis" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative z-10"
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>

            {/* Back to landing or dashboard */}
            <button onClick={() => router.push(userId ? "/dashboard" : "/")} className="absolute top-6 left-6 text-xs text-white/30 hover:text-white transition-colors flex items-center gap-1.5 z-50">
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

              {/* Processing state — Brutalist Loading Screen */}
              {stage !== "done" && (
                <motion.div key="processing" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="w-full flex flex-col items-center gap-8 relative py-20">
                  <BrutalistLoading stage={stage} />
                  
                  {liveStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-sm shadow-[0_0_20px_rgba(52,211,153,0.1)]"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      {liveStatus}
                    </motion.div>
                  )}
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
