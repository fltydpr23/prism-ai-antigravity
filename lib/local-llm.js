/**
 * Optional local model integration for POST /api/analyse.
 *
 * Set in .env.local (server-side — never NEXT_PUBLIC_*):
 *   LOCAL_LLM_ENABLED=true
 *   LOCAL_LLM_API=ollama
 *   LOCAL_LLM_BASE_URL=http://127.0.0.1:11434   # optional for Ollama (this is the default)
 *   LOCAL_LLM_MODEL=qwen2.5:14b                 # default tag; override per request with JSON localLlmModel
 *   LOCAL_LLM_API=openai                       # LM Studio / LiteLLM OpenAI proxy / vLLM
 *   LOCAL_LLM_API_KEY=                         # only if your server expects Authorization: Bearer
 *
 * Ollama model names are whatever `ollama list` shows (no `ollama/` prefix — that’s LiteLLM-only).
 *
 * Ollama: uses POST {baseUrl}/api/chat.
 * OpenAI-compatible: POST {baseUrl}/chat/completions (BASE_URL usually ends in /v1).
 */

const MAX_CHARS = 14_000;

const DEFAULT_OLLAMA_ORIGIN = "http://127.0.0.1:11434";

/**
 * @param {{ model?: string }} [options] — request body can pass model (Ollama tag) to override env default.
 * @returns {{ baseUrl: string, model: string, api: 'ollama' | 'openai', apiKey: string } | null}
 */
export function localLlmConfig(options = {}) {
  const opts = options ?? {};
  const flag = String(process.env.LOCAL_LLM_ENABLED ?? "").toLowerCase();
  const enabled = flag === "1" || flag === "true" || flag === "yes";
  const apiRaw = String(process.env.LOCAL_LLM_API ?? "ollama").toLowerCase();
  const api = apiRaw === "openai" ? "openai" : "ollama";

  let baseUrl = String(process.env.LOCAL_LLM_BASE_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (api === "ollama" && !baseUrl) {
    baseUrl = DEFAULT_OLLAMA_ORIGIN;
  }

  let model = String(opts.model ?? process.env.LOCAL_LLM_MODEL ?? "").trim();
  if (!model && enabled && api === "ollama") {
    model = "qwen2.5:14b";
  }

  const apiKey = String(process.env.LOCAL_LLM_API_KEY ?? "").trim();

  if (!enabled || !model) return null;
  if (!baseUrl) return null;
  return { baseUrl, model, api, apiKey };
}

function stripCodeFences(s) {
  let t = s.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im.exec(t);
  if (fence) t = fence[1].trim();
  return t;
}

function parseModelJson(content) {
  const raw = typeof content === "string" ? content : "";
  try {
    const text = stripCodeFences(raw);
    return { ok: true, value: JSON.parse(text), raw };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid JSON";
    return { ok: false, raw, parseError: msg };
  }
}

const SYSTEM = `You are analyzing CUSTOMER FEEDBACK, USER REVIEWS, or SURVEY RESPONSES.

Your ONLY job is to extract consumer insights. Return NOTHING except valid JSON.

REQUIRED JSON STRUCTURE - return exactly this, no variations:
{
  "executive_summary": "1-2 sentences of the single most important insight",
  "themes": [
    {"title": "string", "description": "string", "evidence": "exact quote from feedback"}
  ],
  "emotions": [
    {"emotion": "string (e.g. frustrated, delighted)", "intensity": "high or medium or low", "why": "string"}
  ],
  "contradictions": [
    {"conflict": "string", "explanation": "string"}
  ],
  "opportunities": [
    {"area": "string", "why": "string", "action": "string"}
  ]
}

RULES:
1. Return ONLY JSON. No text before or after.
2. Do not use markdown code fences.
3. Every field must be a string or array of objects as shown.
4. Use actual quotes from the feedback inside evidence and elsewhere when citing.
5. If a logical section has nothing to say, use an empty array [] (never omit keys).
6. Think like a product manager, not a summarizer — purchase intent, friction, delight, churn risk, bugs, comparisons, gaps vs expectations.
7. Do not treat the input as literature, fiction critique, author analysis, or poetic themes unless those are explicitly voiced by customers reviewing a creative product — default lens is ALWAYS customer-product context.`;


/**
 * @param {string} text
 * @param {Record<string, unknown>} structuredMetrics
 * @param {{ baseUrl: string, model: string, api: 'ollama' | 'openai', apiKey: string }} cfg
 * @returns {Promise<{ ok: true, provider: string, model: string, parsed: unknown | null, raw: string, parseError?: string } | { ok: false, error: string }>}
 */
export async function runLocalLlmAnalysis(text, structuredMetrics, cfg) {
  if (!cfg) {
    return { ok: false, error: "Local LLM not configured." };
  }

  const excerpt =
    text.length > MAX_CHARS
      ? `${text.slice(0, MAX_CHARS)}\n\n[truncated for model context]`
      : text;

  const userPayload = [
    "Supplementary Lune metrics only (counts/tokens — not what you analyze; insights must come from the feedback text):",
    JSON.stringify(structuredMetrics),
    "",
    "CUSTOMER FEEDBACK / USER REVIEW / SURVEY TEXT:",
    excerpt,
  ].join("\n");

  try {
    let rawText = "";
    let provider = cfg.api;

    if (cfg.api === "ollama") {
      const url = `${cfg.baseUrl}/api/chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: cfg.model,
          format: "json",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: userPayload },
          ],
          stream: false,
          options: { temperature: 0.25 },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        return {
          ok: false,
          error: `Ollama HTTP ${res.status}: ${errBody.slice(0, 400)}`,
        };
      }

      const data = await res.json();
      rawText = data?.message?.content ?? "";
      if (typeof rawText !== "string") {
        return { ok: false, error: "Unexpected Ollama response shape." };
      }
    } else {
      const url = `${cfg.baseUrl}/chat/completions`;
      const headers = { "Content-Type": "application/json" };
      if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: userPayload },
          ],
          temperature: 0.25,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        return {
          ok: false,
          error: `OpenAI-compatible HTTP ${res.status}: ${errBody.slice(0, 400)}`,
        };
      }

      const data = await res.json();
      rawText = data?.choices?.[0]?.message?.content ?? "";
      if (typeof rawText !== "string") {
        return { ok: false, error: "Unexpected chat/completions response shape." };
      }
      provider = "openai-compatible";
    }

    const parsed = parseModelJson(rawText);
    return {
      ok: true,
      provider,
      model: cfg.model,
      parsed: parsed.ok ? parsed.value : null,
      raw: parsed.raw,
      ...(parsed.ok ? {} : { parseError: parsed.parseError }),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Local LLM request failed.";
    return { ok: false, error: message };
  }
}
