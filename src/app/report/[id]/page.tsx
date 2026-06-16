"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Printer, ArrowRight } from "lucide-react";
import Link from "next/link";
import PrismResults from "@/components/PrismResults";
import MagneticButton from "@/components/MagneticButton";

type ReportData = {
  id: string;
  createdAt: string;
  analysis: Record<string, unknown>;
};

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/report/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error ?? "Report not found.");
        setReport(d);
        posthog.capture("report_viewed", { report_id: id });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Format the date nicely
  const formattedDate = report?.createdAt
    ? new Date(report.createdAt).toLocaleDateString("en-IN", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "";

  return (
    <div className="min-h-screen relative">
      <div className="aurora-bg print:hidden" />

      {/* Report Header — hidden on print */}
      <div className="sticky top-0 z-40 backdrop-blur-2xl bg-black/60 border-b border-white/5 px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30">Prism</span>
          <span className="text-[10px] text-white/15 mx-1">·</span>
          <span className="text-xs font-medium text-white/50">Shared Intelligence Report</span>
          {formattedDate && (
            <>
              <span className="text-[10px] text-white/10 mx-1">|</span>
              <span className="text-[10px] text-white/30">{formattedDate}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <MagneticButton
            intensity={0.1}
            onClick={() => window.open(`/report/${id}/print`, "_blank")}
            className="glass-pill px-3 py-1.5 text-[11px] font-medium text-white/50 hover:text-white gap-1.5"
          >
            <Printer className="w-3 h-3" /> Export PDF
          </MagneticButton>
          <Link href="/">
            <MagneticButton intensity={0.1} className="glass-pill px-3 py-1.5 text-[11px] font-medium text-white/50 hover:text-white gap-1.5">
              <ArrowRight className="w-3 h-3 rotate-180" /> New Analysis
            </MagneticButton>
          </Link>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:flex print:items-center print:justify-between print:px-8 print:py-4 print:border-b print:border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="font-bold text-sm text-gray-800 tracking-wide">PRISM INTELLIGENCE</span>
        </div>
        <span className="text-xs text-gray-400">{formattedDate}</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-white/30">Fetching intelligence report...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="intel-panel panel-crimson p-12 flex flex-col items-center gap-4 text-center"
          >
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <h2 className="text-lg font-medium text-white/70">Report Not Found</h2>
            <p className="text-sm text-white/40">{error}</p>
            <Link href="/">
              <MagneticButton className="glass-pill px-5 py-2.5 text-sm font-medium text-white mt-2">
                Back to Prism
              </MagneticButton>
            </Link>
          </motion.div>
        )}

        {/* Report */}
        {!loading && !error && report && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <PrismResults
              response={{
                ok: true,
                analysis: report.analysis as any,
                saved: true,
                id: report.id,
              }}
              onReset={() => {}}
              isReadOnly
            />
          </motion.div>
        )}
      </div>

      {/* Powered by Prism Watermark */}
      <div className="border-t border-white/5 py-6 text-center mt-8 print:border-gray-200 print:mt-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 print:bg-emerald-500" />
          <span className="text-[11px] font-medium text-white/25 tracking-widest uppercase print:text-gray-400">
            Powered by Prism — Consumer Intelligence Platform
          </span>
        </div>
        <p className="text-[10px] text-white/15 mt-1 print:text-gray-300">
          This report was generated by AI and should be used as a strategic input, not a definitive source.
        </p>
      </div>
    </div>
  );
}
