# Prism: Together AI Migration & LLM Strategy Summary
**Date:** June 9th - 10th, 2026

## Overview
During this session, we focused entirely on migrating the Prism intelligence platform's AI processing backend from OpenRouter to the **Together AI API**. Our primary goal was to optimize for cost-efficiency, speed, and reliability, allowing the system to run thousands of consumer reports for under $8 without sacrificing reasoning capabilities.

## Achievements & Technical Updates

### 1. Backend Integration for Together AI
We modified the core local LLM router (`lib/local-llm.js`) to officially support the Together API:
- Added `"together"` as a native recognized `LOCAL_LLM_API` provider.
- Automatically mapped the `LOCAL_LLM_BASE_URL` to `https://api.together.xyz/v1` when the Together API is selected.
- Configured the system to look for `TOGETHER_API_KEY` in the environment variables, falling back gracefully if needed.

### 2. Multi-Model Architecture Clarification
We reviewed how Prism structures its AI workloads into three distinct tasks:
1. **Data Structuring / Cleaning** (`SYSTEM_JSON_STRUCTURING`)
2. **Chunk Analysis / Processing** (`SYSTEM_CHUNK_ANALYSIS`)
3. **Final Report Synthesis** (`SYSTEM_FREEFORM_SYNTHESIS`)

While Prism supports overriding models per task (via `LOCAL_LLM_MODEL_CHUNKS`, `LOCAL_LLM_MODEL_STRUCTURING`, `LOCAL_LLM_MODEL_SYNTHESIS`), we determined that for current cost and simplicity goals, utilizing **one highly capable model** as the default (`LOCAL_LLM_MODEL`) is the best approach. The chosen model seamlessly wears all three hats.

### 3. Model Recommendations & Cost Strategy
To achieve the goal of running ~2,000 reports for under $8 (averaging $0.004 per report / ~10k tokens), we identified the best sub-10B parameter models available on Together AI's serverless endpoints that cost around $0.15 - $0.20 per 1M tokens:
- **Meta Llama 3 8B Chat (`meta-llama/Llama-3-8b-chat-hf`)**: The primary recommendation. Extremely fast, highly capable of reasoning and JSON structuring, and widely available.
- **Qwen 2.5 7B Instruct (`Qwen/Qwen2.5-7B-Instruct-Turbo`)**: The best backup option, specifically exceptional at strict instruction following and structured JSON data tasks.
- **Gemma 2 9B Instruct (`google/gemma-2-9b-it`)**: A slightly larger alternative that excels in human-like writing for the final synthesis stage.

### 4. Troubleshooting & Serverless Endpoints
We encountered an issue where Together AI threw a `400 Bad Request: model_not_available` error when attempting to use the string `meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo`. 
- **Cause:** Together AI flagged that specific string as a "dedicated" non-serverless model that required renting a specific GPU instance.
- **Resolution:** Switched the `.env.local` configuration to use the guaranteed serverless endpoint string: `meta-llama/Llama-3-8b-chat-hf`. This immediately resolved the issue while maintaining the desired performance.

## Current Environment Configuration
The `.env.local` is now configured for optimal Together AI usage:
```env
LOCAL_LLM_ENABLED=true
LOCAL_LLM_API=together
# LOCAL_LLM_BASE_URL is no longer strictly required due to backend updates
LOCAL_LLM_MODEL=meta-llama/Llama-3-8b-chat-hf
TOGETHER_API_KEY=your_together_api_key_here
```
*(Any legacy OpenRouter overrides like `LOCAL_LLM_MODEL_CHUNKS` were either removed or updated to match the Llama 3 string to prevent routing failures).*

## Next Steps
With the backend now fluidly integrated with Together AI's cost-efficient models, Prism is successfully positioned to handle massive scale data ingestion and report generation. The next phase can focus on implementing the live streaming functionality.
