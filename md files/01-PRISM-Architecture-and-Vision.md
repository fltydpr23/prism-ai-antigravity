# 01 PRISM Architecture and Vision

> This document is a consolidated master file. Below are the preserved contents from original session and design documents.



---
## Source: PRISM_V2_Architecture.md

# PRISM V2 — Hierarchical Intelligence Architecture

## Core Insight

The bottleneck in local AI systems is NOT chunking.

The bottleneck is:
- giant synthesis prompts
- strict JSON formatting
- constrained generation
- oversized outputs
- massive context windows

The solution:
# separate extraction, reasoning, and formatting into different stages.

---

# THE FUNDAMENTAL SHIFT

## BAD ARCHITECTURE

```txt
Raw File
    ↓
One Massive Prompt
    ↓
Huge JSON Report
```

Problems:
- extremely slow
- context overload
- malformed JSON
- high hallucination risk
- poor scalability
- unusable local inference latency

---

## PRISM V2 ARCHITECTURE

```txt
Raw File
    ↓
Text Extraction
    ↓
Cleaning + Deduplication
    ↓
Semantic Chunking
    ↓
Lightweight Chunk Analysis
    ↓
Compressed Intelligence Memory
    ↓
Freeform Global Synthesis
    ↓
JSON Structuring Layer
    ↓
Final Executive Report
```

This architecture is:
- faster
- more reliable
- local-model friendly
- scalable
- modular
- easier to debug

---

# IMPORTANT PRINCIPLE

## Separate THINKING from FORMATTING

LLMs perform poorly when forced to:
- deeply reason
AND
- generate massive structured JSON
simultaneously.

This dramatically increases:
- latency
- formatting failures
- hallucinations
- inference instability

Instead:
1. Let the model think naturally first.
2. Structure the result afterward.

This is one of the most important optimizations in AI system design.

---

# STAGE 1 — FILE INGESTION

Supported:
- CSV
- PDF
- TXT
- DOCX
- JSON

Goal:
extract only useful text before inference.

---

## CSV Handling

Use traditional parsers:
- pandas
- papaparse
- csv-parser

Extract:
- reviews
- complaints
- support messages
- survey answers

Ignore:
- IDs
- timestamps (unless useful)
- metadata
- empty columns

---

## PDF Handling

Use:
- pdfplumber
- pymupdf
- unstructured.io

Extract:
- paragraphs
- conversations
- transcripts
- customer feedback

Remove:
- headers
- footers
- duplicated text
- page numbers

---

# STAGE 2 — CLEANING + DEDUPLICATION

Before inference:

- normalize whitespace
- remove duplicates
- collapse repeated complaints
- clean malformed text
- merge fragmented sentences

Example:

BAD:
"delivery late"
"delivery late"
"delivery late"

GOOD:
"delivery late" mentioned 53 times

This dramatically reduces:
- token usage
- inference time
- memory pressure

---

# STAGE 3 — SEMANTIC CHUNKING

DO NOT chunk randomly.

Instead:
group semantically similar content together.

Examples:
- delivery complaints
- support issues
- feature requests
- pricing concerns
- positive feedback

This improves:
- emotional consistency
- synthesis quality
- pattern recognition

---

# IDEAL CHUNK SIZE

For local models:

Recommended:
- 4k–8k tokens
OR
- 50–150 feedback items

Goal:
keep inference lightweight and fast.

---

# STAGE 4 — LIGHTWEIGHT CHUNK ANALYSIS

## CRITICAL PRINCIPLE

Chunk analysis should be:
- lightweight
- compressed
- fast
- extraction-focused

NOT:
- verbose
- deeply analytical
- highly formatted

---

# GOOD CHUNK PROMPT

```txt
Analyze this customer feedback chunk.

Return ONLY:
- top issues
- emotional tone
- repeated complaints
- feature requests
- urgency level
- representative phrases

Keep output extremely concise.
No explanations.
```

---

# IDEAL CHUNK OUTPUT

```json
{
  "issues": ["late delivery", "poor support"],
  "emotion": "frustrated",
  "feature_requests": ["faster refunds"],
  "urgency": "high",
  "quotes": ["acha hai but support slow"]
}
```

---

# STAGE 5 — COMPRESSED INTELLIGENCE MEMORY

Store:
- chunk summaries
- issue frequencies
- emotional signals
- feature requests
- representative quotes

DO NOT store:
- giant raw contexts
- full documents
- verbose summaries

Goal:
convert raw chaos into compact machine memory.

---

# STAGE 6 — FREEFORM GLOBAL SYNTHESIS

## IMPORTANT CHANGE

DO NOT force strict JSON during reasoning.

Instead:
allow the model to synthesize naturally.

---

# GLOBAL SYNTHESIS PROMPT

```txt
Analyze these aggregated customer intelligence summaries.

Focus on:
- major recurring issues
- emotional patterns
- operational failures
- strategic opportunities
- customer expectations
- churn risks

Be concise and insight-dense.
```

This is:
- much faster
- smarter
- more stable
- lower hallucination risk

---

# STAGE 7 — JSON STRUCTURING LAYER

ONLY AFTER synthesis:

Convert the concise synthesis into structured JSON.

---

# STRUCTURING PROMPT

```txt
Convert this analysis into structured JSON.

Return ONLY valid JSON.
```

---

# VALIDATION LAYER

Every structured output should pass through:

```txt
Output
    ↓
JSON Validator
    ↓
Pass / Retry
```

If validation fails:
- retry with simpler formatting
- NEVER pass malformed raw outputs upstream

---

# IMPORTANT FAILURE RULE

If a chunk fails:
DO NOT inject raw chunk text into final synthesis.

Instead:
- retry chunk once
- fallback to simpler extraction
- discard malformed formatting

Injecting raw chunks:
- destroys context efficiency
- massively increases latency
- worsens synthesis quality

---

# PERFORMANCE OPTIMIZATIONS

## 1. Keep Intermediate Outputs Tiny

Goal:
maximize intelligence density.

Avoid:
- verbose AI prose
- unnecessary explanation
- giant reports

---

## 2. Flat JSON > Nested JSON

Flat structures are:
- easier for local models
- faster to generate
- more reliable

GOOD:

```json
{
  "issues": [],
  "emotion": "",
  "urgency": ""
}
```

BAD:

```json
{
  "emotional_taxonomy": {
    "primary": {},
    "secondary": {}
  }
}
```

---

## 3. Use Smaller Models for Chunking

Examples:
- Qwen 14B
- Gemma smaller variants
- fast local models

Reserve larger models for:
- final synthesis
- executive intelligence
- strategic reasoning

---

## 4. Parallelism Carefully

Ollama on a single machine does NOT scale linearly with parallel requests.

Too many simultaneous generations cause:
- GPU contention
- RAM pressure
- thermal throttling
- slower total throughput

Better:
- lightweight chunk inference
- controlled concurrency
- one heavy synthesis pass

---

# FUTURE PRISM EVOLUTION

## Embedding Layer

Future pipeline:

```txt
Raw Feedback
    ↓
Embeddings
    ↓
Semantic Clustering
    ↓
Chunk Analysis
```

Benefits:
- smarter grouping
- better emotional coherence
- improved synthesis quality

---

## Emotional Intelligence Layer

Classify:
- disappointment
- frustration
- delight
- betrayal
- cautious optimism
- churn risk

Especially important for:
- Indian customer communication
- Hinglish/Tanglish nuance
- emotional business intelligence

---

## Retrieval + Memory Layer

Store:
- recurring phrases
- complaint patterns
- emotional mappings
- industry-specific signals

Over time:
Prism becomes an evolving intelligence system.

---

# FINAL REALIZATION

PRISM is NOT:
"chat with documents"

PRISM IS:
# an intelligence orchestration system

The moat is NOT:
- giant prompts
- biggest model
- longest context

The moat IS:
- orchestration
- compression
- semantic clustering
- synthesis pipelines
- emotional intelligence
- India-native understanding
- workflow architecture


---
## Source: prism-platform-vision.md

# Prism — Platform Vision & Roadmap

## Current Score: 81/100 (Prism Clarity) ✅
You've built a working consumer intelligence engine. The next step is turning it into a **high-end data intelligence platform** — one that agencies across healthcare, finance, retail, SaaS, and beyond can trust with their most important data decisions.

---

## Part 1: UI Upgrades (Immediate Impact)

The current UI is clean but functional. To feel like a *premium intelligence platform*, it needs to feel like a war room, not a dashboard.

### 1.1 The Prism Score Card → Make it the Hero
The score circle is currently small and understated. Make it the first thing that hits you:
- **Full-bleed score reveal animation** — the number counts up from 0 with an arc that fills in color
- **Contextual benchmarks** — "Your dataset scores higher than 73% of similar analyses in the Food & Delivery category"
- **Score delta badge** — if they've run multiple analyses on the same company, show a `+12` or `-4` delta from the last run

### 1.2 Add a "Signal Map" Visual
A 2x3 or 2x4 hexagonal or radar chart showing all 6 scoring dimensions simultaneously. One glance tells the analyst where the data is strong and where it's thin. This is far more impressive than 6 separate bars.

### 1.3 Expandable Intelligence Cards
Each section (Contradiction Map, Feature Requests, Sentiment Trajectory) should be a collapsible card with:
- A **one-line headline** visible by default
- An **"Expand for Deep Dive"** button that opens the full analysis
- This makes the report scannable in 30 seconds but explorable in 5 minutes

### 1.4 "Evidence Drawer" on Contradictions
Each Contradiction card should have a pull-out drawer that shows the **exact raw reviews** from the dataset that the LLM used as evidence. This builds trust — the analyst can verify the machine's reasoning directly.

### 1.5 Industry Context Panel
A sidebar or header bar where the user selects their industry before uploading:
`Food & Delivery` | `Healthcare` | `SaaS / B2B` | `Retail` | `Finance` | `Hospitality`

This selection dynamically changes which metrics and prompts are weighted more heavily in the analysis.

---

## Part 2: New Intelligence Modules (New Data Points to Surface)

These are brand new sections to add to the report, applicable across all industries.

### 2.1 🔴 Velocity Tracker
> *"How fast is sentiment changing?"*

Instead of just "Negative / Declining", show **rate of change**. If 70% of the 1-star reviews were posted in the last 2 weeks, that's a crisis signal, not a trend. This requires Prism to analyse timestamps in the data.

**Output:**
- `Sentiment Velocity: -3.2 pts / week`
- `Crisis Window: Last 14 days`
- `Projected Trajectory: Will reach critical threshold in ~3 weeks if unaddressed`

---

### 2.2 🟡 Voice of the Loyal Customer (VOLC)
> *"What's keeping your best customers from leaving?"*

Separate 4 and 5 star reviewers from the angry ones. Analyse *specifically* what the happy customers say to find **defensible moats** — the things SwiftCart is genuinely doing well that they should double down on, not abandon in a crisis response.

**Output:**
- `Loyalty Anchor: 24/7 availability consistently praised by power users`
- `Retention Risk: Even loyal users mention hidden charges — this is a pre-churn warning`

---

### 2.3 🟠 Competitor Intelligence Map
> *"Where are users running to, and why?"*

If users mention QuickDrop, FoodDash, Amazon, etc. in their reviews, Prism should automatically surface those mentions and extract the **specific reason** for the comparison.

**Output:**
- `QuickDrop: Mentioned 47 times | "Faster delivery" — structural speed gap`
- `FoodDash: Mentioned 31 times | "Better cashback offers" — pricing strategy gap`

---

### 2.4 🔵 Demand Signal Radar
> *"What do users desperately want that doesn't exist yet?"*

This is beyond feature requests. This is identifying **latent demand** — things users are describing as workarounds, complaints, or wishes that could become entire new product lines.

**Output (for SwiftCart):**
- `"Medicine delivery" mentioned 94 times — users are improvising with a grocery app`
- `"Cash on delivery for large orders" — unmet trust signal, not just a payment preference`

---

### 2.5 🟣 Trust Erosion Index
> *"Are users starting to distrust the brand?"*

This goes deeper than sentiment. It measures whether users are using language that signals **broken trust** (words like "cheating", "scam", "lied", "last time", "never again") and calculates a trust fragility score.

**Output:**
- `Trust Erosion Score: 62/100 (High Risk)`
- `Primary Erosion Driver: Refund failures and hidden charges`
- `Estimated Churn from Trust Failures: ~18% of reviewers explicitly stated they will not return`

---

## Part 3: Cross-Industry Expansion

This is how you make Prism valuable to *any* industry, not just food delivery.

### Healthcare Clients
When a hospital or health-tech company uploads patient satisfaction surveys or app reviews, Prism should activate a **Healthcare Intelligence Mode**:

| Healthcare Metric | What to Surface |
|---|---|
| **Care Quality Score** | Sentiment around doctor/nurse interactions |
| **Wait Time Signal** | Frequency and anger level around appointment delays |
| **Trust & Safety Flags** | Any language suggesting fear, misdiagnosis, or negligence (high priority) |
| **Digital Experience Gap** | Complaints about app booking, teleconsult quality, prescription management |
| **Compliance Language Detector** | Flag any reviews that describe potential regulatory or safety incidents |

---

### SaaS / B2B Clients
When a software company uploads user feedback or G2/Capterra reviews:

| SaaS Metric | What to Surface |
|---|---|
| **Feature Adoption Score** | Which features are loved vs. barely mentioned |
| **Onboarding Friction Index** | How many reviews mention confusion in the first week |
| **Power User vs. Churner Profile** | Two psychographic segments every SaaS needs |
| **Integration Demand** | What other tools users desperately want Prism to connect to |
| **Support Load Signal** | Volume of complaints that indicate a broken help center |

---

### Finance & Banking
| Finance Metric | What to Surface |
|---|---|
| **Regulatory Risk Radar** | Language suggesting potential RBI/SEC/FCA compliance issues |
| **Fee Transparency Score** | How often users complain about hidden or unexpected fees |
| **Trust Recovery Window** | After a crisis (outage, fraud), how long before sentiment recovers |
| **Product-Market Fit by Segment** | Millennials vs. HNI vs. small business users — very different needs |

---

### Retail & E-Commerce
| Retail Metric | What to Surface |
|---|---|
| **Product Quality Signal** | Review-level product issue detection (defective, wrong size, fake) |
| **Return Experience Score** | Sentiment around the returns and refund process specifically |
| **Discovery vs. Repeat Gap** | Are users finding you but not coming back? |
| **Geographic Demand Heat Map** | If reviews contain city/region data, surface where demand is strongest |

---

## Part 4: Platform-Level Features (What Makes it "Enterprise Ready")

### 4.1 Multi-Dataset Comparison Mode
Upload two CSVs (e.g., "SwiftCart Reviews Q1" and "SwiftCart Reviews Q2") and Prism generates a **delta report** showing what improved, what got worse, and what new issues emerged.

### 4.2 Historical Intelligence Archive
Every analysis auto-saves. Build a **history view** where clients can see how their score has trended over time — like a company health dashboard. This is the feature that makes them come back every month.

### 4.3 White-Label Report Export
Generate a beautiful, branded PDF or shareable link from each analysis. Agencies can send this directly to their clients as a deliverable. This alone can justify a **$500/report** pricing tier.

### 4.4 API Access Tier
For larger companies, offer a REST API endpoint. They can pipe their CRM, Zendesk, or app store reviews directly into Prism programmatically and get intelligence back in real-time.

### 4.5 Team Collaboration
- Analyst can add comments/annotations to any insight card
- Share a read-only report link with the client
- "Approved for client delivery" flag

---

## Suggested Next Build Priority

```
Phase 1 (UI Polish):        Signal Map Radar Chart + Expandable Cards
Phase 2 (New Intelligence): Velocity Tracker + Competitor Intelligence Map  
Phase 3 (Industry Modes):   Healthcare Mode + SaaS Mode with dynamic prompts
Phase 4 (Platform):         Multi-Dataset Comparison + PDF Export
```

The core insight: you're not building a report generator.  
You're building a **recurring intelligence subscription** that companies cannot afford to cancel.


---
## Source: prism-saas-roadmap-v1.md

# Prism — SaaS Strategy, India Pricing & Frontend Design Roadmap v1

> Authored from the perspective of a Lead SaaS Full-Stack Developer (OpenAI / Anthropic caliber).
> This is the blueprint to transform Prism from a working intelligence engine into a recurring, high-retention, enterprise-ready SaaS.

---

## PART 1 — Pricing Strategy for India

### The India SaaS Reality Check

Building for India is fundamentally different from building for the US or Europe. Here is what you need to understand before pricing:

| Factor | India Reality |
|---|---|
| **Willingness to pay** | Exists strongly — but only when ROI is explicit and immediate |
| **Price sensitivity** | High at entry, low at enterprise if value is proven |
| **Decision maker** | Founders, CMOs, Agency heads — not procurement committees |
| **Payment method** | UPI, Razorpay, cards — **monthly** preferred over annual at start |
| **Competition** | Mostly generic survey tools (Typeform, SurveyMonkey) and Excel sheets |
| **Sweet spot** | ₹0 → ₹999 for SMB, ₹3000–₹15,000 for agencies, ₹30,000+ for enterprise |

India's B2B SaaS market grew 40%+ YoY in 2024. Sectors most willing to pay: **Ed-tech, D2C Brands, Healthcare SaaS, FinTech, E-commerce agencies.**

---

### Prism's Competitive Moat in India

Nobody in India is offering **AI-native consumer intelligence** at this price point. The landscape is:

- **Qualtrics / Medallia** — ₹30L+ annual enterprise contracts. Overkill.
- **Hotjar / Mixpanel** — Quantitative only, no qualitative language intelligence.
- **Manual agencies** — ₹50,000–₹2,00,000 per report, slow and inconsistent.
- **Prism** — ₹999/month → ₹30,000/month. Fast, deep, multi-industry.

This is a **massive gap** you can dominate if you move quickly.

---

### Recommended Tier Architecture

#### Tier 0 — Free (Lead Magnet)
> Goal: Get people addicted. Make them understand the product's value before asking for money.

| Feature | Limit |
|---|---|
| Reports per month | **3** |
| File size | 2MB |
| Export | Watermarked PDF only |
| History | 7-day rolling only |
| Intelligence Modules | Core Score + 3 dimensions |
| Support | Community only |

**Key psychological move**: The watermarked export says **"Generated with Prism Free — Upgrade to remove branding"**. Agencies feel embarrassed sending a watermarked report to clients. This converts them.

---

#### Tier 1 — Starter — ₹999/month (~$12)
> Goal: Solo analysts, freelancers, early-stage startup founders.

| Feature | Limit |
|---|---|
| Reports per month | **15** |
| File size | 10MB |
| Industries | All 6 industry modes |
| Export | Clean PDF (no watermark) |
| History Archive | Full 90-day rolling |
| Intelligence Modules | Full core suite |
| Support | Email (48hr response) |

**Psychological anchor**: ₹999 is the magic price in India. It's the cost of a meal out. Founders will not hesitate. This tier is pure volume play.

---

#### Tier 2 — Pro — ₹3,499/month (~$42)
> Goal: Marketing agencies, D2C brand managers, research consultants, growth teams.

| Feature | Limit |
|---|---|
| Reports per month | **60** |
| File size | 50MB |
| Team Seats | 3 users |
| Multi-Dataset Comparison | ✅ Yes |
| White-Label PDF Export | ✅ Custom logo + brand colors |
| Competitor Intelligence Map | ✅ Full module |
| Velocity Tracker | ✅ Full module |
| VOLC (Voice of Loyal Customer) | ✅ Full module |
| History Archive | Full 12 months |
| Report Sharing Links | ✅ Read-only client links |
| Support | Email (24hr SLA) + Onboarding call |

**This is your money tier**. An agency spending ₹3,499/month and billing their clients ₹30,000 per Prism report has an **infinite ROI**. Position this explicitly.

---

#### Tier 3 — Agency — ₹9,999/month (~$120)
> Goal: Digital marketing agencies, market research firms, VC-backed startups with data teams.

| Feature | Limit |
|---|---|
| Reports per month | **200** |
| File size | 200MB |
| Team Seats | 10 users |
| Everything in Pro | ✅ |
| API Access | ✅ 1000 calls/month |
| Custom Industry Modes | ✅ Configurable prompts per client |
| Trust Erosion Index | ✅ Full module |
| Demand Signal Radar | ✅ Full module |
| Workspace Isolation | ✅ Separate workspaces per client |
| Priority Support | Slack channel + 4hr SLA |

---

#### Tier 4 — Enterprise — ₹30,000+/month (Custom)
> Goal: Listed companies, D2C conglomerates, healthcare chains, banks, VC firms.

| Feature | Notes |
|---|---|
| Unlimited reports | Volume-based pricing |
| Unlimited users | SSO (SAML/OIDC) |
| On-prem option | Private deployment on client cloud |
| Custom LLM Models | Fine-tuned Prism models per client |
| Dedicated Customer Success | Monthly strategy calls |
| SLA | 99.9% uptime guarantee |
| Annual billing | 20% discount on Annual |
| Data residency | India-hosted data (compliance-critical for banks/healthcare) |

**Enterprise sales motion**: You won't sell this on a pricing page. You sell it over chai. Target CMOs and VP Analytics at Tier 1 D2C brands (Mamaearth, Lenskart, Boat), HealthTech (Practo, PharmEasy), and FinTech (PayElite, QuickDrop).

---

### Pricing Psychology Tips for India

1. **Show the price in ₹, not $**. Trust and relatability increase significantly.
2. **Annual discount**: Offer 20% off for annual billing. Show the saving explicitly: *"Save ₹8,400/year"*.
3. **Add a "Most Popular" badge** on Pro — even if Starter outsells it, the badge anchors buyers toward higher value.
4. **Testimonials in INR ROI**: *"We used Prism to deliver a ₹2L research report in 4 hours instead of 4 weeks."*
5. **Local payment methods**: Integrate Razorpay. Support UPI, Net Banking, and all Indian debit cards.
6. **GST-inclusive pricing**: Always show GST clearly. Indian businesses need GST invoices for input tax credit.

---

## PART 2 — Frontend Design Roadmap

### The Philosophy: You Are Not a Dashboard. You Are a War Room.

The current Prism UI is functional. But a ₹3,499/month SaaS product needs to feel like it was built at the intersection of **Palantir, Notion, and Linear**. Dark. Precise. Premium. Every pixel should scream intelligence.

Reference design inspirations:
- **Vercel** — clean dark mode, sharp typography, confident minimalism
- **Linear** — speed, precision, keyboard-first
- **Hex (hex.tech)** — data intelligence product with premium feel
- **Raycast** — dark glass-morphism, micro-interactions, delightful
- **Anthropic Claude** — trust-inspiring, clean, confident

---

### Frontend Build Phases

---

#### Phase 1 — Landing Page Overhaul (Week 1–2)
> This is the single highest-leverage thing you can do. The homepage IS the product pitch.

**Hero Section:**
- Headline: *"Turn Customer Reviews into Strategic Intelligence."*
- Sub-headline: *"Prism analyses thousands of customer reviews in minutes and surfaces the signals your competitors are missing."*
- CTA: `Analyse Your First Dataset Free →`
- Supporting visual: An animated Prism score card counting up to 81 with a glowing arc — looping silently in the background. No video. Just the product itself.

**Social Proof Bar** (just below hero):
- *"Used by growth teams at [Company], [Company], [Agency]"*
- 3–5 logos. Even logos of companies you've tested with during beta. Build the credibility layer early.

**Feature Showcase (Bento Grid Layout):**
A 3-column bento grid that shows live, interactive cards:
- Prism Score card (animated)
- Competitor Intelligence (animated mentions counter)
- Trust Erosion Index (a live-looking gauge)
- Velocity Tracker (a sparkline chart)
- Industry Mode selector

**Pricing Section:**
- The exact tier table from Part 1 above.
- Toggle: Monthly / Annual (with the annual savings highlighted in green).
- CTA under each tier is different: Free = *"Start Free"*, Starter = *"Start Trial"*, Pro = *"Start 14-Day Free Trial"*, Agency = *"Book a Demo"*.

**Testimonials Section:**
- Quote format with name, company, and a specific outcome: *"We closed a ₹15L retainer based on a Prism report."*

**Footer:**
- Company details, GST number (when registered), Contact, Privacy Policy, Terms, LinkedIn.

---

#### Phase 2 — Application UI Overhaul (Week 2–4)

**2.1 Authenticated Layout Shell**
```
┌─────────────────────────────────────────────────────────┐
│  [Prism Logo]   Dashboard  History  Reports  Settings   │
│                                              [User Avatar]│
├─────────────────────────────────────────────────────────┤
│   [Sidebar: Upload zone + Industry selector]            │
│                                                         │
│   [Main content area: Results, reports, etc]            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**2.2 The Analysis Dashboard (Core Screen)**

Replace the current linear report layout with a **modular card grid**:

```
┌──────────────────────────────────────────────────────────────────┐
│  PRISM SCORE                  │  SIGNAL MAP                      │
│  ● 81 / 100                   │  [Radar Chart — 6 Dimensions]    │
│  Prism Gold Band              │                                   │
│  +12 vs last run              │                                   │
├───────────────────────────────┴──────────────────────────────────┤
│  VELOCITY TRACKER         │  COMPETITOR MAP  │  TRUST EROSION    │
│  -3.2 pts/week            │  QuickDrop: 47 ment. │  Score: 62/100    │
│  Crisis: Last 14 days     │  FoodDash: 31 men. │  Risk: HIGH       │
├───────────────────────────┴──────────────────┴───────────────────┤
│  CONTRADICTION MAP (Expanded Card)                                │
│  ┌─ Delivery Speed is praised AND criticised simultaneously ────┐ │
│  │  Evidence Drawer →  [Show 4 raw reviews]                   │ │
│  └───────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**2.3 The Score Card Animation**
- When results load, the score circle arc animates from 0 to the final score.
- Number counts up with an easing function.
- The band label fades in after the arc completes.
- Color transitions smoothly based on band (Bronze = amber, Gold = golden, Diamond = teal glow).
- This single animation will make users share screenshots of their results. It is inherently viral.

**2.4 History & Archive View**
- A timeline view of all past analyses.
- Each entry shows: date, score, band, industry, score delta vs. previous.
- Clicking an entry loads the full historical report.
- A mini sparkline shows score trend over time across all runs.

**2.5 Gating UI for Paid Features**
When a Free user tries to access a Pro feature (e.g., Competitor Intelligence Map):
- The card renders but is **blurred with a glass overlay**.
- Overlay text: *"Unlock Competitor Intelligence — Available on Pro."*
- A `Upgrade →` button inside the overlay.
- This is **infinitely more effective** than hiding the feature entirely. They can see what they're missing.

---

#### Phase 3 — Billing & Subscription UI (Week 3–4)

**Stripe / Razorpay Integration:**
- `/pricing` — public pricing page
- `/billing` — authenticated billing portal (upgrade, downgrade, invoice history)
- Use Razorpay for Indian customers (UPI + cards + netbanking)
- Use Stripe for international customers (cards + wallets)

**Usage Meter:**
In the top nav or sidebar, always show:
```
[██████████░░░░] 12 / 15 reports used · Resets in 18 days  [Upgrade →]
```
This is called a **consumption progress bar** and it's the single most effective churn-prevention and upsell mechanic in consumption-based SaaS.

---

#### Phase 4 — Platform Features (Month 2+)

**4.1 White-Label PDF Export**
- `/report/[id]/print` → already exists. Needs to:
  - Accept a logo URL from user settings
  - Apply user's brand color as the accent
  - Remove Prism branding on Pro+ plans
  - Add "Prepared by [Agency Name]" footer

**4.2 Shareable Report Links**
- Generate a `/share/[token]` page — read-only, no auth required.
- The link expires in 7 days (Free/Starter) or never (Pro+).
- Shows a read-only view of the full report with a `Analyse Your Own Data →` CTA for virality.
- Every shared report is a free marketing impression.

**4.3 API Access (Agency+ Tier)**
- `POST /api/v1/analyse` — accepts raw text or file URL, returns JSON report.
- API keys generated and managed in user settings.
- Rate limited per tier via existing Upstash infra.
- Full API docs at `/docs` using a clean documentation page.

---

## PART 3 — Technical Implementation Order

Here is the exact sequence to execute this roadmap, prioritised by business impact:

### Sprint 1 (Highest Impact — Do This First)
```
[ ] Landing page redesign with hero + bento grid
[ ] Pricing page with tier cards and toggle
[ ] Razorpay integration for payments
[ ] Usage meter in authenticated nav
[ ] Gated Pro feature blur overlays
```

### Sprint 2 (Core Product Polish)
```
[x] Score circle animation (count-up + arc fill)
[x] Signal Map radar chart (6 dimensions)
[x] Modular card grid layout for analysis dashboard
[x] Expandable intelligence cards (collapse/expand)
[x] Evidence Drawer for Contradiction Map
```

### Sprint 3 (Retention & Growth Loops)
```
[x] History Archive view with timeline
[x] Shareable read-only report links
[x] White-label PDF export (Pro+)
[x] Billing portal (/billing)
[x] Email on analysis complete (via Resend / SendGrid)
```

### Sprint 4 (Enterprise & Scale)
```
[ ] API access system + API key management
[ ] Team workspaces (multi-user)
[ ] Custom industry mode configuration
[ ] Slack/Webhook notifications on report ready
[ ] SSO (SAML) for Enterprise
```

---

## PART 4 — Go-To-Market Strategy for India

### Phase 1: Micro-Virality (Month 1)
- Share 3–5 real Prism analyses of famous Indian brands (SwiftCart, QuickDrop, FoodDash, DineNow, PayElite) publicly on LinkedIn.
- Frame as: *"I ran Prism over 5,000 SwiftCart reviews. Here is what the data says."*
- Every post ends with: *"Run your own analysis at [prism.ai] — free for the first 3 reports."*
- This is the India SaaS community playbook. It works. Every time.

### Phase 2: Agency Partnerships (Month 2–3)
- Target 20 digital marketing agencies in Bangalore, Mumbai, Delhi.
- Offer 6 months free Pro in exchange for 3 case studies and testimonials.
- Agencies become your sales force — they upsell Prism reports to their clients.

### Phase 3: Vertical Conferences (Month 3–6)
- Speak at SaaS events: SaaSBoomi, iSPIRT, YourStory events, Nasscom.
- Pitch angle: *"How Prism gives solo analysts the analytical power of a 50-person research team."*

### Phase 4: Enterprise Sales (Month 6+)
- Direct outreach to CMOs at Tier 1 D2C brands via LinkedIn.
- Offer a free pilot analysis of their own brand's data.
- Decision cycle: 4–6 weeks. Price: ₹30,000–₹1,50,000/month.

---

## PART 5 — Revenue Projections (Conservative)

| Month | Paying Users | Avg Revenue/User | MRR |
|---|---|---|---|
| Month 1 | 20 | ₹1,500 | ₹30,000 |
| Month 3 | 80 | ₹2,200 | ₹1,76,000 |
| Month 6 | 200 | ₹3,000 | ₹6,00,000 |
| Month 12 | 600 | ₹4,000 | ₹24,00,000 |

At 600 paying users at ₹24L MRR (~$28,500/month), you have a fundable, scalable SaaS. This is achievable with disciplined execution of the GTM plan above.

---

## Summary: What Makes Prism Win

1. **Speed** — Prism returns intelligence in minutes. Every competitor takes weeks.
2. **Depth** — Prism doesn't just surface sentiment. It surfaces strategy.
3. **Price** — Prism is 10x cheaper than the only alternatives (manual agencies).
4. **Trust** — Evidence Drawers, Score Bands, and Contradiction Maps make it *verifiable*.
5. **Design** — A premium, dark, animated interface makes it *shareable*.

> The biggest risk is not building fast enough. Your moat is product depth. Go.


---
## Source: prism_implementation_roadmap.md

# Prism: From Intelligence Engine to Industry Standard

## What you've built (the real thing)

You haven't built a feedback analysis tool. You've built **a measurement system for intelligence quality** — like NPS did for satisfaction.

The genius: Instead of "here's what customers said", you're saying "here's how **strategically useful** this feedback is, measured across 6 dimensions."

That's a **category-defining move.**

---

## Why this works (the Pantone parallel is perfect)

Pantone didn't invent color. They invented a **language** for color that made it tradeable, comparable, and consistent.

Prism isn't inventing feedback analysis. You're inventing a **language** for intelligence quality that makes it:
- Comparable across datasets
- Reproducible 
- Tradeable (can be packaged, sold, benchmarked)
- Measurable with precision

A D2C founder can now say: "Our hospital feedback scored Prism 82, that means the intelligence is strong enough to act on immediately."

That's powerful.

---

## The positioning shift

**Old positioning (Lune OS):**
> "Turn messy feedback into themes, emotions, and opportunities"

**New positioning (Prism):**
> "Measure the strategic value of your feedback. Know how confident you should be in your decisions."

**The frame changes from:**
- "What can I learn?" → "How much can I trust what I learned?"
- "Give me insights" → "Tell me if my insights are real"
- "Analyze my data" → "Score my intelligence"

---

## The six dimensions explained (for your ICP)

For **D2C brands, design agencies, and SaaS founders**, here's why each dimension matters:

| Dimension | Why it matters for Prism's ICP |
|:---|:---|
| **Signal Clarity (25%)** | D2C brands need ONE clear problem to fix. Clarity = actionability. |
| **Contradiction Depth (20%)** | This is where real insight lives. "Say vs Do" gaps reveal hidden behavior. |
| **Emotional Precision (15%)** | Emotions drive retention. Specific triggers > generic sentiment. |
| **Strategic Coverage (20%)** | Founders need 3+ prioritized actions, not vague recommendations. |
| **Churn Exposure (10%)** | Who's leaving and why? That's the most valuable insight. |
| **Segment Resolution (10%)** | Different users need different fixes. Segments let you tailor retention. |

---

## The immediate implementation (this week)

### 1. Build the scoring function

```javascript
// lib/prismScore.js

export function calculatePrismScore(analysis) {
  const dimensions = {
    SIG: calculateSignalClarity(analysis),
    CON: calculateContradictionDepth(analysis),
    EMO: calculateEmotionalPrecision(analysis),
    STR: calculateStrategicCoverage(analysis),
    CHR: calculateChurnExposure(analysis),
    SEG: calculateSegmentResolution(analysis),
  };

  const total =
    dimensions.SIG * 0.25 +
    dimensions.CON * 0.20 +
    dimensions.EMO * 0.15 +
    dimensions.STR * 0.20 +
    dimensions.CHR * 0.10 +
    dimensions.SEG * 0.10;

  return {
    total: Math.round(total),
    dimensions,
    band: getBand(total),
    improvements: getImprovements(dimensions),
  };
}

function calculateSignalClarity(analysis) {
  let score = 0;
  
  // Executive summary is decision-forcing
  if (analysis.executive_summary && analysis.executive_summary.length < 150) {
    score += 10;
  }
  
  // Sentiment trajectory identified
  if (analysis.sentiment_trajectory && analysis.sentiment_trajectory.trajectory) {
    score += 10;
  }
  
  // Language style detected
  if (analysis.detected_language || analysis.communication_style) {
    score += 5;
  }
  
  return Math.min(score, 25);
}

function calculateContradictionDepth(analysis) {
  let score = 0;
  const contradictions = analysis.contradiction_analysis || [];
  
  if (contradictions.length >= 3) {
    score = 20;
  } else if (contradictions.length === 2) {
    score = 14;
  } else if (contradictions.length === 1) {
    score = 8;
  }
  
  // Bonus for high severity
  const hasHighSeverity = contradictions.some(c => c.severity === 'high');
  if (hasHighSeverity && score > 0) {
    score = Math.min(score + 5, 20);
  }
  
  return score;
}

function calculateEmotionalPrecision(analysis) {
  let score = 0;
  const emotions = analysis.emotions || [];
  
  // Score per emotion with specific trigger
  const emotionsWithTriggers = emotions.filter(e => e.trigger).length;
  score += Math.min(emotionsWithTriggers * 5, 15);
  
  // Bonus for high intensity
  const hasHighIntensity = emotions.some(e => e.intensity === 'high');
  if (hasHighIntensity) {
    score += 5;
  }
  
  // Sentiment drivers populated
  const drivers = analysis.sentiment_drivers;
  if (drivers && drivers.delight_triggers && drivers.frustration_triggers) {
    score += 5;
  }
  
  // Penalty for generic emotions
  const genericEmotions = emotions.filter(e => 
    ['happy', 'sad', 'angry'].includes(e.emotion.toLowerCase()) && !e.trigger
  ).length;
  score -= genericEmotions * 5;
  
  return Math.max(Math.min(score, 15), 0);
}

function calculateStrategicCoverage(analysis) {
  let score = 0;
  const recs = analysis.strategic_recommendations || [];
  
  // Count recs with full structure
  const fullRecs = recs.filter(r => r.action && r.why && r.expected_outcome).length;
  
  if (fullRecs >= 3) {
    score = 15;
  } else if (fullRecs === 2) {
    score = 10;
  } else if (fullRecs === 1) {
    score = 5;
  }
  
  // Bonus for urgent recommendation
  const hasNowUrgency = recs.some(r => r.priority === 1 || r.timeline === 'now');
  if (hasNowUrgency) {
    score += 5;
  }
  
  return Math.min(score, 20);
}

function calculateChurnExposure(analysis) {
  let score = 0;
  const churnRisks = analysis.churn_risk_analysis?.high_risk_signals || [];
  
  if (churnRisks.length >= 2) {
    score = 10;
  } else if (churnRisks.length === 1) {
    score = 5;
  }
  
  // Bonus for retention strengths
  const retentionStrengths = analysis.churn_risk_analysis?.retention_strengths || [];
  if (retentionStrengths.length > 0) {
    score += 3;
  }
  
  return Math.min(score, 10);
}

function calculateSegmentResolution(analysis) {
  let score = 0;
  const segments = analysis.psychographic_segments || [];
  
  if (segments.length >= 2) {
    score = 10;
  } else if (segments.length === 1) {
    score = 5;
  }
  
  // Bonus for actionable segments
  const actionableSegments = segments.filter(s => s.how_to_win_them).length;
  if (actionableSegments > 0) {
    score += 3;
  }
  
  return Math.min(score, 10);
}

function getBand(score) {
  if (score >= 90) return { name: 'Prism Gold', emoji: '🏆', color: '#FFD700' };
  if (score >= 75) return { name: 'Prism Grade A', emoji: '✦', color: '#00D9FF' };
  if (score >= 60) return { name: 'Prism Grade B', emoji: '◈', color: '#7B68EE' };
  if (score >= 40) return { name: 'Prism Grade C', emoji: '○', color: '#FFB366' };
  return { name: 'Prism Noise', emoji: '⚪', color: '#888' };
}

function getImprovements(dimensions) {
  const sorted = Object.entries(dimensions)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 2);
  
  return sorted.map(([dim, score]) => ({
    dimension: dim,
    score,
    tip: getTip(dim),
  }));
}

function getTip(dimension) {
  const tips = {
    SIG: "Sharpen your executive summary to one decision-forcing sentence.",
    CON: "Look for more 'Say vs. Do' gaps — these reveal hidden behavior.",
    EMO: "Link each emotion to a specific trigger or moment.",
    STR: "Add more recommendations. Aim for 3+ with clear 'Why' and 'Expected outcome'.",
    CHR: "Identify which specific users are at risk and what keeps them engaged.",
    SEG: "Segment users by how they think, not by company size.",
  };
  return tips[dimension] || "Provide more detailed feedback.";
}
```

### 2. Build the UI card

```javascript
// components/PrismScoreCard.jsx

import { useState } from 'react';

export function PrismScoreCard({ score }) {
  const [expanded, setExpanded] = useState(false);

  const dimensionLabels = {
    SIG: 'Signal Clarity',
    CON: 'Contradiction Depth',
    EMO: 'Emotional Precision',
    STR: 'Strategic Coverage',
    CHR: 'Churn Exposure',
    SEG: 'Segment Resolution',
  };

  const dimensionMaxes = {
    SIG: 25,
    CON: 20,
    EMO: 15,
    STR: 20,
    CHR: 10,
    SEG: 10,
  };

  return (
    <div className="prism-score-card">
      <div className="header" onClick={() => setExpanded(!expanded)}>
        <div className="main-score">
          <div className="number">{score.total}</div>
          <div className="band" style={{ color: score.band.color }}>
            {score.band.emoji} {score.band.name}
          </div>
        </div>
        <div className="interpretation">
          <p className="subtext">
            {score.total >= 90 && "World-class signal. Ready for board decisions."}
            {score.total >= 75 && score.total < 90 && "Strong strategic intelligence. Actionable immediately."}
            {score.total >= 60 && score.total < 75 && "Good signal, minor gaps. Some themes need more evidence."}
            {score.total >= 40 && score.total < 60 && "Signal present but thin. Consider more feedback."}
            {score.total < 40 && "Not enough signal to draw strategic conclusions."}
          </p>
        </div>
        <div className="expand-icon">{expanded ? '▼' : '▶'}</div>
      </div>

      {expanded && (
        <div className="breakdown">
          {Object.entries(score.dimensions).map(([dim, value]) => {
            const max = dimensionMaxes[dim];
            const percent = (value / max) * 100;
            
            return (
              <div key={dim} className="dimension-row">
                <div className="label">
                  <span className="code">{dim}</span>
                  <span className="name">{dimensionLabels[dim]}</span>
                </div>
                <div className="bar">
                  <div className="fill" style={{ width: `${percent}%` }}></div>
                </div>
                <div className="value">{value}/{max}</div>
              </div>
            );
          })}

          <div className="improvements">
            <h4>To improve your score:</h4>
            {score.improvements.map((imp, i) => (
              <div key={i} className="improvement-tip">
                <span className="dim">{dimensionLabels[imp.dimension]}</span>
                <p>{imp.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. Add to your output page

```javascript
// pages/results.jsx

import { PrismScoreCard } from '@/components/PrismScoreCard';
import { calculatePrismScore } from '@/lib/prismScore';

export default function ResultsPage({ analysis }) {
  const prismScore = calculatePrismScore(analysis);

  return (
    <div className="results-container">
      {/* Score card — show first */}
      <PrismScoreCard score={prismScore} />

      {/* Then show all the other intelligence sections */}
      <ExecutiveSummary data={analysis.executive_summary} />
      <ContradictionMap data={analysis.contradiction_analysis} />
      <StrategicRecommendations data={analysis.strategic_recommendations} />
      {/* ... etc */}
    </div>
  );
}
```

---

## Why this changes everything

**Current state:** You're a feedback analyzer
**After this:** You're an intelligence quality benchmarking system

**For your ICP:**
- **D2C founders:** "My feedback scored 78. That's strong enough to act on. Let me build the #2 recommendation."
- **Design agencies:** "Our research scored 85. Share this with the client to show research rigor."
- **Researchers:** "My interview score is 62. I need deeper contradictions. Let me do 5 more interviews."

The score becomes the **language of confidence.**

---

## The long-term play

Once you have 100 paying users with Prism scores:

1. **Benchmarking layer:** "Your score (78) is above average for D2C brands (avg 72). Below average for enterprise (avg 82)."

2. **Cohort analysis:** "Teams that score >80 have 3x higher retention. What's different about their feedback?"

3. **Industry reports:** "The State of D2C Intelligence 2026: Average Prism Score by Category"

4. **API/embeds:** Agencies embed the Prism Score in reports sent to clients. It becomes a **credibility badge.**

That's defensibility. That's a moat.

---

## This week's execution

1. Build the scoring function (4 hours)
2. Build the UI card (2 hours)
3. Test with 5 different feedback sets
4. Deploy
5. Launch messaging emphasizing the score, not the analysis

By next week you're selling: **"Know the strategic value of your feedback before you act on it."**

That's Prism.

