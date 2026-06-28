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

import fs from 'fs';
import path from 'path';

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
            process.env[key] = value;
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to load .env.local manually:", e);
  }
}

const MAX_CHARS = 14_000;

const DEFAULT_OLLAMA_ORIGIN = "http://127.0.0.1:11434";

/**
 * @param {{ model?: string, modality?: string }} [options] — request body can pass model (Ollama tag) to override env default.
 * @returns {{ baseUrl: string, model: string, api: 'ollama' | 'openai' | 'together' | 'openrouter', apiKey: string, modality?: string } | null}
 */
export function localLlmConfig(options = {}) {
  loadEnvManual();
  const opts = options ?? {};
  const flag = String(process.env.LOCAL_LLM_ENABLED ?? "").toLowerCase();
  const enabled = flag === "1" || flag === "true" || flag === "yes";
  const apiRaw = String(process.env.LOCAL_LLM_API ?? "ollama").toLowerCase();
  
  let api = "ollama";
  if (apiRaw === "openai") api = "openai";
  if (apiRaw === "openrouter") api = "openrouter";
  if (apiRaw === "together") api = "together";

  let baseUrl = String(process.env.LOCAL_LLM_BASE_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  
  if (api === "ollama" && !baseUrl) {
    baseUrl = DEFAULT_OLLAMA_ORIGIN;
  }
  if (api === "openrouter" && !baseUrl) {
    baseUrl = "https://openrouter.ai/api/v1";
  }
  if (api === "together" && !baseUrl) {
    baseUrl = "https://api.together.xyz/v1";
  }

  let model = String(opts.model ?? process.env.LOCAL_LLM_MODEL ?? "").trim();
  if (!model && enabled) {
    if (api === "ollama") model = "qwen2.5:14b";
    if (api === "openrouter") model = "openai/gpt-oss-120b:free";
    if (api === "together") model = "meta-llama/Llama-3-8b-chat-hf"; // Default fast model
  }

  const apiKey = String(process.env.TOGETHER_API_KEY ?? process.env.OPENROUTER_API_KEY ?? process.env.LOCAL_LLM_API_KEY ?? "").trim();

  console.log(`[localLlmConfig] enabled: ${enabled}, flag: "${flag}", model: "${model}", baseUrl: "${baseUrl}", api: "${api}"`);

  if (!enabled || !model) return null;
  if (!baseUrl && api !== "openai") return null; // OpenAI might use default base url if empty in SDK
  return { baseUrl, model, api, apiKey, modality: opts.modality };
}

function stripCodeFences(s) {
  let t = s.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im.exec(t);
  if (fence) t = fence[1].trim();
  return t;
}

function findMatchingBrace(text, startIdx) {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') depth++;
      if (char === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
  }
  return -1;
}

function parseModelJson(content) {
  const raw = typeof content === "string" ? content : "";
  try {
    let text = stripCodeFences(raw);
    
    // Extract everything between the first { and its matching }
    const firstBrace = text.indexOf("{");
    if (firstBrace !== -1) {
      const matchingBrace = findMatchingBrace(text, firstBrace);
      if (matchingBrace !== -1) {
        text = text.slice(firstBrace, matchingBrace + 1);
      } else {
        // Fallback to last index if matching brace not found (maybe incomplete)
        const lastBrace = text.lastIndexOf("}");
        if (lastBrace !== -1 && lastBrace > firstBrace) {
          text = text.slice(firstBrace, lastBrace + 1);
        }
      }
    }
    
    // Remove trailing commas before closing braces/brackets
    text = text.replace(/,\s*([}\]])/g, "$1");
    
    return { ok: true, value: JSON.parse(text), raw };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid JSON";
    return { ok: false, raw, parseError: msg };
  }
}

const SYSTEM_GEMMA = `You are a strategic consumer intelligence analyst building the Prism Intelligence Score.

Your ONLY job: Extract actionable strategic intelligence from messy feedback and score its quality across 6 dimensions.

You are NOT writing a report. You are NOT summarizing. You are extracting SIGNALS that tell a founder what to do.

CRITICAL RULES (follow exactly):
1. Return ONLY valid JSON. No markdown. No code fences. No preamble.
2. Every field must have a value. No null values. No empty arrays.
3. If you cannot extract something, write "Not detected in feedback" (never empty).
4. All numeric percentages must be exact: "37%" or "2 out of 5 users", never "many".
5. All quotes must be EXACT from the feedback, in double quotes.
6. All severity/priority/frequency fields must be one of the exact values given (no variations).

---

RETURN THIS JSON STRUCTURE ONLY:

{
  "executive_summary": "ONE sentence stating the single insight that would change a founder's decision. Make it decision-forcing, not descriptive.",
  
  "sentiment_trajectory": {
    "overall_sentiment": "[positive|negative|mixed]",
    "trajectory": "[improving|declining|stable|volatile]",
    "insight": "Explain the WHY or WHEN. If declining: 'Satisfaction drops after day 5 when X happens.' If stable: 'No improvement signal—suggests unresolved issue.'"
  },

  "contradiction_analysis": [
    {
      "what_they_say": "[exact quote or paraphrase from feedback]",
      "what_they_do": "[contradicting behavior they reveal]",
      "severity": "[high|medium|low]",
      "why_it_matters": "[What does this gap reveal about their actual priorities vs stated needs?]"
    }
  ],

  "psychographic_segments": [
    {
      "segment_name": "[Memorable name like 'The Optimizer', 'The Skeptic', 'The Pragmatist']",
      "percentage_of_users": "[X% or 'N out of M' — be exact]",
      "key_traits": ["trait1", "trait2", "trait3"],
      "decision_drivers": ["what makes them tick"],
      "retention_likelihood": "[high|medium|low]",
      "how_to_win_them": "[Specific action to improve retention for this segment]"
    }
  ],

  "themes": [
    {
      "title": "[Theme name]",
      "description": "[What this theme means strategically—why should a founder care?]",
      "evidence": "[Exact quote from feedback]",
      "sentiment_driver": "[What about this triggers emotion?]",
      "frequency": "[1|3|5+|10+ — count exact mentions or best estimate]",
      "severity": "[high|medium|low] — high means blocks usage, medium means friction, low is nice-to-have",
      "urgency": "[now|soon|later]"
    }
  ],

  "sentiment_drivers": {
    "delight_triggers": [
      {
        "trigger": "[Specific thing that makes people happy]",
        "evidence": "[Quote]",
        "why": "[What psychological need does this satisfy?]"
      }
    ],
    "frustration_triggers": [
      {
        "trigger": "[Specific thing that makes people angry]",
        "evidence": "[Quote]",
        "why": "[What need is being violated?]"
      }
    ],
    "anxiety_triggers": [
      {
        "trigger": "[Specific thing that makes people worried]",
        "evidence": "[Quote]",
        "why": "[What fear does this activate?]"
      }
    ]
  },

  "emotions": [
    {
      "emotion": "[Specific emotion: delighted, frustrated, anxious, skeptical, hopeful, overwhelmed, etc.]",
      "intensity": "[high|medium|low]",
      "percentage_experiencing": "[X% or 'estimated X out of Y']",
      "trigger": "[What specifically causes this emotion? Be specific, not generic.]",
      "insight": "[What does this emotion tell you about product/market fit?]"
    }
  ],

  "churn_risk_analysis": {
    "high_risk_signals": [
      {
        "signal": "[What tells you someone might leave?]",
        "evidence": "[Quote or observed behavior]",
        "number_at_risk": "[X users or 'estimated X%']",
        "retention_action": "[Specific action to prevent churn. Not generic—actionable.]"
      }
    ],
    "retention_strengths": [
      {
        "strength": "[What's keeping people engaged?]",
        "evidence": "[Quote]",
        "number_affected": "[X users or X%]",
        "how_to_amplify": "[How to double down on this strength?]"
      }
    ]
  },

  "contradictions": [
    {
      "conflict": "[What conflicts with what?]",
      "explanation": "[Why does this matter strategically?]",
      "implication": "[What should you do about it?]"
    }
  ],

  "feature_requests": [
    {
      "feature": "[What they want]",
      "frequency": "[1|few|many|very_many]",
      "importance_rating": "[1-10: 10=would switch tools, 3=nice-to-have]",
      "who_wants_it": "[Which segment? All users? Specific role?]",
      "why_they_want_it": "[What problem does this solve?]",
      "build_priority": "[critical|high|medium|low]"
    }
  ],

  "competitive_positioning": {
    "compared_to_alternatives": [
      {
        "alternative": "[Product name or manual process (e.g., 'ChatGPT', 'manual research', 'Dovetail')]",
        "your_strength": "[Where you win vs this alternative]",
        "your_weakness": "[Where you lose]",
        "user_sentiment": "[positive|neutral|negative about comparison]"
      }
    ],
    "real_competitor": "[What's actually competing with you? Often NOT a product. Example: 'researcher doing it manually', 'free ChatGPT', 'gut feeling decisions']"
  },

  "opportunities": [
    {
      "area": "[Opportunity name]",
      "why": "[Why does this gap exist? What would fixing it enable?]",
      "impact": "[How much would this improve retention/conversion/satisfaction?]",
      "action": "[Specific thing to build/fix/change]",
      "effort": "[easy|medium|hard]",
      "timeline": "[now|sprint|quarter]"
    }
  ],

  "cohort_patterns": {
    "retention_signals": "[If feedback mentions timelines/dates: when do people churn? Day 7? Month 1? Or 'Not detected in feedback']",
    "activation_barrier": "[What stops people from getting value? What's the friction moment? Or 'Not detected']",
    "aha_moment": "[When do people go from 'interesting' to 'must have'? Or 'Not detected']"
  },

  "strategic_recommendations": [
    {
      "priority": "[1|2|3]",
      "action": "[Specific thing to change]",
      "why": "[Based on which insight from above?]",
      "expected_outcome": "[What metric improves? How much?]"
    }
  ]
}

---

EXTRACTION GUIDELINES (CRITICAL):

### 1. EXECUTIVE SUMMARY (most important)
- ONE sentence only.
- Must be decision-forcing: "The founder should X because Y."
- Example GOOD: "Hospital needs to fix discharge experience—it's destroying retention despite excellent medical care."
- Example BAD: "Users had mixed feelings about the hospital."

### 2. SENTIMENT TRAJECTORY
- Read the entire feedback set as a narrative arc.
- Does satisfaction improve over time? Decline? Stay flat? Jump around?
- If timeline exists: track when sentiment shifts.
- "Volatile" = swings between very positive and very negative (this is important).
- Explain WHY in the insight field.

### 3. CONTRADICTION ANALYSIS (THE GOLD)
- This is where real strategy lives. Spend extra effort here.
- Find: "They say X but their behavior shows they value Y more."
- Examples:
  * Say "Price is too high" → Do "Upgrade to premium" = Price isn't the blocker
  * Say "Need mobile" → Do "Never use mobile" = Not a real need
  * Say "Support is slow" → Do "Never contact support" = They self-serve
- Severity:
  * HIGH = This contradiction invalidates their stated strategy
  * MEDIUM = Worth investigating further
  * LOW = Noted but doesn't change strategy

### 4. PSYCHOGRAPHIC SEGMENTS
- DO NOT segment by "Enterprise vs SMB" or "CEO vs Manager"
- DO segment by values and decision patterns:
  * "The Optimizer" — chases efficiency, price-sensitive, wants metrics
  * "The Pioneer" — wants innovation, willing to pay, shares learnings
  * "The Pragmatist" — solves immediate problem, loyal, quiet
- Estimate % of feedback that matches each segment
- Retention likelihood is KEY: high = sticky, low = will leave if problem unsolved

### 5. SENTIMENT DRIVERS (BE SPECIFIC)
- NOT "they like good support" → TOO VAGUE
- YES "they love when support responds within 2 hours to critical issues" → SPECIFIC
- Every trigger must have:
  * What specifically causes it (exact moment, feature, behavior)
  * Evidence (quote)
  * Why it matters (psychological need)

### 6. THEMES
- Each theme is a pattern mentioned in feedback.
- Frequency must be counted: 1 mention, 3 people, 5+ references, 10+ times?
- Severity: Does this block usage (high) or just cause friction (medium)?
- Urgency: If you could only fix one thing this week, which would create most impact?

### 7. CHURN RISK ANALYSIS
- Look for early warning signals:
  * "Considering switching" → HIGH RISK
  * "Stopped using after week 2" → HIGH RISK
  * "Would use if X was fixed" → MEDIUM RISK
- Retention strengths: What makes people STAY? Double down on this.
- Be specific: Not "improve support" but "Add email notification when support responds—users miss Slack pings."

### 8. CONTRADICTIONS (SEPARATE SECTION FROM CONTRADICTION_ANALYSIS)
- These are big-picture conflicts in the narrative.
- Example: "Feedback says 'onboarding is hard' but also 'we got massive value in week 2'"
- Implication: The problem is onboarding, not product quality.

### 9. FEATURE REQUESTS
- Cluster similar requests.
- Importance: Would they switch products if you added it? (10) Or just nice-to-have? (3)
- Priority: Critical = blocks adoption. High = accelerates growth. Medium = nice-to-have. Low = rarely requested.

### 10. COMPETITIVE POSITIONING
- Find mentions of competitors or alternatives (ChatGPT, manual research, etc.)
- Most important: What's the REAL competitor? Often it's not a product.
  * Your real competitor might be: "researcher doing it manually" not "Dovetail"
  * Or: "free ChatGPT" not "HeyMarvin"

### 11. OPPORTUNITIES
- Based on contradictions, churn signals, and gaps.
- Impact: Quantify if possible ("Would improve retention by 30%")
- Effort: easy = 1-2 days. Medium = sprint. Hard = quarter.

### 12. COHORT PATTERNS
- Only if feedback mentions dates/timelines.
- When do people churn? Day 3? Month 1? Or is it immediate?
- What moment breaks people? Onboarding? Deployment? First issue?

### 13. STRATEGIC RECOMMENDATIONS
- Prioritized (1, 2, 3).
- Based on which insight (reference the problem from above).
- Expected outcome must be concrete: "Improve retention to 70%" not "get better."

---

TONE & STYLE:

- Write for a FOUNDER before a board meeting. They have 10 minutes.
- Be specific. Use quotes. Ground everything.
- Avoid: "Users like features" → Include: "Users love real-time feedback loops. They hate 24-hour delays."
- Avoid: "There's some churn" → Include: "3 out of 5 enterprise users churn after week 2 if they hit the 50-seat limit."
- Avoid: "Support could be better" → Include: "Support response time >4 hours triggers escalation emails and 40% of those users don't return."

---

WHAT WILL GET YOU REJECTED:

- Empty arrays or null values anywhere
- Generic observations ("Users like good experiences")
- Vague recommendations ("Improve onboarding")
- Contradictions lumped in with themes
- Quotes that aren't exact from feedback
- Frequencies without numbers ("many users said" instead of "5 users mentioned")
- Frequencies that are guesses without saying "estimated"

---

OUTPUT RULES:

- Return ONLY the JSON object. Nothing else.
- No markdown backticks.
- No preamble text.
- Valid JSON that parses cleanly.
- Every string field has a value (never empty string, never null).
- If a section has no data, use "Not detected in feedback" as placeholder value.

---

Now analyze the following feedback and extract intelligence according to these rules.`;

const SYSTEM_QWEN = `You are a strategic consumer intelligence analyst. Your job is NOT to summarize feedback.
Your job is to extract ACTIONABLE STRATEGIC INTELLIGENCE from messy human signal.

Think like a founder who needs to make a decision, not a researcher who needs to report findings.

CRITICAL: Return ONLY valid JSON. No markdown. No preamble. No fences.
Every field must be a string or array. No null values.

Return this exact structure:

{
  "executive_summary": "ONE sentence: the single most important strategic insight. What would a founder do differently knowing this?",
  
  "sentiment_trajectory": {
    "overall_sentiment": "positive|negative|mixed",
    "trajectory": "improving|declining|stable|volatile",
    "insight": "If improving: WHY is it improving? If declining: WHEN does it start declining? If stable: that's a problem, need to fix something."
  },

  "contradiction_analysis": [
    {
      "what_they_say": "exact claim from feedback",
      "what_they_do": "contradicting behavior they reveal",
      "severity": "high|medium|low",
      "why_it_matters": "what this gap tells you about reality vs stated preference"
    }
  ],

  "psychographic_segments": [
    {
      "segment_name": "memorable name (e.g., The Optimizer, The Pioneer, The Skeptic)",
      "percentage_of_users": "X%",
      "key_traits": ["trait1", "trait2", "trait3"],
      "decision_drivers": ["what makes them tick"],
      "retention_likelihood": "high|medium|low",
      "how_to_win_them": "specific action to improve retention"
    }
  ],

  "themes": [
    {
      "title": "theme name",
      "description": "what this theme means strategically",
      "evidence": "exact quote from feedback",
      "sentiment_driver": "what about this triggers emotion?",
      "frequency": "how many people mentioned it? (1, 3, 5+, 10+)",
      "severity": "high|medium|low (how critical is this?)",
      "urgency": "now|soon|later (when to fix it)"
    }
  ],

  "sentiment_drivers": {
    "delight_triggers": [
      {
        "trigger": "specific thing that makes people happy",
        "evidence": "quote",
        "why": "what need does this satisfy?"
      }
    ],
    "frustration_triggers": [
      {
        "trigger": "specific thing that makes people angry",
        "evidence": "quote",
        "why": "what need is being violated?"
      }
    ],
    "anxiety_triggers": [
      {
        "trigger": "specific thing that makes people worried",
        "evidence": "quote",
        "why": "what fear does this activate?"
      }
    ]
  },

  "emotions": [
    {
      "emotion": "specific emotion (delighted, frustrated, anxious, skeptical, etc.)",
      "intensity": "high|medium|low",
      "percentage_experiencing": "X%",
      "trigger": "what specifically causes this emotion?",
      "insight": "what does this emotion tell you about your product/market fit?"
    }
  ],

  "churn_risk_analysis": {
    "high_risk_signals": [
      {
        "signal": "what tells you someone might leave",
        "evidence": "quote or behavior",
        "number_at_risk": "X users/mentions",
        "retention_action": "specific action to prevent churn"
      }
    ],
    "retention_strengths": [
      {
        "strength": "what's keeping people",
        "evidence": "quote",
        "number_affected": "X users/mentions",
        "how_to_amplify": "double down on this"
      }
    ]
  },

  "contradictions": [
    {
      "conflict": "what conflicts with what?",
      "explanation": "why does this matter strategically?",
      "implication": "what should you do about it?"
    }
  ],

  "feature_requests": [
    {
      "feature": "what they want",
      "frequency": "1|few|many|very_many (how many asked?)",
      "importance_rating": "1-10 (how critical is it?)",
      "who_wants_it": "which segment/user type",
      "why_they_want_it": "what problem does it solve?",
      "build_priority": "critical|high|medium|low"
    }
  ],

  "competitive_positioning": {
    "compared_to_alternatives": [
      {
        "alternative": "competitor or manual process",
        "your_strength": "where you win",
        "your_weakness": "where you lose",
        "user_sentiment": "positive|neutral|negative about the comparison"
      }
    ],
    "real_competitor": "what's actually competing with you? (often not a product, but a behavior like manual research or using ChatGPT)"
  },

  "opportunities": [
    {
      "area": "opportunity name",
      "why": "why does this exist? what gap are you filling?",
      "impact": "how much would fixing this improve retention/conversion?",
      "action": "specific thing to build/fix/change",
      "effort": "easy|medium|hard",
      "timeline": "now|sprint|quarter"
    }
  ],

  "cohort_patterns": {
    "retention_signals": "if multiple dates/timeframes in feedback, note: which cohorts stick around longest? when do people churn?",
    "activation_barrier": "what stops people from getting value? at which moment?",
    "aha_moment": "when do people go from 'interesting' to 'must have'?"
  },

  "strategic_recommendations": [
    {
      "priority": "1|2|3 (do this first/second/third)",
      "action": "specific thing to change",
      "why": "based on which insight",
      "expected_outcome": "what metric improves?"
    }
  ]
}

---

INSTRUCTIONS FOR EXTRACTION:

1. SENTIMENT TRAJECTORY
   - Read all feedback as a narrative
   - Does satisfaction improve (Week 1 → Week 4)? Or decline? Or stay flat?
   - If mentions of specific dates/timeline, track when sentiment shifts
   - Example: "Day 1 frustrated, Day 4 delighted, Day 10 frustrated again" = volatile

2. CONTRADICTIONS (CRITICAL - most valuable insight)
   - Find places where they SAY one thing but their BEHAVIOR shows another
   - Example: "Price is too high" but they upgraded to premium tier
   - Example: "Need mobile app" but never used it when available
   - Example: "Customer support is bad" but they never contact support
   - These contradictions show what's REALLY important vs what they claim

3. PSYCHOGRAPHIC SEGMENTS (NOT DEMOGRAPHICS)
   - Don't segment by company size or role
   - Segment by VALUES and DECISION-MAKING PATTERNS
   - Example segment names: The Optimizer, The Pioneer, The Pragmatist, The Skeptic
   - Each segment thinks differently, values different things, will churn for different reasons
   - Calculate % of feedback that fits each segment

4. SENTIMENT DRIVERS (SPECIFIC, NOT GENERIC)
   - Not "they like speed" but "they love when results appear in 60 seconds, not 5 minutes"
   - Not "they hate errors" but "they hate error message 'parsing failed' with no explanation"
   - Be SPECIFIC about what triggers emotion
   - Quote the exact moment/thing that caused the feeling

5. THEMES WITH SENTIMENT
   - Each theme should have emotional weight attached
   - "Onboarding is hard" (theme) is driven by "confusion about step 2" (sentiment driver)
   - Rate severity: high = blocks usage, medium = causes friction, low = nice-to-have complaint

6. CHURN RISK ANALYSIS
   - Look for EARLY WARNING SIGNALS
   - Examples: "kept asking for X but we never built it", "tried for 2 weeks then quit", "says they'll leave if Y doesn't improve"
   - Be specific: which users/segments are at risk? Why exactly?
   - Provide SPECIFIC retention actions (not generic "improve support")

7. CONTRADICTIONS (SEPARATE SECTION)
   - Most important section
   - Contradictions are where strategy lives
   - "Love it but can't get team to use it" = product works but adoption is broken
   - "Fastest tool but pay lowest" = you're underpriced

8. FEATURE REQUESTS
   - Cluster similar requests together
   - Count how many people asked for each
   - Rate importance: "Would you switch tools if this was added?" = 10. "Nice to have" = 3
   - Map to segments: who wants what?

9. COMPETITIVE POSITIONING
   - Find any mention of alternatives (ChatGPT, Dovetail, manual, competitors)
   - How do people compare you? What are your advantages? Disadvantages?
   - CRITICAL: What's the REAL competitor? (often not a product)
   - Example: Your real competitor might be "researcher doing it manually" not "Dovetail"

10. COHORT PATTERNS
    - If feedback mentions timelines/dates, extract cohort patterns
    - When do people churn? Day 7? Day 30?
    - When do they go from "trying" to "committed"?
    - What barriers prevent activation?

TONE REQUIREMENTS:
- Write for a founder who needs to make a decision
- Not a researcher writing a report
- Every insight should be ACTIONABLE
- Avoid generic observations
- Be specific, use quotes, ground everything in evidence

WHAT NOT TO DO:
- Don't just summarize feedback (that's useless)
- Don't be vague ("users like features") be specific ("users love real-time validation, hate delayed responses")
- Don't group contradictions as themes (contradictions are MORE important)
- Don't miss nuance (not all users are the same, segment them)
- Don't ignore what's NOT being said (absence of feature requests is meaningful)

STRATEGIC FRAMING:
Think of yourself as writing an intelligence brief for a founder before a board meeting.
You have 10 minutes. What do they NEED to know?
- What metric should move?
- Who's at risk of leaving?
- What should be built first?
- What contradicts the narrative?
- Where do we actually stand vs where we think we stand?

Return clean, valid JSON. Nothing else.`;

export const SYSTEM_CHUNK_ANALYSIS = `You are a strategic consumer intelligence analyst.
Your job is to analyze a SMALL CHUNK of customer feedback and extract the core signals.
You are NOT writing a full report. You are just extracting the raw signals.

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown. No code fences.
2. If you cannot extract something, omit it or use "Not detected".
3. Be extremely concise.

RETURN THIS JSON STRUCTURE ONLY:
{
  "issues": ["late delivery", "poor support"],
  "emotion": "frustrated",
  "feature_requests": ["faster refunds"],
  "urgency": "high",
  "quotes": ["acha hai but support slow"]
}`;

export const SYSTEM_VARIANT_DETECTION = `You are a data analysis assistant. Your job is to identify the column header in a dataset that represents the primary entity, product, or variant being reviewed.

Look at the provided dataset snippet (headers and a few rows).
Which column represents the main subject of the reviews (e.g., the product name, hotel name, restaurant name, app name)?

Rules:
1. Return ONLY the exact column header name as it appears in the data.
2. Do not include markdown formatting, quotes, or any extra text.
3. If no column clearly represents the entity/variant being reviewed, return exactly the word "null".`;

export const SYSTEM_FREEFORM_SYNTHESIS = `You are a strategic consumer intelligence analyst.
Your job is to synthesize raw customer feedback, reviews, and data chunks into a cohesive, actionable analysis of consumer sentiment, product issues, and market opportunities. Focus on what founders and product teams need to fix or build.

CRITICAL — CONTRADICTION DETECTION:
Contradictions are the most valuable intelligence in any feedback dataset. You MUST look for all three types:
1. The Praiser-Complainer: A user who writes a positive headline ("Great app!", "5 stars") but describes serious problems in the body text. This is the most common and most ignored contradiction.
2. The Conditional Loyalist: A user who says they will keep using the service, but only IF something specific improves ("I'll come back when they fix support", "would use daily if delivery was on time"). Their condition IS their true complaint.
3. The Competitor-Mentioner: A user who compares the brand favorably to a competitor ("better than Swiggy"), but in doing so reveals an unmet need ("but Swiggy lets me cancel orders, this app doesn't").
Always extract at least 2 contradictions. Return them verbatim from the feedback.

CRITICAL — INDIAN CODE-MIX ENGINE (HINGLISH/TANGLISH/NATIVE SCRIPT):
You are analyzing code-mixed Indian data. You must:
1. Preserve Native Quotes: When extracting quotes, pull the EXACT raw text — preserve slang, typos, emoji, Devanagari, Tamil script. DO NOT sanitize or translate. Let founders read the exact words of their users.
2. Weight Slang & Sarcasm: Words like "fraud", "bakwaas", "ghatiya", "wahiyat", "kand", "scam", "chor", "loot", "nalla" carry CRITICAL negative weight. Sarcasm (e.g. "Wah kya service hai", "Blinkit to Closeit") MUST be flagged as severe frustration, never neutral.
3. Native Script Detection (DO THIS FIRST): Before any other analysis, scan for characters in these Unicode ranges:
   - Devanagari (Hindi/Marathi): U+0900–U+097F (e.g. बहुत अच्छी, शानदार)
   - Tamil: U+0B80–U+0BFF
   - Telugu: U+0C00–U+0C7F
   - Kannada: U+0C80–U+0CFF
   - Malayalam: U+0D00–U+0D7F
   - Bengali: U+0980–U+09FF
   - Gujarati: U+0A80–U+0AFF
   If ANY of these characters are found, set native_script_detected: true and create a separate language bucket for that script.
4. SEPARATE Devanagari Hindi (native script, e.g. बहुत अच्छी) from Romanized Hinglish (Latin script, e.g. "bahut acha"). They are different language groups with different emotional registers. Devanagari writers are typically more direct and emotionally raw.
5. Language Attribution: Identify EVERY language group present. Minimum buckets for Indian datasets: Romanized Hinglish, English, and any native script groups found. If Tamil-related content or Tamil Nadu mentions exist, create a Tanglish bucket even if small.

CRITICAL — EXTRAPOLATED PERCENTAGES:
Based on the frequency of issues across all the chunks you processed, you MUST estimate a specific prevalence percentage (e.g., 65, 20) for every major feature request, emotional signal, psychographic segment, and churn signal you identify. Do not skip this!

RETURN THIS EXACT JSON STRUCTURE ONLY:
{
  "summary": "string summary",
  "contradictions": ["quote 1", "quote 2"],
  "native_quotes": ["quote 1", "quote 2"],
  "emotional_severity": "High|Medium|Low",
  "emotions": [ {"emotion": "angry", "estimated_prevalence_percentage": 65} ],
  "feature_requests": [ {"feature": "faster refunds", "estimated_prevalence_percentage": 80} ],
  "psychographic_segments": [ {"segment_name": "The Frustrated Buyer", "estimated_prevalence_percentage": 50} ],
  "churn_risk_signals": [ {"signal": "crashes during payment", "estimated_prevalence_percentage": 40} ],
  "issues": [ "late delivery", "poor support" ]
}`;

export const SYSTEM_FREEFORM_SYNTHESIS_QUANTITATIVE = `You are a Data Scientist and Statistical Analyst.
Your job is to synthesize raw mathematical summaries and row samples into a cohesive, actionable analysis of correlations, distributions, and outliers. Focus on what leaders need to fix, build, or investigate based on the data.

CRITICAL:
1. Look for strong correlations between variables (e.g., if X goes up, does Y go down?). You will receive exact Pearson correlation coefficients (r); use them.
2. Identify significant outliers or anomalies. ALWAYS cite the exact numeric values, limits, and standard deviation thresholds when describing an outlier. Do not be vague.
3. Group the data into logical clusters or segments based on the numbers. Estimate the percentage of data belonging to each cluster based on the standard deviations and data samples provided.
4. Provide predictive insights based on the trends you observe, including any Temporal Trends provided.`;


export const SYSTEM_JSON_STRUCTURING = `You are a data structuring layer for the Prism Intelligence Dashboard.
Your job is to take a freeform intelligence analysis and structure it into the EXACT JSON format required by our system.
This system handles BOTH consumer feedback analysis AND AI workforce impact analysis. You must populate the fields that apply to the input text.

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown. No code fences.
2. If the input text does not contain data for a specific section, use "Not detected" for strings and leave arrays empty []. Do NOT invent data or copy example values just to fill the schema.
3. **No Corporate Buzzwords**: Do NOT use high-level abstract terms like "operational volatility", "demographic sensitivity", or "ecosystem optimization" when analyzing consumer feedback. Use direct, tactical language derived from the reviews (e.g., "bad support", "cold food", "app crashes").
4. **Grounded Feature Requests**: Do NOT invent high-tech solutions (like "predictive AI") unless users explicitly ask for them. Feature requests must be direct mappings of what users want (e.g., "talk to a human", "better refund policy", "faster delivery").
5. **Factuality**: Every insight must be traceable to a specific complaint or data point in the text. Do not assume or extrapolate beyond the provided feedback.
6. **Entity Specificity**: Identify the specific company, brand, or entity being analyzed (e.g., Zomato, Nykaa, Swiggy) from the input text or data. Use that specific name in the executive summary, insights, and descriptions instead of generic words like "companies", "the platform", or "service providers".
7. Follow the EXACT schema provided below.
8. **Minimum depth requirements when data IS present:**
   - contradiction_analysis: minimum 2, ideally 3 items. Look for 'say vs do' gaps — e.g. users praising but also complaining.
   - feature_requests: minimum 3, ideally 5 items.
   - emotions: minimum 2 distinct emotions, each with a SPECIFIC trigger (e.g. "frustrated by delivery delays on rainy days", NOT just "frustrated by delays").
   - psychographic_segments: minimum 2 segments with distinct behaviors (e.g. "The Power User", "The One-Timer", "The Price Hawk").
   - churn_risk_analysis.high_risk_signals: minimum 2 signals.
   - strategic_recommendations: minimum 3 recommendations, each with a specific measurable expected_outcome.
   - **reality_checks: minimum 5 items. Each must have a verbatim raw native quote — not paraphrased, not translated. Prioritize high-severity quotes with slang, emoji, or extreme frustration.** If fewer than 5 raw quotes exist in the data, include whatever is available but never fabricate.
9. In 'timeline', if no displacement trend is detected, return an empty array [].
10. The '*_num' fields must be integers from 0 to 100 that sum to 100 where applicable. If no data, use 0.
11. **HYBRID PERCENTAGE SAMPLING (CRITICAL):**
    For 'feature_requests', 'emotions', 'psychographic_segments', and 'high_risk_signals', you MUST include an 'estimated_prevalence_percentage' field (an integer from 0 to 100). 
    - **Concrete Issues:** If your analysis involves a topic listed in the \`[HARD_MATH_HEURISTICS]\` block (e.g., refunds, late delivery, support, pricing, bugs), you MUST map your percentage to the EXACT mathematical percentage provided. Do not deviate.
    - **Abstract Themes:** If you are estimating abstract themes (e.g. emotional nuances, loyalty, specific segments) not covered by heuristics, you must use conservative Extrapolated Sampling. Cap your estimates realistically (e.g. 5-30%). Never hallucinate 80%+ unless practically the entire dataset explicitly matches.
12. **LANGUAGE INTELLIGENCE (CRITICAL — EVERY FIELD REQUIRED):**
    You MUST populate the 'language_intelligence' block for EVERY consumer feedback analysis. This is Prism's core differentiator.
    
    The input text has ALREADY been pre-segmented into explicit language buckets for you (e.g. [--- ENGLISH REVIEWS ---], [--- HINGLISH REVIEWS ---]).
    Your ONLY job is to extract data from these buckets. 
    
    LANGUAGE RULES:
    - Create exactly one bucket in your output for each [--- {LANG} REVIEWS ---] block found in the input.
    - Set the language_name and language_code to match the block (e.g., "English", "Hinglish").
    - MANDATORY: If there is an [--- ENGLISH REVIEWS ---] block, you MUST output an English bucket.
    - MANDATORY: The sum of "review_count_percentage" across all language buckets MUST equal exactly 100.
    - CRITICAL ANTI-HALLUCINATION RULE: When extracting quotes for a Hinglish or Romanized bucket, DO NOT transliterate the text into Devanagari (Hindi) script! If the user wrote "sabse ghatiya app", you MUST output "sabse ghatiya app". Do NOT output "सबसे घटिया". Preserve the exact Latin script character-for-character.
    
    REGION HINTS MUST BE SPECIFIC:
    - NEVER use 'India' alone as a region_hint. Be as specific as possible.
    - Romanized Hinglish → 'North India (UP, Delhi, Haryana)'
    - Devanagari Hindi → 'North India (native script users)'
    - Tanglish → 'Tamil Nadu'
    - Telugu-English → 'Andhra Pradesh / Telangana'
    - Kannada-English → 'Karnataka'
    - Malayalam-English → 'Kerala'
    - Bengali-English → 'West Bengal'
    - Pure English → 'Metro cities / English-first users'
    
    QUOTE EXTRACTION RULES (per language bucket):
    - Extract 3 to 5 raw quotes (sample_quotes array). DO NOT pick the tamest quote. Pick quotes that are:
      a) Emotionally specific (frustrated/delighted/angry/shocked)
      b) Brand-specific (mention the company, product, or event)
      c) In the authentic voice of that language (slang, emoji, typos preserved)
    - MANDATORY: A quote can only appear in ONE language bucket. Do NOT repeat the exact same quote across multiple buckets.
    - Include the quote's sentiment: 'positive'|'negative'|'neutral'
    
    SENTIMENT BREAKDOWN:
    - For each language group, estimate the positive/neutral/negative SPLIT as percentages summing to 100.
    - These must be computed INDEPENDENTLY per language group.
    
    KEY SIGNALS GLOSSARY:
    - For each language group, extract 2-4 high-signal words/phrases that appear repeatedly.
    - For each: provide the term, a brief English meaning, and whether it's a positive or negative signal.
    - Examples: { term: 'bakwaas', meaning: 'worthless/terrible', sentiment_weight: 'negative' }, { term: 'zabardast', meaning: 'outstanding', sentiment_weight: 'positive' }
    
    REVIEW COUNT ESTIMATE:
    - Include review_count_estimate (integer) = round(total_rows * review_count_percentage / 100)
    - If total rows are unknown, set to 0.
    
    FALLBACK (English-only dataset):
    - If ALL reviews are plain English, set detected_languages to a single entry: language: 'English', language_code: 'EN', review_count_percentage: 100, native_script_detected: false.

---
EXAMPLES OF EXPECTED OUTPUT:

Example 1: Analyzing Consumer Feedback (No workforce data)
Input: "Users are angry that the Nykaa app keeps crashing during payment. They want a better refund flow."
Output:
{
  "executive_summary": "Nykaa faces critical drop-offs due to payment crashes, requiring immediate app stability fixes.",
  "consumer_feedback": {
    "sentiment_trajectory": { "overall_sentiment": "negative", "trajectory": "declining", "insight": "Payment failures are driving negative sentiment." },
    "feature_requests": [{ "feature": "fix payment flow", "build_priority": "critical", "frequency": "high", "estimated_prevalence_percentage": 85 }],
    "emotions": [{ "emotion": "angry", "intensity": "high", "trigger": "app keeps crashing during payment", "estimated_prevalence_percentage": 70 }],
    "psychographic_segments": [{ "segment_name": "The Frustrated Buyer", "how_to_win_them": "improve refund flow", "estimated_prevalence_percentage": 60 }],
    "churn_risk_analysis": { "high_risk_signals": [{ "signal": "crashes during payment", "retention_action": "fix app stability", "estimated_prevalence_percentage": 50 }] }
  },
  "workforce_metrics": { "workers_at_risk": "Not detected", "workers_at_risk_trend": "Not detected", "avg_automation_risk": "Not detected", "avg_automation_risk_trend": "Not detected", "net_new_roles": "Not detected", "net_new_roles_trend": "Not detected", "reskilling_readiness": "Not detected", "reskilling_readiness_trend": "Not detected" },
  "automation_risk_by_sector": [],
  "displacement_trend": { "peak_displacement": "Not detected", "peak_displacement_timeframe": "Not detected", "acceleration_rate": "Not detected", "acceleration_rate_timeframe": "Not detected", "timeline": [] },
  "worker_risk_distribution": { "total_workers": "Not detected", "high": "0%", "medium": "0%", "low": "0%", "high_num": 0, "medium_num": 0, "low_num": 0 },
  "geographic_hotspots": [],
  "opportunity_sectors": [],
  "sentiment_shift": { "historical": { "concerned": "0%", "uncertain": "0%", "optimistic": "0%" }, "current": { "concerned": "0%", "uncertain": "0%", "optimistic": "0%" }, "historical_num": { "concerned": 0, "uncertain": 0, "optimistic": 0 }, "current_num": { "concerned": 0, "uncertain": 0, "optimistic": 0 } },
  "reskilling_readiness_gap": []
}

Example 2: Analyzing Workforce Data (No consumer feedback)
Input: "AI is automating 10,000 coding jobs in the IT sector in India."
Output:
{
  "executive_summary": "AI is rapidly displacing coding roles in the IT sector, necessitating urgent reskilling.",
  "consumer_feedback": null,
  "workforce_metrics": { "workers_at_risk": "10,000", "workers_at_risk_trend": "Increasing", "avg_automation_risk": "0.75", "avg_automation_risk_trend": "High", "net_new_roles": "Not detected", "net_new_roles_trend": "Not detected", "reskilling_readiness": "20%", "reskilling_readiness_trend": "Low" },
  "automation_risk_by_sector": [{ "label": "IT Sector", "val": 0.75, "pct": "75%" }],
  "displacement_trend": { "peak_displacement": "0.75", "peak_displacement_timeframe": "Q4 24", "acceleration_rate": "2x", "acceleration_rate_timeframe": "YoY", "timeline": [{ "quarter": "Q4 24", "value": 75 }] },
  "worker_risk_distribution": { "total_workers": "10,000", "high": "100%", "medium": "0%", "low": "0%", "high_num": 100, "medium_num": 0, "low_num": 0 },
  "geographic_hotspots": [{ "name": "India", "desc": "IT Hubs", "status": "High" }],
  "opportunity_sectors": [],
  "sentiment_shift": { "historical": { "concerned": "0%", "uncertain": "0%", "optimistic": "0%" }, "current": { "concerned": "0%", "uncertain": "0%", "optimistic": "0%" }, "historical_num": { "concerned": 0, "uncertain": 0, "optimistic": 0 }, "current_num": { "concerned": 0, "uncertain": 0, "optimistic": 0 } },
  "reskilling_readiness_gap": []
}
---

RETURN THIS JSON STRUCTURE ONLY:
{
  "executive_summary": "ONE sentence stating the single most important tactical or strategic insight. Try to connect raw consumer pain points to higher-level business or workforce strategy if applicable (e.g., connecting bad chatbot experiences to a failing customer support automation strategy). Use the specific company name. Do NOT use empty buzzwords.",
  
  "consumer_feedback": {
    "sentiment_trajectory": {
      "overall_sentiment": "positive|negative|mixed",
      "trajectory": "improving|declining|stable|volatile",
      "insight": "Explanation of why or when sentiment shifts."
    },
    "contradiction_analysis": [
      {
        "what_they_say": "exact claim or quote from feedback",
        "what_they_do": "contradicting behavior they reveal",
        "severity": "high|medium|low"
      }
    ],
    "feature_requests": [
      {
        "feature": "what they want",
        "frequency": "low|medium|high",
        "build_priority": "critical|high|medium|low",
        "estimated_prevalence_percentage": 0
      }
    ],
    "emotions": [
      {
        "emotion": "specific emotion (e.g., frustrated, anxious)",
        "intensity": "high|medium|low",
        "trigger": "what specifically causes this emotion?",
        "estimated_prevalence_percentage": 0
      }
    ],
    "psychographic_segments": [
      {
        "segment_name": "memorable name",
        "how_to_win_them": "specific action to improve retention",
        "estimated_prevalence_percentage": 0
      }
    ],
    "churn_risk_analysis": {
      "high_risk_signals": [
        {
          "signal": "what tells you someone might leave",
          "retention_action": "specific action to prevent churn",
          "estimated_prevalence_percentage": 0
        }
      ]
    },
    "strategic_recommendations": [
      {
        "action": "what to do",
        "why": "why do it",
        "expected_outcome": "metric outcome",
        "priority": "1|2|3",
        "timeline": "now|later"
      }
    ],
    "passion_index": {
      "score": "integer 0-100 indicating density of code-mixing/informality",
      "reasoning": "why did it get this score?"
    },
    "reality_checks": [
      {
        "sanitized_english": "corporate/sanitized summary of the issue",
        "raw_native_quote": "exact raw code-mixed quote from user",
        "severity": "high|medium|low"
      }
    ]
  },

  "language_intelligence": {
    "primary_language": "The dominant language found in the dataset.",
    "detected_languages": [
      {
        "language": "Name of language (e.g., Hinglish, English, Hindi, Tanglish).",
        "language_code": "STRICT RULES: Use 'HI' for Hinglish. Use 'DE' for pure Devanagari Hindi. Use 'EN' for pure English. Use standard 2-letter codes for others.",
        "region_hint": "Infer region (e.g., 'North India', 'Tamil Nadu', 'Metro cities'). Do NOT just say 'India'.",
        "review_count_percentage": 60,
        "review_count_estimate": 0,
        "sentiment": "positive|negative|mixed|neutral",
        "sentiment_intensity": "high|medium|low",
        "sentiment_breakdown": {
          "positive_pct": 10,
          "neutral_pct": 15,
          "negative_pct": 75
        },
        "top_themes": ["theme 1", "theme 2"],
        "sample_quotes": [
          { "quote": "MUST BE EXACT RAW QUOTE from this language. Provide EXACTLY 5 distinct quotes per bucket.", "sentiment": "negative" }
        ],
        "key_signals": [
          { "term": "slang or high-emotion term", "meaning": "english meaning", "sentiment_weight": "positive|negative|neutral" }
        ],
        "script_type": "latin_romanized|native_script|mixed"
      }
    ],
    "regional_insight": "One punchy sentence summarizing the most striking regional sentiment difference. Be specific about which group, what issue, and what the implication is.",
    "native_script_detected": false
  },

  "workforce_metrics": {
    "workers_at_risk": "Count with unit or 'Not detected'",
    "workers_at_risk_trend": "Percentage change and direction or 'Not detected'",
    "avg_automation_risk": "Decimal score from 0 to 1 or 'Not detected'",
    "avg_automation_risk_trend": "Change from baseline or 'Not detected'",
    "net_new_roles": "Count with +/- sign or 'Not detected'",
    "net_new_roles_trend": "Type of jobs or 'Not detected'",
    "reskilling_readiness": "Percentage or 'Not detected'",
    "reskilling_readiness_trend": "Status relative to threshold or 'Not detected'"
  },
  "automation_risk_by_sector": [
    { "label": "Sector name", "val": 0.5, "pct": "50%" }
  ],
  "displacement_trend": {
    "peak_displacement": "Decimal score or 'Not detected'",
    "peak_displacement_timeframe": "Quarter or 'Not detected'",
    "acceleration_rate": "Multiplier or 'Not detected'",
    "acceleration_rate_timeframe": "Timeframe or 'Not detected'",
    "timeline": [
      { "quarter": "Quarter name", "value": 50 }
    ]
  },
  "worker_risk_distribution": {
    "total_workers": "Count with unit or 'Not detected'",
    "high": "Percentage",
    "medium": "Percentage",
    "low": "Percentage",
    "high_num": 33,
    "medium_num": 33,
    "low_num": 34
  },
  "geographic_hotspots": [
    { "name": "Region or city", "desc": "Context or driver", "status": "Critical/High/Medium" }
  ],
  "opportunity_sectors": [
    { "name": "Sector name", "change": "+0%" }
  ],
  "sentiment_shift": {
    "historical": { "concerned": "0%", "uncertain": "0%", "optimistic": "0%" },
    "current": { "concerned": "0%", "uncertain": "0%", "optimistic": "0%" },
    "historical_num": { "concerned": 0, "uncertain": 0, "optimistic": 0 },
    "current_num": { "concerned": 0, "uncertain": 0, "optimistic": 0 }
  },
  "reskilling_readiness_gap": [
    { "label": "Gap category", "val": "0%", "pct": "0%" }
  ]
}`;

export const SYSTEM_JSON_STRUCTURING_QUANTITATIVE = `You are a data structuring layer for the Prism Intelligence Dashboard.
Your job is to take a freeform data analysis of numerical and statistical data and structure it into the EXACT JSON format required by our system.
This system handles quantitative statistical data (correlations, averages, distributions).

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown. No code fences.
2. If the input text does not contain data for a specific section, use "Not detected" for strings and leave arrays empty [].
3. Factuality: Every insight must be grounded in the mathematical data provided. Do not invent data.
4. Follow the EXACT schema provided below.

RETURN THIS JSON STRUCTURE ONLY:
{
  "executive_summary": "ONE sentence stating the single most important statistical insight. Connect the numbers to business or operational outcomes.",
  
  "quantitative_analysis": {
    "statistical_summary": "A high level narrative summary of the mathematical distributions and averages.",
    "key_correlations": [
      {
        "variable_a": "First variable (e.g., Gaming Hours)",
        "variable_b": "Second variable (e.g., Grades)",
        "correlation": "Exact description (e.g., 'Strong Positive')",
        "coefficient_weight": 0.0,
        "insight": "What does this relationship mean?"
      }
    ],
    "pca_components": [
      {
        "component": "Principal Component 1",
        "variance_explained_pct": 44.66,
        "top_driving_metric": "Name of metric"
      }
    ],
    "survival_analysis": [
      {
        "time_milestone": 18.0,
        "survival_probability_pct": 81.2
      }
    ],
    "categorical_dependencies": [
      {
        "variables_tested": ["First variable", "Second variable"],
        "chi_square_statistic": 0.0,
        "p_value": 0.0,
        "is_significant": true,
        "insight": "What does this statistical dependency mean?"
      }
    ],
    "outlier_detection": [
      {
        "outlier_description": "Description of the anomaly",
        "significance": "high|medium|low"
      }
    ],
    "cluster_profiles": [
      {
        "cluster_name": "Name of the group (e.g., High Gamers / Low Grades)",
        "percentage_of_data": 25,
        "business_persona": "Describe the human persona or behavior of this cluster in 1-2 sentences.",
        "strategic_implication": "What should a business or analyst do with this specific group?"
      }
    ],
    "predictive_insights": [
      {
        "insight": "Predictive trend",
        "confidence": "high|medium|low",
        "actionable_recommendation": "What to do about it"
      }
    ]
  }
}`;

/**
 * Builds an industry-specific lens block to prepend to SYSTEM_JSON_STRUCTURING.
 * @param {string} industryLensText - The lens string from industryConfig
 * @param {string} modality - Quantitative or Qualitative
 * @returns {string} - The full prompt with the lens prepended
 */
export function buildIndustryAwareStructuringPrompt(industryLensText, modality = "Qualitative") {
  const baseSchema = modality === "Quantitative" ? SYSTEM_JSON_STRUCTURING_QUANTITATIVE : SYSTEM_JSON_STRUCTURING;
  if (!industryLensText || !industryLensText.trim()) {
    return baseSchema;
  }
  return `${industryLensText}

---

${baseSchema}`;
}

/**
 * @param {{ baseUrl: string, model: string, api: 'ollama' | 'openai' | 'together' | 'openrouter', apiKey: string, modality?: string }} cfg
 * @returns {Promise<{ ok: true, provider: string, model: string, parsed: unknown | null, raw: string, parseError?: string } | { ok: false, error: string }>}
 */
export async function runLocalLlmAnalysis(text, structuredMetrics, cfg, promptOverride = null) {
  if (!cfg) {
    return { ok: false, error: "Local LLM not configured." };
  }

  const systemPrompt = promptOverride || (cfg.model.includes("gemma") ? SYSTEM_GEMMA : SYSTEM_QWEN);

  let excerpt = text;
  if (text.length > MAX_CHARS) {
    excerpt = text.slice(0, MAX_CHARS) + "\n\n[truncated for model context]";
  }

  const userPayload = [
    "Supplementary Lune metrics only (counts/tokens — not what you analyze; insights must come from the feedback text):",
    JSON.stringify(structuredMetrics),
    "",
    "CUSTOMER FEEDBACK / USER REVIEW / SURVEY TEXT:",
    excerpt,
    "",
    "REMINDER: Return ONLY the JSON object. Do not wrap it in markdown code fences. Do not say 'Here is your analysis'. Start with { and end with }."
  ].join("\n");

  try {
    let rawText = "";
    let provider = cfg.api;

    if (cfg.api === "ollama") {
      const url = `${cfg.baseUrl}/api/chat`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 mins
      
      let res;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model: cfg.model,
            ...(systemPrompt !== SYSTEM_FREEFORM_SYNTHESIS ? { format: "json" } : {}),
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPayload },
            ],
            stream: false,
            options: { temperature: 0.25, num_predict: 8192 },
          }),
        });
      } finally {
        clearTimeout(timeoutId);
      }

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
      if (cfg.api === "openrouter") {
        headers["HTTP-Referer"] = "https://prism-dashboard.com";
        headers["X-Title"] = "Prism Dashboard";
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 mins
      
      let res;
      try {
        res = await fetch(url, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            model: cfg.model,
            ...(systemPrompt !== SYSTEM_FREEFORM_SYNTHESIS ? { response_format: { type: "json_object" } } : {}),
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPayload },
            ],
            temperature: 0.25,
            max_tokens: 8192,
          }),
        });
      } finally {
        clearTimeout(timeoutId);
      }

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
