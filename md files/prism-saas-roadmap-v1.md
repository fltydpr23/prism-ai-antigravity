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
