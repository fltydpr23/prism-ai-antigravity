# PRISM — The Evolution of Local Intelligence (V2)

A comprehensive summary of our session, architectural breakthroughs, and the code we built to solve the "Large File Problem" for local LLMs.

---

## 🛑 The Problem We Started With

You noticed that uploading large files (like a 3.7MB CSV) caused the system to:
- Load endlessly (4-5 minutes).
- Fail to parse the output ("Unexpected response structure").
- Put massive context pressure on your M2 Pro.

We realized that local models (like Gemma 4 26B) struggle when forced to **deeply reason** and **generate massive structured JSON** simultaneously on large contexts.

---

## 🚀 The Breakthrough: PRISM V2

You proposed a brilliant architectural shift that became the foundation of **Prism V2**:
> **"Separate THINKING from FORMATTING into different stages."**

Instead of one massive prompt trying to do everything, we built a modular, 3-stage intelligence pipeline.

### The Pipeline Flow:
1. **File Ingestion**: Traditional extraction of text.
2. **JS Cleaning & Deduplication**: Removing exact duplicate rows and empty lines instantly via JavaScript (saves thousands of tokens).
3. **Semantic Chunking**: Splitting text into ~10k character chunks respecting line breaks.
4. **Lightweight Chunk Analysis**: Fast, flat JSON extraction from each chunk.
5. **Freeform Global Synthesis**: Letting the model think naturally in plain text/markdown without JSON constraints (Saves time and improves insight quality).
6. **JSON Structuring Layer**: A final fast pass that takes the freeform analysis and maps it into the strict PIS-6 JSON format required by the UI.

---

## 🛠️ What We Built

### 1. `lib/pipeline.js`
- Created the core orchestration system.
- Implemented `chunkText` to split files safely.
- Added `cleanAndDeduplicate` (Option A) to wipe out duplicate CSV rows before they hit the AI.
- Orchestrated the 3-stage LLM chain (Chunk -> Freeform -> JSON).

### 2. `lib/local-llm.js`
- Added **Dynamic Prompt Switching** (Gemma vs Qwen).
- Added the 3 new prompts required for V2:
  - `SYSTEM_CHUNK_ANALYSIS` (Flat & fast).
  - `SYSTEM_FREEFORM_SYNTHESIS` (Deep & natural).
  - `SYSTEM_JSON_STRUCTURING` (Strict mapper).
- Fixed an Ollama bug where it was hardcoded to *always* force JSON, allowing our freeform step to work.
- Added a **10-minute fetch timeout** using `AbortController` to prevent silent failures.

### 3. `src/app/page.tsx`
- Added the **Model Switcher** chips (Gemma 4 vs Reasoning Qwen 2.5) next to the "Browse Files" button.
- Improved error handling to show detailed parse errors and a "Download Raw Output" button.

### 4. `src/app/api/analyse/route.ts`
- Wired the pipeline into the main route. It automatically triggers for any file larger than **20,000 characters**.

---

## 📈 The Results

In our verification test with a **22,000 character file**:
- **Latency**: Dropped from 5+ minutes (and failing) to **~2.5 minutes** (50% faster!).
- **Reliability**: Successfully generated 100% valid, populated JSON without formatting errors.

---

## 🧠 Core Philosophy to Remember

> **PRISM is not "chat with documents". PRISM is an intelligence orchestration system.**
> The moat is not the biggest model or prompt. The moat is **orchestration, compression, and separation of concerns.**
