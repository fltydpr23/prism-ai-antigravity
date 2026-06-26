"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal, LayoutDashboard, Database, Code2, Sparkles, ChevronDown } from "lucide-react";
import PrismResults from "./PrismResults";
import rawHotelData from "../../public/data/prism-analysis-hotels.json";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SampleReportOverlay({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"compiled" | "raw">("compiled");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [hotelData, setHotelData] = useState<any>(null);
  
  useEffect(() => {
    if (isOpen && !hotelData) {
      // Use the directly imported data to avoid Next.js static asset fetching issues
      const data = JSON.parse(JSON.stringify(rawHotelData));
      
      // Removed fake quantitative math injection so it stays purely qualitative.
      // Removed artificial delay for instant loading.
      setHotelData(data);
    }
  }, [isOpen, hotelData]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Floating Vision-Pro Style Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-x-24 lg:inset-y-12 z-[101] bg-[#080808]/80 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white tracking-tight">Prism Sample Reports</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mt-0.5">Sandbox Environment</p>
                </div>
              </div>
              
              {/* Centered Pill Menu for Datasets */}
              <div className="hidden md:flex flex-1 justify-center">
                <button className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-white font-medium group">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Hotel Reviews (Qualitative)
                  <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors ml-2" />
                </button>
              </div>

              <div className="flex items-center gap-4 flex-1 justify-end">
                {/* View Toggle */}
                <div className="flex bg-black/50 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setActiveTab("compiled")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      activeTab === "compiled" 
                        ? "bg-white/10 text-white shadow-sm" 
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Compiled
                  </button>
                  <button
                    onClick={() => setActiveTab("raw")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      activeTab === "raw" 
                        ? "bg-white/10 text-emerald-400 shadow-sm" 
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    <Code2 className="w-4 h-4" /> Raw Matrix
                  </button>
                </div>

                <button 
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white/50 hover:text-white transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
              <div className="flex-1 overflow-y-auto relative">
                {!hotelData ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-5 text-white/40">
                      <Terminal className="w-10 h-10 animate-pulse text-white/20" />
                      <div className="text-sm font-mono tracking-widest uppercase">Loading heuristics...</div>
                    </div>
                  </div>
                ) : activeTab === "compiled" ? (
                  <div className="p-8 lg:p-12 max-w-6xl mx-auto relative">
                    <div className="mb-12 text-center relative z-10">
                      <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-4">Chennai Hospitality Sector Analysis</h1>
                      <p className="text-sm md:text-base text-white/40 max-w-2xl mx-auto leading-relaxed">
                        A comprehensive qualitative synthesis of 14,291 guest reviews across premium and budget hotels in Chennai. This report analyzes customer sentiment, maintenance heuristics, and core experiential drivers to determine true hospitality performance.
                      </p>
                    </div>
                    <PrismResults response={hotelData} onReset={() => {}} isReadOnly={true} />
                  </div>
                ) : (
                  <div className="h-full p-8 font-mono text-sm overflow-x-auto text-emerald-400/80 leading-relaxed bg-black/40">
                    <div className="mb-6 text-white/30 flex items-center gap-3 border-b border-white/10 pb-4">
                      <Terminal className="w-5 h-5" /> ROOT/quant_engine/prism-analysis-hotels.json
                    </div>
                    <pre className="whitespace-pre-wrap selection:bg-emerald-500/30 selection:text-white">{JSON.stringify(hotelData, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
