import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';

function levenshtein(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const STATE_MAP: Record<string, string> = {
  "california": "CA", "calif": "CA", "calif.": "CA", "texas": "TX", "new york": "NY", "united kingdom": "GB", "uk": "GB", "great britain": "GB", "united states": "US", "usa": "US"
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const industryHeader = formData.get('industry') as string || 'auto';

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let text = "";
    const filename = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();

    if (filename.endsWith('.zip')) {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(arrayBuffer);
      
      let targetFile = null;
      for (const [path, zipObj] of Object.entries(loadedZip.files)) {
        if (!zipObj.dir && (path.endsWith('.csv') || path.endsWith('.json') || path.endsWith('.tsv') || path.endsWith('.xlsx') || path.endsWith('.xls'))) {
          targetFile = zipObj;
          break;
        }
      }

      if (!targetFile) {
        return NextResponse.json({ error: "No supported file found in ZIP" }, { status: 400 });
      }

      if (targetFile.name.endsWith('.csv') || targetFile.name.endsWith('.tsv') || targetFile.name.endsWith('.json')) {
        text = await targetFile.async("string");
        if (targetFile.name.endsWith('.tsv')) {
          text = text.split(/\r?\n/).map(line => line.split('\t').join(',')).join('\n');
        } else if (targetFile.name.endsWith('.json')) {
           const jsonArr = JSON.parse(text);
           if (Array.isArray(jsonArr) && jsonArr.length > 0) {
             const keys = Object.keys(jsonArr[0]);
             text = keys.join(',') + '\n' + jsonArr.map((obj: any) => keys.map(k => JSON.stringify(obj[k] || "")).join(',')).join('\n');
           }
        }
      } else if (targetFile.name.endsWith('.xlsx') || targetFile.name.endsWith('.xls')) {
        const buffer = await targetFile.async("nodebuffer");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);
        const worksheet = workbook.worksheets[0];
        
        let csvLines: string[] = [];
        worksheet.eachRow((row) => {
           let rowVals: string[] = [];
           row.eachCell({ includeEmpty: true }, (cell) => {
             let val = cell.text || cell.value?.toString() || "";
             if (val.includes(',') || val.includes('"') || val.includes('\n')) {
               val = '"' + val.replace(/"/g, '""') + '"';
             }
             rowVals.push(val);
           });
           csvLines.push(rowVals.join(','));
        });
        text = csvLines.join('\n');
      }
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Buffer.from(arrayBuffer) as any);
      const worksheet = workbook.worksheets[0];
      
      let csvLines: string[] = [];
      worksheet.eachRow((row) => {
         let rowVals: string[] = [];
         row.eachCell({ includeEmpty: true }, (cell) => {
           let val = cell.text || cell.value?.toString() || "";
           if (val.includes(',') || val.includes('"') || val.includes('\n')) {
             val = '"' + val.replace(/"/g, '""') + '"';
           }
           rowVals.push(val);
         });
         csvLines.push(rowVals.join(','));
      });
      text = csvLines.join('\n');
    } else if (filename.endsWith('.json')) {
      const str = Buffer.from(arrayBuffer).toString('utf-8');
      const jsonArr = JSON.parse(str);
      if (Array.isArray(jsonArr) && jsonArr.length > 0) {
        const keys = Object.keys(jsonArr[0]);
        text = keys.join(',') + '\n' + jsonArr.map((obj: any) => keys.map(k => JSON.stringify(obj[k] || "")).join(',')).join('\n');
      }
    } else if (filename.endsWith('.tsv')) {
      const str = Buffer.from(arrayBuffer).toString('utf-8');
      text = str.split(/\r?\n/).map(line => line.split('\t').join(',')).join('\n');
    } else {
      text = Buffer.from(arrayBuffer).toString('utf-8');
    }

    if (!text) {
      return NextResponse.json({ error: "Empty file provided or format could not be parsed" }, { status: 400 });
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) {
      return NextResponse.json({ error: "No lines in file" }, { status: 400 });
    }

    // A lightweight CSV parser just for the first few rows
    const parseRow = (line: string) => {
      const row: string[] = [];
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

    // Schema Sniffer Logic (from Preprocessor)
    let metadataRowIdx = -1;
    for (let i = 0; i < Math.min(5, firstRows.length); i++) {
      if (firstRows[i].includes("Id") || firstRows[i].includes("User Id")) {
        metadataRowIdx = i;
        break;
      }
    }

    let questionRowIdx = -1;
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

    let isSurveySchema = false;
    let masterHeader: string[] = [];
    let numCols = 0;
    let dataStartIdx = 0;

    if (maxQScore > 0 && metadataRowIdx !== -1 && questionRowIdx !== metadataRowIdx) {
      // It's a complex Enterprise Survey
      isSurveySchema = true;
      dataStartIdx = Math.max(metadataRowIdx, questionRowIdx) + 1;
      
      const metadataRow = firstRows[metadataRowIdx] || [];
      const questionRow = firstRows[questionRowIdx] || [];
      numCols = Math.max(metadataRow.length, questionRow.length);
      
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
    } else {
      // Standard CSV
      masterHeader = firstRows[0] || [];
      numCols = masterHeader.length;
      dataStartIdx = 1;
    }

    // Helper to format CSV row
    const toCsvRow = (arr: string[]) => arr.map(v => {
      const clean = v.replace(/"/g, '""');
      return `"${clean}"`;
    }).join(",");

    const outputLines: string[] = [];
    outputLines.push(toCsvRow(masterHeader));

    const industry = request.headers.get("X-Prism-Industry") || "auto";

    // PASS 1: Parse all data rows into memory
    const dataRows: string[][] = [];
    let initialRows = 0;
    for (let i = dataStartIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      initialRows++;
      const row = parseRow(line);
      while (row.length < numCols) row.push("");
      dataRows.push(row.slice(0, numCols));
    }

    // PASS 2: Column Profiling
    const colProfiles: Array<{
      isNumeric: boolean;
      isDate: boolean;
      isGeo: boolean;
      mean?: number;
      median?: number;
      stdDev?: number;
      fuzzyMap?: Record<string, string>;
    }> = [];

    for (let j = 0; j < numCols; j++) {
      let numCount = 0;
      let dateCount = 0;
      const values: number[] = [];
      const freqMap: Record<string, number> = {};

      const headerLower = (masterHeader[j] || "").toLowerCase();
      const isGeo = headerLower.includes("state") || headerLower.includes("country") || headerLower.includes("location");

      for (let i = 0; i < dataRows.length; i++) {
        const val = dataRows[i][j];
        if (!val) continue;

        freqMap[val] = (freqMap[val] || 0) + 1;

        if (!isNaN(Number(val))) {
          numCount++;
          values.push(Number(val));
        } else if (Date.parse(val) && !/^\d+$/.test(val)) {
          dateCount++;
        }
      }

      const isNumeric = numCount > dataRows.length * 0.5 && values.length > 0;
      const isDate = dateCount > dataRows.length * 0.5;

      const profile: any = { isNumeric, isDate, isGeo };

      if (isNumeric) {
        values.sort((a, b) => a - b);
        profile.median = values[Math.floor(values.length / 2)];
        profile.mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - profile.mean, 2), 0) / values.length;
        profile.stdDev = Math.sqrt(variance);
      } else if (!isDate) {
        // Build fuzzy map for categorical
        const fuzzyMap: Record<string, string> = {};
        const uniqueVals = Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]);
        
        for (let k = 0; k < uniqueVals.length; k++) {
          const val = uniqueVals[k];
          if (fuzzyMap[val]) continue;
          fuzzyMap[val] = val; // map to self
          for (let l = k + 1; l < uniqueVals.length; l++) {
            const other = uniqueVals[l];
            if (!fuzzyMap[other] && levenshtein(val.toLowerCase(), other.toLowerCase()) <= 2 && val.length > 3) {
              fuzzyMap[other] = val; // map rare/misspelled to frequent
            }
          }
        }
        profile.fuzzyMap = fuzzyMap;
      }
      colProfiles.push(profile);
    }

    let emptyRowsDropped = 0;
    let duplicatesDropped = 0;
    let transformationsApplied = 0;
    let datesNormalized = 0;
    let imputations = 0;
    let geosMapped = 0;
    let outliersQuarantined = 0;
    let fuzzyMerges = 0;

    const rowSignatures = new Set<string>();

    // PASS 3: Mutation & Quarantine
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      let isOutlier = false;
      const mutatedRow = [...row];

      if (!row.some(cell => cell.trim() !== "")) {
        emptyRowsDropped++;
        continue;
      }

      for (let j = 0; j < numCols; j++) {
        let val = mutatedRow[j];
        const original = val;
        const prof = colProfiles[j];

        // 1. Imputation
        if (!val && prof.isNumeric && prof.median !== undefined) {
          val = prof.median.toString();
          imputations++;
        }

        // 2. Outlier Quarantine
        if (val && prof.isNumeric && prof.stdDev && prof.mean !== undefined) {
          const num = Number(val);
          if (!isNaN(num)) {
            if (Math.abs(num - prof.mean) > 3 * prof.stdDev) {
              isOutlier = true;
            }
          }
        }

        // 3. Temporal Normalization
        if (val && prof.isDate) {
          const parsed = Date.parse(val);
          if (parsed) {
            val = new Date(parsed).toISOString().split('T')[0]; // YYYY-MM-DD
            if (val !== original) datesNormalized++;
          }
        }

        // 4. Geographic Standardization
        if (val && prof.isGeo) {
          const lower = val.toLowerCase();
          if (STATE_MAP[lower]) {
            val = STATE_MAP[lower];
            if (val !== original) geosMapped++;
          }
        }

        // 5. Fuzzy Categorical Merging
        if (val && prof.fuzzyMap && prof.fuzzyMap[val] && prof.fuzzyMap[val] !== val) {
          val = prof.fuzzyMap[val];
          fuzzyMerges++;
        }

        // Apply existing industry rules
        if (industry === 'healthcare') {
          val = val.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
          val = val.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
          val = val.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
        } else if (industry === 'food') {
          val = val.replace(/\b(?:rs\.?|inr|₹)\s*(\d+(?:\.\d+)?)\b/gi, '$1');
          val = val.replace(/\b(\d+(?:\.\d+)?)\s*(?:rs\.?|inr|₹)\b/gi, '$1');
          val = val.replace(/\b([1-5])\s*(?:stars?|\*)\b/gi, '$1');
          val = val.replace(/\b(?:one|two|three|four|five)\s*stars?\b/gi, (match) => {
            const m = match.toLowerCase();
            if (m.includes('one')) return '1';
            if (m.includes('two')) return '2';
            if (m.includes('three')) return '3';
            if (m.includes('four')) return '4';
            return '5';
          });
        } else if (industry === 'finance') {
          val = val.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CARD]');
        } else if (industry === 'saas') {
          val = val.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (m) => m.toLowerCase());
        }

        // Count base string mutations if they changed outside of the new features
        if (val !== original && !prof.isDate && !prof.isGeo && (!prof.fuzzyMap || prof.fuzzyMap[original] === original)) {
          transformationsApplied++;
        }

        mutatedRow[j] = val;
      }

      if (isOutlier) {
        outliersQuarantined++;
        continue;
      }

      const sig = mutatedRow.join("|");
      if (rowSignatures.has(sig)) {
        duplicatesDropped++;
        continue;
      }
      rowSignatures.add(sig);

      outputLines.push(toCsvRow(mutatedRow));
    }

    const flatCsv = outputLines.join("\n");
    
    return NextResponse.json({
      cleanedCsv: flatCsv,
      stats: {
        initialRows,
        finalRows: outputLines.length - 1, // minus header
        emptyRowsDropped,
        duplicatesDropped,
        schemaFlattened: isSurveySchema,
        transformationsApplied,
        datesNormalized,
        imputations,
        geosMapped,
        outliersQuarantined,
        fuzzyMerges
      }
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
