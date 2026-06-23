/**
 * PrismPrintReport — Premium PDF/Print layout component.
 * Option C: The Editorial Whitepaper (Stripe / Vercel Aesthetic)
 * Designed for light-mode, airy, executive boardroom printing.
 */

import React from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:          "#ffffff",
  surface:     "#ffffff",
  surface2:    "#f8f9fa",
  border:      "#e5e7eb",
  borderHi:    "#d1d5db",
  emerald:     "#10b981",
  emeraldDim:  "rgba(16,185,129,0.08)",
  cyan:        "#06b6d4",
  cyanDim:     "rgba(6,182,212,0.08)",
  amber:       "#f59e0b",
  amberDim:    "rgba(245,158,11,0.08)",
  rose:        "#ef4444",
  roseDim:     "rgba(239,68,68,0.08)",
  violet:      "#8b5cf6",
  violetDim:   "rgba(139,92,246,0.08)",
  text1:       "#111827",
  text2:       "#4b5563",
  text3:       "#6b7280",
  text4:       "#9ca3af",
  shadow:      "0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 0 3px rgba(0,0,0,0.02)",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function s(...parts: React.CSSProperties[]): React.CSSProperties {
  return Object.assign({}, ...parts);
}

function severityColor(sev: string): string {
  if (sev === "high") return T.rose;
  if (sev === "medium") return T.amber;
  return T.cyan;
}

function severityBg(sev: string): string {
  if (sev === "high") return T.roseDim;
  if (sev === "medium") return T.amberDim;
  return T.cyanDim;
}

function priorityColor(p: string): string {
  if (p === "critical" || p === "1") return T.rose;
  if (p === "high" || p === "2") return T.amber;
  return T.cyan;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ text, color = T.text4 }: { text: string; color?: string }) {
  return (
    <div style={s({ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 })}>
      <div style={{ width: 4, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: T.text3 }}>
        {text}
      </span>
    </div>
  );
}

function Card({ children, accentColor = T.border, style }: { children: React.ReactNode; accentColor?: string; style?: React.CSSProperties }) {
  return (
    <div style={s({
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: "28px",
      position: "relative",
      breakInside: "avoid",
      pageBreakInside: "avoid",
      boxShadow: T.shadow,
    }, style ?? {})}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
      {children}
    </div>
  );
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 12px",
      borderRadius: 999,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color,
      background: bg,
      border: `1px solid ${color}20`,
    }}>{text}</span>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 6, borderRadius: 999, background: "#f3f4f6", overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: color,
        borderRadius: 999,
      }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface PrismPrintReportProps {
  lm: Record<string, any>;
  score: number;
  band: string;
  bandColorStart: string;
  bandColorEnd: string;
  dimensions: Record<string, { score: number; max: number; label: string }>;
  industry?: { id: string; label: string; emoji: string } | null;
  reportDate?: string;
  reportId?: string;
  branding?: {
    logoUrl?: string;
    brandColor?: string;
    companyName?: string;
  };
  totalRowsProcessed?: number;
}

export default function PrismPrintReport({
  lm,
  score,
  band,
  bandColorStart,
  bandColorEnd,
  dimensions,
  industry,
  reportDate,
  reportId,
  branding,
  totalRowsProcessed = 0,
}: PrismPrintReportProps) {
  const cf = lm.consumer_feedback || {};
  const sentiment = cf.sentiment_trajectory || {};
  const contradictions: any[] = cf.contradiction_analysis || [];
  const features: any[] = cf.feature_requests || [];
  const emotions: any[] = cf.emotions || lm.emotions || [];
  const segments: any[] = cf.psychographic_segments || lm.psychographic_segments || [];
  const churnAnalysis = cf.churn_risk_analysis || lm.churn_risk_analysis || {};
  const churnSignals: any[] = churnAnalysis.high_risk_signals || [];
  const recommendations: any[] = cf.strategic_recommendations || lm.strategic_recommendations || [];
  const passionIndex = cf.passion_index || lm.passion_index;
  const realityChecks: any[] = cf.reality_checks || lm.reality_checks || [];

  // Map old dark mode band colors to light mode print equivalents if necessary
  const cs = bandColorStart === "#34d399" ? T.emerald : bandColorStart === "#22d3ee" ? T.cyan : bandColorStart;
  const ce = bandColorEnd === "#22d3ee" ? T.cyan : bandColorEnd === "#a78bfa" ? T.violet : bandColorEnd;

  const formatPrevalence = (pct: any) => {
    if (typeof pct !== "number" || totalRowsProcessed === 0 || pct === 0) return null;
    const exact = Math.round((pct / 100) * totalRowsProcessed);
    return `~${exact.toLocaleString()}/${totalRowsProcessed.toLocaleString()} (${pct}%)`;
  };

  const ringColor = score >= 75 ? T.emerald : score >= 60 ? T.amber : score >= 40 ? "#f97316" : T.rose;
  const circ = 2 * Math.PI * 72;
  const offset = circ - (score / 100) * circ;

  const dimList = Object.entries(dimensions);

  const summaryWords = (lm.executive_summary || "").split(" ");
  const companyName = summaryWords[0] || "Unknown";

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: T.bg,
      color: T.text1,
      minHeight: "100vh",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>

      {/* ── COVER PAGE ──────────────────────────────────────────────────────── */}
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        pageBreakAfter: "always",
        breakAfter: "page",
        position: "relative",
        background: T.surface2,
      }}>
        {/* Top bar */}
        <div style={{ padding: "40px 60px", display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg, borderBottom: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" style={{ height: 24, width: "auto" }} />
            ) : (
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})` }} />
            )}
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: branding?.brandColor ?? T.text2 }}>
              {branding?.companyName ?? "PRISM"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {industry && <span style={{ fontSize: 11, color: T.text2, letterSpacing: "0.1em", fontWeight: 500 }}>{industry.emoji} {industry.label.toUpperCase()}</span>}
            <span style={{ fontSize: 11, color: T.text3, letterSpacing: "0.08em", fontWeight: 500 }}>Consumer Intelligence Report</span>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "60px" }}>
          <div style={{ flex: 1, paddingRight: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text3, marginBottom: 24 }}>
              Intelligence Brief · {reportDate || ""}
            </div>
            <h1 style={{ fontSize: 64, fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 1.1, color: T.text1, margin: 0, marginBottom: 8 }}>
              {companyName}
            </h1>
            <h2 style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, color: T.text1, margin: 0, marginBottom: 48 }}>
              Intelligence
            </h2>
            <p style={{ fontSize: 18, lineHeight: 1.7, color: T.text2, maxWidth: 600, marginBottom: 56, fontWeight: 400 }}>
              {lm.executive_summary || ""}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 24px",
                borderRadius: 999,
                background: `linear-gradient(135deg, ${cs}, ${ce})`,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#fff",
                boxShadow: "0 8px 20px -4px rgba(0,0,0,0.15)",
              }}>{band}</div>
              <span style={{ fontSize: 14, color: T.text3, fontWeight: 500 }}>Overall Intelligence Score</span>
            </div>
          </div>

          {/* Score ring */}
          <div style={{ textAlign: "center", flexShrink: 0, background: T.bg, padding: 48, borderRadius: 32, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
            <svg width={200} height={200} viewBox="0 0 200 200">
              <circle cx={100} cy={100} r={72} fill="none" stroke="#f3f4f6" strokeWidth={12} />
              <circle
                cx={100} cy={100} r={72}
                fill="none"
                stroke={ringColor}
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                transform="rotate(-90 100 100)"
              />
              <text x={100} y={108} textAnchor="middle" fill={T.text1} fontSize={52} fontWeight={200} fontFamily="Inter" letterSpacing="-0.04em">{score}</text>
              <text x={100} y={132} textAnchor="middle" fill={T.text4} fontSize={12} fontFamily="Inter" fontWeight={600} letterSpacing="0.1em">/ 100</text>
            </svg>
            <div style={{ fontSize: 12, color: T.text2, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 24, fontWeight: 700 }}>Prism Score</div>
            {passionIndex?.score && (
              <div style={{ marginTop: 16, fontSize: 12, color: T.text2, fontWeight: 500 }}>
                🔥 Passion Index: <span style={{ color: T.rose, fontWeight: 700 }}>{passionIndex.score}/100</span>
              </div>
            )}
          </div>
        </div>

        {/* Dimension scores at bottom of cover */}
        <div style={{ background: T.bg, borderTop: `1px solid ${T.border}`, padding: "40px 60px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 32 }}>
          {dimList.map(([key, dim]) => {
            const colors: Record<string, string> = { SIG: T.emerald, CON: T.cyan, EMO: T.amber, STR: T.cyan, CHR: T.rose, SEG: T.violet };
            const c = colors[key] ?? T.emerald;
            return (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, color: T.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{key}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>{dim.score}<span style={{ color: T.text4, fontSize: 11, fontWeight: 500 }}>/{dim.max}</span></span>
                </div>
                <ProgressBar value={(dim.score / dim.max) * 100} color={c} />
                <span style={{ fontSize: 10, color: T.text3, letterSpacing: "0.06em", fontWeight: 500 }}>{dim.label}</span>
              </div>
            );
          })}
        </div>

        {/* Cover page bottom bar */}
        <div style={{ background: T.surface2, padding: "20px 60px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 10, color: T.text4, letterSpacing: "0.1em", fontWeight: 600 }}>CONFIDENTIAL · NOT FOR DISTRIBUTION</span>
          {reportId && <span style={{ fontSize: 10, color: T.text4, fontFamily: "monospace" }}>ID: {reportId.slice(0, 8)}…</span>}
        </div>
      </div>

      {/* ── PAGE 2: SENTIMENT + CONTRADICTIONS + EMOTIONS ─────────────────── */}
      <div style={{ padding: "60px", pageBreakAfter: "always", breakAfter: "page", background: T.bg }}>
        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, paddingBottom: 20, borderBottom: `2px solid ${T.surface2}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" style={{ height: 16, width: "auto" }} />
            ) : (
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})` }} />
            )}
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: branding?.brandColor ?? T.text3 }}>{branding?.companyName ?? "PRISM"}</span>
          </div>
          <span style={{ fontSize: 11, color: T.text3, letterSpacing: "0.1em", fontWeight: 600 }}>Section 01 — Sentiment & Signal Intelligence</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
          {/* Sentiment card */}
          <Card accentColor={sentiment.overall_sentiment === "positive" ? T.emerald : sentiment.overall_sentiment === "negative" ? T.rose : T.amber}>
            <SectionLabel text="Sentiment Trajectory" color={sentiment.overall_sentiment === "positive" ? T.emerald : sentiment.overall_sentiment === "negative" ? T.rose : T.amber} />
            <div style={{ fontSize: 42, fontWeight: 300, color: T.text1, textTransform: "capitalize", marginBottom: 12, letterSpacing: "-0.02em" }}>
              {sentiment.overall_sentiment || "N/A"}
            </div>
            <div style={{ fontSize: 13, color: T.text3, marginBottom: 20, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Trajectory: <span style={{ color: T.text2, fontWeight: 700 }}>{sentiment.trajectory || "—"}</span>
            </div>
            <p style={{ fontSize: 15, color: T.text2, lineHeight: 1.7, margin: 0 }}>{sentiment.insight || "No insight available."}</p>
          </Card>

          {/* Emotions card */}
          <Card accentColor={T.violet}>
            <SectionLabel text="Emotional Signals" color={T.violet} />
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {emotions.slice(0, 4).map((e: any, i: number) => {
                const prev = formatPrevalence(e.estimated_prevalence_percentage);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <Badge text={e.intensity || "med"} color={severityColor(e.intensity)} bg={severityBg(e.intensity)} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.text1, textTransform: "capitalize", marginBottom: 4 }}>
                        {e.emotion}
                        {prev && <span style={{ marginLeft: 8, fontSize: 10, color: T.text3, fontWeight: 600, padding: "2px 6px", background: T.surface2, borderRadius: 999 }}>{prev}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.5 }}>{e.trigger}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Contradictions */}
        <Card accentColor={T.cyan} style={{ marginBottom: 0 }}>
          <SectionLabel text="Contradiction Map" color={T.cyan} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {contradictions.map((item: any, i: number) => (
              <div key={i} style={{ background: T.surface2, borderRadius: 12, padding: "20px", border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 13, color: T.text3, marginBottom: 8, fontWeight: 500 }}>
                  What they say: <br/><em style={{ color: T.text1, fontStyle: "normal", fontWeight: 400, display: "block", marginTop: 4 }}>&ldquo;{item.what_they_say}&rdquo;</em>
                </div>
                <div style={{ fontSize: 13, color: T.rose, marginBottom: 12, fontWeight: 500 }}>
                  What they do: <br/><em style={{ color: T.rose, fontStyle: "normal", fontWeight: 600, display: "block", marginTop: 4 }}>&ldquo;{item.what_they_do}&rdquo;</em>
                </div>
                {item.severity && <Badge text={`${item.severity} severity`} color={severityColor(item.severity)} bg={severityBg(item.severity)} />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── PAGE 3: FEATURES + CHURN + SEGMENTS ───────────────────────────── */}
      <div style={{ padding: "60px", pageBreakAfter: "always", breakAfter: "page", background: T.bg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, paddingBottom: 20, borderBottom: `2px solid ${T.surface2}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" style={{ height: 16, width: "auto" }} />
            ) : (
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})` }} />
            )}
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: branding?.brandColor ?? T.text3 }}>{branding?.companyName ?? "PRISM"}</span>
          </div>
          <span style={{ fontSize: 11, color: T.text3, letterSpacing: "0.1em", fontWeight: 600 }}>Section 02 — Demand Signals & Retention Risk</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
          {/* Feature Requests */}
          <Card accentColor={T.emerald}>
            <SectionLabel text="Feature Requests" color={T.emerald} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {features.map((f: any, i: number) => {
                const prev = formatPrevalence(f.estimated_prevalence_percentage);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${T.surface2}`, gap: 16 }}>
                    <span style={{ fontSize: 14, color: T.text1, fontWeight: 500 }}>
                      {f.feature}
                      {prev && <span style={{ marginLeft: 8, fontSize: 10, color: T.emerald, fontWeight: 600, padding: "2px 6px", background: T.emeraldDim, borderRadius: 999 }}>{prev}</span>}
                    </span>
                    <Badge text={f.build_priority || "med"} color={priorityColor(f.build_priority)} bg={severityBg(f.build_priority === "critical" ? "high" : f.build_priority === "high" ? "medium" : "low")} />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Churn Risk */}
          <Card accentColor={T.rose}>
            <SectionLabel text="Churn Risk Signals" color={T.rose} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {churnSignals.map((s: any, i: number) => {
                const prev = formatPrevalence(s.estimated_prevalence_percentage);
                return (
                  <div key={i} style={{ padding: "16px", borderRadius: 12, background: T.roseDim, border: `1px solid ${T.rose}30` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text1, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <span>{s.signal}</span>
                      {prev && <span style={{ fontSize: 10, color: T.rose, fontWeight: 700, padding: "2px 6px", background: "#fff", borderRadius: 999, border: `1px solid ${T.rose}30`, flexShrink: 0 }}>{prev}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: T.rose, fontWeight: 600 }}>Action Required: <span style={{ color: T.text1, fontWeight: 400 }}>{s.retention_action}</span></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Customer Archetypes */}
        <Card accentColor={T.violet}>
          <SectionLabel text="Customer Archetypes" color={T.violet} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {segments.map((seg: any, i: number) => {
              const prev = formatPrevalence(seg.estimated_prevalence_percentage);
              return (
                <div key={i} style={{ background: T.surface2, borderRadius: 12, padding: "20px", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text1, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {seg.segment_name}
                    {prev && <span style={{ fontSize: 10, color: T.text3, fontWeight: 600, padding: "2px 6px", background: T.bg, borderRadius: 999, border: `1px solid ${T.border}` }}>{prev}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.5 }}>
                    <span style={{ color: T.emerald, fontWeight: 700, marginRight: 6 }}>→</span> 
                    {seg.how_to_win_them}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── PAGE 4: STRATEGIC RECOMMENDATIONS + REALITY CHECKS ────────────── */}
      <div style={{ padding: "60px", background: T.bg, minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, paddingBottom: 20, borderBottom: `2px solid ${T.surface2}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" style={{ height: 16, width: "auto" }} />
            ) : (
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})` }} />
            )}
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: branding?.brandColor ?? T.text3 }}>{branding?.companyName ?? "PRISM"}</span>
          </div>
          <span style={{ fontSize: 11, color: T.text3, letterSpacing: "0.1em", fontWeight: 600 }}>Section 03 — Strategic Action Plan</span>
        </div>

        {/* Strategic Recommendations */}
        <Card accentColor={T.emerald} style={{ marginBottom: 32 }}>
          <SectionLabel text="Strategic Recommendations" color={T.emerald} />
          {recommendations.map((rec: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: 24, padding: "24px 0", borderBottom: `1px solid ${T.surface2}`, alignItems: "flex-start" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `linear-gradient(135deg, ${cs}, ${ce})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0,
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.text1, marginBottom: 8, textTransform: "capitalize", letterSpacing: "-0.01em" }}>{rec.action}</div>
                <div style={{ fontSize: 14, color: T.text2, marginBottom: 16, lineHeight: 1.6 }}>{rec.why}</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  {rec.timeline && <Badge text={rec.timeline} color={rec.timeline === "now" ? T.rose : T.amber} bg={rec.timeline === "now" ? T.roseDim : T.amberDim} />}
                  {rec.expected_outcome && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.emerald, background: T.emeraldDim, padding: "6px 14px", borderRadius: 999, border: `1px solid ${T.emerald}30`, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {rec.expected_outcome}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Card>

        {/* Reality Checks */}
        {realityChecks.length > 0 && (
          <Card accentColor={T.amber} style={{ marginBottom: 32 }}>
            <SectionLabel text="Raw Reality vs. Sanitized" color={T.amber} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {realityChecks.map((item: any, i: number) => (
                <div key={i} style={{ borderRadius: 12, border: `1px solid ${T.borderHi}`, overflow: "hidden" }}>
                  <div style={{ background: T.surface2, padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8, fontWeight: 700 }}>Sanitized Report</div>
                    <p style={{ fontSize: 14, color: T.text2, margin: 0, lineHeight: 1.6 }}>&ldquo;{item.sanitized_english}&rdquo;</p>
                  </div>
                  <div style={{ background: T.amberDim, padding: "16px 20px", borderTop: `1px solid ${T.amber}30` }}>
                    <div style={{ fontSize: 10, color: T.amber, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8, fontWeight: 800 }}>Raw Voice</div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#b45309', fontStyle: "italic", margin: 0, lineHeight: 1.6 }}>&ldquo;{item.raw_native_quote}&rdquo;</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Watermark */}
        <div style={{ marginTop: 60, paddingTop: 30, borderTop: `1px solid ${T.borderHi}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})` }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: T.text3 }}>Powered by Prism — Consumer Intelligence Platform</span>
          </div>
          <span style={{ fontSize: 10, color: T.text4, fontWeight: 500 }}>This report was AI-generated and should be used as a strategic input.</span>
        </div>
      </div>
    </div>
  );
}
