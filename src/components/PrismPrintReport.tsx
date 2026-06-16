/**
 * PrismPrintReport — Premium PDF/Print layout component.
 * Designed to be rendered in a dedicated print window, NOT inside the main UI.
 * Uses inline styles throughout for guaranteed cross-browser print fidelity.
 * Inspired by Apple product briefs and Pentagram annual reports.
 */

import React from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:          "#080810",
  surface:     "#0F0F1A",
  surface2:    "#141420",
  border:      "#1E1E32",
  borderHi:    "#2A2A44",
  emerald:     "#34D399",
  emeraldDim:  "rgba(52,211,153,0.15)",
  cyan:        "#22D3EE",
  cyanDim:     "rgba(34,211,238,0.12)",
  amber:       "#FBBF24",
  amberDim:    "rgba(251,191,36,0.12)",
  rose:        "#F87171",
  roseDim:     "rgba(248,113,113,0.12)",
  violet:      "#A78BFA",
  violetDim:   "rgba(167,139,250,0.12)",
  text1:       "rgba(255,255,255,0.95)",
  text2:       "rgba(255,255,255,0.60)",
  text3:       "rgba(255,255,255,0.35)",
  text4:       "rgba(255,255,255,0.18)",
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

function SectionLabel({ text, color = T.emerald }: { text: string; color?: string }) {
  return (
    <div style={s({ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 })}>
      <div style={{ width: 3, height: 12, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text3 }}>
        {text}
      </span>
    </div>
  );
}

function Card({ children, accentColor = T.emerald, style }: { children: React.ReactNode; accentColor?: string; style?: React.CSSProperties }) {
  return (
    <div style={s({
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    }, style ?? {})}>
      {/* Top accent strip */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accentColor}60, transparent)` }} />
      {children}
    </div>
  );
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color,
      background: bg,
      border: `1px solid ${color}40`,
    }}>{text}</span>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
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

  const ringColor = score >= 75 ? T.emerald : score >= 60 ? T.amber : score >= 40 ? "#f97316" : T.rose;
  const circ = 2 * Math.PI * 64;
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
        overflow: "hidden",
      }}>
        {/* Background gradient orbs */}
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60%", height: "60%", borderRadius: "50%", background: `radial-gradient(ellipse, ${ringColor}18 0%, transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "55%", height: "55%", borderRadius: "50%", background: `radial-gradient(ellipse, ${T.cyan}12 0%, transparent 65%)`, pointerEvents: "none" }} />

        {/* Top bar */}
        <div style={{ padding: "28px 44px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" style={{ height: 20, width: "auto" }} />
            ) : (
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})` }} />
            )}
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: branding?.brandColor ?? T.text2 }}>
              {branding?.companyName ?? "PRISM"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {industry && <span style={{ fontSize: 10, color: T.text3, letterSpacing: "0.08em" }}>{industry.emoji} {industry.label.toUpperCase()}</span>}
            <span style={{ fontSize: 10, color: T.text4, letterSpacing: "0.06em" }}>Consumer Intelligence Report</span>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "60px 44px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text3, marginBottom: 20 }}>
              Intelligence Brief · {reportDate || ""}
            </div>
            <h1 style={{ fontSize: 52, fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.1, color: T.text1, margin: 0, marginBottom: 12 }}>
              {companyName}
            </h1>
            <h2 style={{ fontSize: 52, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1, color: T.text1, margin: 0, marginBottom: 40 }}>
              Intelligence
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: T.text2, maxWidth: 480, marginBottom: 48, fontWeight: 300 }}>
              {lm.executive_summary || ""}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 20px",
                borderRadius: 999,
                background: `linear-gradient(135deg, ${bandColorStart}, ${bandColorEnd})`,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#fff",
              }}>{band}</div>
              <span style={{ fontSize: 13, color: T.text3 }}>Overall Intelligence Score</span>
            </div>
          </div>

          {/* Score ring */}
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <svg width={180} height={180} viewBox="0 0 180 180">
              <circle cx={90} cy={90} r={64} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
              <circle
                cx={90} cy={90} r={64}
                fill="none"
                stroke={ringColor}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                transform="rotate(-90 90 90)"
                style={{ filter: `drop-shadow(0 0 14px ${ringColor}80)` }}
              />
              <text x={90} y={84} textAnchor="middle" fill={T.text1} fontSize={36} fontWeight={300} fontFamily="Inter">{score}</text>
              <text x={90} y={102} textAnchor="middle" fill={T.text3} fontSize={10} fontFamily="Inter" letterSpacing="2">/ 100</text>
            </svg>
            <div style={{ fontSize: 10, color: T.text3, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 8 }}>Prism Score</div>
            {passionIndex?.score && (
              <div style={{ marginTop: 12, fontSize: 10, color: T.text3 }}>
                🔥 Passion Index: <span style={{ color: T.rose, fontWeight: 600 }}>{passionIndex.score}/100</span>
              </div>
            )}
          </div>
        </div>

        {/* Dimension scores at bottom of cover */}
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "28px 44px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 24 }}>
          {dimList.map(([key, dim]) => {
            const colors: Record<string, string> = { SIG: T.emerald, CON: T.cyan, EMO: T.amber, STR: T.cyan, CHR: T.rose, SEG: T.violet };
            const c = colors[key] ?? T.emerald;
            return (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 9, color: T.text3, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{key}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c }}>{dim.score}<span style={{ color: T.text4, fontSize: 9 }}>/{dim.max}</span></span>
                </div>
                <ProgressBar value={(dim.score / dim.max) * 100} color={c} />
                <span style={{ fontSize: 8, color: T.text4, letterSpacing: "0.04em" }}>{dim.label}</span>
              </div>
            );
          })}
        </div>

        {/* Cover page bottom bar */}
        <div style={{ padding: "16px 44px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: T.text4, letterSpacing: "0.06em" }}>CONFIDENTIAL · NOT FOR DISTRIBUTION</span>
          {reportId && <span style={{ fontSize: 9, color: T.text4, fontFamily: "monospace" }}>ID: {reportId.slice(0, 8)}…</span>}
        </div>
      </div>

      {/* ── PAGE 2: SENTIMENT + CONTRADICTIONS + EMOTIONS ─────────────────── */}
      <div style={{ padding: "40px 44px", pageBreakAfter: "always", breakAfter: "page" }}>
        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" style={{ height: 12, width: "auto", filter: "grayscale(1)", opacity: 0.8 }} />
            ) : (
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})` }} />
            )}
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: branding?.brandColor ?? T.text3 }}>{branding?.companyName ?? "PRISM"}</span>
          </div>
          <span style={{ fontSize: 9, color: T.text4, letterSpacing: "0.08em" }}>Section 01 — Sentiment & Signal Intelligence</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Sentiment card */}
          <Card accentColor={sentiment.overall_sentiment === "positive" ? T.emerald : sentiment.overall_sentiment === "negative" ? T.rose : T.amber}>
            <SectionLabel text="Sentiment Trajectory" color={T.amber} />
            <div style={{ fontSize: 32, fontWeight: 300, color: sentiment.overall_sentiment === "positive" ? T.emerald : sentiment.overall_sentiment === "negative" ? T.rose : T.amber, textTransform: "capitalize", marginBottom: 8 }}>
              {sentiment.overall_sentiment || "N/A"}
            </div>
            <div style={{ fontSize: 11, color: T.text3, marginBottom: 12, textTransform: "capitalize", letterSpacing: "0.06em" }}>
              Trajectory: {sentiment.trajectory || "—"}
            </div>
            <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.6 }}>{sentiment.insight || "No insight available."}</p>
          </Card>

          {/* Emotions card */}
          <Card accentColor={T.violet}>
            <SectionLabel text="Emotional Signals" color={T.violet} />
            {emotions.slice(0, 5).map((e: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                <Badge text={e.intensity || "med"} color={severityColor(e.intensity)} bg={severityBg(e.intensity)} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text1, textTransform: "capitalize", marginBottom: 2 }}>{e.emotion}</div>
                  <div style={{ fontSize: 11, color: T.text3 }}>{e.trigger}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Contradictions */}
        <Card accentColor={T.rose} style={{ marginBottom: 0 }}>
          <SectionLabel text="Contradiction Map" color={T.rose} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {contradictions.map((item: any, i: number) => (
              <div key={i} style={{ background: T.roseDim, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.rose}20` }}>
                <div style={{ fontSize: 10, color: T.text3, marginBottom: 4 }}>
                  Say: <em style={{ color: T.text2 }}>&ldquo;{item.what_they_say}&rdquo;</em>
                </div>
                <div style={{ fontSize: 11, color: T.rose, marginBottom: 6 }}>
                  Actually: <em style={{ color: "#fca5a5" }}>&ldquo;{item.what_they_do}&rdquo;</em>
                </div>
                {item.severity && <Badge text={`${item.severity} severity`} color={severityColor(item.severity)} bg={severityBg(item.severity)} />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── PAGE 3: FEATURES + CHURN + SEGMENTS ───────────────────────────── */}
      <div style={{ padding: "40px 44px", pageBreakAfter: "always", breakAfter: "page" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" style={{ height: 12, width: "auto", filter: "grayscale(1)", opacity: 0.8 }} />
            ) : (
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})` }} />
            )}
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: branding?.brandColor ?? T.text3 }}>{branding?.companyName ?? "PRISM"}</span>
          </div>
          <span style={{ fontSize: 9, color: T.text4, letterSpacing: "0.08em" }}>Section 02 — Demand Signals & Retention Risk</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Feature Requests */}
          <Card accentColor={T.cyan}>
            <SectionLabel text="Feature Requests" color={T.cyan} />
            {features.map((f: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}`, gap: 8 }}>
                <span style={{ fontSize: 12, color: T.text1 }}>{f.feature}</span>
                <Badge text={f.build_priority || "med"} color={priorityColor(f.build_priority)} bg={severityBg(f.build_priority === "critical" ? "high" : f.build_priority === "high" ? "medium" : "low")} />
              </div>
            ))}
          </Card>

          {/* Churn Risk */}
          <Card accentColor={T.rose}>
            <SectionLabel text="Churn Risk Signals" color={T.rose} />
            {churnSignals.map((s: any, i: number) => (
              <div key={i} style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 8, background: T.roseDim, border: `1px solid ${T.rose}20` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text1, marginBottom: 4 }}>{s.signal}</div>
                <div style={{ fontSize: 11, color: T.rose }}>Fix: <span style={{ color: "#fca5a5" }}>{s.retention_action}</span></div>
              </div>
            ))}
          </Card>
        </div>

        {/* Customer Archetypes */}
        <Card accentColor={T.emerald}>
          <SectionLabel text="Customer Archetypes" color={T.emerald} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {segments.map((seg: any, i: number) => (
              <div key={i} style={{ background: T.emeraldDim, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.emerald}20` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text1, marginBottom: 4 }}>{seg.segment_name}</div>
                <div style={{ fontSize: 11, color: T.emerald }}>→ <span style={{ color: T.text2 }}>{seg.how_to_win_them}</span></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── PAGE 4: STRATEGIC RECOMMENDATIONS + REALITY CHECKS ────────────── */}
      <div style={{ padding: "40px 44px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" style={{ height: 12, width: "auto", filter: "grayscale(1)", opacity: 0.8 }} />
            ) : (
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})` }} />
            )}
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: branding?.brandColor ?? T.text3 }}>{branding?.companyName ?? "PRISM"}</span>
          </div>
          <span style={{ fontSize: 9, color: T.text4, letterSpacing: "0.08em" }}>Section 03 — Strategic Action Plan</span>
        </div>

        {/* Strategic Recommendations */}
        <Card accentColor={T.emerald} style={{ marginBottom: 16 }}>
          <SectionLabel text="Strategic Recommendations" color={T.emerald} />
          {recommendations.map((rec: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: `1px solid ${T.border}`, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: `linear-gradient(135deg, ${bandColorStart}, ${bandColorEnd})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text1, marginBottom: 4, textTransform: "capitalize" }}>{rec.action}</div>
                <div style={{ fontSize: 11, color: T.text3, marginBottom: 6 }}>Why: {rec.why}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {rec.timeline && <Badge text={rec.timeline} color={rec.timeline === "now" ? T.rose : T.amber} bg={rec.timeline === "now" ? T.roseDim : T.amberDim} />}
                  {rec.expected_outcome && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.emerald, background: T.emeraldDim, padding: "2px 10px", borderRadius: 999, border: `1px solid ${T.emerald}30`, textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
          <Card accentColor={T.amber} style={{ marginBottom: 16 }}>
            <SectionLabel text="Raw Reality vs. Sanitized" color={T.amber} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {realityChecks.map((item: any, i: number) => (
                <div key={i} style={{ borderRadius: 8, border: `1px solid ${T.amber}30`, overflow: "hidden" }}>
                  <div style={{ background: T.surface2, padding: "10px 12px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 9, color: T.text4, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontWeight: 700 }}>Sanitized Report</div>
                    <p style={{ fontSize: 11, color: T.text2, margin: 0 }}>&ldquo;{item.sanitized_english}&rdquo;</p>
                  </div>
                  <div style={{ background: `${T.amber}0A`, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: T.amber, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontWeight: 700 }}>Raw Voice</div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.amber, fontStyle: "italic", margin: 0 }}>&ldquo;{item.raw_native_quote}&rdquo;</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Watermark */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})` }} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: T.text3 }}>Powered by Prism — Consumer Intelligence Platform</span>
          </div>
          <span style={{ fontSize: 9, color: T.text4 }}>This report was AI-generated and should be used as a strategic input.</span>
        </div>
      </div>
    </div>
  );
}
