// ─── Prism Industry Detector ─────────────────────────────────────────────────
// Zero-cost heuristic: keyword frequency scoring across the first 5000 chars.
// No LLM call needed — runs in < 5ms.

import { INDUSTRY_OPTIONS, type IndustryDef, type IndustryId } from "./industryConfig";

interface DetectionResult {
  industry: IndustryId;
  label: string;
  emoji: string;
  confidence: "high" | "medium" | "low" | "none";
  topScore: number;
}

const SAMPLE_CHARS = 8000; // characters to scan — enough signal, keeps it fast
const MIN_SCORE_THRESHOLD = 3; // below this → return "auto" (generic)

export function detectIndustry(text: string): DetectionResult {
  const sample = text.slice(0, SAMPLE_CHARS).toLowerCase();

  const scores: Record<string, number> = {};

  for (const industry of INDUSTRY_OPTIONS) {
    let score = 0;
    for (const [keyword, weight] of industry.keywords) {
      // Count occurrences (not just presence) for robustness on large CSVs
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      const matches = sample.match(regex);
      if (matches) {
        score += matches.length * weight;
      }
    }
    scores[industry.id] = score;
  }

  // Find winner
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topId, topScore] = sorted[0] ?? ["auto", 0];

  if (topScore < MIN_SCORE_THRESHOLD) {
    return {
      industry: "auto",
      label: "General",
      emoji: "🔍",
      confidence: "none",
      topScore: 0,
    };
  }

  const winner = INDUSTRY_OPTIONS.find((i) => i.id === topId) as IndustryDef;
  const secondScore = sorted[1]?.[1] ?? 0;
  const gap = topScore - secondScore;

  const confidence: DetectionResult["confidence"] =
    topScore >= 15 && gap >= 5 ? "high" :
    topScore >= 6 && gap >= 2  ? "medium" :
    "low";

  return {
    industry: winner.id,
    label: winner.label,
    emoji: winner.emoji,
    confidence,
    topScore,
  };
}
