# 04 PRISM AI and Prompts

> This document is a consolidated master file. Below are the preserved contents from original session and design documents.



---
## Source: advanced_system_prompt.md

# Advanced System Prompt for Lune OS (Qwen2.5)

Use this as your system prompt in the API call. Replace the old one entirely.

```
You are a strategic consumer intelligence analyst. Your job is NOT to summarize feedback.
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

Return clean, valid JSON. Nothing else.
```

---

## How to use this in your Next.js API

Replace your current system prompt with the above. Then update your API call:

```javascript
// pages/api/analyze.js

const systemPrompt = `[paste the entire prompt above here]`

export default async function handler(req, res) {
  const { input } = req.body

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LOCAL_MODEL,
      prompt: `${systemPrompt}\n\nFeedback to analyze:\n${input}`,
      stream: false,
      temperature: 0.7,
    }),
  })

  // Rest of your code...
}
```

---

## Expected output structure

Your JSON will now have these top-level keys:

```
{
  "executive_summary": "...",
  "sentiment_trajectory": { ... },
  "contradiction_analysis": [ ... ],
  "psychographic_segments": [ ... ],
  "themes": [ ... ],
  "sentiment_drivers": { ... },
  "emotions": [ ... ],
  "churn_risk_analysis": { ... },
  "contradictions": [ ... ],
  "feature_requests": [ ... ],
  "competitive_positioning": { ... },
  "opportunities": [ ... ],
  "cohort_patterns": { ... },
  "strategic_recommendations": [ ... ]
}
```

---

## Frontend rendering guide

Here's how to render each section in your UI:

```javascript
// sections/SentimentTrajectory.jsx
export function SentimentTrajectory({ data }) {
  return (
    <div className="card">
      <h3>Sentiment Trajectory</h3>
      <p>{data.trajectory}</p>
      <p className="insight">{data.insight}</p>
    </div>
  )
}

// sections/ContradictionMap.jsx
export function ContradictionMap({ data }) {
  return (
    <div className="card">
      <h3>Contradiction Map</h3>
      {data.map((item, i) => (
        <div key={i} className="contradiction-item">
          <div className="say">Say: {item.what_they_say}</div>
          <div className="do">Do: {item.what_they_do}</div>
          <p>{item.why_it_matters}</p>
        </div>
      ))}
    </div>
  )
}

// sections/PsychographicSegments.jsx
export function PsychographicSegments({ data }) {
  return (
    <div className="card">
      <h3>Customer Types</h3>
      <div className="segment-grid">
        {data.map((segment, i) => (
          <div key={i} className="segment">
            <h4>{segment.segment_name}</h4>
            <p>{segment.percentage_of_users}</p>
            <ul>
              {segment.key_traits.map((t, j) => (
                <li key={j}>{t}</li>
              ))}
            </ul>
            <p className="action">{segment.how_to_win_them}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// sections/ChurnRisk.jsx
export function ChurnRisk({ data }) {
  return (
    <div className="card">
      <h3>Who's at Risk</h3>
      <div className="risk-high">
        <h4>High Risk</h4>
        {data.high_risk_signals.map((signal, i) => (
          <div key={i}>
            <p>{signal.signal}</p>
            <p className="action">Fix: {signal.retention_action}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// sections/StrategicRecommendations.jsx
export function StrategicRecommendations({ data }) {
  return (
    <div className="card">
      <h3>What to do first</h3>
      <ol>
        {data.map((rec, i) => (
          <li key={i}>
            <p>{rec.action}</p>
            <p className="why">Why: {rec.why}</p>
            <p className="outcome">Expect: {rec.expected_outcome}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
```

---

## Testing with Qwen2.5

Test this prompt with your sample feedback:

```
"Been using for 3 weeks. Love the dashboard, hate the onboarding. 
Had to call support to connect my first data source. My team quit 
during setup. Once you're in, it's amazing. But seriously, fix onboarding 
or lose people at step 2."
```

Expected insight:
- Sentiment trajectory: declining (positive → negative mid-onboarding → positive if they stick)
- Contradiction: "love the product but can't get team to use it"
- Churn risk: Teams abandon at day 2-3
- Strategic recommendation: Redesign onboarding before adding features

---

## Prompt optimization tips

If Qwen struggles with:

**Too verbose output:** Add to system prompt:
```
Keep all responses concise. One sentence per insight. No fluff.
```

**Missing contradictions:** Add:
```
FIND CONTRADICTIONS FIRST. This is 40% of your job.
Look for: Say vs Do, Want vs Need, Say vs Behavior
```

**Generic segments:** Add:
```
Name segments by VALUES, not roles.
Not "Enterprise user" but "The Cost-Cutter" or "The Visionary"
```

**Incomplete JSON:** Add:
```
Every field must have a value. No empty arrays. No nulls.
If you can't extract something, say "Not mentioned in feedback"
```


---
## Source: multi-model-architecture-update.md

# Architecture Update: Multi-Model Orchestration (June 28, 2026)

## The Sanitization Problem
While `Meta-Llama-3.3-70B-Instruct-Turbo` is excellent for deep strategic reasoning, we discovered it possesses a strong "alignment bias." When exposed to raw, angry, code-mixed Indian reviews (Hinglish/Tanglish), it forcibly sanitized and translated the quotes into formal English or Devanagari script, stripping away the visceral emotion that Prism aims to capture.

## The Solution: Pipeline Decoupling
To preserve native sentiment, we decoupled the AI pipeline into a multi-model orchestration sequence using environment variables in `.env.local`:
1. **Chunking & Freeform Synthesis:** Handled by Llama 3 (`LOCAL_LLM_MODEL_SYNTHESIS`) for its massive context window and ability to find strategic business contradictions.
2. **JSON Structuring & Language Extraction:** Handled by `deepseek-ai/DeepSeek-V4-Pro` (`LOCAL_LLM_MODEL_STRUCTURING`). Deepseek proved exceptional at adhering strictly to complex JSON schemas without attempting to translate or "fix" the raw native text passed to it.

## The Raw Bucket Injection Fix
We found that Deepseek cannot accurately populate the `language_intelligence` arrays if it only receives Llama 3's synthesized output (which has already lost the native buckets).
To solve this, we implemented `getLanguageBucketSample()` in `lib/pipeline-local.js`. This function injects a 25-line sample of the raw, unadulterated text directly from the offline language detector (e.g., `[RAW_LANGUAGE_BUCKETS_SAMPLE]`) into the final Structuring Prompt. This provides Deepseek with authentic source material to extract quotes for English, Hinglish, Tamil/Tanglish, etc.

## Offline Detector Hardening
We removed ultra-short, ambiguous homonyms (like "da", "pa", "se", "me") from `lib/language-detector.js` to prevent English and Hindi reviews from falsely triggering the Tanglish or Hinglish buckets. The detector now exclusively relies on highly specific regional markers.
