import fs from 'fs';
import path from 'path';

// Helper to manually load .env.local if process.env is missing the key
function loadEnvManual() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const firstEqual = trimmed.indexOf('=');
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const value = trimmed.slice(firstEqual + 1).trim();
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to load .env.local manually:", e);
  }
}

/**
 * Detects the language of a single text snippet using Sarvam AI.
 */
export async function detectLanguage(text) {
  loadEnvManual();
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    console.error("[Sarvam] Missing SARVAM_API_KEY in .env.local");
    return null;
  }

  // Sarvam has a 1000 char limit for LID
  const safeText = text.substring(0, 999);

  let attempt = 0;
  const maxAttempts = 3;
  let delay = 1000;

  while (attempt < maxAttempts) {
    try {
      const res = await fetch("https://api.sarvam.ai/text-lid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": apiKey
        },
        body: JSON.stringify({ input: safeText })
      });

      if (!res.ok) {
        if (res.status === 429) {
          console.warn(`[Sarvam] API Error 429 Too Many Requests (Attempt ${attempt + 1}/${maxAttempts}). Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          attempt++;
          delay *= 2; // exponential backoff
          continue;
        }
        console.error(`[Sarvam] API Error: ${res.status} ${res.statusText}`);
        return null;
      }

      const data = await res.json();
      return {
        language_code: data.language_code,
        // Fallbacks in case script is embedded or named differently
        script_code: data.script_code ?? undefined
      };
    } catch (err) {
      console.error("[Sarvam] Request failed", err);
      return null;
    }
  }
  
  console.error("[Sarvam] Max retries reached for 429.");
  return null;
}

/**
 * Normalizes Sarvam's language codes to our Prism internal language labels.
 * e.g., "hi" + "Latn" -> "Hinglish (HI)"
 *       "hi" + "Deva" -> "Hindi (DE)"
 *       "en"          -> "English (EN)"
 */
export function normalizeSarvamCode(langCode, scriptCode) {
  if (!langCode) return "Unknown";
  
  const lc = langCode.toLowerCase();
  const sc = (scriptCode || "").toLowerCase();

  if (lc === "en") return "English";
  
  if (lc === "hi") {
    if (sc.includes("latn") || sc === "") return "Hinglish";
    return "Hindi (Devanagari)";
  }
  
  if (lc === "ta") {
    if (sc.includes("latn")) return "Tanglish";
    return "Tamil";
  }

  if (lc === "te") {
    if (sc.includes("latn")) return "Tenglish";
    return "Telugu";
  }

  // General fallback for other Indic languages
  const indicMap = {
    "mr": "Marathi",
    "bn": "Bengali",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia"
  };

  const baseName = indicMap[lc] || lc.toUpperCase();
  if (sc.includes("latn")) {
    return `${baseName} (Romanized)`;
  }
  return baseName;
}
