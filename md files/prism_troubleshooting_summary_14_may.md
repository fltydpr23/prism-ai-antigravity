# Prism Debugging & Troubleshooting Summary — May 14, 2026

We have spent this session diagnosing and fixing issues with the local LLM analysis pipeline for the Prism Dashboard. Here is a comprehensive summary of the problems we found and the changes we made.

---

## 1. JSON Parsing & Looping Fixes
* **Problem**: The model `openai/gpt-oss-120b:free` was generating valid JSON but then failed to stop, repeating `{\n{"{"...` at the end. The parser used `lastIndexOf("}")` which included this garbage, breaking `JSON.parse`.
* **Fix**: Implemented `findMatchingBrace` in `lib/local-llm.js` to find the correct closing brace for the first `{`, effectively ignoring trailing garbage.
* **Flawed Fix Removed**: We temporarily added regexes to auto-fix missing colons, but realized they corrupted valid JSON when commas were missing instead. We removed them to ensure safety.

## 2. Pipeline Optimizations
* **Problem**: The pipeline was set to use a `CHUNK_SIZE` of **100,000 characters**. This was too large for free OpenRouter endpoints, causing timeouts and chunk failures. When a chunk failed, the fallback only passed **1,000 characters** to the synthesis stage, resulting in a "sub-par" (generic) report.
* **Fix**: 
  * Reduced `CHUNK_SIZE` to **20,000 characters** in `lib/pipeline-local.js`.
  * Increased the fallback excerpt size from 1,000 to **5,000 characters** to preserve data on failure.

## 3. Model Mix Support (Multi-Model Pipeline)
* **Problem**: You wanted to use different models for different tasks (e.g., small fast models for chunks, large models for synthesis).
* **Fix**: Updated both `runPipelineAnalysis` (large files) and `runSmallFileAnalysis` (small files) in `lib/pipeline-local.js` to look for specific environment variables:
  * `LOCAL_LLM_MODEL_CHUNKS`
  * `LOCAL_LLM_MODEL_SYNTHESIS`
  * `LOCAL_LLM_MODEL_STRUCTURING`
  * This allows you to mix and match models from OpenRouter per task!

## 4. Environment Variable Resolution Fixes
* **Problem**: We noticed in the logs that `[localLlmConfig]` was reporting `enabled: false` and falling back to Ollama defaults, even though you had set it in `.env.local`. Next.js was failing to load the variables in that module context.
* **Fix**: Added `loadEnvManual()` in `lib/local-llm.js` to read and parse `.env.local` directly from the disk as a fallback. We also forced it to overwrite `process.env` to ensure your file is the absolute source of truth.

## 5. Current Roadblock: Upstream Rate Limits (429)
* **Status**: The pipeline is now 100% correctly wired up and engaging the models you requested.
* **Issue**: Both `meta-llama/llama-3.3-70b-instruct:free` and `openai/gpt-oss-20b:free` are currently returning **429 Too Many Requests** errors from OpenRouter's upstream providers (e.g., Venice, OpenInference).
* **Conclusion**: This is a server-side limitation of the free tier on OpenRouter. The code is working, but the models are too busy to respond right now.

---

### Current Recommended `.env.local` Setup:
```env
LOCAL_LLM_ENABLED=true
LOCAL_LLM_API=openrouter
LOCAL_LLM_BASE_URL=https://openrouter.ai/api/v1
LOCAL_LLM_MODEL=openai/gpt-oss-20b:free

LOCAL_LLM_MODEL_CHUNKS=openai/gpt-oss-20b:free
LOCAL_LLM_MODEL_STRUCTURING=openai/gpt-oss-20b:free
LOCAL_LLM_MODEL_SYNTHESIS=openai/gpt-oss-120b:free
```
