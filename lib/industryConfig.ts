// ─── Industry Configuration for Prism ────────────────────────────────────────
// Central registry of all supported industry verticals.
// Used by: industryDetector.ts, pipeline-together.js, local-llm.js, PrismResults.tsx

export type IndustryId =
  | "auto"
  | "food"
  | "healthcare"
  | "saas"
  | "finance"
  | "retail"
  | "workforce";

export interface IndustryDef {
  id: IndustryId;
  label: string;
  emoji: string;
  color: string; // Tailwind / CSS class fragment for UI badge
  panelLabels: {
    emotions: string;
    features: string;
    churn: string;
    segments: string;
    contradictions: string;
  };
  // Weighted keywords for heuristic detection
  // Each entry: [keyword, weight]  — 1=generic signal, 3=very strong signal (brand name etc.)
  keywords: [string, number][];
  // Lens injected into SYSTEM_JSON_STRUCTURING — tells the model what to focus on
  lens: string;
}

export const INDUSTRIES: IndustryDef[] = [
  // ── Auto-detect placeholder (no lens, no detection — just triggers the heuristic) ──
  {
    id: "auto",
    label: "Auto-Detect",
    emoji: "🔍",
    color: "text-white/50 border-white/10",
    panelLabels: {
      emotions: "Emotional Signals",
      features: "Feature Requests",
      churn: "Churn Risk Signals",
      segments: "Psychographic Segments",
      contradictions: "Contradiction Map",
    },
    keywords: [],
    lens: "",
  },

  // ── Food & Delivery ──────────────────────────────────────────────────────────
  {
    id: "food",
    label: "Food & Delivery",
    emoji: "🍕",
    color: "text-orange-400 border-orange-400/20",
    panelLabels: {
      emotions: "Emotional Signals",
      features: "Feature Requests",
      churn: "Churn Risk Signals",
      segments: "Customer Archetypes",
      contradictions: "Contradiction Map",
    },
    keywords: [
      ["dinenow", 3], ["fooddash", 3], ["swiftcart", 3], ["quickdrop", 3], ["taskrun", 3],
      ["delivery", 2], ["food", 2], ["restaurant", 2], ["order", 1], ["hungry", 1],
      ["cod", 2], ["refund", 1], ["delivery boy", 2], ["delivery agent", 2],
      ["handling charges", 2], ["missing items", 2], ["cold food", 2], ["late delivery", 2],
    ],
    lens: `INDUSTRY LENS — FOOD & DELIVERY:
This dataset contains food delivery or quick commerce app reviews.
Focus on:
- Delivery reliability (timing, condition on arrival, missing items)
- Hidden charges and pricing transparency (handling fees, surge pricing, mandatory tips)
- Customer support responsiveness for refunds and wrong orders
- App UX around tracking, ordering, and payment
Contradiction archetypes to look for:
- Users who say "I love [Brand]" but describe a recent nightmare delivery in the same review
- Users who keep using the app but explicitly say they're looking for alternatives
- Users who complain about prices but admit they order daily anyway
In psychographic_segments, use archetypes like: "The Daily Commuter", "The Price Hawk", "The Convenience Addict", "The Churner".`,
  },

  // ── Healthcare ───────────────────────────────────────────────────────────────
  {
    id: "healthcare",
    label: "Healthcare",
    emoji: "🏥",
    color: "text-sky-400 border-sky-400/20",
    panelLabels: {
      emotions: "Patient Anxiety Signals",
      features: "Care Gap Requests",
      churn: "Trust Erosion Signals",
      segments: "Patient Archetypes",
      contradictions: "Say vs. Experience Map",
    },
    keywords: [
      ["hospital", 3], ["clinic", 3], ["doctor", 3], ["patient", 3], ["pharmacy", 3],
      ["appointment", 2], ["diagnosis", 2], ["prescription", 2], ["treatment", 2],
      ["nurse", 2], ["waiting time", 2], ["billing", 2], ["health", 1], ["medical", 1],
      ["ward", 2], ["discharge", 2], ["insurance", 2], ["consultation", 2],
    ],
    lens: `INDUSTRY LENS — HEALTHCARE:
This dataset contains patient reviews, hospital feedback, or healthcare app reviews.
CRITICAL — this data has higher stakes than consumer retail. Weight these accordingly:
- Trust and privacy signals (patients are vulnerable; any breach of trust is critical)
- Doctor-patient communication failures
- Appointment wait times and their emotional impact
- Billing disputes and hidden charges that cause anxiety
- App/portal usability for booking, records access, and teleconsultation
Contradiction archetypes to look for:
- Patients who say "my doctor is wonderful" but describe a clinic billing disaster in the same review
- Patients who return despite bad experiences because they have no alternative (captive user)
- Patients who ask for digital records access but then distrust the system when given it
In psychographic_segments, use archetypes like: "The Frequent Patient", "The First-Timer", "The Caregiver", "The Digital Adopter".
In emotional signals, pay extra attention to: anxiety, fear, helplessness, relief, and betrayed trust.`,
  },

  // ── SaaS / Tech ──────────────────────────────────────────────────────────────
  {
    id: "saas",
    label: "SaaS / Tech",
    emoji: "💻",
    color: "text-violet-400 border-violet-400/20",
    panelLabels: {
      emotions: "User Friction Signals",
      features: "Product Gaps",
      churn: "Churn Risk Signals",
      segments: "User Archetypes",
      contradictions: "Expectation vs. Reality Map",
    },
    keywords: [
      ["dashboard", 2], ["api", 3], ["integration", 2], ["onboarding", 3], ["saas", 3],
      ["subscription", 2], ["bug", 2], ["uptime", 2], ["feature", 1], ["export", 2],
      ["analytics", 2], ["workflow", 2], ["pricing", 1], ["plan", 1], ["trial", 2],
      ["enterprise", 2], ["b2b", 2], ["slack", 2], ["zapier", 2], ["crm", 2],
    ],
    lens: `INDUSTRY LENS — SaaS / TECH PRODUCT:
This dataset contains reviews, NPS responses, or feedback for a software product (web app, API, mobile app, or B2B tool).
Focus on:
- Onboarding friction (what stops new users from getting value in the first 7 days)
- Feature adoption gaps (what features exist but aren't being used, and why)
- Integration and API reliability issues
- Pricing plan confusion or billing disputes
- Support ticket quality and response time
Contradiction archetypes to look for:
- Power users who praise advanced features but say onboarding drove away their team
- Users who rate 5 stars but list 3 things they need before they'll renew
- Users who say the product is "best in class" but are actively evaluating competitors
In psychographic_segments, use archetypes like: "The Power User", "The Reluctant Admin", "The Skeptic", "The Onboarding Dropout".`,
  },

  // ── Finance / Fintech ────────────────────────────────────────────────────────
  {
    id: "finance",
    label: "Finance / Fintech",
    emoji: "🏦",
    color: "text-emerald-400 border-emerald-400/20",
    panelLabels: {
      emotions: "Trust Anxiety Signals",
      features: "Product Gap Requests",
      churn: "Trust Erosion Signals",
      segments: "Customer Archetypes",
      contradictions: "Trust Contradiction Map",
    },
    keywords: [
      ["bank", 3], ["upi", 3], ["loan", 3], ["emi", 3], ["transaction", 2], ["fraud", 3],
      ["kyc", 3], ["cibil", 3], ["investment", 2], ["wallet", 2], ["neft", 2], ["imps", 2],
      ["credit card", 3], ["debit card", 2], ["insurance", 2], ["fd", 2], ["mutual fund", 2],
      ["account", 1], ["branch", 2], ["atm", 2], ["paytm", 3], ["phonepe", 3], ["gpay", 3],
    ],
    lens: `INDUSTRY LENS — FINANCE / FINTECH:
This dataset contains banking, payments, or fintech app reviews or complaints.
CRITICAL — financial trust loss is catastrophic and irreversible. Weight churn signals heavily.
Focus on:
- Transaction failures and money in limbo (the highest-urgency category)
- Undisclosed fees, charges, or interest rates that cause feelings of betrayal
- KYC/onboarding friction that blocks users from accessing their money
- Fraud experience and the platform's response (slow resolution = trust destroyed)
- Customer support accessibility for financial disputes
Contradiction archetypes to look for:
- Users who say "I trust [Brand] with my money" but have never been able to reach support during a dispute
- Users who complain about fees but keep the account because they're locked in by salary deposits
- Users who praise the UI but describe a transaction failure that cost them money
In psychographic_segments, use archetypes like: "The Salary Account Captive", "The Digital Native Investor", "The Fraud Victim", "The Fee-Sensitive User".
In trust_erosion_signals, flag any mention of: failed transactions, money deducted without credit, delayed refunds, and ignored complaints.`,
  },

  // ── Retail / E-commerce ──────────────────────────────────────────────────────
  {
    id: "retail",
    label: "Retail / E-commerce",
    emoji: "🛍",
    color: "text-pink-400 border-pink-400/20",
    panelLabels: {
      emotions: "Shopping Emotion Signals",
      features: "Experience Gap Requests",
      churn: "Abandonment Risk Signals",
      segments: "Shopper Archetypes",
      contradictions: "Expectation vs. Delivery Map",
    },
    keywords: [
      ["amazon", 3], ["flipkart", 3], ["myntra", 3], ["meesho", 3], ["ajio", 3],
      ["product", 2], ["return", 2], ["refund", 2], ["shipping", 2], ["delivery", 1],
      ["quality", 2], ["fake", 2], ["counterfeit", 3], ["size", 2], ["color", 1],
      ["exchange", 2], ["warranty", 2], ["packaging", 2], ["cart", 2], ["wishlist", 1],
    ],
    lens: `INDUSTRY LENS — RETAIL / E-COMMERCE:
This dataset contains online shopping reviews or customer service feedback.
Focus on:
- Product authenticity and quality versus listing expectations (counterfeit, wrong color, sizing issues)
- Return and refund experience quality
- Delivery timing, packaging quality, and last-mile experience
- Review authenticity concerns (fake reviews mentioned by real users)
- Payment options (COD availability, EMI, wallet support)
Contradiction archetypes to look for:
- Users who buy frequently but consistently complain about product quality
- Users who say the app is great but have 3-5 open complaints in their history
- Users who give 5 stars but ask for a refund in the same review text
In psychographic_segments, use archetypes like: "The Brand Loyalist", "The Deal Hunter", "The One-Time Buyer", "The Returns Abuser".`,
  },

  // ── HR / Workforce ───────────────────────────────────────────────────────────
  {
    id: "workforce",
    label: "HR / Workforce",
    emoji: "👥",
    color: "text-cyan-400 border-cyan-400/20",
    panelLabels: {
      emotions: "Workforce Anxiety Signals",
      features: "Support Gap Requests",
      churn: "Attrition Risk Signals",
      segments: "Worker Archetypes",
      contradictions: "Say vs. Experience Map",
    },
    keywords: [
      ["employee", 3], ["workforce", 3], ["automation", 3], ["ai jobs", 3], ["reskilling", 3],
      ["displacement", 3], ["career", 2], ["manager", 2], ["hr", 2], ["layoff", 3],
      ["remote work", 2], ["culture", 2], ["salary", 2], ["appraisal", 2], ["burnout", 2],
    ],
    lens: `INDUSTRY LENS — HR / WORKFORCE:
This dataset contains employee reviews, HR feedback, or workforce impact reports.
Focus on:
- Automation anxiety (fear of job loss, uncertainty about the future)
- Manager-employee communication failures
- Reskilling and training program effectiveness
- Salary and appraisal transparency
- Burnout signals correlated with specific team dynamics
Contradiction archetypes to look for:
- Employees who say they're "fine with AI tools" but express deep anxiety about their job security
- Employees who praise company culture publicly but describe toxic dynamics in Glassdoor reviews
- Employees who say their manager is great but report no career growth
In psychographic_segments, use archetypes like: "The Anxious Performer", "The Skeptic", "The Reskilling Champion", "The Quiet Quitter".`,
  },
];

// Quick lookup by ID
export const INDUSTRY_MAP = Object.fromEntries(
  INDUSTRIES.map((i) => [i.id, i])
) as Record<IndustryId, IndustryDef>;

// Options for the dropdown (all except "auto" which is handled separately)
export const INDUSTRY_OPTIONS = INDUSTRIES.filter((i) => i.id !== "auto");
