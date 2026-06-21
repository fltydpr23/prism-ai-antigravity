"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, FileText, Loader2, AlertCircle, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import MagneticButton from "@/components/MagneticButton";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import { useWorkspace } from "../../providers/WorkspaceProvider";

type HistoryItem = {
  id: string;
  createdAt: string;
  execSummary: string;
  industry: { id: string; label: string; emoji: string } | null;
  wordCount: number;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

export default function HistoryPage() {
  const { isLoaded, userId } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { activeWorkspace } = useWorkspace();

  const fetchDbHistory = () => {
    setLoading(true);
    let url = "/api/history";
    if (activeWorkspace) {
      url += `?workspace_id=${activeWorkspace.id}`;
    }
    
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error ?? "Failed to load.");
        setItems(d.items);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Sync local storage analyses to Supabase when user signs in
  useEffect(() => {
    if (!userId) return;
    const local = localStorage.getItem("prism_local_analyses");
    if (!local) return;
    
    try {
      const localItems = JSON.parse(local);
      if (localItems.length === 0) return;
      
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: localItems })
      })
      .then(res => res.json())
      .then(d => {
        if (d.ok) {
          console.log(`Synced ${d.synced} local analyses to your account.`);
          localStorage.removeItem("prism_local_analyses");
          fetchDbHistory();
        }
      })
      .catch(err => console.error("Auto-sync failed", err));
    } catch (e) {
      console.error("Failed to parse local analyses for sync", e);
    }
  }, [userId]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      // Guest mode: load from localStorage
      setLoading(true);
      try {
        const local = localStorage.getItem("prism_local_analyses");
        if (local) {
          const localItems = JSON.parse(local);
          const mappedItems = localItems.map((row: any) => {
            const result = row.result ?? {};
            const localModel = result.localModel?.parsed ?? {};
            const industry = result.industry ?? null;
            const metrics = result.metrics ?? {};

            return {
              id: row.id,
              createdAt: row.createdAt,
              execSummary: localModel.executive_summary ?? "No summary available.",
              industry,
              wordCount: metrics.wordCount ?? 0,
            };
          });
          
          // Sort items by createdAt descending
          mappedItems.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          setItems(mappedItems);
        } else {
          setItems([]);
        }
        setError(null);
      } catch (e) {
        setError("Failed to load local history.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    } else {
      // Authenticated mode: fetch from database
      fetchDbHistory();
    }
  }, [isLoaded, userId, activeWorkspace]);

  return (
    <div className="min-h-screen relative">
      <div className="aurora-bg" />

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-2xl bg-black/60 border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30">Prism</span>
          <span className="text-[10px] text-white/15 mx-1">·</span>
          <span className="text-xs font-medium text-white/50">Intelligence Archive</span>
        </div>
        <div className="flex items-center gap-4">
          <WorkspaceSwitcher />
          <Link href="/analyse">
            <MagneticButton intensity={0.1} className="glass-pill px-3 py-1.5 text-[11px] font-medium text-white/50 hover:text-white gap-1.5">
              <ArrowRight className="w-3 h-3 rotate-180" /> New Analysis
            </MagneticButton>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-white/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white/90">Archive</h1>
          </div>
          <p className="text-sm text-white/40 ml-11">All saved analyses, from most recent. Click any report to view.</p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
            <p className="text-sm text-white/30">Fetching intelligence archive...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="intel-panel panel-crimson p-8 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <p className="text-sm text-white/60">{error}</p>
            <p className="text-xs text-white/30">Is Supabase configured? Check your environment variables.</p>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="intel-panel panel-emerald p-12 flex flex-col items-center gap-4 text-center">
            <Sparkles className="w-10 h-10 text-emerald-400/50" />
            <h2 className="text-lg font-medium text-white/70">No saved analyses yet.</h2>
            <p className="text-sm text-white/35 max-w-sm">Run an analysis with &ldquo;Save to Archive&rdquo; toggled on. Your intelligence history will appear here.</p>
            <Link href="/analyse">
              <MagneticButton className="glass-pill px-5 py-2.5 text-sm font-medium text-white mt-2">
                Run First Analysis
              </MagneticButton>
            </Link>
          </motion.div>
        )}

        {/* Archive list / Timeline */}
        {!loading && !error && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col relative"
          >
            {/* The vertical timeline axis */}
            <div className="absolute top-0 bottom-0 left-[19px] w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent hidden sm:block" />

            <div className="flex flex-col gap-8">
              {Object.entries(
                items.reduce((acc, item) => {
                  const date = new Date(item.createdAt);
                  const monthYear = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
                  if (!acc[monthYear]) acc[monthYear] = [];
                  acc[monthYear].push(item);
                  return acc;
                }, {} as Record<string, typeof items>)
              ).map(([monthYear, monthItems], groupIdx) => (
                <div key={monthYear} className="relative">
                  {/* Timeline Month Label */}
                  <div className="flex items-center gap-4 mb-4 sm:ml-12">
                    <div className="hidden sm:flex absolute left-[15px] w-2.5 h-2.5 rounded-full bg-[#080810] border-2 border-emerald-500/50 items-center justify-center">
                       <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-emerald-400/80 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                      {monthYear}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 sm:ml-12">
                    <AnimatePresence>
                      {monthItems.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.35 }}
                          className="relative group"
                        >
                          {/* Node connector line */}
                          <div className="hidden sm:block absolute -left-12 top-1/2 w-6 h-px bg-white/10 group-hover:bg-emerald-500/30 transition-colors" />
                          {/* Node dot */}
                          <div className="hidden sm:block absolute -left-[29px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all duration-300" />

                          <Link href={`/report/${item.id}`} className="block">
                            <div className="intel-panel panel-emerald p-5 flex items-start gap-4 hover:border-emerald-500/25 transition-all duration-200 hover:bg-white/[0.03]">
                              {/* Icon */}
                              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0 group-hover:border-emerald-500/30 transition-colors">
                                {item.industry?.emoji
                                  ? <span className="text-sm">{item.industry.emoji}</span>
                                  : <FileText className="w-4 h-4 text-white/30" />
                                }
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/80 leading-snug line-clamp-2 font-medium group-hover:text-white transition-colors">
                                  {item.execSummary}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  {item.industry && (
                                    <span className="text-[10px] text-white/30 font-medium">{item.industry.label}</span>
                                  )}
                                  {item.wordCount > 0 && (
                                    <span className="text-[10px] text-white/20">{item.wordCount.toLocaleString()} words</span>
                                  )}
                                  <span className="text-[10px] text-white/20 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" /> {timeAgo(item.createdAt)}
                                  </span>
                                </div>
                              </div>

                              {/* Arrow */}
                              <div className="shrink-0 text-white/15 group-hover:text-emerald-400 transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
