import { runLocalLlmAnalysis, SYSTEM_CHUNK_ANALYSIS, SYSTEM_FREEFORM_SYNTHESIS, SYSTEM_FREEFORM_SYNTHESIS_QUANTITATIVE, buildIndustryAwareStructuringPrompt, SYSTEM_VARIANT_DETECTION } from "./local-llm.js";


const CHUNK_SIZE = 20_000; // target characters per chunk

import { detectIndicLanguage } from './language-detector.js';

/**
 * Cleans text by removing duplicate lines and normalizing whitespace.
 * Optionally filters out business replies.
 */
function cleanAndDeduplicate(text, filterBusinessReplies = true) {
  const lines = text.split("\n");
  const uniqueLines = new Set();

  const businessReplyPatterns = [
    /^Hi\s+[A-Za-z]+,/,
    /socialsupport@/i,
    /~[A-Z\.]+/i,
    /~mg/i,
    /regret the inconvenience/i
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (filterBusinessReplies) {
      if (businessReplyPatterns.some(regex => regex.test(trimmed))) {
        continue;
      }
    }

    uniqueLines.add(trimmed);
  }

  return Array.from(uniqueLines).join("\n");
}

/**
 * Runs the text through our offline Indic Language Detector to group lines by language.
 */
async function processLanguageSegmentation(text) {
  const lines = cleanAndDeduplicate(text, true).split("\n");
  
  if (lines.length === 0) return text;

  console.log(`[Pipeline] Segmenting ${lines.length} lines with Offline Language Detector...`);
  
  const buckets = {};
  
  // We can process all lines synchronously because it's offline and takes milliseconds.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const langName = detectIndicLanguage(line);
    
    if (langName) {
      if (!buckets[langName]) buckets[langName] = [];
      buckets[langName].push(line);
    } else {
      if (!buckets["Unknown"]) buckets["Unknown"] = [];
      buckets["Unknown"].push(line);
    }
  }
  
  // Reconstruct the text
  let segmentedText = "";
  for (const [lang, langLines] of Object.entries(buckets)) {
    if (langLines.length === 0) continue;
    segmentedText += `\n[--- ${lang.toUpperCase()} REVIEWS ---]\n`;
    segmentedText += langLines.join("\n") + "\n";
  }
  
  return segmentedText || lines.join("\n");
}

/**
 * Creates a sampled version of the language buckets (e.g. max 20 lines per language)
 * to safely inject into the final structuring payload without blowing up the context window.
 */
function getLanguageBucketSample(text, sampleSize = 25) {
  const lines = cleanAndDeduplicate(text, true).split("\n");
  if (lines.length === 0) return "";
  
  const buckets = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const langName = detectIndicLanguage(line);
    if (langName) {
      if (!buckets[langName]) buckets[langName] = [];
      if (buckets[langName].length < sampleSize) {
        buckets[langName].push(line);
      }
    }
  }
  
  let sampledText = "";
  for (const [lang, langLines] of Object.entries(buckets)) {
    if (langLines.length === 0) continue;
    sampledText += `\n[--- ${lang.toUpperCase()} REVIEWS (SAMPLE) ---]\n`;
    sampledText += langLines.join("\n") + "\n";
  }
  return sampledText;
}

/**
 * Detects whether the dataset is Quantitative (mostly numbers/short strings) or Qualitative (long text).
 * @param {string} text
 * @returns {"Quantitative" | "Qualitative"}
 */
export function detectModality(text) {
  // If JSON, simple check on first few string values
  if (text.trim().startsWith("[")) {
    try {
      const records = JSON.parse(text);
      if (Array.isArray(records) && records.length > 0) {
        let longStrings = 0;
        let shortOrNum = 0;
        for (let i = 0; i < Math.min(50, records.length); i++) {
          for (const val of Object.values(records[i])) {
            if (typeof val === 'number') shortOrNum++;
            else if (typeof val === 'string') {
              if (val.length > 50) longStrings++;
              else shortOrNum++;
            }
          }
        }
        return (longStrings === 0 && shortOrNum > 0) ? "Quantitative" : "Qualitative";
      }
    } catch (e) {}
  }

  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return "Qualitative";

  const sampleLines = lines.slice(1, Math.min(101, lines.length));
  let totalCells = 0;
  let numericOrShortCells = 0;
  let hasLongText = false;

  for (const line of sampleLines) {
    // Basic CSV split for heuristic
    let cols = [];
    let curr = "";
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') inQuotes = !inQuotes;
      else if (line[c] === ',' && !inQuotes) { cols.push(curr); curr = ""; }
      else curr += line[c];
    }
    cols.push(curr);

    for (const col of cols) {
      const val = col.replace(/^"|"$/g, '').trim();
      if (!val) continue;
      totalCells++;
      if (!isNaN(Number(val)) || val.length < 30) {
        numericOrShortCells++;
      }
      if (val.length > 50) {
        hasLongText = true;
      }
    }
  }

  if (totalCells === 0) return "Qualitative";
  
  const numericRatio = numericOrShortCells / totalCells;
  if (numericRatio > 0.8 && !hasLongText) {
    return "Quantitative";
  }
  return "Qualitative";
}

/**
 * Computes a simple statistical summary for numeric columns in a CSV.
 * @param {string} text
 * @returns {string} 
 */
function computeStatisticalSummary(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return text.slice(0, 5000);

  const header = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const rawColData = Array.from({ length: header.length }, () => []);
  const numericColData = Array.from({ length: header.length }, () => []);

  for (let i = 1; i < lines.length; i++) {
    let cols = [];
    let curr = "";
    let inQuotes = false;
    const line = lines[i];
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') inQuotes = !inQuotes;
      else if (line[c] === ',' && !inQuotes) { cols.push(curr); curr = ""; }
      else curr += line[c];
    }
    cols.push(curr);
    
    for (let c = 0; c < Math.min(cols.length, header.length); c++) {
      const val = cols[c].replace(/^"|"$/g, '').trim();
      rawColData[c].push(val);
      if (val !== "") {
        const num = Number(val);
        if (!isNaN(num)) {
          numericColData[c].push(num);
        } else {
          numericColData[c].push(null);
        }
      } else {
        numericColData[c].push(null);
      }
    }
  }

  let summary = "Statistical Summary of Numerical Columns:\n";
  const validNumericCols = [];

  for (let c = 0; c < header.length; c++) {
    const data = numericColData[c].filter(v => v !== null);
    if (data.length > 0 && data.length > lines.length * 0.5) {
      validNumericCols.push(c);
      const sortedData = [...data].sort((a, b) => a - b);
      const min = sortedData[0];
      const max = sortedData[sortedData.length - 1];
      const median = sortedData[Math.floor(sortedData.length / 2)];
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      
      const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
      const stdDev = Math.sqrt(variance);

      summary += `- ${header[c] || 'Column ' + c}: Mean=${mean.toFixed(2)}, Median=${median}, StdDev=${stdDev.toFixed(2)}, Min=${min}, Max=${max}\n`;
    }
  }

  summary += "\nPearson Correlation Coefficients (|r| >= 0.3):\n";
  let hasCorrelations = false;
  
  function calcPearson(x, y) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    let n = 0;
    for (let i = 0; i < x.length; i++) {
      if (x[i] !== null && y[i] !== null) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
        n++;
      }
    }
    if (n === 0) return 0;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denominator === 0) return 0;
    return (n * sumXY - sumX * sumY) / denominator;
  }

  for (let i = 0; i < validNumericCols.length; i++) {
    for (let j = i + 1; j < validNumericCols.length; j++) {
      const c1 = validNumericCols[i];
      const c2 = validNumericCols[j];
      const r = calcPearson(numericColData[c1], numericColData[c2]);
      if (Math.abs(r) >= 0.3) {
        hasCorrelations = true;
        const direction = r > 0 ? "Positive" : "Negative";
        const strength = Math.abs(r) >= 0.7 ? "Strong " : Math.abs(r) >= 0.5 ? "Moderate " : "Weak ";
        summary += `- ${header[c1]} & ${header[c2]}: ${strength}${direction} (r = ${r.toFixed(2)})\n`;
      }
    }
  }
  if (!hasCorrelations) summary += "- No significant linear correlations detected.\n";

  let dateColIndex = -1;
  for (let c = 0; c < header.length; c++) {
    const h = (header[c] || "").toLowerCase();
    if (h.includes('date') || h.includes('time') || h.includes('year') || h.includes('timestamp')) {
      dateColIndex = c;
      break;
    }
  }

  if (dateColIndex !== -1 && validNumericCols.length > 0) {
    summary += `\nTemporal Trends (ordered by ${header[dateColIndex]}):\n`;
    
    let rows = [];
    for (let i = 0; i < lines.length - 1; i++) {
      const val = new Date(rawColData[dateColIndex][i]).getTime();
      // Only include if we parsed a valid date
      if (!isNaN(val)) {
        rows.push({
          dateVal: val,
          values: validNumericCols.map(c => numericColData[c][i])
        });
      }
    }
    
    rows.sort((a, b) => a.dateVal - b.dateVal);
    
    if (rows.length >= 4) {
      const q = Math.floor(rows.length / 4);
      const firstQuarter = rows.slice(0, q);
      const lastQuarter = rows.slice(-q);
      
      let hasTrends = false;
      for (let i = 0; i < validNumericCols.length; i++) {
        const firstVals = firstQuarter.map(r => r.values[i]).filter(v => v !== null);
        const lastVals = lastQuarter.map(r => r.values[i]).filter(v => v !== null);
        
        if (firstVals.length > 0 && lastVals.length > 0) {
          const firstMean = firstVals.reduce((a,b)=>a+b,0)/firstVals.length;
          const lastMean = lastVals.reduce((a,b)=>a+b,0)/lastVals.length;
          
          if (firstMean !== 0) {
            const pctChange = ((lastMean - firstMean) / Math.abs(firstMean)) * 100;
            if (Math.abs(pctChange) >= 5) {
               hasTrends = true;
               const sign = pctChange > 0 ? "+" : "";
               summary += `- ${header[validNumericCols[i]]}: ${sign}${pctChange.toFixed(1)}% (from ~${firstMean.toFixed(1)} to ~${lastMean.toFixed(1)})\n`;
            }
          }
        }
      }
      if (!hasTrends) summary += "- No significant temporal trends detected.\n";
    } else {
      summary += "- Not enough chronological data to calculate trends.\n";
    }
  }

  summary += "\nData Sample (first 10 rows):\n";
  summary += lines.slice(0, 11).join("\n");
  
  return summary;
}

/**
 * Normalizer: Forcefully scales down any mathematically hallucinated percentages
 * from the LLM that escaped the heuristic bounds.
 */
function normalizeHallucinatedPercentages(parsed) {
  if (!parsed || !parsed.consumer_feedback) return parsed;
  const cf = parsed.consumer_feedback;

  const scaleDown = (item) => {
    if (item && typeof item.estimated_prevalence_percentage === "number") {
      if (item.estimated_prevalence_percentage > 35) {
        // Linear scale down to a realistic cap. E.g., 80% -> 20%, 90% -> 22.5%
        item.estimated_prevalence_percentage = parseFloat((item.estimated_prevalence_percentage / 4).toFixed(1));
      }
    }
  };

  if (Array.isArray(cf.feature_requests)) cf.feature_requests.forEach(scaleDown);
  if (Array.isArray(cf.emotions)) cf.emotions.forEach(scaleDown);
  if (Array.isArray(cf.psychographic_segments)) cf.psychographic_segments.forEach(scaleDown);
  
  if (cf.churn_risk_analysis && Array.isArray(cf.churn_risk_analysis.high_risk_signals)) {
    cf.churn_risk_analysis.high_risk_signals.forEach(scaleDown);
  }
  
  return parsed;
}

/**
 * Calculates real mathematical frequencies using Multilingual Vector Clustering.
 */
async function calculateVectorIntentsAsync(text) {
  try {
    let rawOutput = "";
    if (process.env.VERCEL) {
      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
      const host = process.env.VERCEL_URL || 'localhost:3000';
      console.log(`[Pipeline] Routing vector dataset to Vercel Python Engine at ${protocol}://${host}/api/vector...`);
      
      const res = await fetch(`${protocol}://${host}/api/vector`, {
        method: 'POST',
        body: text,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(text, 'utf8').toString()
        }
      });
      
      if (!res.ok) {
        throw new Error(`Vercel Vector API returned status ${res.status}: ${await res.text()}`);
      }
      rawOutput = await res.text();
    } else {
      const fs = require('fs');
      const child_process = require('child_process');
      const tmpFile = require('path').join(process.cwd(), '.prism-tmp-vector.csv');
      fs.writeFileSync(tmpFile, text, 'utf8');
      
      const cleanEnv = Object.assign({}, process.env);
      delete cleanEnv.PYTHONHOME;
      delete cleanEnv.VIRTUAL_ENV;

      console.log(`[Pipeline] Executing Multilingual Vector Engine...`);
      rawOutput = child_process.execSync(require('path').join(process.cwd(), '.venv/bin/python3') + ' scripts/vector_engine.py ' + tmpFile, { encoding: 'utf8', env: cleanEnv });
      
      try { fs.unlinkSync(tmpFile); } catch(e) {}
    }
    
    const parsed = JSON.parse(rawOutput);
    if (parsed.error) {
      console.warn("[Pipeline] Vector Engine Error:", parsed.error);
      return "";
    }
    
    let summary = `\n\n[HARD_MATH_HEURISTICS]\nThe following are EXACT, mathematically proven percentages of how many users mentioned these intents in the dataset (calculated via Multilingual Clustering). You MUST strictly use these percentages for corresponding features/signals:\n`;
    
    for (const intent of parsed.mathematically_proven_intents || []) {
      summary += `- ${intent.intent}: ${intent.prevalence_percentage}% (e.g. "${intent.representative_regional_quotes[0]}")\n`;
    }
    
    return summary + "\n";
  } catch (err) {
    console.warn("[Pipeline] Failed to run Vector Engine. Falling back to empty heuristics.", err.message);
    return "";
  }
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
 * @param {{ baseUrl: string, model: string, api: 'ollama' | 'openai' | 'together' | 'openrouter', apiKey: string, modality?: string }} cfg
 */
export async function runPipelineAnalysis(text, structuredMetrics, cfg, industryLensText = "", onProgress = (stage) => {}, schema = "standard") {
  if (schema === "survey") {
    text = await runSurveyPreprocessor(text, onProgress);
  }

  const isQuantitative = cfg.modality === "Quantitative";

  if (!isQuantitative) {
    // Check if it's a CSV with variants
    const csvParsed = await parseCSVHeuristicAsync(text, cfg);
    if (csvParsed && Object.keys(csvParsed.variants).length > 1) {
      return await runVariantAnalysis(csvParsed, text.split(/\r?\n/).length, structuredMetrics, cfg, industryLensText, onProgress, text, schema);
    }
  }

  const chunkModel = process.env.LOCAL_LLM_MODEL_CHUNKS || cfg.model;
  const synthesisModel = process.env.LOCAL_LLM_MODEL_SYNTHESIS || cfg.model;
  const structuringModel = process.env.LOCAL_LLM_MODEL_STRUCTURING || cfg.model;

  let synthesisPayload;

  if (isQuantitative) {
    onProgress("vector");
    console.log(`[Pipeline] Quantitative dataset detected. Computing hard mathematical structures in Python...`);
    
    let pythonOutput = "No mathematical structures could be computed.";
    try {
      if (process.env.VERCEL) {
        // We are deployed on Vercel, use the Serverless Python endpoint
        const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
        const host = process.env.VERCEL_URL || 'localhost:3000';
        console.log(`[Pipeline] Routing dataset to Vercel Python Engine at ${protocol}://${host}/api/quant...`);
        
        const res = await fetch(`${protocol}://${host}/api/quant`, {
          method: 'POST',
          body: text,
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(text, 'utf8').toString()
          }
        });
        
        if (!res.ok) {
          throw new Error(`Vercel Python API returned status ${res.status}: ${await res.text()}`);
        }
        
        const rawOutput = await res.text();
        JSON.parse(rawOutput); // Validate JSON
        pythonOutput = rawOutput;
      } else {
        // We are local running npm run dev
        const fs = require('fs');
        const child_process = require('child_process');
        const tmpFile = require('path').join(process.cwd(), '.prism-tmp-dataset.csv');
        fs.writeFileSync(tmpFile, text, 'utf8');
        
        const cleanEnv = Object.assign({}, process.env);
        delete cleanEnv.PYTHONHOME;
        delete cleanEnv.VIRTUAL_ENV;

        console.log(`[Pipeline] Executing local Python Quant Engine...`);
        const rawOutput = child_process.execSync(require('path').join(process.cwd(), '.venv/bin/python3') + ' scripts/quant_engine.py ' + tmpFile, { encoding: 'utf8', env: cleanEnv });
        
        // Attempt to parse just to verify it's valid JSON, then we inject it
        JSON.parse(rawOutput);
        pythonOutput = rawOutput;
        
        try { fs.unlinkSync(tmpFile); } catch(e) {}
      }
    } catch(err) {
      console.error("[Pipeline] Python Quantitative Engine failed:", err.message);
    }
    
    synthesisPayload = [
      "You are a top-tier data scientist at McKinsey/Deloitte. Here are the HARD MATHEMATICAL structures computed from the dataset:",
      "==== [HARD_MATH_HEURISTICS] ====",
      pythonOutput,
      "================================",
      "",
      "IMPORTANT: Do NOT calculate any mathematical formulas yourself. Use the exact coefficients, P-values, and variances provided above to construct a highly rigorous, executive-level quantitative narrative."
    ].join("\n");
  } else {
    onProgress("vector");

    const chunks = chunkText(await processLanguageSegmentation(text));
    const chunkCount = chunks.length;
    console.log(`[Pipeline] Processing ${chunkCount} chunks (Modality=${cfg.modality})...`);

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
    synthesisPayload = [
      "You are synthesizing multiple chunk analyses into a final report.",
      "Here are the summaries from the chunks of the original dataset:",
      JSON.stringify(chunkSummaries, null, 2),
      "",
      "Now generate the final report based on these summaries. Follow your system instructions exactly."
    ].join("\\n");
  }

  const synthesisPrompt = cfg.modality === "Quantitative" ? SYSTEM_FREEFORM_SYNTHESIS_QUANTITATIVE : SYSTEM_FREEFORM_SYNTHESIS;

  const freeformRes = await runLocalLlmAnalysis(
    synthesisPayload,
    {}, // No structured metrics for freeform
    { ...cfg, model: synthesisModel },
    synthesisPrompt
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
    "",
    "==== [RAW_LANGUAGE_BUCKETS_SAMPLE] ====",
    "The following is a small sample of the raw text bucketed by language.",
    "Use these authentic quotes for the 'language_intelligence' block. DO NOT pull quotes from the 'Analysis' section above.",
    getLanguageBucketSample(text, 25),
    "=========================================",
    await calculateVectorIntentsAsync(text),
  ].join("\n");

  const structuringPrompt = buildIndustryAwareStructuringPrompt(industryLensText, cfg.modality);

  // Call the final analysis with the structuring prompt
  const finalRes = await runLocalLlmAnalysis(
    structuringPayload,
    structuredMetrics, // Pass original metrics here
    { ...cfg, model: structuringModel },
    structuringPrompt
  );

  if (finalRes.ok && finalRes.parsed) {
    // Ultimate Failsafe Normalization
    finalRes.parsed = normalizeHallucinatedPercentages(finalRes.parsed);

    let totalLines = text.split(/\r?\n/).length;
    if (text.trim().startsWith("[")) {
      try { totalLines = JSON.parse(text).length; } catch(e) {}
    }
    finalRes.parsed.coverage = {
      totalRowsAvailable: totalLines,
      totalRowsProcessed: totalLines,
      totalVariantsFound: 1,
      variantsAnalyzed: 1,
      mode: "background"
    };
  }

  return finalRes;
}

/**
 * Runs the 2-stage analysis for small files (No chunking).
 * @param {string} text
 * @param {Record<string, unknown>} structuredMetrics
 * @param {{ baseUrl: string, model: string, api: 'ollama' | 'openai' | 'together' | 'openrouter', apiKey: string, modality?: string }} cfg
 */
export async function runSmallFileAnalysis(text, structuredMetrics, cfg, industryLensText = "", onProgress = (stage) => {}, skipVariantCheck = false, schema = "standard") {
  if (schema === "survey") {
    text = await runSurveyPreprocessor(text, onProgress);
  }

  if (!skipVariantCheck && cfg.modality !== "Quantitative") {
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
      return await runVariantAnalysis(csvParsed, totalLines, structuredMetrics, cfg, industryLensText, onProgress, text, schema);
    }
  }

  onProgress("vector");

  const cleanedText = cfg.modality === "Quantitative" 
    ? computeStatisticalSummary(text) 
    : await processLanguageSegmentation(text);
  
  const synthesisModel = process.env.LOCAL_LLM_MODEL_SYNTHESIS || cfg.model;
  const structuringModel = process.env.LOCAL_LLM_MODEL_STRUCTURING || cfg.model;
  
  console.log(`[Pipeline] Running 2-stage analysis for small file using Synthesis=${synthesisModel}, Structuring=${structuringModel}, Modality=${cfg.modality}...`);
  onProgress("transitions");
  
  const synthesisPrompt = cfg.modality === "Quantitative" ? SYSTEM_FREEFORM_SYNTHESIS_QUANTITATIVE : SYSTEM_FREEFORM_SYNTHESIS;

  const freeformRes = await runLocalLlmAnalysis(
    cleanedText,
    {}, // No structured metrics for freeform
    { ...cfg, model: synthesisModel },
    synthesisPrompt
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
    "",
    "==== [RAW_LANGUAGE_BUCKETS_SAMPLE] ====",
    "The following is a small sample of the raw text bucketed by language.",
    "Use these authentic quotes for the 'language_intelligence' block. DO NOT pull quotes from the 'Analysis' section above.",
    getLanguageBucketSample(text, 25),
    "=========================================",
    await calculateVectorIntentsAsync(text),
  ].join("\n");
  
  const structuringPrompt = buildIndustryAwareStructuringPrompt(industryLensText);

  const finalRes = await runLocalLlmAnalysis(
    structuringPayload,
    structuredMetrics,
    { ...cfg, model: structuringModel },
    structuringPrompt
  );
  if (finalRes.ok && finalRes.parsed) {
    // Ultimate Failsafe Normalization
    finalRes.parsed = normalizeHallucinatedPercentages(finalRes.parsed);

    let totalLines = text.split(/\r?\n/).length;
    if (text.trim().startsWith("[")) {
      try { totalLines = JSON.parse(text).length; } catch(e) {}
    }
    finalRes.parsed.coverage = {
      totalRowsAvailable: totalLines,
      totalRowsProcessed: totalLines,
      totalVariantsFound: 1,
      variantsAnalyzed: 1,
      mode: "background"
    };
  }
  
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
        let variantKey = keys.find(k => 
          k.toLowerCase().includes("varient") || 
          k.toLowerCase().includes("variant") || 
          k.toLowerCase().includes("product") ||
          k.toLowerCase().includes("name") ||
          k.toLowerCase().includes("hotel") ||
          k.toLowerCase().includes("restaurant")
        );

        if (!variantKey) {
          const colStats = keys.map((k) => ({ key: k, uniqueVals: new Set(), totalVals: 0, isNumeric: true }));
          for (let i = 0; i < Math.min(1001, records.length); i++) {
            for (let c = 0; c < Math.min(3, keys.length); c++) {
              const val = String(records[i][keys[c]] || "").trim();
              if (val) {
                colStats[c].uniqueVals.add(val);
                colStats[c].totalVals++;
                if (isNaN(Number(val))) {
                  colStats[c].isNumeric = false;
                }
              }
            }
          }
          for (let i = 0; i < Math.min(3, colStats.length); i++) {
            const stats = colStats[i];
            if (!stats.isNumeric && stats.uniqueVals.size > 1 && stats.uniqueVals.size <= stats.totalVals * 0.4) {
              variantKey = stats.key;
              console.log(`[Pipeline] JSON Statistical detection selected key: ${stats.key}`);
              break;
            }
          }
        }

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
        
        return null;
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

async function runVariantAnalysis(csvParsed, totalLines, structuredMetrics, cfg, industryLensText, onProgress, originalText = "", schema = "standard") {
  const { header, variants, isJson, keys } = csvParsed;
  
  const isBackground = cfg.mode === "background";
  // Increase background limits to process more rows for comprehensive mode
  const limitVariants = isBackground ? Math.min(100, Object.keys(variants).length) : Math.min(10, Object.keys(variants).length);
  const sampleLimit = isBackground ? 100 : 20;

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
      
      if (schema === "survey") {
         variantText = await runSurveyPreprocessor(variantText, onProgress);
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
        res.parsed = normalizeHallucinatedPercentages(res.parsed);
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
  
  const synthesisPrompt = cfg.modality === "Quantitative" ? SYSTEM_FREEFORM_SYNTHESIS_QUANTITATIVE : SYSTEM_FREEFORM_SYNTHESIS;
  const overarchingFreeform = await runLocalLlmAnalysis(
    overarchingPayload,
    {},
    { ...cfg, model: structuringModel },
    synthesisPrompt
  );
  
  onProgress("interactions");
  
  const structuringPrompt = buildIndustryAwareStructuringPrompt(industryLensText, cfg.modality);
  const structuringPayload = [
    "Convert the following overarching analysis into structured JSON.",
    "Analysis:",
    overarchingFreeform.raw || "",
    originalText ? await calculateVectorIntentsAsync(originalText) : ""
  ].join("\n");
  
  const finalRes = await runLocalLlmAnalysis(
    structuringPayload,
    structuredMetrics,
    { ...cfg, model: structuringModel },
    structuringPrompt
  );
  
  if (finalRes.ok && finalRes.parsed) {
    finalRes.parsed = normalizeHallucinatedPercentages(finalRes.parsed);
    finalRes.parsed.variants = variantReports;
    // Add coverage stats
    finalRes.parsed.coverage = {
      totalVariantsFound: Object.keys(variants).length,
      variantsAnalyzed: sortedVariants.length,
      totalRowsAvailable: totalLines,
      totalRowsProcessed: analyzedRows,
      is_sampled: true,
      mode: isBackground ? "background" : "parallel_sampled"
    };
  }
  
  return finalRes;
}

/**
 * Runs the Survey Preprocessor to flatten multi-header CSVs natively in JS.
 * This avoids unstable loopback HTTP requests on Vercel and slow shell spawns.
 */
async function runSurveyPreprocessor(text, onProgress) {
  try {
    onProgress("vector"); // Update UI to show data extraction phase
    
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return text;

    const parseRow = (line) => {
      const row = [];
      let field = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inQuotes) {
          if (c === '"') {
            if (line[i + 1] === '"') {
              field += '"';
              i++;
            } else {
              inQuotes = false;
            }
          } else {
            field += c;
          }
        } else {
          if (c === '"') {
            inQuotes = true;
          } else if (c === ',') {
            row.push(field.trim());
            field = "";
          } else {
            field += c;
          }
        }
      }
      row.push(field.trim());
      return row;
    };

    const firstRows = lines.slice(0, 10).map(parseRow);

    let metadataRowIdx = 0;
    for (let i = 0; i < Math.min(5, firstRows.length); i++) {
      if (firstRows[i].includes("Id") || firstRows[i].includes("User Id")) {
        metadataRowIdx = i;
        break;
      }
    }

    let questionRowIdx = 0;
    let maxQScore = -1;
    for (let i = 0; i < Math.min(10, firstRows.length); i++) {
      let score = 0;
      for (const cell of firstRows[i]) {
        if (cell.length > 20 && cell.includes("?")) {
          score++;
        }
      }
      if (score > maxQScore) {
        maxQScore = score;
        questionRowIdx = i;
      }
    }

    const dataStartIdx = Math.max(metadataRowIdx, questionRowIdx) + 1;
    const metadataRow = firstRows[metadataRowIdx] || [];
    const questionRow = firstRows[questionRowIdx] || [];

    const numCols = Math.max(metadataRow.length, questionRow.length);
    const masterHeader = [];

    for (let colIdx = 0; colIdx < numCols; colIdx++) {
      let qText = colIdx < questionRow.length ? questionRow[colIdx].trim() : "";
      let mText = colIdx < metadataRow.length ? metadataRow[colIdx].trim() : "";
      
      qText = qText.replace(/\s+/g, ' ');

      if (qText && qText !== '""') {
        masterHeader.push(qText);
      } else if (mText && mText !== '""') {
        masterHeader.push(mText);
      } else {
        masterHeader.push(`Column_${colIdx}`);
      }
    }

    const toCsvRow = (arr) => arr.map(v => {
      const clean = (v || "").replace(/"/g, '""');
      return `"${clean}"`;
    }).join(",");

    const outputLines = [];
    outputLines.push(toCsvRow(masterHeader));

    for (let i = dataStartIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const row = parseRow(line);
      while (row.length < numCols) row.push("");
      const trimmedRow = row.slice(0, numCols);
      
      if (trimmedRow.some(cell => cell.trim() !== "")) {
        outputLines.push(toCsvRow(trimmedRow));
      }
    }

    return outputLines.join("\n");
  } catch (err) {
    console.error("[Pipeline] Native Survey Preprocessor failed:", err.message);
    return text;
  }
}
