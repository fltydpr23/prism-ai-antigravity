# Prism Data Analysis Architecture — Project Summary (June 26th)

## 1. Cloud-Native Architecture & Deployment
We began the session by hardening the Prism architecture for production. We ensured the entire data pipeline was robust enough to be deployed seamlessly to GitHub and Vercel. 
- **Model Upgrades**: We integrated `intfloat/multilingual-e5-large-instruct` for superior semantic clustering and upgraded the main reasoning engine to `Meta-Llama-3.3-70B-Instruct-Turbo`.
- **Quantitative & Qualitative Synergy**: We successfully validated Prism's ability to analyze both qualitative datasets (`in_swiggy_android_playstore.csv`) and heavily quantitative datasets (`telcocustomerchurn.csv`). Prism successfully executed complex statistical analyses (Kaplan-Meier survival curves, Pearson correlations, K-Means clustering) in tandem with semantic clustering.

## 2. The Enterprise Survey Challenge
We analyzed a highly complex dataset provided by a ZoomRx employee (`zoomrxresponsesheet.csv`). We quickly discovered a "blind spot" in the data pipeline:
- Enterprise surveys contain multi-header rows consisting of empty columns, internal variable codes (e.g., `S1Z`, `EQ_ROLE`), and deep metadata *before* the actual human-readable questions.
- Feeding this raw schema to an LLM causes severe hallucinations and token waste, as the model struggles to map the variable codes to the actual questions.

## 3. The "Schema Sniffer" Solution (Option 3)
Instead of forcing every dataset through a heavy pre-processor, we brainstormed and aligned on "Option 3": an elegant auto-detect system with a manual override capability.

### Frontend Implementation (`src/app/analyse/page.tsx`)
- Engineered a lightweight client-side parser that instantly reads the first 10KB of any dropped CSV file.
- Designed heuristic logic to detect enterprise survey markers (e.g., `VENDOR_CONSENT`, sparse upper rows, deep variable arrays).
- **Premium UI**: Injected a sleek, glassmorphic UI badge directly into the upload card that instantly flashes **`✨ Detected: Enterprise Survey`** or **`📊 Detected: Standard Dataset`**.
- Added a polished dropdown allowing the user to manually override the detected schema if necessary.

### Backend Routing (`src/app/api/analyse/route.ts`)
- Modified the API payload to seamlessly pass the `schema` parameter (`"standard"` or `"survey"`) down the chain through to the QStash background job and local execution layers.

### Data Pre-Processing (`lib/pipeline-local.js`)
- **Initial Attempt**: Created a Python script (`scripts/survey_preprocessor.py`) and a Vercel API route (`api/preprocessor/route.ts`) to handle the flattening of the CSV.
- **The Vercel 99% Hang**: After deploying to Vercel, we discovered a fatal serverless networking issue where the pipeline would hang at "DATA EXTRACTION 99%". This was caused by the Vercel serverless function attempting a "loopback" HTTP fetch to itself.
- **The Hotfix**: We ripped out the Python and HTTP dependencies and rewrote the entire CSV flattening logic natively in JavaScript, baking it directly into `lib/pipeline-local.js`. 
- **Result**: The pipeline now parses the file perfectly in-memory. It merges the metadata headers, extracts the human-readable questions as the primary column headers, and discards all internal variable codes before execution.

## 4. Final Output & Insights
By resolving the schema complexity before it hit the LLM, the output for `prism-analysis-zoomrx.json` was phenomenal. Prism operated at the level of a senior McKinsey/Deloitte data analyst, successfully extracting:
- **Psychographic Segments**: Beautifully identified segments like "The Frustrated Patient" and "The Dissatisfied Dermatologist".
- **Behavioral Contradictions**: Highlighted massive disparities between *what doctors say* (e.g., "Topicals are sufficient") and *what they actually prescribe* (resorting to oral systemic therapies).

## 5. Deployment Status
All code was committed and pushed to the `main` branch. The codebase is currently fully operational, lightning-fast, and deeply resistant to Vercel timeout errors.
