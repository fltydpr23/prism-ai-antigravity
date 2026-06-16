export type PisDimension = {
  score: number;
  max: number;
  tip: string;
};

export type PisBreakdown = {
  SIG: PisDimension;
  CON: PisDimension;
  EMO: PisDimension;
  STR: PisDimension;
  CHR: PisDimension;
  SEG: PisDimension;
};

export type PisResult = {
  total: number;
  band: string;
  bandColor: string;
  interpretation: string;
  dimensions: PisBreakdown;
  weakest: string;
};

export function calculatePrismScore(analysis: any, localModel: Record<string, any>): PisResult {
  // — Dimension 1: Signal Clarity (SIG) — 25 pts —
  let sig = 0;
  const summary = (localModel.executive_summary as string) || "";
  const hasSummary = !!summary.trim();
  const cf = localModel.consumer_feedback || {};
  const traj = (cf.sentiment_trajectory || localModel.sentiment_trajectory) as { trajectory?: string; insight?: string } | undefined;

  if (hasSummary) sig += 10;
  if (traj?.trajectory && traj?.insight && traj.insight.length > 20) sig += 10;

  const wordCount = (analysis.metrics?.wordCount as number) || 0;
  if (wordCount >= 100) sig += 5;

  // Stricter rule from roadmap: Bonus for concise, decision-forcing summary
  if (hasSummary && summary.length < 150) {
    sig = Math.min(25, sig + 5);
  }

  const sigTip = sig >= 22 ? "Excellent signal clarity." : sig >= 15 ? "Add a more specific sentiment trajectory 'when/why' to raise clarity." : "Your executive summary needs to be a single decision-forcing sentence under 150 chars.";

  // — Dimension 2: Contradiction Depth (CON) — 20 pts —
  let con = 0;
  const contras = ((cf.contradiction_analysis as any[]) || (localModel.contradiction_analysis as any[]) || (localModel.contradictions as any[]) || []);
  if (contras.length >= 3) con = 20;
  else if (contras.length === 2) con = 14;
  else if (contras.length === 1) con = 8;

  const hasHighSeverity = contras.some((c: any) => c.severity === 'high');
  if (hasHighSeverity && con < 20) con = Math.min(20, con + 4);

  const conTip = con >= 18 ? "Strong contradiction signal — this is your most valuable intelligence." : con >= 10 ? "Find one more 'Say vs. Do' gap to unlock deeper strategic insight." : "Contradictions are the most valuable signal. Look harder for behavioural gaps in the feedback.";

  // — Dimension 3: Emotional Precision (EMO) — 15 pts —
  let emo = 0;
  const emotions = (cf.emotions as any[]) || (localModel.emotions as any[]) || [];
  const emotionsWithTriggers = emotions.filter((e: any) => e.trigger && e.trigger.length > 5);
  emo += Math.min(emotionsWithTriggers.length, 3) * 4;

  const hasHighEmo = emotions.some((e: any) => e.intensity?.toLowerCase() === 'high');
  if (hasHighEmo) emo += 3;

  const drivers = (cf.sentiment_drivers || localModel.sentiment_drivers) as { delight_triggers?: any[]; frustration_triggers?: any[]; anxiety_triggers?: any[] } | undefined;
  if (drivers?.frustration_triggers?.length) emo = Math.min(15, emo + 2);

  // Stricter rule from roadmap: Penalty for generic emotions without triggers
  const genericEmotions = emotions.filter((e: any) =>
    ['happy', 'sad', 'angry', 'good', 'bad'].includes(e.emotion?.toLowerCase()) && !e.trigger
  ).length;
  emo = Math.max(0, emo - genericEmotions * 3);

  const emoTip = emo >= 13 ? "Precise emotional mapping." : emo >= 8 ? "Map each emotion to a specific trigger, not a category." : "Emotions without triggers are noise. Each emotion needs a 'what specifically caused this' link.";

  // — Dimension 4: Strategic Coverage (STR) — 20 pts —
  let str = 0;
  const recs = (cf.strategic_recommendations as any[]) || (localModel.strategic_recommendations as any[]) || [];
  if (recs.length >= 3) str += 15;
  else if (recs.length === 2) str += 10;
  else if (recs.length === 1) str += 5;

  const hasNowRec = recs.some((r: any) => r.priority === '1' || r.timeline === 'now');
  if (hasNowRec) str = Math.min(20, str + 5);

  // Stricter rule from roadmap: Bonus for full structure
  const fullRecs = recs.filter((r: any) => r.action && r.why && r.expected_outcome).length;
  if (fullRecs >= 2) str = Math.min(20, str + 3);

  const strTip = str >= 18 ? "Comprehensive strategic coverage with prioritised actions." : str >= 10 ? "Add a Priority 1 recommendation with a specific expected metric outcome." : "You need at least 2 strategic recommendations with clear outcomes to make this score actionable.";

  // — Dimension 5: Churn Exposure (CHR) — 10 pts —
  let chr = 0;
  const churnAnalysis = cf.churn_risk_analysis || localModel.churn_risk_analysis || {};
  const churnSignals = (churnAnalysis.high_risk_signals as any[]) || [];
  if (churnSignals.length >= 2) chr = 10;
  else if (churnSignals.length === 1) chr = 5;

  const hasRetentionStrengths = (churnAnalysis.retention_strengths as any[])?.length > 0;
  if (hasRetentionStrengths) chr = Math.min(10, chr + 2);

  const chrTip = chr >= 9 ? "Churn signals clearly identified with specific retention actions." : chr >= 5 ? "Add a second churn signal with a specific retention action to improve defensibility." : "Identifying at-risk users before they leave is critical. Surface early warning signals.";

  // — Dimension 6: Segment Resolution (SEG) — 10 pts —
  let seg = 0;
  const segments = (cf.psychographic_segments as any[]) || (localModel.psychographic_segments as any[]) || [];
  if (segments.length >= 2) seg = 10;
  else if (segments.length === 1) seg = 5;

  const hasHowToWin = segments.some((s: any) => s.how_to_win_them?.length > 10);
  if (hasHowToWin) seg = Math.min(10, seg + 2);

  const segTip = seg >= 9 ? "Segments are distinct and actionable." : seg >= 5 ? "Identify a second psychographic segment (e.g., 'The Skeptic') for fuller coverage." : "Segment by values and decision-making patterns, not demographics.";

  // — Composite Score (weighted) —
  const total = Math.round(Math.min(100,
    (sig / 25) * 25 +
    (con / 20) * 20 +
    (emo / 15) * 15 +
    (str / 20) * 20 +
    (chr / 10) * 10 +
    (seg / 10) * 10
  ));

  // Premium Banding
  let band = "Prism Noise";
  let bandColor = "from-white/40 to-white/10";
  let interpretation = "Insufficient signal for strategic conclusions.";

  if (total >= 90) {
    band = "Prism Diamond";
    bandColor = "from-sky-400 to-violet-600";
    interpretation = "Board-ready intelligence. High confidence.";
  } else if (total >= 75) {
    band = "Prism Clarity";
    bandColor = "from-emerald-400 to-teal-600";
    interpretation = "Strong signal. Immediately actionable.";
  } else if (total >= 60) {
    band = "Prism Signal";
    bandColor = "from-amber-400 to-orange-600";
    interpretation = "Good signal, but some evidence gaps remain.";
  } else if (total >= 40) {
    band = "Prism Static";
    bandColor = "from-rose-400 to-pink-600";
    interpretation = "Thin signal. Collect more data before acting.";
  }

  // Find weakest dimension
  const dims: PisBreakdown = {
    SIG: { score: sig, max: 25, tip: sigTip },
    CON: { score: con, max: 20, tip: conTip },
    EMO: { score: emo, max: 15, tip: emoTip },
    STR: { score: str, max: 20, tip: strTip },
    CHR: { score: chr, max: 10, tip: chrTip },
    SEG: { score: seg, max: 10, tip: segTip }
  };

  const weakest = Object.keys(dims).reduce((a, b) =>
    (dims[a as keyof PisBreakdown].score / dims[a as keyof PisBreakdown].max) <
      (dims[b as keyof PisBreakdown].score / dims[b as keyof PisBreakdown].max) ? a : b
  );

  const labels: Record<string, string> = {
    SIG: 'Signal Clarity',
    CON: 'Contradiction Depth',
    EMO: 'Emotional Precision',
    STR: 'Market Opportunity Detection',
    CHR: 'Churn Exposure',
    SEG: 'Segment Resolution'
  };

  return {
    total,
    band,
    bandColor,
    interpretation,
    dimensions: dims,
    weakest: labels[weakest]
  };
}
