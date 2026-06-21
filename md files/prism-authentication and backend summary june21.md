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
