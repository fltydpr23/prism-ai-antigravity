# PRISM V2 — Hierarchical Intelligence Architecture

## Core Insight

The bottleneck in local AI systems is NOT chunking.

The bottleneck is:
- giant synthesis prompts
- strict JSON formatting
- constrained generation
- oversized outputs
- massive context windows

The solution:
# separate extraction, reasoning, and formatting into different stages.

---

# THE FUNDAMENTAL SHIFT

## BAD ARCHITECTURE

```txt
Raw File
    ↓
One Massive Prompt
    ↓
Huge JSON Report
```

Problems:
- extremely slow
- context overload
- malformed JSON
- high hallucination risk
- poor scalability
- unusable local inference latency

---

## PRISM V2 ARCHITECTURE

```txt
Raw File
    ↓
Text Extraction
    ↓
Cleaning + Deduplication
    ↓
Semantic Chunking
    ↓
Lightweight Chunk Analysis
    ↓
Compressed Intelligence Memory
    ↓
Freeform Global Synthesis
    ↓
JSON Structuring Layer
    ↓
Final Executive Report
```

This architecture is:
- faster
- more reliable
- local-model friendly
- scalable
- modular
- easier to debug

---

# IMPORTANT PRINCIPLE

## Separate THINKING from FORMATTING

LLMs perform poorly when forced to:
- deeply reason
AND
- generate massive structured JSON
simultaneously.

This dramatically increases:
- latency
- formatting failures
- hallucinations
- inference instability

Instead:
1. Let the model think naturally first.
2. Structure the result afterward.

This is one of the most important optimizations in AI system design.

---

# STAGE 1 — FILE INGESTION

Supported:
- CSV
- PDF
- TXT
- DOCX
- JSON

Goal:
extract only useful text before inference.

---

## CSV Handling

Use traditional parsers:
- pandas
- papaparse
- csv-parser

Extract:
- reviews
- complaints
- support messages
- survey answers

Ignore:
- IDs
- timestamps (unless useful)
- metadata
- empty columns

---

## PDF Handling

Use:
- pdfplumber
- pymupdf
- unstructured.io

Extract:
- paragraphs
- conversations
- transcripts
- customer feedback

Remove:
- headers
- footers
- duplicated text
- page numbers

---

# STAGE 2 — CLEANING + DEDUPLICATION

Before inference:

- normalize whitespace
- remove duplicates
- collapse repeated complaints
- clean malformed text
- merge fragmented sentences

Example:

BAD:
"delivery late"
"delivery late"
"delivery late"

GOOD:
"delivery late" mentioned 53 times

This dramatically reduces:
- token usage
- inference time
- memory pressure

---

# STAGE 3 — SEMANTIC CHUNKING

DO NOT chunk randomly.

Instead:
group semantically similar content together.

Examples:
- delivery complaints
- support issues
- feature requests
- pricing concerns
- positive feedback

This improves:
- emotional consistency
- synthesis quality
- pattern recognition

---

# IDEAL CHUNK SIZE

For local models:

Recommended:
- 4k–8k tokens
OR
- 50–150 feedback items

Goal:
keep inference lightweight and fast.

---

# STAGE 4 — LIGHTWEIGHT CHUNK ANALYSIS

## CRITICAL PRINCIPLE

Chunk analysis should be:
- lightweight
- compressed
- fast
- extraction-focused

NOT:
- verbose
- deeply analytical
- highly formatted

---

# GOOD CHUNK PROMPT

```txt
Analyze this customer feedback chunk.

Return ONLY:
- top issues
- emotional tone
- repeated complaints
- feature requests
- urgency level
- representative phrases

Keep output extremely concise.
No explanations.
```

---

# IDEAL CHUNK OUTPUT

```json
{
  "issues": ["late delivery", "poor support"],
  "emotion": "frustrated",
  "feature_requests": ["faster refunds"],
  "urgency": "high",
  "quotes": ["acha hai but support slow"]
}
```

---

# STAGE 5 — COMPRESSED INTELLIGENCE MEMORY

Store:
- chunk summaries
- issue frequencies
- emotional signals
- feature requests
- representative quotes

DO NOT store:
- giant raw contexts
- full documents
- verbose summaries

Goal:
convert raw chaos into compact machine memory.

---

# STAGE 6 — FREEFORM GLOBAL SYNTHESIS

## IMPORTANT CHANGE

DO NOT force strict JSON during reasoning.

Instead:
allow the model to synthesize naturally.

---

# GLOBAL SYNTHESIS PROMPT

```txt
Analyze these aggregated customer intelligence summaries.

Focus on:
- major recurring issues
- emotional patterns
- operational failures
- strategic opportunities
- customer expectations
- churn risks

Be concise and insight-dense.
```

This is:
- much faster
- smarter
- more stable
- lower hallucination risk

---

# STAGE 7 — JSON STRUCTURING LAYER

ONLY AFTER synthesis:

Convert the concise synthesis into structured JSON.

---

# STRUCTURING PROMPT

```txt
Convert this analysis into structured JSON.

Return ONLY valid JSON.
```

---

# VALIDATION LAYER

Every structured output should pass through:

```txt
Output
    ↓
JSON Validator
    ↓
Pass / Retry
```

If validation fails:
- retry with simpler formatting
- NEVER pass malformed raw outputs upstream

---

# IMPORTANT FAILURE RULE

If a chunk fails:
DO NOT inject raw chunk text into final synthesis.

Instead:
- retry chunk once
- fallback to simpler extraction
- discard malformed formatting

Injecting raw chunks:
- destroys context efficiency
- massively increases latency
- worsens synthesis quality

---

# PERFORMANCE OPTIMIZATIONS

## 1. Keep Intermediate Outputs Tiny

Goal:
maximize intelligence density.

Avoid:
- verbose AI prose
- unnecessary explanation
- giant reports

---

## 2. Flat JSON > Nested JSON

Flat structures are:
- easier for local models
- faster to generate
- more reliable

GOOD:

```json
{
  "issues": [],
  "emotion": "",
  "urgency": ""
}
```

BAD:

```json
{
  "emotional_taxonomy": {
    "primary": {},
    "secondary": {}
  }
}
```

---

## 3. Use Smaller Models for Chunking

Examples:
- Qwen 14B
- Gemma smaller variants
- fast local models

Reserve larger models for:
- final synthesis
- executive intelligence
- strategic reasoning

---

## 4. Parallelism Carefully

Ollama on a single machine does NOT scale linearly with parallel requests.

Too many simultaneous generations cause:
- GPU contention
- RAM pressure
- thermal throttling
- slower total throughput

Better:
- lightweight chunk inference
- controlled concurrency
- one heavy synthesis pass

---

# FUTURE PRISM EVOLUTION

## Embedding Layer

Future pipeline:

```txt
Raw Feedback
    ↓
Embeddings
    ↓
Semantic Clustering
    ↓
Chunk Analysis
```

Benefits:
- smarter grouping
- better emotional coherence
- improved synthesis quality

---

## Emotional Intelligence Layer

Classify:
- disappointment
- frustration
- delight
- betrayal
- cautious optimism
- churn risk

Especially important for:
- Indian customer communication
- Hinglish/Tanglish nuance
- emotional business intelligence

---

## Retrieval + Memory Layer

Store:
- recurring phrases
- complaint patterns
- emotional mappings
- industry-specific signals

Over time:
Prism becomes an evolving intelligence system.

---

# FINAL REALIZATION

PRISM is NOT:
"chat with documents"

PRISM IS:
# an intelligence orchestration system

The moat is NOT:
- giant prompts
- biggest model
- longest context

The moat IS:
- orchestration
- compression
- semantic clustering
- synthesis pipelines
- emotional intelligence
- India-native understanding
- workflow architecture
