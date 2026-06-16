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

Separate 4 and 5 star reviewers from the angry ones. Analyse *specifically* what the happy customers say to find **defensible moats** — the things Blinkit is genuinely doing well that they should double down on, not abandon in a crisis response.

**Output:**
- `Loyalty Anchor: 24/7 availability consistently praised by power users`
- `Retention Risk: Even loyal users mention hidden charges — this is a pre-churn warning`

---

### 2.3 🟠 Competitor Intelligence Map
> *"Where are users running to, and why?"*

If users mention Zepto, Swiggy, Amazon, etc. in their reviews, Prism should automatically surface those mentions and extract the **specific reason** for the comparison.

**Output:**
- `Zepto: Mentioned 47 times | "Faster delivery" — structural speed gap`
- `Swiggy: Mentioned 31 times | "Better cashback offers" — pricing strategy gap`

---

### 2.4 🔵 Demand Signal Radar
> *"What do users desperately want that doesn't exist yet?"*

This is beyond feature requests. This is identifying **latent demand** — things users are describing as workarounds, complaints, or wishes that could become entire new product lines.

**Output (for Blinkit):**
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
Upload two CSVs (e.g., "Blinkit Reviews Q1" and "Blinkit Reviews Q2") and Prism generates a **delta report** showing what improved, what got worse, and what new issues emerged.

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
