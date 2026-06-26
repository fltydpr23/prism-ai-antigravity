import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (!text) {
      return new NextResponse("", { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    const lines = text.split(/\r?\n/);
    if (lines.length === 0) {
      return new NextResponse("", { status: 200, headers: { 'Content-Type': 'text/plain' } });
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
    const masterHeader: string[] = [];

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

    // Helper to format CSV row
    const toCsvRow = (arr: string[]) => arr.map(v => {
      const clean = v.replace(/"/g, '""');
      return `"${clean}"`;
    }).join(",");

    const outputLines: string[] = [];
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

    const flatCsv = outputLines.join("\n");
    return new NextResponse(flatCsv, { status: 200, headers: { 'Content-Type': 'text/plain' } });

  } catch (error: any) {
    console.error("[Preprocessor API] Error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
