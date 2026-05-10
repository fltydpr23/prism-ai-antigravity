/** Synodic month length (mean), milliseconds */
const SYNODIC_MS = 29.530588861 * 86400000;
/** Reference instant treated as a new moon for phase estimation */
const KNOWN_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14, 0);

const MOON_LABELS = [
  "New",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full",
  "Waning gibbous",
  "Third quarter",
  "Waning crescent",
];

/**
 * Rough lunar phase at an instant (cosmetic / branding for Lune — not observatory-grade).
 * @param {Date} [date=new Date()]
 */
export function moonPhaseAt(date = new Date()) {
  const t = date.getTime();
  const age =
    ((t - KNOWN_NEW_MOON_UTC) % SYNODIC_MS + SYNODIC_MS) % SYNODIC_MS;
  const phase01 = age / SYNODIC_MS;
  const idx = Math.floor(phase01 * 8) % 8;
  const illumination = Math.round(
    ((1 - Math.cos(2 * Math.PI * phase01)) / 2) * 100,
  );
  return {
    phase01,
    label: MOON_LABELS[idx],
    illuminationPercent: illumination,
  };
}

const STOP = new Set(
  "a an the and or but in on at to for of as is was were be been being it its if then else with from by not no yes so too very can could should would about into through during before after above below between both each few more most other some such than that this those these what which who whom whose when where why how".split(
    " ",
  ),
);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function hashToUint(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Structured pass over free-form text — counts, light lexical stats, Lune context.
 * @param {string} text
 * @param {{ at?: Date }} [options]
 */
export function analyse(text, options = {}) {
  const at = options.at instanceof Date ? options.at : new Date();
  const raw = typeof text === "string" ? text : "";
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      ok: true,
      empty: true,
      generatedAt: at.toISOString(),
      moon: moonPhaseAt(at),
      metrics: {
        charCount: 0,
        charCountNoWs: 0,
        wordCount: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        avgWordLength: 0,
        lexicalDensity: 0,
      },
      topTokens: [],
      luneSignature: null,
      caption: "Nothing to analyse yet.",
    };
  }

  const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim());
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim());
  const words = tokenize(trimmed);
  const wordCount = words.length;

  const freq = new Map();
  for (const w of words) {
    if (w.length < 2 || STOP.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  const topTokens = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([token, count]) => ({ token, count }));

  const numerics = words.filter((w) => /^\d+\.?\d*$/.test(w)).length;
  const contentWords = words.filter((w) => !STOP.has(w)).length;
  const lexicalDensity =
    wordCount > 0 ? Math.round((contentWords / wordCount) * 1000) / 1000 : 0;

  const charCount = raw.length;
  const charCountNoWs = raw.replace(/\s/g, "").length;
  const avgWordLength =
    wordCount > 0
      ? Math.round((charCountNoWs / wordCount) * 100) / 100
      : 0;

  const h = hashToUint(trimmed);
  const luneSignature = {
    hue: Math.round((h % 36000) / 100),
    drift: Math.round(((h >>> 8) % 10000) / 100) / 100,
  };

  const caption =
    wordCount < 8
      ? "Short note — sparse signal, rich intent."
      : wordCount < 120
        ? "Brief piece — rhythm and diction carry most of the meaning."
        : "Extended text — structure and repetition patterns matter.";

  return {
    ok: true,
    empty: false,
    generatedAt: at.toISOString(),
    moon: moonPhaseAt(at),
    metrics: {
      charCount,
      charCountNoWs,
      wordCount,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      avgWordLength,
      lexicalDensity,
      numericTokenCount: numerics,
    },
    topTokens,
    luneSignature,
    caption,
  };
}
