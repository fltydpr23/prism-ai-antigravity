# 03 PRISM Features and Frontend

> This document is a consolidated master file. Below are the preserved contents from original session and design documents.



---
## Source: prism-website-redesignv1.md

CLAUDE PROMPT — DESIGN & BUILD THE PRISM WEBSITE

You are a world-class product designer and frontend engineer.

Your task is to design and build the marketing website and product UI for a premium AI-native consumer intelligence platform called Prism.

DO NOT create a generic SaaS website.

The goal is to create the most premium consumer intelligence platform on the market.

Reference quality:

* Linear
* Stripe
* Vercel
* Arc Browser
* Notion
* Figma
* Ramp
* Anthropic
* Bloomberg Terminal (data density inspiration)
* Gartner reports (credibility inspiration)

The product is called:

PRISM

Domain:

prismintel.co

Tagline:

Turn Customer Feedback Into Strategic Intelligence.

⸻

PRODUCT OVERVIEW

Prism is an AI-native Consumer Intelligence Platform.

Users upload:

* Customer reviews
* WhatsApp support chats
* Survey responses
* Interview transcripts
* Community discussions
* CSV exports
* PDFs
* Audio files

Prism analyzes the data and generates:

* Prism Score™
* Prism Intelligence Reports™
* Prism Signals™
* Executive Summaries
* Churn Risks
* Opportunity Detection
* Competitive Insights
* Emerging Trends

The output should feel closer to:

McKinsey
Gartner
Bloomberg

than

ChatGPT.

⸻

DESIGN PHILOSOPHY

Keywords:

Premium
Elegant
Intelligent
Minimal
Data-rich
Fast
Trustworthy
Enterprise-grade

Avoid:

* Neon gradients
* Crypto aesthetics
* Generic AI illustrations
* Cartoon icons
* Stock photos
* Generic dashboard screenshots

The interface should feel:

“AI for decision makers.”

not

“AI toy.”

⸻

LANDING PAGE STRUCTURE

HERO

Large headline:

Turn Customer Feedback Into Strategic Intelligence.

Subheadline:

Upload reviews, surveys, support conversations and customer research. Prism transforms thousands of voices into executive-ready intelligence.

CTA:

Start Free Analysis

Secondary CTA:

View Sample Report

Right side:

Interactive dashboard mockup.

Show:

PRISM SCORE

87

with:

↑ +6 this month

and:

3 emerging opportunities detected

2 churn risks detected

Visual should feel alive.

⸻

TRUST SECTION

Headline:

Built for modern brands, agencies and research teams.

Show use cases:

* Consumer Intelligence
* Voice of Customer
* Community Intelligence
* Competitive Analysis
* Customer Research

⸻

FEATURE SECTION

Prism Score™

Large beautiful card.

Description:

A proprietary intelligence score that measures customer health, satisfaction and risk.

Display:

Prism Score: 87

Category: Strong

Trend: Improving

⸻

Prism Signals™

Show AI-generated insights:

Delivery delays rising in South India

Price sensitivity increasing among family buyers

Subscription demand detected

Communication gaps impacting trust

Beautiful signal cards.

⸻

Prism Intelligence Reports™

Show executive report preview.

Sections:

Executive Summary

Key Opportunities

Churn Risks

Strategic Recommendations

Competitive Positioning

The report should look worthy of being presented in a boardroom.

⸻

Multilingual Intelligence

Highlight:

English

Tanglish

Hinglish

Kannada-English

Telugu-English

Mixed-language support.

Show examples.

⸻

Universal Inputs

Beautiful upload section.

Supported:

CSV

PDF

WhatsApp Export

Survey Data

Interview Transcripts

Audio

App Reviews

⸻

PRODUCT SCREENSHOTS

Create premium mock product interfaces.

Do NOT use placeholders.

Create realistic consumer intelligence data.

Show:

* Prism Score
* Sentiment evolution
* Emerging themes
* Opportunity map
* Churn risk indicators
* Executive summary cards

The UI should feel like a modern Bloomberg terminal.

⸻

HOW IT WORKS

Step 1

Upload Data

Step 2

AI Signal Extraction

Step 3

Executive Intelligence Report

Step 4

Strategic Decisions

⸻

USE CASES

Agencies

Generate client-ready intelligence reports in minutes.

Brands

Understand customer sentiment at scale.

Researchers

Analyze qualitative data instantly.

Product Teams

Identify emerging opportunities and friction points.

⸻

SOCIAL PROOF SECTION

Use placeholder testimonials.

Design them beautifully.

Emphasize:

saved research hours

faster reporting

better client presentations

improved decision making

⸻

PRICING

Show:

Starter

Professional

Agency

Enterprise

Pricing cards should feel premium and clean.

⸻

FOOTER

Minimal.

Elegant.

Enterprise feel.

⸻

PRODUCT UI DESIGN SYSTEM

Typography:

Inter
Geist
SF Pro style

Spacing:

Generous

Colors:

Near-black backgrounds

Soft grays

White typography

Subtle blue accents

No flashy gradients.

⸻

DASHBOARD DESIGN

Main navigation:

Overview
Signals
Reports
Uploads
Benchmarks
Settings

Main metrics:

Prism Score
Sentiment Index
Risk Index
Opportunity Index
Voice Share

Widgets:

Signal Feed

Emerging Themes

Trend Detection

Report Generator

Recent Uploads

Competitive Insights

Everything should feel:

Fast
Premium
Executive-ready

Create production-quality UI.

Not a template.

Not a generic SaaS page.

Design Prism as if it is the category-defining Consumer Intelligence platform of the next decade.

---
## Source: prism_redesign_summary 17th may.md

# Prism Intelligence Platform — Redesign & Polish Summary

This document summarizes the comprehensive transformation of the **Prism Consumer Intelligence Platform** from a functional prototype into a premium, cinematic, enterprise-grade SaaS experience.

---

## 🌟 The Core Vision
Prism is styled to feel like **Bloomberg Terminal × Linear × Apple × Palantir**. It ingests highly messy, multilingual customer feedback (chats, app store reviews, support transcripts) and transforms them into strategic, emotional insights. Today, we elevated this vision through meticulously crafted typography, kinetic physics, and structural alignment.

---

## 🚀 Key Accomplishments & Deliverables

### 1. Typography & Contrast Overhaul (The "Editorial" Punch)
To fix the common readability issues on pitch-black backgrounds, we completely overhauled the typographic hierarchy:
- **Heavier Editorial Headers:** Removed cheap-feeling extralight text. Replaced with bold and semibold weights (`font-bold`, `font-semibold`) and paired them with aggressive negative tracking (`tracking-tighter` / `tracking-tight`) for that premium Vercel/Linear feel.
- **JetBrains Mono Integration:** Configured `JetBrains_Mono` from Google Fonts and applied `font-mono` to all numbers, processing stats, and score displays to convey high-precision, technical authority.
- **Increased Opacity:** Raised subtext and description opacity from standard high-transparency layers to solid high-contrast values (e.g., `text-white/55` to `text-white/70`), preventing halation on deep dark backgrounds.

### 2. Kinetic Spring Physics & Magnetic Buttons
We removed default, flat CSS transitions on all call-to-actions and introduced rich micro-interactions:
- **Magnetic Drag:** Primary CTA buttons now track the user's cursor. When hovered, the button warps and dynamically "pulls" itself toward the cursor, giving the software a physical, tactile weight.
- **Snapping Springs:** Configured realistic spring parameters (`stiffness: 350, damping: 25, mass: 0.5`) in Framer Motion. When the cursor leaves, the buttons snap back into place with natural inertia.

### 3. Bento Grid Alignment & 3x3 Symmetry
The landing page bento grid was restructured from an uneven, unbalanced 7-card layout into a **pixel-perfect 6-card zig-zag pattern**:
- **Consolidated Modules:** Combined the overlapping "Macro Analysis" and "Segment Depth" cards into a single 2-column wide module: **Macro & Segment Depth** (Crimson/Amber).
- **Alternate Balance:** Achieved a perfectly balanced asymmetric flow:
  - **Row 1:** `[ 2-Col Wide Card ]` `[ 1-Col Stat Card ]` (Total: 3 cols)
  - **Row 2:** `[ 1-Col Quote Card ]` `[ 2-Col Wide Card ]` (Total: 3 cols)
  - **Row 3:** `[ 2-Col Wide Card ]` `[ 1-Col Trust Card ]` (Total: 3 cols)
- **Pixel-Perfect Row Alignment (`h-full` Flex):** Added `h-full flex flex-col justify-between` wrapper styling. Every card in a grid row now automatically stretches to match the height of the tallest card, aligning the grid boundaries flawlessly.

### 4. Cinematic Orbital Ingestion Loader
Replaced the basic circular loading spinner in the analysis pipeline with a high-end orbital animation:
- **Orbital Data Particles:** Three light particles revolving at different speeds and radii around a central core.
- **Counter-Rotating Rings:** Inner and outer dashed circles spinning in opposite directions to represent active background computation.
- **Dynamic Progress Strip:** Added a connected progression line tracing the pipeline stages (`parsing` → `detecting` → `mapping` → `building`) with glowing status indicators.

### 5. Prism Clarity Score Ring
Designed a striking visualization for the top of the Results Dashboard:
- **Self-Drawing SVG Score Ring:** A radial progress ring that animates on mount and dynamically adjusts its color (Green, Amber, Red) depending on the analysis score.
- **Subscore Progress HUD:** 6 metric bars (Signal Clarity, Contradiction Depth, etc.) that load with synchronized growth animations to provide immediate cognitive trust.

---

## 🛠️ Tech Stack & Architecture Integration
- **Framework:** Next.js (Turbopack) with a robust, type-safe Page/Component structure.
- **Styling:** CSS Grid, Flexbox, custom Tailwind CSS utility tokens, and a curated HSL design system (`globals.css`).
- **Animations:** Framer Motion spring physics and native CSS keyframes (for performant, hardware-accelerated rotational orbits).
- **Typography:** Google `Inter` (sans-serif) & `JetBrains Mono` (monospace).

---

## 📈 Verification & Quality Assurance
- **Compile Status:** Passed Next.js static page optimization and strict TypeScript type-checking (`npm run build` output is **100% clean**).
- **Flow Verification:** The complete state machine (**Landing Hero → Balanced Bento Grid → Magnetic Analysis Input → Orbital Processing → Results Score HUD**) was verified in a browser subagent session.

---

*The redesign is now fully compiled, deployed, and live at `localhost:3000`.*


---
## Source: project summary quantitative overhaul june23.md

# Prism: Quantitative Overhaul & Vercel Migration
**Date:** June 23, 2026  
**Scope:** Hard Mathematical Architecture, Advanced UI/UX, Serverless Deployment

## 1. The Quantitative Engine (`quant_engine.py`)
We fundamentally shifted Prism from relying purely on LLM "vibes" to executing hard mathematical heuristics. We built a robust, localized Python data science engine capable of automatically parsing structured datasets and calculating:
- **Dimensionality Reduction (PCA):** Extracts hidden principal components and explains variance.
- **Key Driver Analysis (OLS Regression):** Standardized multivariate regression to detect independent variable impact on target metrics.
- **Categorical Dependencies (Chi-Square):** Discovers statistical links between non-numerical categories.
- **Survival Analysis (Kaplan-Meier):** Calculates event-avoidance probabilities over distinct time milestones.
- **Time Series Forecasting (ARIMA):** Projects upcoming intervals based on historical trend data.

## 2. LLM Pipeline Integration
We wired the Python engine directly into the Next.js orchestration layer (`lib/pipeline-local.js`). 
- **Deterministic Math Prompting:** Instead of asking the LLM to guess statistical outcomes, we inject the raw mathematical JSON directly into the LLM context under `[HARD_MATH_HEURISTICS]`. We explicitly instruct the model to use the precise P-values, coefficients, and bounds provided to construct its executive-level narrative.
- **Persona Generation:** Updated the `local-llm.js` prompt schemas to convert dry clusters into actionable "Business Personas" and "Strategic Implications".

## 3. Ultra-Premium Visual Overhaul (`QuantitativeVisuals.tsx`)
We built a $100k-tier financial terminal UI using React and `framer-motion`, focusing on dynamic interactivity and "Apple/Linear" design aesthetics.
- **3D Parallax Tornado Chart:** The Key Drivers panel tracks cursor movement in real-time, tilting the entire component in a 3D perspective space with internal glowing depth.
- **Scrubbable Survival Curve:** Added a precision crosshair scanner to the Kaplan-Meier chart. As the user scrubs across the timeline, a tooltip dynamically interpolates the exact survival probability at that specific pixel.
- **Elastic Force Graph (Chi-Square):** Converted static dependency metrics into draggable, physics-based nodes linked by a glowing dependency beam. We also implemented smart typography truncation to prevent long variable names from overlapping.
- **Magnetic Glass Clusters:** Designed deep-frosted (`backdrop-blur-3xl`) cluster profile cards that feature a subtle, emerald radial "flashlight" glow that perfectly tracks beneath the user's cursor.
- **Graceful Empty States:** Built sleek, informative fallback UI cards (e.g., "Insufficient Variance Detected") for datasets that lack the necessary statistical variance or dependency, ensuring the dashboard layout remains stunning and unbroken.
- **Hotfixes:** Resolved a critical JS truthiness bug where a Chi-Square value of exactly `0` was accidentally evaluated as `falsy`, which previously hid valid statistical panels.

## 4. Vercel Serverless Architecture Migration
To ensure the local Python environment successfully transitions to a cloud-hosted production environment, we engineered a seamless serverless migration.
- **Vercel Python Endpoint (`api/quant.py`):** Wrapped the `quant_engine.py` logic inside a native `BaseHTTPRequestHandler`, converting it into a Vercel-compatible Serverless Function.
- **Infrastructure Config:** Generated `requirements.txt` (`pandas`, `scikit-learn`, `scipy`, etc.) and `vercel.json` with an extended `maxDuration` to prevent timeout failures on complex datasets.
- **Intelligent Routing (`pipeline-local.js`):** Engineered the Node.js backend to be environment-aware. If `process.env.VERCEL` is detected, it securely sends a `fetch()` POST request to the serverless Python endpoint. If run locally via `npm run dev`, it falls back to the lightning-fast `.venv` local execution without breaking the developer workflow.

## Deployment Status
- Code successfully compiled (`npm run build` completed via Turbopack).
- All changes cleanly committed and pushed to `fltydpr23/prism-ai-antigravity`.
- System is prepped and ready for immediate Vercel deployment.


---
## Source: posthog-setup-report.md

<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Prism consumer intelligence platform. Here's a summary of every change made:

**Client initialization** — Created `instrumentation-client.ts` at the project root. This is the Next.js 15.3+ recommended approach: PostHog is initialized once, globally, via the instrumentation file rather than inside a React component. The reverse proxy (`/ingest`) is configured so events route through the app's own domain, making them less likely to be blocked by ad blockers.

**Reverse proxy** — Added three rewrites to `next.config.ts` (`/ingest/static/*`, `/ingest/array/*`, `/ingest/*`) so all PostHog requests and assets are proxied through the Next.js server.

**Provider cleanup** — Removed the `posthog.init()` call from `src/providers/PostHogProvider.tsx` (it was initializing PostHog with the old host and a deprecated `NEXT_PUBLIC_POSTHOG_KEY` variable). The `<PostHogProvider>` wrapper is kept so React hooks remain available. Added a `PostHogIdentify` component that calls `posthog.identify()` with the Clerk user's ID, name, and email whenever a user is authenticated, and `posthog.reset()` on sign-out.

**Server-side client** — Created `lib/posthog-server.ts` with a `getPostHogClient()` factory (using `posthog-node`) for use in API routes. Installed `posthog-node`.

**Environment variables** — Set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` in `.env.local`.

**Client-side events** — Added `posthog.capture()` calls across three client files.

**Server-side events** — Added `posthog.capture()` in `src/app/api/analyse/route.ts` for save success/failure events.

---

## Events instrumented

| Event | Description | File |
|---|---|---|
| `analysis_started` | User clicks "Extract Insights"; includes input type, model, industry, save toggle | `src/app/page.tsx` |
| `analysis_completed` | Analysis succeeds; includes Prism score band, detected industry, save status | `src/app/page.tsx` |
| `analysis_failed` | Analysis returns an error; includes error message | `src/app/page.tsx` |
| `file_uploaded` | User drops or browses a file; includes file type, size (KB), and upload method | `src/app/page.tsx` |
| `example_used` | User clicks an industry chip to auto-fill example text | `src/app/page.tsx` |
| `model_selected` | User picks a different AI model from the preset buttons | `src/app/page.tsx` |
| `industry_selected` | User picks an industry from the dropdown | `src/app/page.tsx` |
| `report_copied` | User copies the markdown report to clipboard | `src/components/PrismResults.tsx` |
| `report_shared` | User copies the shareable report URL; includes whether a saved ID exists | `src/components/PrismResults.tsx` |
| `report_exported_pdf` | User opens the print/PDF view; includes whether an on-demand save was needed | `src/components/PrismResults.tsx` |
| `report_downloaded` | User downloads the raw JSON analysis | `src/components/PrismResults.tsx` |
| `report_viewed` | A saved report is successfully loaded on the report detail page | `src/app/report/[id]/page.tsx` |
| `analysis_saved` | Server-side: analysis persisted to Supabase; includes report ID, industry, text length, model | `src/app/api/analyse/route.ts` |
| `analysis_save_failed` | Server-side: Supabase persistence failed; includes error message | `src/app/api/analyse/route.ts` |

---

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/469174/dashboard/1709380)
- [Analysis Conversion Funnel (wizard)](https://us.posthog.com/project/469174/insights/7ALygDiJ) — funnel from `analysis_started` → `analysis_completed`
- [Daily Active Analysers (wizard)](https://us.posthog.com/project/469174/insights/9JLEuvTR) — unique users running analyses per day
- [Report Engagement Actions (wizard)](https://us.posthog.com/project/469174/insights/4lPYBgNP) — share, PDF export, and JSON download trends
- [Analysis Failure Rate (wizard)](https://us.posthog.com/project/469174/insights/r4ZXWaxq) — `analysis_failed / analysis_started × 100`
- [Analysis Save Rate (wizard)](https://us.posthog.com/project/469174/insights/yfJHEq7c) — `analysis_saved / analysis_started × 100`

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
