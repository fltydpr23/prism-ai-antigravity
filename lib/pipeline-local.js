import { runLocalLlmAnalysis, SYSTEM_CHUNK_ANALYSIS, SYSTEM_FREEFORM_SYNTHESIS, buildIndustryAwareStructuringPrompt } from "./local-llm.js";


const CHUNK_SIZE = 20_000; // target characters per chunk

/**
 * Cleans text by removing duplicate lines and normalizing whitespace.
 * @param {string} text
 * @returns {string}
 */
function cleanAndDeduplicate(text) {
  const lines = text.split("\n");
  const uniqueLines = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      uniqueLines.add(trimmed);
    }
  }

  return Array.from(uniqueLines).join("\n");
}

/**
 * Splits text into chunks, trying to respect line breaks (important for CSVs).
 * @param {string} text
 * @param {number} size
 * @returns {string[]}
 */
function chunkText(text, size = CHUNK_SIZE) {
  const lines = text.split("\n");
  const chunks = [];
  let currentChunk = "";

  for (const line of lines) {
    if ((currentChunk + line).length > size) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = line + "\n";
    } else {
      currentChunk += line + "\n";
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());

  // If we still have huge chunks (e.g. no newlines), fallback to hard split
  if (chunks.length === 1 && chunks[0].length > size * 1.5) {
    const result = [];
    for (let i = 0; i < text.length; i += size) {
      result.push(text.slice(i, i + size));
    }
    return result;
  }

  return chunks;
}

/**
 * Runs the hierarchical analysis pipeline.
 * @param {string} text
 * @param {Record<string, unknown>} structuredMetrics
 * @param {{ baseUrl: string, model: string, api: 'ollama' | 'openai', apiKey: string }} cfg
 */
export async function runPipelineAnalysis(text, structuredMetrics, cfg, industryLensText = "", onProgress = (stage) => {}) {
  onProgress("vector");

  const cleanedText = cleanAndDeduplicate(text);
  const chunks = chunkText(cleanedText);
  console.log(`[Pipeline] Cleaned text reduced size from ${text.length} to ${cleanedText.length} chars.`);
  console.log(`[Pipeline] Split text into ${chunks.length} chunks.`);

  const chunkModel = process.env.LOCAL_LLM_MODEL_CHUNKS || cfg.model;
  const synthesisModel = process.env.LOCAL_LLM_MODEL_SYNTHESIS || cfg.model;
  const structuringModel = process.env.LOCAL_LLM_MODEL_STRUCTURING || cfg.model;
  
  console.log(`[Pipeline] Model mix: Chunks=${chunkModel}, Synthesis=${synthesisModel}, Structuring=${structuringModel}`);

  const chunkSummaries = [];

  // We process sequentially because Ollama on local machine won't handle parallel requests well
  for (let i = 0; i < chunks.length; i++) {
    console.log(`[Pipeline] Analyzing chunk ${i + 1}/${chunks.length} using ${chunkModel}...`);
    const res = await runLocalLlmAnalysis(
      chunks[i],
      {}, // No structured metrics for chunks
      { ...cfg, model: chunkModel },
      SYSTEM_CHUNK_ANALYSIS
    );

    if (res.ok && res.parsed) {
      chunkSummaries.push(res.parsed);
    } else {
      console.warn(`[Pipeline] Failed to analyze chunk ${i + 1}:`, res.parseError || res.error);
      // Fallback: add raw text excerpt if parse failed
      chunkSummaries.push({
        error: "Failed to parse JSON from this chunk",
        raw_excerpt: res.raw ? res.raw.slice(0, 5000) : chunks[i].slice(0, 5000)
      });
    }
  }

  console.log(`[Pipeline] Generating freeform synthesis...`);
  onProgress("transitions");

  // Combine summaries into a single payload for synthesis
  const synthesisPayload = [
    "You are synthesizing multiple chunk analyses into a final report.",
    "Here are the summaries from the chunks of the original dataset:",
    JSON.stringify(chunkSummaries, null, 2),
    "",
    "Now generate the final report based on these summaries. Follow your system instructions exactly."
  ].join("\n");

  const freeformRes = await runLocalLlmAnalysis(
    synthesisPayload,
    {}, // No structured metrics for freeform
    { ...cfg, model: synthesisModel },
    SYSTEM_FREEFORM_SYNTHESIS
  );

  if (!freeformRes.ok) {
    console.error(`[Pipeline] Freeform synthesis failed:`, freeformRes.error);
    return { ok: false, error: `Freeform synthesis failed: ${freeformRes.error}` };
  }

  console.log(`[Pipeline] Freeform Synthesis Output:\n${freeformRes.raw}\n`);

  console.log(`[Pipeline] Structuring synthesis into JSON...`);
  onProgress("interactions");

  const structuringPayload = [
    "Convert the following analysis into structured JSON based on your instructions.",
    "",
    "Analysis:",
    freeformRes.raw || "",
  ].join("\n");

  const structuringPrompt = buildIndustryAwareStructuringPrompt(industryLensText);

  // Call the final analysis with the structuring prompt
  const finalRes = await runLocalLlmAnalysis(
    structuringPayload,
    structuredMetrics, // Pass original metrics here
    { ...cfg, model: structuringModel },
    structuringPrompt
  );

  return finalRes;
}

/**
 * Runs the 2-stage analysis for small files (No chunking).
 * @param {string} text
 * @param {Record<string, unknown>} structuredMetrics
 * @param {{ baseUrl: string, model: string, api: 'ollama' | 'openai', apiKey: string }} cfg
 */
export async function runSmallFileAnalysis(text, structuredMetrics, cfg, industryLensText = "", onProgress = (stage) => {}) {
  onProgress("vector");

  const cleanedText = cleanAndDeduplicate(text);
  
  const synthesisModel = process.env.LOCAL_LLM_MODEL_SYNTHESIS || cfg.model;
  const structuringModel = process.env.LOCAL_LLM_MODEL_STRUCTURING || cfg.model;
  
  console.log(`[Pipeline] Running 2-stage analysis for small file using Synthesis=${synthesisModel}, Structuring=${structuringModel}...`);
  onProgress("transitions");
  
  const freeformRes = await runLocalLlmAnalysis(
    cleanedText,
    {}, // No structured metrics for freeform
    { ...cfg, model: synthesisModel },
    SYSTEM_FREEFORM_SYNTHESIS
  );
  
  if (!freeformRes.ok) {
    return freeformRes;
  }
  
  console.log(`[Pipeline] Structuring synthesis into JSON...`);
  onProgress("interactions");
  
  const structuringPayload = [
    "Convert the following analysis into structured JSON based on your instructions.",
    "",
    "Analysis:",
    freeformRes.raw || "",
  ].join("\n");
  
  const structuringPrompt = buildIndustryAwareStructuringPrompt(industryLensText);

  const finalRes = await runLocalLlmAnalysis(
    structuringPayload,
    structuredMetrics,
    { ...cfg, model: structuringModel },
    structuringPrompt
  );
  
  return finalRes;
}
