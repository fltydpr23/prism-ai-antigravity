"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ArrowRight, UploadCloud, Check, ShieldCheck, Download, Trash2, X, ChevronDown, Lock, Zap } from "lucide-react";
import Link from "next/link";
import MagneticButton from "@/components/MagneticButton";
import { UserButton } from "@clerk/nextjs";

export default function WashPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isWashing, setIsWashing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string>("auto");
  const [results, setResults] = useState<{
    cleanedCsv: string;
    stats: {
      initialRows: number;
      finalRows: number;
      emptyRowsDropped: number;
      duplicatesDropped: number;
      schemaFlattened: boolean;
      transformationsApplied: number;
      datesNormalized: number;
      imputations: number;
      geosMapped: number;
      outliersQuarantined: number;
      fuzzyMerges: number;
    };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const allowedExtensions = [".csv", ".xlsx", ".xls", ".json", ".tsv", ".zip"];
  const isValidFile = (filename: string) => allowedExtensions.some(ext => filename.toLowerCase().endsWith(ext));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFile(droppedFile.name)) {
      setFile(droppedFile);
      setResults(null);
      setError(null);
    } else {
      setError(`Please upload a valid data file (${allowedExtensions.join(", ")}).`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && isValidFile(selected.name)) {
      setFile(selected);
      setResults(null);
      setError(null);
    } else {
      setError(`Please upload a valid data file (${allowedExtensions.join(", ")}).`);
    }
  };

  const handleWash = async () => {
    if (!file) return;
    setIsWashing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("industry", industry);

      const res = await fetch("/api/wash", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to wash data");
      
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsWashing(false);
    }
  };

  const downloadCleanedFile = () => {
    if (!results) return;
    const blob = new Blob([results.cleanedCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `cleaned_${file?.name || "data.csv"}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-[#F3F4F6] selection:bg-white/20 font-sans selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 mix-blend-difference">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-6 h-6 bg-white rounded-sm group-hover:scale-95 transition-transform" />
          <span className="font-medium tracking-tight text-lg text-white">Prism Wash</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/analyse">
            <MagneticButton className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              Full Analysis
            </MagneticButton>
          </Link>
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-full border border-white/10" } }} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-6 ring-1 ring-white/10">
            <ShieldCheck className="w-8 h-8 text-white/80" />
          </div>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-4 text-white">
            Data Sanitization.
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto font-light tracking-wide mb-6">
            Drop your messy CSVs. We'll automatically flatten complex survey schemas, fix typos, fill gaps, and quarantine outliers to give you a pristine dataset.
          </p>
          <div className="flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm font-medium text-white/40 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Free</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20 hidden md:block" />
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>Zero Data Retention</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20 hidden md:block" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Instant Self-Destruct</span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!results ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl flex flex-col items-center"
            >
              <div className="w-full max-w-xs mb-6 relative">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-white/50" />
                </div>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30 cursor-pointer"
                >
                  <option value="auto" className="bg-[#0A0A0A]">Generic / Auto-Detect</option>
                  <option value="healthcare" className="bg-[#0A0A0A]">Healthcare (PII Scrubbing)</option>
                  <option value="saas" className="bg-[#0A0A0A]">SaaS / B2B</option>
                  <option value="food" className="bg-[#0A0A0A]">Food & Delivery</option>
                  <option value="finance" className="bg-[#0A0A0A]">Finance & Fintech</option>
                  <option value="retail" className="bg-[#0A0A0A]">Retail & D2C</option>
                </select>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`relative w-full h-[300px] rounded-3xl border border-dashed flex flex-col items-center justify-center transition-all duration-500 overflow-hidden group
                  ${isDragging ? "border-white/50 bg-white/5" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"}
                  ${file ? "cursor-default" : "cursor-pointer"}
                `}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json,.tsv,.zip"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                
                {file ? (
                  <div className="flex flex-col items-center z-10">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-white/10">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-lg font-medium text-white mb-1">{file.name}</p>
                    <p className="text-sm text-white/50 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.name.split('.').pop()?.toUpperCase()} Document</p>
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="px-4 py-2 rounded-full text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleWash(); }}
                        disabled={isWashing}
                        className="px-6 py-2 rounded-full bg-white text-black text-sm font-medium hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isWashing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            Washing Data...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Commence Wash
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center z-10 pointer-events-none">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${isDragging ? "bg-white text-black scale-110" : "bg-white/5 text-white ring-1 ring-white/10 group-hover:scale-110 group-hover:bg-white/10"}`}>
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-medium text-white mb-2">Drag & drop your messy data file</p>
                    <p className="text-sm text-white/40">CSV, Excel, JSON, TSV, or ZIP</p>
                  </div>
                )}
                
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              </div>

              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                  <X className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center ring-1 ring-green-500/20 text-green-400">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-medium text-white">Data Sanitized</h2>
                  <p className="text-white/50 text-sm">Your dataset is now clean and ready for analysis.</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Hero Widget: Final Row Count */}
                <div className="col-span-2 row-span-2 p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full group-hover:bg-green-500/20 transition-colors duration-700" />
                  <div>
                    <p className="text-sm text-white/40 mb-2 font-medium tracking-wide uppercase">Final Row Count</p>
                    <div className="flex items-baseline gap-3">
                      <p className="text-6xl font-semibold text-white tracking-tight">{results.stats.finalRows}</p>
                      <p className="text-xl text-white/30 font-medium tracking-tight">/ {results.stats.initialRows} Initial</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-8">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <p className="text-sm text-white/60">Ready for AI analysis</p>
                  </div>
                </div>

                {/* Transformations & Schema */}
                <div className="col-span-1 p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full group-hover:bg-blue-500/20 transition-colors duration-700" />
                  <p className="text-xs text-white/40 mb-1 font-medium tracking-wide uppercase">Redactions</p>
                  <p className="text-3xl font-medium text-white mb-1">{results.stats.transformationsApplied || 0}</p>
                  <p className="text-xs text-blue-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> PII Scrubbed
                  </p>
                </div>

                <div className="col-span-1 p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-center">
                  <p className="text-xs text-white/40 mb-1 font-medium tracking-wide uppercase">Schema</p>
                  {results.stats.schemaFlattened ? (
                    <div>
                      <p className="text-xl font-medium text-white mb-1">Flattened</p>
                      <p className="text-xs text-emerald-400">Headers Collapsed</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xl font-medium text-white mb-1">Standard</p>
                      <p className="text-xs text-white/40">No changes needed</p>
                    </div>
                  )}
                </div>

                {/* New Features Row */}
                <div className="col-span-1 p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-center">
                  <p className="text-xs text-white/40 mb-1 font-medium tracking-wide uppercase">Dates Fixed</p>
                  <p className="text-2xl font-medium text-white">{results.stats.datesNormalized}</p>
                </div>
                
                <div className="col-span-1 p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-center">
                  <p className="text-xs text-white/40 mb-1 font-medium tracking-wide uppercase">Typos Merged</p>
                  <p className="text-2xl font-medium text-white">{results.stats.fuzzyMerges}</p>
                </div>

                {/* New Features Row 2 */}
                <div className="col-span-1 p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-center">
                  <p className="text-xs text-white/40 mb-1 font-medium tracking-wide uppercase">Gaps Filled</p>
                  <p className="text-2xl font-medium text-white">{results.stats.imputations}</p>
                </div>
                
                <div className="col-span-1 p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-center">
                  <p className="text-xs text-white/40 mb-1 font-medium tracking-wide uppercase">Geo Mapped</p>
                  <p className="text-2xl font-medium text-white">{results.stats.geosMapped}</p>
                </div>

                <div className="col-span-2 p-4 rounded-3xl bg-red-500/5 border border-red-500/10 flex flex-col justify-center">
                  <p className="text-xs text-red-400/60 mb-1 font-medium tracking-wide uppercase">Outliers Quarantined</p>
                  <p className="text-2xl font-medium text-red-400">{results.stats.outliersQuarantined}</p>
                </div>

                {/* Dropped Rows Widget */}
                <div className="col-span-4 grid grid-cols-2 gap-4 mt-2">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <p className="text-sm text-white/50">Empty Rows Dropped</p>
                    <p className="text-xl font-medium text-white">{results.stats.emptyRowsDropped}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <p className="text-sm text-white/50">Duplicates Removed</p>
                    <p className="text-xl font-medium text-white">{results.stats.duplicatesDropped}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={downloadCleanedFile}
                  className="flex-1 py-4 rounded-2xl bg-white text-black font-medium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Cleaned CSV
                </button>
                <button
                  onClick={() => { setFile(null); setResults(null); }}
                  className="px-6 py-4 rounded-2xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Wash Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
