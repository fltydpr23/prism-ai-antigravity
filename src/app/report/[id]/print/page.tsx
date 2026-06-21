"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PrismPrintReport from "@/components/PrismPrintReport";
import { calculatePrismScore } from "../../../../../lib/prismScore";

type ReportData = {
  id: string;
  createdAt: string;
  analysis: Record<string, unknown>;
  workspace?: { logo_url?: string; brand_color?: string; name?: string };
};

export default function PrintPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    if (id.startsWith("local_")) {
      try {
        const local = localStorage.getItem("prism_local_analyses");
        if (local) {
          const localItems = JSON.parse(local);
          const found = localItems.find((item: any) => item.id === id);
          if (found) {
            setReport({
              id: found.id,
              createdAt: found.createdAt,
              analysis: found.result,
            });
            setError(null);
          } else {
            throw new Error("Local report not found.");
          }
        } else {
          throw new Error("No local reports stored.");
        }
      } catch (e: any) {
        setError(e.message);
      }
    } else {
      fetch(`/api/report/${id}`)
        .then((r) => r.json())
        .then((d) => {
          if (!d.ok) throw new Error(d.error ?? "Report not found.");
          setReport(d);
        })
        .catch((e) => setError(e.message));
    }
  }, [id]);

  // Auto-trigger print once loaded
  useEffect(() => {
    if (!report) return;
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, [report]);

  if (error) {
    return (
      <div style={{ fontFamily: "sans-serif", background: "#080810", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ fontFamily: "sans-serif", background: "#080810", color: "rgba(255,255,255,0.4)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ width: 16, height: 16, border: "2px solid #34d399", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span>Preparing premium report...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Compute score from analysis
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analysis = report.analysis as any;
  const lm = analysis?.localModel?.parsed ?? {};
  const scoreResult = calculatePrismScore(analysis || {}, lm || {});

  const bandColorMap: Record<string, [string, string]> = {
    "Prism Diamond":   ["#34d399", "#22d3ee"],
    "Prism Platinum":  ["#22d3ee", "#a78bfa"],
    "Prism Gold":      ["#fbbf24", "#f97316"],
    "Prism Silver":    ["#9ca3af", "#6b7280"],
    "Prism Bronze":    ["#f97316", "#ef4444"],
    "Prism Raw":       ["#f87171", "#dc2626"],
  };
  const [cs, ce] = bandColorMap[scoreResult.band] ?? ["#34d399", "#22d3ee"];

  // Build dimensions for report
  const dims: Record<string, { score: number; max: number; label: string }> = {};
  const labelMap: Record<string, string> = {
    SIG: "Signal Clarity", CON: "Contradiction Depth",
    EMO: "Emotional Precision", STR: "Strategic Coverage",
    CHR: "Churn Exposure", SEG: "Segment Resolution",
  };
  for (const [key, dim] of Object.entries(scoreResult.dimensions)) {
    dims[key] = { score: (dim as any).score, max: (dim as any).max, label: labelMap[key] ?? key };
  }

  const formattedDate = new Date(report.createdAt).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      <style>{`
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @media print {
          @page { margin: 0; size: A4; }
          body { margin: 0; }
        }
      `}</style>
      <PrismPrintReport
        lm={lm}
        score={scoreResult.total}
        band={scoreResult.band}
        bandColorStart={cs}
        bandColorEnd={ce}
        dimensions={dims}
        industry={analysis?.industry ?? null}
        reportDate={formattedDate}
        reportId={report.id}
        branding={report.workspace ? {
          logoUrl: report.workspace.logo_url,
          brandColor: report.workspace.brand_color,
          companyName: report.workspace.name
        } : undefined}
      />
    </>
  );
}
