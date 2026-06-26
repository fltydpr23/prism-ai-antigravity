#!/usr/bin/env python3
import sys
import csv
import io
import re

def process_survey(input_path):
    with open(input_path, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        return ""

    # Find the row that contains standard metadata headers like "Id", "User Id"
    # Usually row index 1 or 2
    metadata_row_idx = -1
    for i in range(min(5, len(rows))):
        if "Id" in rows[i] or "User Id" in rows[i]:
            metadata_row_idx = i
            break

    # Find the row that contains the human-readable questions
    # Usually characterized by long strings, often ending with "?"
    question_row_idx = -1
    max_q_score = -1
    
    for i in range(min(10, len(rows))):
        score = sum(1 for cell in rows[i] if len(cell) > 20 and "?" in cell)
        if score > max_q_score:
            max_q_score = score
            question_row_idx = i
            
    if metadata_row_idx == -1:
        metadata_row_idx = 0
    if question_row_idx == -1:
        question_row_idx = 0

    # The data rows start after the question row
    data_start_idx = max(metadata_row_idx, question_row_idx) + 1

    # Build the master header
    master_header = []
    metadata_row = rows[metadata_row_idx]
    question_row = rows[question_row_idx]
    
    # We want to use the question text if available, otherwise fallback to metadata header, then column index
    num_cols = max(len(metadata_row), len(question_row))
    for col_idx in range(num_cols):
        q_text = question_row[col_idx].strip() if col_idx < len(question_row) else ""
        m_text = metadata_row[col_idx].strip() if col_idx < len(metadata_row) else ""
        
        # Clean up question text to remove newlines or excessive whitespace
        q_text = re.sub(r'\s+', ' ', q_text)
        
        if q_text and q_text not in ["", '""']:
            # If the column has question text, use it
            # To avoid duplicate columns, we might append an index if we want, but LLMs handle raw questions better
            header_name = q_text
        elif m_text and m_text not in ["", '""']:
            header_name = m_text
        else:
            header_name = f"Column_{col_idx}"
            
        master_header.append(header_name)

    # Prepare output buffer
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write master header
    writer.writerow(master_header)
    
    # Write data rows
    for i in range(data_start_idx, len(rows)):
        row = rows[i]
        # Pad row if necessary
        if len(row) < num_cols:
            row.extend([""] * (num_cols - len(row)))
        # Trim row if too long
        row = row[:num_cols]
        # Only write rows that have some data
        if any(cell.strip() for cell in row):
            writer.writerow(row)
            
    return output.getvalue()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 survey_preprocessor.py <input_csv_file>")
        sys.exit(1)
        
    input_file = sys.argv[1]
    result = process_survey(input_file)
    print(result)
