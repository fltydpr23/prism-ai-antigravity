import { runLocalLlmAnalysis, SYSTEM_CHUNK_ANALYSIS, SYSTEM_FREEFORM_SYNTHESIS, buildIndustryAwareStructuringPrompt, SYSTEM_VARIANT_DETECTION } from "./local-llm.js";


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
  // Check if it's a CSV with variants
  const csvParsed = await parseCSVHeuristicAsync(text, cfg);
  if (csvParsed && Object.keys(csvParsed.variants).length > 1) {
    return await runVariantAnalysis(csvParsed, text.split(/\r?\n/).length, structuredMetrics, cfg, industryLensText, onProgress);
  }

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
export async function runSmallFileAnalysis(text, structuredMetrics, cfg, industryLensText = "", onProgress = (stage) => {}, skipVariantCheck = false) {
  if (!skipVariantCheck) {
    // Check if it's a CSV or JSON with variants
    const csvParsed = await parseCSVHeuristicAsync(text, cfg);
    if (csvParsed && Object.keys(csvParsed.variants).length > 1) {
      let totalLines = text.split(/\r?\n/).length;
      if (csvParsed.isJson) {
        try {
          const records = JSON.parse(text);
          totalLines = records.length;
        } catch (e) {}
      }
      return await runVariantAnalysis(csvParsed, totalLines, structuredMetrics, cfg, industryLensText, onProgress);
    }
  }

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

// ─── Variant Parsing & Sampling ──────────────────────────────────────────────

function convertJsonToCsv(keys, items) {
  const headerLine = keys.map(k => `"${k.replace(/"/g, '""')}"`).join(",");
  const itemLines = items.map(item => {
    return keys.map(k => {
      const val = String(item[k] !== undefined && item[k] !== null ? item[k] : '');
      return `"${val.replace(/"/g, '""')}"`;
    }).join(",");
  });
  return [headerLine, ...itemLines].join("\n");
}

async function parseCSVHeuristicAsync(text, cfg) {
  // Try JSON first
  if (text.trim().startsWith("[")) {
    try {
      const records = JSON.parse(text);
      if (Array.isArray(records) && records.length > 0 && typeof records[0] === 'object' && records[0] !== null) {
        const keys = Object.keys(records[0]);
        // For JSON, we stick to heuristic for now
        const variantKey = keys.find(k => 
          k.toLowerCase().includes("varient") || 
          k.toLowerCase().includes("variant") || 
          k.toLowerCase().includes("product") ||
          k.toLowerCase().includes("name") ||
          k.toLowerCase().includes("hotel") ||
          k.toLowerCase().includes("restaurant")
        );
        if (variantKey) {
          const variants = {};
          for (const item of records) {
            const v = String(item[variantKey] || '').trim();
            if (v) {
              if (!variants[v]) variants[v] = [];
              variants[v].push(item);
            }
          }
          return { isJson: true, keys, variants };
        }
      }
    } catch (e) {
      console.warn("[Pipeline] parseCSVHeuristic failed to parse JSON:", e);
    }
  }

  // Fallback to standard raw CSV parsing
  const lines = text.split(/\r?\n/);
  if (lines.length < 5) return null;
  const header = lines[0].split(",");
  
  let variantIndex = -1;

  // 1. Smart LLM Detection
  const snippet = lines.slice(0, Math.min(10, lines.length)).join("\n");
  try {
    const chunkModel = process.env.LOCAL_LLM_MODEL_CHUNKS || cfg.model;
    const llmRes = await runLocalLlmAnalysis(
      snippet,
      {},
      { ...cfg, model: chunkModel },
      SYSTEM_VARIANT_DETECTION
    );
    if (llmRes.ok && llmRes.raw) {
      const detectedHeader = llmRes.raw.trim().replace(/^"|"$/g, '');
      if (detectedHeader.toLowerCase() !== "null") {
        variantIndex = header.findIndex(h => h.trim() === detectedHeader);
      }
    }
  } catch (e) {
    console.warn("[Pipeline] Smart LLM variant detection failed:", e);
  }

  // 2. Statistical Fallback
  if (variantIndex === -1) {
    console.log("[Pipeline] Falling back to statistical variant detection...");
    const sampleLines = lines.slice(1, Math.min(1001, lines.length));
    const colStats = header.map((_, i) => ({ index: i, uniqueVals: new Set(), totalVals: 0, isNumeric: true }));

    for (const line of sampleLines) {
      if (!line.trim()) continue;
      let cols = [];
      let curr = "";
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        if (line[c] === '"') inQuotes = !inQuotes;
        else if (line[c] === ',' && !inQuotes) { cols.push(curr); curr = ""; }
        else curr += line[c];
      }
      cols.push(curr);

      for (let i = 0; i < Math.min(3, cols.length); i++) {
        const val = cols[i].replace(/^"|"$/g, '').trim();
        if (val) {
          colStats[i].uniqueVals.add(val);
          colStats[i].totalVals++;
          if (isNaN(Number(val))) {
            colStats[i].isNumeric = false;
          }
        }
      }
    }

    for (let i = 0; i < Math.min(3, colStats.length); i++) {
      const stats = colStats[i];
      if (!stats.isNumeric && stats.uniqueVals.size > 1 && stats.uniqueVals.size <= stats.totalVals * 0.4) {
        variantIndex = i;
        console.log(`[Pipeline] Statistical detection selected column: ${header[i]}`);
        break;
      }
    }
  }
  
  if (variantIndex === -1) return null;

  const variants = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    let cols = [];
    let curr = "";
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') inQuotes = !inQuotes;
      else if (line[c] === ',' && !inQuotes) { cols.push(curr); curr = ""; }
      else curr += line[c];
    }
    cols.push(curr);
    
    if (cols.length > variantIndex) {
      const v = cols[variantIndex].replace(/^"|"$/g, '').trim();
      if (v) {
        if (!variants[v]) variants[v] = [];
        variants[v].push(line);
      }
    }
  }
  return { isJson: false, header: lines[0], variants };
}

async function runVariantAnalysis(csvParsed, totalLines, structuredMetrics, cfg, industryLensText, onProgress) {
  const { header, variants, isJson, keys } = csvParsed;
  
  const isBackground = cfg.mode === "background";
  const limitVariants = isBackground ? Math.min(50, Object.keys(variants).length) : Math.min(10, Object.keys(variants).length);
  const sampleLimit = isBackground ? 50 : 20;

  // Sort variants by review count
  const sortedVariants = Object.entries(variants)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, limitVariants);
    
  console.log(`[Pipeline] Detected CSV/JSON with ${Object.keys(variants).length} variants. Analyzing top ${sortedVariants.length} in mode: ${cfg.mode || 'standard'}...`);
  
  const structuringModel = process.env.LOCAL_LLM_MODEL_STRUCTURING || cfg.model;
  let analyzedRows = 0;
  const variantReports = {};
  const variantSummariesForOverall = [];

  const BATCH_SIZE = 5;
  
  for (let i = 0; i < sortedVariants.length; i += BATCH_SIZE) {
    const batch = sortedVariants.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async ([varName, linesOrItems]) => {
      const sampleSize = Math.min(sampleLimit, linesOrItems.length);
      const sampled = [...linesOrItems].sort(() => 0.5 - Math.random()).slice(0, sampleSize);
      
      let variantText = "";
      if (isJson) {
        variantText = convertJsonToCsv(keys, sampled);
      } else {
        variantText = [header, ...sampled].join("\n");
      }
      console.log(`[Pipeline] Analyzing variant: ${varName} (${sampleSize} rows)`);
      
      const res = await runSmallFileAnalysis(
        variantText, 
        {}, // no top-level metrics for individual variants
        cfg, 
        industryLensText, 
        () => {}, // silence sub-progress
        true // skipVariantCheck
      );
      
      return { varName, sampleSize, res };
    });

    const batchResults = await Promise.all(batchPromises);
    
    for (const result of batchResults) {
      const { varName, sampleSize, res } = result;
      analyzedRows += sampleSize;
      
      if (res.ok && res.parsed) {
        variantReports[varName] = res.parsed;
        variantSummariesForOverall.push(`Variant: ${varName}\nSummary: ${res.parsed.executive_summary}\n`);
      }
    }
    
    // Update live stream with progress pill after each batch
    onProgress(`Analyzed ${analyzedRows.toLocaleString()} / ${totalLines.toLocaleString()} reviews across ${i + batch.length} variants`);
  }
  
  onProgress("transitions");
  console.log(`[Pipeline] Generating overarching summary for all variants...`);
  
  const overarchingPayload = [
    "You are synthesizing multiple product variant analyses into an overarching market intelligence report.",
    "Compare and contrast the variants. Identify which are performing best and worst.",
    "Here are the summaries:",
    variantSummariesForOverall.join("\n\n"),
    "",
    "Now generate the final overarching report."
  ].join("\n");
  
  const overarchingFreeform = await runLocalLlmAnalysis(
    overarchingPayload,
    {},
    { ...cfg, model: structuringModel },
    SYSTEM_FREEFORM_SYNTHESIS
  );
  
  onProgress("interactions");
  
  const structuringPrompt = buildIndustryAwareStructuringPrompt(industryLensText);
  const structuringPayload = [
    "Convert the following overarching analysis into structured JSON.",
    "Analysis:",
    overarchingFreeform.raw || "",
  ].join("\n");
  
  const finalRes = await runLocalLlmAnalysis(
    structuringPayload,
    structuredMetrics,
    { ...cfg, model: structuringModel },
    structuringPrompt
  );
  
  if (finalRes.ok && finalRes.parsed) {
    finalRes.parsed.variants = variantReports;
    // Add coverage stats
    finalRes.parsed.coverage = {
      total_variants_in_dataset: Object.keys(variants).length,
      variants_analyzed: sortedVariants.length,
      total_rows_in_dataset: totalLines,
      rows_analyzed: analyzedRows,
      is_sampled: true,
      mode_used: isBackground ? "comprehensive_background" : "fast_parallel_sampled"
    };
  }
  
  return finalRes;
}
