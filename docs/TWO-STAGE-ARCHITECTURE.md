# Two-Stage Graph-Aware Content Generation

## Core Principle

**Stage 1 = DEFINE STRUCTURE**  
**Stage 2 = ENRICH EXISTING STRUCTURE**

AI MUST NOT invent structure in Stage 2.

---

## System Architecture

### Stage 1 — Core Generation (Required)

**Purpose:** Generate minimal, stable, indexable page. Define graph nodes.

**Characteristics:**
- Small JSON
- No long text
- No deep nesting
- No enrichment

**Output Schema:**
```json
{
  "slug": "string",
  "title": "string",
  "system": "string",
  "symptom": "string",
  "fast_answer": "string",
  "summary_30_sec": "string",
  "difficulty": "string",
  "diagnostic_steps": [
    { "step": 1, "action": "string" }
  ],
  "causes": [
    { "name": "string", "confidence": "string" }
  ],
  "repairs": [
    { "name": "string", "difficulty": "string" }
  ]
}
```

**Hard Rules:**
- Max 3 causes
- Max 3 repairs
- Max 3 diagnostic steps
- Short sentences only
- ALL arrays must be objects (no strings)
- max_tokens: 800–900

---

### Stage 2 — Graph-Based Enrichment (Async)

**Purpose:** Expand existing nodes. Add depth without risk. Use graph relationships.

**Input:**
- Core page (Stage 1 output)
- Graph data from DB: related causes, components, repair mappings

**Output Schema:**
```json
{
  "slug": "string",
  "cause_details": [
    {
      "name": "string",
      "explanation": "string",
      "symptoms": ["string"],
      "related_components": ["string"]
    }
  ],
  "repair_details": [
    {
      "name": "string",
      "steps": ["string"],
      "tools": ["string"],
      "cost": "string"
    }
  ],
  "tools": [
    { "name": "string", "purpose": "string" }
  ],
  "faq": [
    { "question": "string", "answer": "string" }
  ],
  "internal_links": [
    { "anchor": "string", "slug": "string" }
  ]
}
```

**Hard Rules:**
- DO NOT create new causes or repairs
- ONLY expand entities from Stage 1
- Must match names EXACTLY
- Use graph data when available
- max_tokens: 900–1100

---

## Pipeline Flow

1. **Stage 1:** `generateCorePage()` → validate (ends with `}`, required keys) → save
2. **Stage 2:** `generateEnrichment()` → merge into page

## Truncation Handling

- Check if output ends with `}`
- Check for required keys
- If truncated: retry generation (DO NOT attempt repair)

## Safe Parsing

- Use `safeJsonParse()` from `@/lib/utils`
- Never raw `JSON.parse` without validation
- Retry on failure (max 3, lower temp on retry)

## Graph Integration

- Every "name" becomes a node
- Nodes must be reusable across pages
- No synonyms (use canonical names)
- Internal links must reference existing slugs

## Usage

```ts
import { generateTwoStagePage, generateCorePage, generateEnrichment } from "@/lib/two-stage-generator";

// Full pipeline
const content = await generateTwoStagePage("AC blowing warm air", {
  slug: "ac-blowing-warm-air",
  graphCauses: [{ name: "Bad capacitor" }, { name: "Refrigerant leak" }],
  graphRepairs: [{ name: "Capacitor replacement" }],
});

// Or run stages separately (for async enrichment queue)
const core = await generateCorePage("AC blowing warm air", { graphCauses: [...] });
// ... save core, queue enrichment ...
const enrichment = await generateEnrichment(core, { graphComponents: [...] });
```

## Environment

- `USE_TWO_STAGE=true` — Use two-stage generator in worker (when graph data exists)
- Workers load dotenv at top
- DATABASE_URL validated, fail fast if missing
