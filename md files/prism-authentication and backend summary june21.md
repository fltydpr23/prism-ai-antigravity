# Prism Intelligence: Authentication & Backend Summary
**Date:** June 21, 2026

## Overview
This document summarizes the core architectural changes, backend integrations, and pipeline optimizations implemented today. The primary focus was transitioning from synchronous, limited data analysis to a robust, asynchronous, variant-aware pipeline, alongside implementing a secure notification and deployment framework.

---

## 1. Smart Pipeline Architecture (Variant Detection)
**Problem:** The original data processing pipeline was truncating context or analyzing datasets universally. It failed to differentiate between entities (e.g., treating all hotel reviews as one generic blob rather than comparing specific hotels).
**Solution:**
- We implemented a **Smart Variant Detection** system (`parseCSVHeuristicAsync` in `pipeline-local.js`).
- **LLM-Based Detection:** Added a `SYSTEM_VARIANT_DETECTION` prompt that feeds a snippet of the dataset to the LLM to intelligently identify the main "entity" column (e.g., `Hotel_name` or `Bike_brand`).
- **Statistical Fallback:** If the LLM detection fails, the system executes a mathematical cardinality check across the first 1,000 rows (evaluating unique values vs. total rows) to identify categorical columns.
- **Pipeline Overhaul:** Modified `runPipelineAnalysis` and `runSmallFileAnalysis` to chunk the CSV data dynamically based on these identified variants.
- **Result:** The final overarching synthesis now accurately compares variants head-to-head. For example, in `chennaihotelreviews.csv`, the output successfully contrasted top-performing hotels (e.g., Accord Metropolitan) directly against underperformers (e.g., The Park Chennai) in a highly detailed, honest 3.5s analysis.

## 2. Background Processing (Upstash QStash)
**Problem:** Comprehensive variant analyses take time and threaten to hit serverless function timeouts on Vercel.
**Solution:**
- Transitioned long-running analyses to a background job system using **Upstash QStash**.
- Built a dedicated webhook callback endpoint (`/src/app/api/qstash/analyse/route.ts`).
- **Security:** Integrated `@upstash/qstash` to wrap the webhook with `verifySignatureAppRouter`, ensuring the endpoint cannot be triggered by malicious actors.
- **Build Fixes:** Added an environment check to conditionally apply the signature verification (`process.env.QSTASH_CURRENT_SIGNING_KEY`). This successfully bypasses static evaluation crashes during local Next.js `npm run build` steps while remaining entirely secure in production.

## 3. Identity & Notification System (Clerk + Resend)
**Problem:** Users needed to be notified when their background analysis finished without polling the client UI endlessly.
**Solution:**
- Integrated **Clerk Authentication** into the backend routes. The system pulls the `userId` during the request initiation to verify authentication and fetch the user's registered email address dynamically via `clerkClient`.
- Integrated **Resend** directly into `backgroundTask.ts` and `route.ts`.
- Designed a custom, responsive HTML email template ("Your Prism Intelligence Report is Ready" with a direct "View Full Report →" button).
- **Troubleshooting:** Added explicit `console.log` error catching for Resend to diagnose silent delivery failures (often caused by unverified sender domains like `hello@prismintel.co` on free tiers or missing `userId` during unauthenticated local testing).

## 4. Environment & Security Patches
- Audited the project dependencies and addressed 3 moderate security vulnerabilities.
- Bypassed dangerous automated fixes that would have downgraded `Next.js` 16.2.6 by manually injecting `overrides` for `dompurify` and `postcss` directly into `package.json`.
- Ran a clean `npm install` and verified `npm run build` compiles with zero errors and zero vulnerabilities.

---
### Next Steps / Pending Actions
- Ensure `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, and `QSTASH_NEXT_SIGNING_KEY` are populated in Vercel.
- Ensure `RESEND_API_KEY` is active and the sender domain (`prismintel.co`) is verified via DNS records in the Resend dashboard to allow production email delivery.

## 5. "Split-Brain" Pipeline (Quantitative vs. Qualitative)
**Problem:** The previous architecture was designed strictly for NLP processing on text reviews. When tested with numerical datasets like `gaming academic performance.csv`, the pipeline attempted to run qualitative sentiment heuristics (identifying numerical IDs as variants) and hallucinated qualitative outputs—while taking agonizingly long.
**Solution:** We built a "Split-Brain" processing architecture that dynamically adapts mathematical vs. NLP analysis depending on the dataset. We accomplished this in 5 logical steps:

1. **Modality Detection (`detectModality`):** A new heuristic engine that scans incoming dataset columns to classify the data payload as either `Qualitative` (text-heavy) or `Quantitative` (numerical/metric-heavy).
2. **Statistical Core (`computeStatisticalSummary`):** For quantitative sets, the system now computes a raw mathematical summary—including standard deviations, Pearson correlation coefficients, averages, variance, and out-of-bounds outliers—instead of attempting NLP text deduplication.
3. **API Flagging & Routing:** Updated the Next.js API endpoints (`src/app/api/analyse/route.ts` and background tasks) to persist and cascade the `modality` flag into the `cfg` config object.
4. **Dashboard Conditional UI (`PrismResults.tsx`):** Rewrote the frontend interface to conditionally render entirely distinct UI components. If the data is quantitative, it drops the qualitative sentiment cards and instead maps Key Correlations, Cluster Profiles, and data distribution graphics.
5. **System Prompt Adapting & Variant Bypass:** Introduced a specialized `SYSTEM_FREEFORM_SYNTHESIS_QUANTITATIVE` prompt tuned for Data Scientists. Crucially, we bypassed the LLM Variant Detection logic entirely for numeric datasets, solving an issue where fast-sampled mode was creating a separate LLM call for every individual student row, ensuring analysis is now extremely fast.

## 6. Type & Runtime Fixes
During this pipeline upgrade, we performed essential stability patching to ensure clean Next.js `Turbopack` builds:
- **`cfg` Type Synchronization:** When expanding local LLM API support to include `together` and `openrouter` (with the new `modality` field), we triggered cascading TypeScript mismatches. We executed a codebase-wide sweep in `lib/local-llm.js`, `lib/pipeline.js`, and `lib/pipeline-together.js` to ensure the strict `@param` JSDoc annotations all aligned with the new object structure.
- **`chunkModel` ReferenceError:** Resolved a critical runtime crash in `lib/pipeline-local.js` where variable declarations for model references (`chunkModel`, `synthesisModel`, `structuringModel`) had been omitted in the comprehensive pipeline execution flow.

## 7. Deep Math Engine & Background Processing Fixes
While the "Split-Brain" logic initially worked for fast analyses, testing revealed the Comprehensive Background processing was still falling back to qualitative outputs and hallucinating correlations. We implemented the following massive upgrades to permanently solve this:

- **Background Worker State Fix (`backgroundTask.ts`):** We discovered the Upstash QStash payload was not passing the `modality` flag into the background worker. Because of this, large CSV files defaulted back to treating student grades as "Consumer Feedback." We patched `backgroundTask.ts` to actively invoke `detectModality()` upon awakening, ensuring the Split-Brain logic holds true even in background jobs.
- **Strict Node.js Pearson Correlation Engine (`calcPearson`):** Previously, the LLM was allowed to *guess* correlations based on column headers (e.g., assuming high gaming = low study), leading to false mathematical narratives. We rebuilt `computeStatisticalSummary()` to calculate the exact Pearson correlation coefficient `(r)` between *every* numeric column in Node.js. Now, if the LLM says variables are correlated, it's because Prism mathematically proved it with `|r| >= 0.3`.
- **Chronological / Temporal Trend Analysis:** We added algorithmic logic to scan dataset headers for `date`, `time`, or `year`. When detected, Prism now sorts the entire dataset chronologically and computes exact percentage trend shifts from the first 25% of the timeline to the final 25%, drastically improving the LLM's predictive insights.
- **Data Grounding & Prompt Enforcement:** We updated `SYSTEM_FREEFORM_SYNTHESIS_QUANTITATIVE` to legally force the LLM to report the exact standard deviations and mathematical limits for outliers, preventing vague descriptions. The prompt now also requires the LLM to estimate data cluster populations based entirely on the provided row counts, ensuring mathematically honest reporting.
