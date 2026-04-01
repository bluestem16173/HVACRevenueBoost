# HVAC Diagnose Page — Full build reference

**Generated:** 2026-03-27T19:02:19.829Z

**Purpose:** Single markdown you can paste into **ChatGPT Pro** (or similar) for architecture review, debugging, or extending the pipeline.

**How to regenerate:** `node scripts/build-diagnose-docs-md.mjs`

---

## Table of contents

1. [Pipeline overview](#pipeline-overview)
2. [Source files (full)](#source-files-full)

---

## Pipeline overview

**Worker path**

- `generation_queue` → `generateDiagnosticEngineJson()` → `validateV2()` → `migrateOnePage()` → `pages` row (`schema_version: v5_master`, `content_json`).

**Render path**

- `/diagnose/[symptom]` → `getDiagnosticPageFromDB()` (status filter: production = published/validated/review; dev or `DIAGNOSE_ALLOW_DRAFT_GENERATED=1` includes draft/generated) → parse `content_json` → `inferDiagnosticSchemaVersion()` when `schema_version` is null → `normalizeDiagnosticToDisplayModel()` (merges legacy hub shapes: `hero`, `commonCauses`, `mermaidGraph`) → `DiagnosticGoldPage` (v5/v6) or `GoldStandardPage` (v2).
- **There is no `DiagnoseHubTemplate`** in this repo; that name is obsolete. Amber debug JSON at the bottom only appears in development or when `NEXT_PUBLIC_DIAGNOSE_DEBUG=1`.

**If the main column looks empty but a debug strip appears**

- Usually **unknown/missing schema** (fixed by inference) or **legacy JSON keys** not mapped into v5 (fixed by `mergeLegacyHubContent` in `normalize-diagnostic-display.ts`), not a separate “template short-circuit.”

---

## Source files (full)

The following sections contain the **complete** current file contents from this repository.


### `lib/content-engine/schema.ts`

```typescript
export const DiagnosticPageSchema = {
  type: "object",
  required: [
    "title",
    "symptom",
    "system",
    "fast_answer",
    "failure_modes",
    "diagnostic_order",
    "guided_diagnosis",
    "mermaid_diagram",
    "causes",
    "repairs"
  ],
  properties: {
    title: { type: "string" },
    symptom: { type: "string" },
    system: { type: "string" },

    fast_answer: {
      type: "object",
      description:
        "Technician-density summary only — no consumer fluff. Must name a physical failure mechanism.",
      required: ["technical_summary", "primary_mechanism"],
      properties: {
        technical_summary: {
          type: "string",
          description:
            "2–4 sentences: airflow dynamics, thermodynamics, and/or electrical behavior; include measurable language where possible.",
        },
        primary_mechanism: {
          type: "string",
          description:
            "Single dominant failure mechanism (e.g. reduced mass flow → coil behavior → capacity loss).",
        },
      },
    },

    failure_modes: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        required: ["name", "description"],
        properties: {
          name: { type: "string" },
          description: { type: "string" }
        }
      }
    },

    diagnostic_order: {
      type: "array",
      minItems: 4,
      items: { type: "string" }
    },

    guided_diagnosis: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        required: ["scenario", "likely_modes", "next_step"],
        properties: {
          scenario: { type: "string" },
          likely_modes: {
            type: "array",
            items: { type: "string" }
          },
          next_step: { type: "string" }
        }
      }
    },

    mermaid_diagram: {
      type: "string",
      description: "Must be valid Mermaid flowchart TD"
    },

    causes: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        required: [
          "name",
          "failure_mode",
          "mechanism",
          "description",
          "symptoms",
          "diagnostic_signal",
          "confidence",
          "test",
          "expected_result",
        ],
        properties: {
          name: { type: "string" },
          failure_mode: { type: "string" },
          mechanism: {
            type: "string",
            description:
              "Physical chain: what fails, how it propagates (not a generic label).",
          },
          description: { type: "string" },
          symptoms: {
            type: "array",
            minItems: 1,
            items: { type: "string" },
          },
          diagnostic_signal: {
            type: "string",
            description:
              "Observable or measurable signal (temps, pressures, electrical, airflow).",
          },
          confidence: { type: "number" },
          test: { type: "string" },
          expected_result: { type: "string" },
        },
      },
    },

    repairs: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        required: [
          "name",
          "cause",
          "system_effect",
          "difficulty",
          "estimated_cost",
          "description",
        ],
        properties: {
          name: { type: "string" },
          cause: { type: "string" },
          system_effect: {
            type: "string",
            description:
              "What system behavior this repair restores (compression, airflow, heat transfer, control sequence).",
          },
          difficulty: {
            type: "string",
            enum: ["easy", "moderate", "hard"],
          },
          estimated_cost: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          description: { type: "string" },
        },
      },
    },

    /** v6 / display-bridge: optional on v5; required when schema_version is v6_dg_hvac_hybrid */
    quick_toolkit: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        required: ["tool", "purpose", "difficulty"],
        properties: {
          tool: { type: "string" },
          purpose: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "moderate", "hard"] },
        },
      },
    },
    tools_needed: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        required: ["name", "purpose", "difficulty"],
        properties: {
          name: { type: "string" },
          purpose: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "moderate", "hard"] },
        },
      },
    },
    problem_overview: {
      type: "string",
      description:
        "Short technician-facing overview of the dominant failure states for this symptom.",
    },
    system_explainer: {
      type: "string",
      description:
        "How the relevant HVAC subsystem works under normal conditions (thermodynamic, airflow, or electrical language).",
    },
    bench_procedures: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        required: ["title", "steps", "field_insight"],
        properties: {
          title: { type: "string" },
          steps: {
            type: "array",
            minItems: 2,
            items: { type: "string" },
          },
          field_insight: { type: "string" },
        },
      },
    },
    prevention_tips: {
      type: "array",
      minItems: 3,
      items: { type: "string" },
    },
    related_guides: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        required: ["title", "slug", "type"],
        properties: {
          title: { type: "string" },
          slug: { type: "string" },
          type: { type: "string" },
        },
      },
    },
    faq: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        required: ["question", "answer"],
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
      },
    },
  }
};

export const Schema = DiagnosticPageSchema;
export type GeneratedContent = any; 

export const SCHEMA_STRING = JSON.stringify(DiagnosticPageSchema, null, 2);

export function getFallback(pageType: string): GeneratedContent {
  return {};
}

```

### `lib/validators/validate-v2.ts`

```typescript
/** Gold Standard Gate: reject soft copy + enforce technician pillars + measurables. */
function assertGoldTechnicalDepth(payload: any) {
  const fa = payload.fast_answer;
  if (!fa || typeof fa !== "object") {
    throw new Error("fast_answer must be an object with technical_summary and primary_mechanism");
  }
  const ts = String(fa.technical_summary ?? "");
  const pm = String(fa.primary_mechanism ?? "");
  const combined = `${ts} ${pm}`.toLowerCase();

  const hedge = /\b(may|might|could)\b/i;
  if (hedge.test(ts) || hedge.test(pm)) {
    throw new Error(
      "Gold gate: fast_answer must not use hedge words (may/might/could) in technical_summary or primary_mechanism"
    );
  }

  const pillar =
    /airflow|cfm|static|refrigerant|charge|superheat|subcool|enthalpy|condenser|evaporator|compressor|electrical|voltage|volt|amp|amperage|capacitor|contactor|motor|blower|duct|psi|°f|°\s*f|humidity|latent/i;
  if (!pillar.test(combined)) {
    throw new Error(
      "Gold gate: fast_answer must reference at least one system pillar (airflow/refrigerant/electrical) with domain terms"
    );
  }

  const measurable =
    /\d|°|delta|Δ|psi|subcool|superheat|cfm|ohm|vdc|vac|amp|°f|°c|psig|btuh|watts/i;
  if (!measurable.test(combined)) {
    throw new Error(
      "Gold gate: fast_answer must include measurable language (numbers, °F/°C, PSI, CFM, voltage, etc.)"
    );
  }

  for (const cause of payload.causes || []) {
    const mech = String(cause.mechanism ?? "");
    if (!mech.trim()) throw new Error(`Cause ${cause.name} missing mechanism`);
    if (hedge.test(mech)) {
      throw new Error(`Gold gate: cause ${cause.name} mechanism uses hedge words`);
    }
    if (!Array.isArray(cause.symptoms) || cause.symptoms.length < 1) {
      throw new Error(`Cause ${cause.name} must include symptoms[]`);
    }
    const sig = String(cause.diagnostic_signal ?? "");
    if (!sig.trim()) throw new Error(`Cause ${cause.name} missing diagnostic_signal`);
    if (typeof cause.confidence !== "number" || Number.isNaN(cause.confidence)) {
      throw new Error(`Cause ${cause.name} must have numeric confidence`);
    }
  }

  for (const repair of payload.repairs || []) {
    const se = String(repair.system_effect ?? "");
    if (!se.trim()) throw new Error(`Repair ${repair.name} missing system_effect`);
    if (hedge.test(se)) {
      throw new Error(`Gold gate: repair ${repair.name} system_effect uses hedge words`);
    }
  }
}

export function validateV2(payload: any) {
  if (!payload) throw new Error("Empty payload");

  const modeNames = new Set(payload.failure_modes?.map((m: any) => m.name));
  const causeNames = new Set(payload.causes?.map((c: any) => c.name));

  if (!payload.failure_modes || payload.failure_modes.length < 3) {
    throw new Error('At least 3 failure modes required');
  }

  // 1. Unique name checks
  if (modeNames.size !== payload.failure_modes.length) {
    throw new Error('Failure mode names must be unique');
  }
  if (causeNames.size !== payload.causes.length) {
    throw new Error('Cause names must be unique');
  }

  // 2. Reject Generic Failure Modes
  const bannedGenericModes = new Set([
    'Electrical Issues',
    'Airflow Issues',
    'Refrigerant Problems',
    'Mechanical Issues',
    'Control Issues',
    'General',
    'System',
    'Other', 
    'Unknown',
    'Miscellaneous',
    'General Issues'
  ]);
  for (const mode of payload.failure_modes) {
    if (bannedGenericModes.has(mode.name.trim())) {
      throw new Error(`Failure mode too generic: ${mode.name}`);
    }
  }

  // 3. Causes ownership and tests
  for (const cause of payload.causes || []) {
    if (!modeNames.has(cause.failure_mode)) {
      throw new Error(`Cause ${cause.name} has invalid failure mode`);
    }
    if (!cause.test || !cause.test.trim()) {
      throw new Error(`Cause ${cause.name} missing test`);
    }
    if (!cause.expected_result || !cause.expected_result.trim()) {
      throw new Error(`Cause ${cause.name} missing expected_result`);
    }

    const testMeasurableKeywords = ['measure', 'inspect', 'check', 'test', 'read', 'verify', 'voltage', 'ohm', 'psi', 'temperature', 'continuity', 'multimeter', 'gauge', 'meter', 'observe', 'listen', 'disconnect', 'discharge'];
    const hasMeasurable = testMeasurableKeywords.some(kw => cause.test.toLowerCase().includes(kw)) || /\d+/.test(cause.test);
    if (!hasMeasurable) {
      throw new Error(`Cause ${cause.name} test lacks measurable condition: ${cause.test}`);
    }

    const resultPassFailKeywords = ['confirm', 'indicate', 'below', 'above', 'within', 'range', 'should be', 'normal', 'abnormal', 'pass', 'fail', 'detect', 'present', 'eliminates'];
    const hasPassFail = resultPassFailKeywords.some(kw => cause.expected_result.toLowerCase().includes(kw)) || /\d+/.test(cause.expected_result);
    if (!hasPassFail) {
      throw new Error(`Cause ${cause.name} expected_result lacks decisive pass/fail outcome: ${cause.expected_result}`);
    }
  }

  // 4. Repairs mapping
  for (const repair of payload.repairs || []) {
    if (!causeNames.has(repair.cause)) {
      throw new Error(`Repair ${repair.name} points to unknown cause`);
    }
  }

  // 5. Failure mode has causes
  for (const mode of payload.failure_modes) {
    const count = payload.causes.filter((c: any) => c.failure_mode === mode.name).length;
    if (count === 0) {
      throw new Error(`Failure mode ${mode.name} has no causes`);
    }
  }

  // 6. Mermaid validation
  if (!payload.mermaid_diagram || !payload.mermaid_diagram.includes('flowchart TD')) {
    throw new Error('Mermaid diagram must use flowchart TD');
  }
  for (const mode of payload.failure_modes) {
    if (!payload.mermaid_diagram.includes(mode.name)) {
      throw new Error(`Mermaid missing failure mode ${mode.name}`);
    }
  }
  if (!payload.mermaid_diagram.includes('?')) {
    throw new Error("Mermaid missing binary questions (?)");
  }

  // 7. Guided diagnosis strict checks
  if (!payload.guided_diagnosis || payload.guided_diagnosis.length < 3) {
    throw new Error('Guided diagnosis requires at least 3 scenarios');
  }
  for (const gd of payload.guided_diagnosis) {
    for (const mode of gd.likely_modes || []) {
      if (!modeNames.has(mode)) {
        throw new Error(`Guided diagnosis references unknown mode: ${mode}`);
      }
    }
  }

  // 8. Anti-blog checks (object fast_answer)
  if (payload.fast_answer && typeof payload.fast_answer === "object") {
    const blob = JSON.stringify(payload.fast_answer);
    if (blob.includes("This article")) throw new Error("Contains blog jargon: 'This article'");
    if (blob.includes("In this guide")) throw new Error("Contains blog jargon: 'In this guide'");
  }

  assertGoldTechnicalDepth(payload);

  return true;
}

```

### `lib/validators/page-validator.ts`

```typescript
export type ValidationResult = {
  valid: boolean;
  errors?: string[]; 
  error?: string;    
};

export function validatePage(page: any): ValidationResult {
  if (!page) return { valid: false, error: "Empty payload", errors: ["Empty payload"] };

  try {
    // HARD FAIL CONDITIONS

    // MUST HAVE MERMAID
    if (!page.mermaid_diagram || typeof page.mermaid_diagram !== 'string' || !page.mermaid_diagram.includes("flowchart TD")) {
      throw new Error("Missing valid Mermaid flowchart TD diagram");
    }

    // MUST HAVE 3+ FAILURE MODES
    if (!page.failure_modes || !Array.isArray(page.failure_modes) || page.failure_modes.length < 3) {
      throw new Error("Insufficient failure modes (min 3)");
    }

    // 1. FAILURE MODE COVERAGE for CAUSES
    if (!page.causes || !Array.isArray(page.causes)) {
      throw new Error("Causes array missing");
    }

    const failureModeNames = page.failure_modes.map((m: any) => m.name);
    for (const cause of page.causes) {
      if (!failureModeNames.includes(cause.failure_mode)) {
        throw new Error(`Cause must map to valid failure mode: ${cause.name} -> ${cause.failure_mode}`);
      }
    }

    // 2. NO ORPHAN CAUSES
    const mappedModes = new Set(page.causes.map((c: any) => c.failure_mode));
    if (mappedModes.size !== page.failure_modes.length) {
      throw new Error("Every failure mode must have at least one assigned cause");
    }

    // 3. REPAIR COVERAGE
    if (!page.repairs || !Array.isArray(page.repairs)) {
      throw new Error("Repairs array missing");
    }
    for (const cause of page.causes) {
      const hasRepair = page.repairs.some((r: any) => r.cause === cause.name);
      if (!hasRepair) {
        throw new Error(`Missing repair for cause: ${cause.name}`);
      }
    }

    // 4. MERMAID VALIDATION
    for (const mode of page.failure_modes) {
      if (!page.mermaid_diagram.includes(mode.name)) {
        throw new Error(`Flowchart missing failure mode node: ${mode.name}`);
      }
    }

    // 5. ANTI-BLOG CHECK (fast_answer is object: technical_summary + primary_mechanism)
    if (page.fast_answer) {
      const blob =
        typeof page.fast_answer === "string"
          ? page.fast_answer
          : JSON.stringify(page.fast_answer);
      if (blob.includes("This article")) throw new Error("Contains blog jargon: 'This article'");
      if (blob.includes("In this guide")) throw new Error("Contains blog jargon: 'In this guide'");
    }

    // MUST HAVE GUIDED DIAGNOSIS
    if (!page.guided_diagnosis || !Array.isArray(page.guided_diagnosis) || page.guided_diagnosis.length < 3) {
      throw new Error("Guided diagnosis too shallow (min 3)");
    }

    // 6. FINAL STRICT CHECKS
    if (!page.mermaid_diagram.includes("?")) {
      throw new Error("Flowchart missing binary diagnostic questions (?)");
    }
    for (const cause of page.causes) {
      if (!cause.test || !cause.expected_result) {
        throw new Error(`Cause missing direct physical test or expected_result: ${cause.name}`);
      }
    }
    const genericModes = ["General", "System", "Other", "Unknown", "Miscellaneous"];
    for (const mode of page.failure_modes) {
      if (genericModes.includes(mode.name)) {
        throw new Error(`Failure mode is too generic, must represent physical state: ${mode.name}`);
      }
    }

  } catch (err: any) {
    return { valid: false, error: err.message, errors: [err.message] };
  }

  return { valid: true, errors: [] };
}

```

### `lib/normalize-content.ts`

```typescript
export type NormalizeContentOptions = {
  /** Route slug (e.g. symptom) — applied for v2 gold payloads so templates receive canonical breadcrumbs. */
  slug?: string;
};

/**
 * Align DB `pages.schema_version` with `content_json` payload fields before templates read the row.
 * Call once; treat the return value as canonical for rendering.
 *
 * Does NOT truncate, merge unrelated fields, or simplify strings — only JSON-parse, spread, and
 * set schemaVersion/slug for v2 gold pages.
 */
export function normalizeContent(
  raw: any,
  schema: string,
  options?: NormalizeContentOptions
) {
  if (raw == null) {
    return raw;
  }

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (schema === "v2_goldstandard") {
    return {
      ...parsed,
      ...(options?.slug != null && options.slug !== ""
        ? { slug: options.slug }
        : {}),
      schemaVersion: "v1",
    };
  }

  return parsed;
}
```

### `lib/infer-diagnostic-schema.ts`

```typescript
/**
 * When `pages.schema_version` is null (older jobs, drift, or manual inserts),
 * infer which renderer branch to use so /diagnose/[symptom] does not fall through
 * to "Unknown schema" with only the debug footer visible.
 */

export function inferDiagnosticSchemaVersion(content: unknown): string | null {
  if (content == null || typeof content !== "object") return null;
  const o = content as Record<string, unknown>;

  if (o.schemaVersion === "v2_goldstandard") {
    return "v2_goldstandard";
  }

  const hasV5OrLegacyHub =
    Array.isArray(o.failure_modes) ||
    Array.isArray(o.causes) ||
    Array.isArray(o.repairs) ||
    Array.isArray(o.guided_diagnosis) ||
    (typeof o.mermaid_diagram === "string" && o.mermaid_diagram.trim().length > 0) ||
    Array.isArray(o.diagnostic_order) ||
    Array.isArray(o.commonCauses) ||
    typeof o.mermaidGraph === "string" ||
    (o.hero !== null && typeof o.hero === "object") ||
    (o.diagnosticFlow !== null && typeof o.diagnosticFlow === "object");

  if (hasV5OrLegacyHub) {
    return "v5_master";
  }

  if (o.fast_answer !== undefined && o.fast_answer !== null) {
    return "v5_master";
  }

  return null;
}

```

### `lib/page-status.ts`

```typescript
/**
 * `pages.status` values — independent from `generation_queue.status`.
 * Never assign queue/job status directly to `pages.status` (they use different lifecycles).
 */
/** Stored in `pages.schema_version` for DG-style HVAC + display-bridge payloads. */
export const SCHEMA_VERSION_V6_DG_HVAC = "v6_dg_hvac_hybrid" as const;

export const PagesStatus = {
  DRAFT: "draft",
  GENERATED: "generated",
  VALIDATED: "validated",
  PUBLISHED: "published",
  FAILED: "failed",
  STALE: "stale",
} as const;

export type PagesStatusValue = (typeof PagesStatus)[keyof typeof PagesStatus];

/** Successful dual-write from the generation worker: always `published` (not queue `published`). */
export function pagesStatusAfterSuccessfulGeneration(): PagesStatusValue {
  return PagesStatus.PUBLISHED;
}

```

### `lib/content-engine/core.ts`

```typescript
import { createHash } from 'node:crypto';
import { Schema, GeneratedContent } from './schema';
import { validatePage } from '../validators/page-validator';

export const ENGINE_VERSION = "v4.0";

export const MASTER_GOLD_STANDARD_PROMPT = `
You are generating a GOLD STANDARD authority diagnostic page.

This page must be:
- materially better than top 3 Google results
- written like an expert technician + conversion strategist
- deeply structured, NOT generic
- designed to solve the problem AND drive action

DO NOT produce thin content.
DO NOT repeat generic advice.
DO NOT write filler.

Every section must add NEW value, specificity, or clarity.

🧱 REQUIRED PAGE STRUCTURE (EXPANDED)

1. HERO (HIGH-IMPACT, NON-GENERIC)
Clear problem statement, immediate instruction (if urgent), and confidence-building tone. Include "Do this first", "Avoid this mistake", and expectation setting.

2. QUICK ANSWER (FEATURED SNIPPET BAIT)
3–5 bullet points. Direct, actionable, no fluff.

3. DIAGNOSTIC FLOW (CORE DIFFERENTIATOR)
Step-by-step logic. Yes/No branching mindset. Each step must isolate the cause and lead to the next action. This is NOT optional — this is your edge.

4. ROOT CAUSES (DEEP, NOT GENERIC)
For EACH cause: what it is, why it happens, how to confirm it, severity (low / medium / high), and likelihood (common / uncommon). Minimum: 5 causes. Must NOT overlap or feel repetitive.

5. FIXES (ACTIONABLE + SPECIFIC)
For EACH fix: exact steps, tools required, difficulty level, time estimate, and when NOT to DIY. No vague advice like "check the system".

6. COST BREAKDOWN (MONEY SECTION)
Repair cost ranges, DIY vs professional cost comparison, what affects the price, and when the cost spikes. This increases conversion heavily.

7. PREVENTION (AUTHORITY LAYER)
How to avoid the issue long-term, specific maintenance habits, and system upgrades. Builds trust + expertise.

8. WARNING SIGNS (EARLY DETECTION)
Symptoms before failure, what users typically miss, and escalation patterns.

9. CTA (AGGRESSIVE BUT NATURAL)
Include "Get help now", "Talk to a local expert", and natural urgency if applicable. Must appear after diagnostic, after fixes, and at the bottom.

10. INTERNAL LINKS (GRAPH BUILDER)
Must include related symptoms, related system pages, and related authority guides to strengthen the SEO network.

11. FAQ (LONG-TAIL SEO)
4–6 questions using real user phrasing with concise answers.

🔥 CRITICAL DEPTH RULES:
- Each section must contain at least 2–4 paragraphs OR structured bullet logic.
- Avoid repeating the same explanation across sections.
- Each cause must feel distinct and testable.
- Each fix must include real-world execution detail.
- Use specific terminology (evaporator coil, capacitor, airflow restriction, etc.).
- Avoid generic phrases like "this could be caused by several factors".

⚡ MONETIZATION LAYER (VERY IMPORTANT):
- Include clear moments where the user realizes they need help.
- Highlight the risk of doing nothing.
- Highlight the risk of incorrect DIY.
- Introduce professional help naturally.
- Reinforce urgency for high-severity issues.

🧠 OUTPUT QUALITY FILTER:
Before finalizing, ensure:
- This page would outperform existing Google results.
- A real technician would not find this "basic".
- A user could actually solve or diagnose their issue from this page alone.
- The page builds confidence AND drives action.

-----------------------------------
OUTPUT FORMAT (STRICT JSON)
-----------------------------------

{
  "slug": "string",
  "page_type": "diagnostic",
  "title": "string",
  "relationships": { "system": [], "symptoms": [], "diagnostics": [], "causes": [], "repairs": [] },
  "content": {
    "hero": {
      "problemStatement": "...",
      "immediateInstruction": "...",
      "expectationSetting": "..."
    },
    "quickAnswer": [
      "...", "..."
    ],
    "diagnosticFlow": [
      {
        "step": "...",
        "logic": "...",
        "nextAction": "..."
      }
    ],
    "causes": [
      {
        "whatItIs": "...",
        "whyItHappens": "...",
        "howToConfirm": "...",
        "severity": "low|medium|high",
        "likelihood": "common|uncommon"
      }
    ],
    "fixes": [
      {
        "fixName": "...",
        "exactSteps": ["...", "..."],
        "toolsRequired": ["...", "..."],
        "difficultyLevel": "...",
        "timeEstimate": "...",
        "whenNotToDiy": "..."
      }
    ],
    "costBreakdown": {
      "repairCostRanges": "...",
      "diyVsProfessional": "...",
      "whatAffectsPrice": "...",
      "whenCostSpikes": "..."
    },
    "prevention": {
      "howToAvoidLongTerm": "...",
      "maintenanceHabits": ["...", "..."],
      "systemUpgrades": "..."
    },
    "warningSigns": {
      "symptomsBeforeFailure": ["...", "..."],
      "whatUsersMiss": "...",
      "escalationPatterns": "..."
    },
    "cta": {
      "primary": "...",
      "secondary": "...",
      "urgency": "..."
    },
    "internalLinks": ["...", "..."],
    "faq": [
      {
        "question": "...",
        "answer": "..."
      }
    ]
  }
}

Return ONLY valid JSON. No commentary.
`.trim();

export const EXPECTED_PROMPT_HASH = createHash('sha256')
  .update(MASTER_GOLD_STANDARD_PROMPT, 'utf8')
  .digest('hex');

export function validateContent(data: unknown, pageType: string = "diagnostic") {
  const result = validatePage(data);
  return {
    success: result.valid,
    error: result.error ? { flatten: () => result.errors } : null,
    data: data
  };
}

```

### `lib/diagnostic-engine.ts`

```typescript
import { SYMPTOMS, CAUSES, REPAIRS } from "@/data/knowledge-graph";
import sql from "./db";
import { normalizeToString } from "@/lib/utils";

/**
 * GENERATION GUARDRAILS
 * Minimum threshold for a symptom-city combo to be considered "high quality"
 */
const MIN_CAUSES_FOR_PAGE = 2;
const MIN_REPAIRS_FOR_PAGE = 2;

export interface DiagnosticStep {
  step: string;
  action: string;
}

export interface SymptomData {
  id: string;
  name: string;
  slug: string;
  description: string;
  causes: any[];
}

/**
 * Diagnostic logic for the "Residential HVAC Manual" look.
 * Translates component-based causes into human-readable manual steps.
 */
export function getDiagnosticSteps(causeIds: string[]): DiagnosticStep[] {
  // Map specific components to universal manual steps
  const steps: DiagnosticStep[] = [
    {
      step: "Safety First: Power Down",
      action: "Locate the SERVICE DISCONNECT at the outdoor unit or the HVAC breaker in your main electrical panel. Turn it OFF."
    },
    {
      step: "Check the Air Filter",
      action: "Remove your indoor air filter. If you cannot see light through it, replace it immediately. A clogged filter is the #1 cause of airflow issues."
    }
  ];

  // Add more steps based on the causes provided
  if (causeIds.includes("refrigerant-leak") || causeIds.includes("dirty-coils")) {
    steps.push({
      step: "Inspect the Indoor Coil",
      action: "Look for ice buildup on the copper lines. If found, let the system thaw for 4 hours before calling a technician."
    });
  }

  if (causeIds.includes("failed-capacitor") || causeIds.includes("welded-contactor")) {
    steps.push({
      step: "Listen for Fan Sounds",
      action: "If you hear a humming sound but the outdoor fan isn't spinning, DO NOT keep the power on. This indicates a motor or capacitor failure."
    });
  }

  steps.push({
    step: "Final Validation",
    action: "Restore power and set the thermostat to 5 degrees below current room temperature. Wait 15 minutes for the compressor 'time-delay' to end."
  });

  return steps;
}

/**
 * Content guardrail: prevents generating "thin" pages
 */
export function shouldGeneratePage(symptomId: string): boolean {
  const symptom = SYMPTOMS.find(s => s.id === symptomId);
  if (!symptom) return false;
  
  return symptom.causes.length >= MIN_CAUSES_FOR_PAGE;
}

/**
 * DISCOVERY PIPELINE
 * Implementation of the "Deterministic Knowledge Graph" candidate search.
 */
export function getValidCandidates() {
  return SYMPTOMS.filter(s => shouldGeneratePage(s.id));
}

export function getCauseDetails(causeId: string) {
  const cause = CAUSES[causeId];
  if (!cause) return null;

  return {
    ...cause,
    repairDetails: cause.repairs.map(rId => REPAIRS[rId]).filter(Boolean)
  };
}

/**
 * NEON ASYNC HELPERS (DecisionGrid Overhaul)
 *
 * `/diagnose/...` reads `pages.status`:
 * - **Production (default):** `published` | `validated` | `review` only — avoids half-baked `draft` / `generated` rows.
 * - **Relaxed:** non-production, or set `DIAGNOSE_ALLOW_DRAFT_GENERATED=1` or `NEXT_PUBLIC_DIAGNOSE_ALLOW_DRAFT_GENERATED=1`
 *   so pipeline rows (`generated`, `draft`) still resolve while debugging.
 */
export function diagnoseRoutePageStatuses(): string[] {
  const allowDraft =
    process.env.NODE_ENV !== "production" ||
    process.env.DIAGNOSE_ALLOW_DRAFT_GENERATED === "1" ||
    process.env.NEXT_PUBLIC_DIAGNOSE_ALLOW_DRAFT_GENERATED === "1";
  if (allowDraft) {
    return ["published", "validated", "review", "generated", "draft"];
  }
  return ["published", "validated", "review"];
}

export async function getDiagnosticPageFromDB(
  slug: string, 
  category: string,
  city?: string | null
): Promise<any | null> {
  try {
    const statuses = diagnoseRoutePageStatuses();
    let rows;
    if (city) {
      rows = await sql`
        SELECT * FROM pages
        WHERE slug = ${slug} 
          AND page_type = ${category} 
          AND city = ${city}
          AND status = ANY(${statuses}::text[])
      `;
    } else {
      rows = await sql`
        SELECT * FROM pages
        WHERE slug = ${slug} 
          AND page_type = ${category} 
          AND (city IS NULL OR city = '')
          AND status = ANY(${statuses}::text[])
      `;
    }
    // const fs = require('fs');
    // fs.appendFileSync('debug-render.txt', `\\n[DB FETCH SUCCESS] ${slug} | ${category} | ROWS: ${rows?.length}\\n`);
    const page = rows[0];
    if (!page) return null;

    const content = page.content_json || {};

    const effectiveSchema =
      page.schema_version ||
      content.schema_version ||
      content.schema ||
      null;

    return {
      ...page,
      schema: effectiveSchema,          // 👈 backfill for old UI
      schema_version: effectiveSchema,  // 👈 canonical
      content_json: content,
    };
  } catch (error: any) {
    // const fs = require('fs');
    // fs.appendFileSync('debug-render.txt', `\\n[DB FETCH ERROR] ${slug} | ${error.message}\\n`);
    console.error('Neon Query Error:', error);
    return null;
  }
}

export async function getSymptomWithCausesFromDB(symptomSlug: string): Promise<SymptomData | null> {
  try {
    const symptom = await sql`
      SELECT * FROM symptoms WHERE slug = ${symptomSlug} LIMIT 1
    `;
    
    if (!(symptom as any[])[0]) return null;

    const causes = await sql`
      SELECT c.* 
      FROM causes c
      JOIN symptom_causes sc ON sc.cause_id = c.id
      WHERE sc.symptom_id = ${(symptom as any[])[0].id}
      ORDER BY c.id
    `;

    // Fetch repairs via cause_repairs (DecisionGrid) or legacy cause_id
    const causeIds = (causes as any[]).map((c: any) => c.id);
    let repairs: any[] = [];
    try {
      repairs = await sql`
        SELECT r.*, cr.cause_id 
        FROM repairs r 
        JOIN cause_repairs cr ON cr.repair_id = r.id
        WHERE cr.cause_id = ANY(${causeIds})
      `;
    } catch {
      try {
        repairs = await sql`
          SELECT r.*, r.cause_id FROM repairs r WHERE r.cause_id = ANY(${causeIds})
        `;
      } catch {}
    }

    const repairsByCause = (repairs as any[]).reduce((acc: Record<string, any[]>, r: any) => {
      const cid = r.cause_id;
      if (!acc[cid]) acc[cid] = [];
      acc[cid].push({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description || r.repair_type || r.name,
        estimatedCost: r.estimated_cost || (r.skill_level === 'advanced' ? 'high' : r.skill_level === 'moderate' ? 'medium' : 'low'),
        skill_level: r.skill_level || 'moderate'
      });
      return acc;
    }, {});

    const causesWithRepairs = (causes as any[]).map((c: any) => ({
      ...c,
      id: c.slug || c.id,
      explanation: c.explanation || c.description || '',
      repairDetails: repairsByCause[c.id] || []
    }));

    return {
      ...(symptom as any[])[0],
      id: (symptom as any[])[0].slug || (symptom as any[])[0].id,
      causes: causesWithRepairs
    } as any;
  } catch (error) {
    console.error('Neon Symptom Fetch Error:', error);
    return null;
  }
}
export async function getComponentData(componentSlug: string) {
  try {
    const symptoms = SYMPTOMS.filter(s => 
      s.causes?.some((cId: string) => {
        const cause = getCauseDetails(cId);
        return normalizeToString(cause?.component).toLowerCase() === normalizeToString(componentSlug).toLowerCase();
      })
    );

    const repairs = SYMPTOMS.flatMap(s => s.causes || [])
      .map(cId => getCauseDetails(cId))
      .filter(c => normalizeToString(c?.component).toLowerCase() === normalizeToString(componentSlug).toLowerCase())
      .flatMap(c => c?.repairDetails || [])
      .slice(0, 10);

    return {
      component: componentSlug,
      symptoms,
      repairs: Array.from(new Set(repairs.map(r => JSON.stringify(r)))).map(s => JSON.parse(s))
    };
  } catch (error) {
    console.error('Component Data Fetch Error:', error);
    return null;
  }
}

```

### `scripts/generation-worker.ts`

```typescript
import "dotenv/config";
import {
  BATCH_SIZE,
  getQueuedJobs,
  markFailedPermanent,
  queueAttemptCount,
} from "../lib/generation-queue";
import sql from '../lib/db';
import { generateDiagnosticEngineJson, transformDGToUnified, assertCriticalDiagnosticFields } from '../lib/content-engine/generator';
import { getFallback, Schema } from '../lib/content-engine/schema';
import { EXPECTED_PROMPT_HASH } from '../lib/content-engine/core';
import { normalizeToBaseSlug, buildSlug } from '../lib/slug-helpers';
import { buildRetryPromptFragment } from '../lib/prompt-schema-router';
import { scoreGoldStandardPage, type PageType, PUBLISH_THRESHOLDS } from '../lib/quality-scorer';
import { shouldUseAiForQueueJob } from "../lib/content-strategy";
import {
  checkSpendSpikeAndShutdown,
  isEmergencyGenerationShutdown,
} from "../lib/emergency-generation-shutdown";
import { validateV2 } from "../lib/validators/validate-v2";
import { migrateOnePage } from "../lib/content-engine/relational-upsert";
import { QueueStatus } from "../lib/queue-status";
import { pagesStatusAfterSuccessfulGeneration } from "../lib/page-status";

console.log("DB URL:", process.env.DATABASE_URL);
if (process.env.DRY_RUN === "true") {
  console.log("🧪 DRY_RUN=true — no AI calls; jobs will be released back to draft.");
}

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/^diagnose\//, '')
    .replace(/^repair\/[^/]+\//, '') // 🔥 strips location layer
    .replace(/\s+/g, '-')
    .trim();
}

let isWorkerRunning = false;

export async function runWorker(options: { limit?: number, manual?: boolean, type?: string } = {}) {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.log("🚫 Generation globally disabled");
    return { success: false, reason: "GENERATION_DISABLED" };
  }

  if (await isEmergencyGenerationShutdown()) {
    console.log(
      "🚨 Emergency generation shutdown is ON (system_state). Clear: UPDATE system_state SET value = 'false' WHERE key = 'generation_emergency_shutdown';"
    );
    return { success: false, reason: "EMERGENCY_SHUTDOWN" };
  }

  if (await checkSpendSpikeAndShutdown()) {
    return { success: false, reason: "SPEND_SPIKE_SHUTDOWN" };
  }

  try {
    const spendRes = await sql`
      SELECT COUNT(*) as generated_today
      FROM pages
      WHERE DATE(updated_at) = CURRENT_DATE
        AND status = 'published'
    `;
    const todaySpend = parseInt((spendRes as any[])[0]?.generated_today || "0", 10);
    // Hard $5 Daily Budget Cap
    const DAILY_BUDGET = 5; // dollars
    const estimatedCost = todaySpend * 0.01; // ~1 cent per generation

    if (estimatedCost >= DAILY_BUDGET) {
      console.log(`💸 Daily budget reached ($${estimatedCost.toFixed(2)} / $${DAILY_BUDGET}). Stopping.`);
      process.exit(0);
    }
  } catch (e) {
    console.log("⚠️ Could not verify daily spend guard, proceeding with caution.");
  }

  if (isWorkerRunning) {
    console.log("⚠️ Worker is already running. Skipping execution.");
    return { success: false, reason: "Already running" };
  }
  isWorkerRunning = true;

  console.log('🚀 Starting Authority HVAC Worker...');
  try {
    await sql`INSERT INTO system_logs (event_type, message) VALUES ('worker_start', 'Worker started')`;
  } catch(e) {}

  let processedCount = 0;
  let failedCount = 0;

  try {
    let lockAcquired = false;
    try {
      const lockRes = await sql`SELECT pg_try_advisory_lock(999999) as locked`;
      lockAcquired = lockRes[0]?.locked;
    } catch {
      lockAcquired = true; 
    }

    if (!lockAcquired) {
      console.log("⚠️ Global DB lock already held. Another worker is running.");
      isWorkerRunning = false;
      return { success: false, reason: "DB lock held" };
    }

    if (!options.manual) {
      const autoModeState = await sql`SELECT value FROM system_state WHERE key = 'auto_mode' LIMIT 1` as any[];
      if (autoModeState[0]?.value === 'OFF') {
        console.log("🛑 Auto Mode is OFF. Cron execution blocked. Use manual run.");
        isWorkerRunning = false;
        try { await sql`SELECT pg_advisory_unlock(999999)`; } catch {}
        return { success: false, reason: "Auto Mode OFF" };
      }
    }

    let batchSize =
      typeof options.limit === "number" && options.limit > 0
        ? options.limit
        : parseInt(process.env.CANARY_BATCH_SIZE || String(BATCH_SIZE), 10) || BATCH_SIZE;

    const MAX_JOBS_PER_RUN = 50;
    if (batchSize > MAX_JOBS_PER_RUN) {
      console.log(`⚠️ Requested batch size (${batchSize}) exceeds hard limit. Capping to ${MAX_JOBS_PER_RUN}.`);
      batchSize = MAX_JOBS_PER_RUN;
    }

    const items = (await getQueuedJobs(batchSize, options.type)) as any[];

    console.log(`📦 Fetched ${items.length} draft/queued jobs (batch up to ${batchSize}).`);

    for (const job of items) {
      if (process.env.GENERATION_ENABLED !== "true") {
        console.log("🛑 Mid-batch stop — GENERATION_ENABLED off (e.g. emergency spend spike)");
        for (const j of items) {
          await sql`
            UPDATE generation_queue
            SET status = ${QueueStatus.DRAFT}
            WHERE id = ${j.id} AND status IN ('generated', 'processing')
          `;
        }
        break;
      }

      const attemptCount = queueAttemptCount(job as Record<string, unknown>);
      if (attemptCount > 1) {
        console.log("🔒 attempt_count > 1 — permanent fail:", job.id, job.proposed_slug);
        await markFailedPermanent(job.id as number);
        failedCount++;
        continue;
      }

      const proposedSlug = job.proposed_slug;
      const pageTypeForSlug = job.proposed_slug?.startsWith("repair/") ? "repair" : (job.page_type || "symptom");
      const pageType = pageTypeForSlug || "symptom";

      if (process.env.DRY_RUN === "true") {
        console.log("Would generate:", proposedSlug, { page_type: job.page_type, id: job.id });
        await sql`
          UPDATE generation_queue
          SET status = ${QueueStatus.DRAFT}
          WHERE id = ${job.id}
        `;
        continue;
      }

      if (!shouldUseAiForQueueJob(String(job.page_type || pageType), String(proposedSlug))) {
        console.log(
          "📍 Layer 8 — skipping AI for location/template page (expand from canonical symptom in code):",
          proposedSlug
        );
        await sql`
          UPDATE generation_queue
          SET
            status = ${QueueStatus.PUBLISHED},
            last_error = 'layer8_template_expansion'
          WHERE id = ${job.id}
        `;
        processedCount++;
        continue;
      }

      try {
        console.log("🚀 GENERATING:", proposedSlug);

        let attempts = 0;
        let lastError = "";
        let finalResult: any = null;
        /** Never `generation_queue.status` — only `pages.status` lifecycle (see lib/page-status.ts). */
        let pagesInsertStatus: ReturnType<typeof pagesStatusAfterSuccessfulGeneration> | null = null;
        let schemaVersion = "v5_master";

        while (attempts < 3) {
          const rawDg = await generateDiagnosticEngineJson(
            { symptom: proposedSlug, city: job.city || "Florida", pageType },
            lastError,
            job.orchestrator_options
          );

          console.log(`📦 JSON GENERATED (Attempt ${attempts + 1}/3):`, proposedSlug);

          let validation = { valid: false, error: "" };
          try {
            validateV2(rawDg);
            validation = { valid: true, error: "" };
          } catch(ve: any) {
            validation = { valid: false, error: ve.message };
          }

          if (validation.valid) {
            console.log(`✅ Validation passed for ${proposedSlug}`);
            finalResult = rawDg;
            pagesInsertStatus = pagesStatusAfterSuccessfulGeneration();
            break;
          }

          console.log(`⚠️ Validation failed: ${validation.error}. Retrying ${proposedSlug}...`);
          lastError = validation.error || "Unknown validation failure";
          attempts++;
        }

        if (!pagesInsertStatus || !finalResult) {
          console.error(`❌ Rejected weak page ${proposedSlug}. Failed on: ${lastError}`);
          throw new Error(lastError || "Failed all 3 attempts to generate valid schema");
        }

        const result = finalResult;

        await sql`
          UPDATE generation_queue
          SET status = ${QueueStatus.VALIDATED}
          WHERE id = ${job.id}
        `;

        // Add required properties
        (result as any)._prompt_hash = EXPECTED_PROMPT_HASH;
        (result as any).engineVersion = "v5.0";

        console.log({
          slug: proposedSlug,
          pages_status: pagesInsertStatus,
          causes: result?.content?.causes?.length || result?.content?.top_causes?.length,
          steps: result?.content?.diagnostic_flow?.length || result?.content?.diagnosticFlow?.length,
        });

        const cleanSlug = normalizeSlug(proposedSlug);
        let city = job.city || null;
        if (!city && proposedSlug.startsWith('repair/')) {
          const parts = proposedSlug.split('/');
          if (parts.length >= 3) {
            city = parts[1];
          }
        }

        console.log("💾 DUAL-WRITE V2 START:", cleanSlug);

        // V2 Relational Engine Native Upsert
        // (This validates, drops junctions, and transactionally layers Causes, Repais, Flowcharts into PG)
        await migrateOnePage(sql, null, cleanSlug, result);

        // V1 Legacy Fallback Upsert (True Dual-Write)
        // pages.status is NOT derived from generation_queue.status.
        const res = await sql`
          INSERT INTO pages (slug, content_json, status, page_type, title, city, schema_version)
          VALUES (
            ${cleanSlug},
            ${JSON.stringify(result)}::jsonb,
            ${pagesInsertStatus},
            ${result.page_type || pageType},
            ${result.title || 'Untitled'},
            ${city},
            ${schemaVersion}
          )
          ON CONFLICT (slug) DO UPDATE
          SET content_json = EXCLUDED.content_json,
              title = EXCLUDED.title,
              status = EXCLUDED.status,
              page_type = EXCLUDED.page_type,
              schema_version = EXCLUDED.schema_version,
              updated_at = NOW()
          RETURNING slug;
        `;

        console.log("✅ DUAL-WRITE SUCCESS:", cleanSlug);
        console.log(`ORCH::PAGE_CREATED=${JSON.stringify({ slug: cleanSlug, url: "/diagnose/" + cleanSlug })}`);
        await new Promise(res => setTimeout(res, 1000));

        await sql`
          UPDATE generation_queue
          SET status = ${QueueStatus.PUBLISHED}
          WHERE id = ${job.id}
        `;

        processedCount++;

      } catch (err: any) {
        console.error("❌ HARD FAILURE:", proposedSlug);
        if (err.issues) console.error("ZOD ISSUES:", JSON.stringify(err.issues, null, 2));
        else console.error(err.message || err);

        const msg = String(err?.message || err);
        console.log(`ORCH::ERROR=${JSON.stringify({ slug: proposedSlug, error: msg.slice(0, 500) })}`);
        const isDailyLimit = msg.includes("DAILY_SPEND_LIMIT_REACHED");
        const isRateLimit = err?.code === '429' || err?.status === 429 || msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota");
        const PAGE_QUEUE_FAIL_AFTER_ATTEMPTS = parseInt(process.env.PAGE_QUEUE_FAIL_AFTER_ATTEMPTS || "3", 10);

        if (isDailyLimit) {
          await sql`
            UPDATE generation_queue
            SET status = ${QueueStatus.DRAFT}
            WHERE id = ${job.id}
          `;
        } else if (isRateLimit) {
          console.log("🛑 429 Rate Limit hit. Failing job permanently to prevent burn loop.");
          await sql`
            UPDATE generation_queue
            SET attempts = ${PAGE_QUEUE_FAIL_AFTER_ATTEMPTS}, status = ${QueueStatus.FAILED}, last_error = ${msg.slice(0, 2000)}
            WHERE id = ${job.id}
          `;
        } else {
          const prev = queueAttemptCount(job as Record<string, unknown>);
          const next = prev + 1;
          if (next >= PAGE_QUEUE_FAIL_AFTER_ATTEMPTS) {
            await sql`
              UPDATE generation_queue
              SET
                attempts = ${next},
                status = ${QueueStatus.FAILED},
                last_error = ${msg.slice(0, 2000)}
              WHERE id = ${job.id}
            `;
          } else {
            await sql`
              UPDATE generation_queue
              SET
                attempts = ${next},
                status = ${QueueStatus.DRAFT},
                last_error = ${msg.slice(0, 2000)}
              WHERE id = ${job.id}
            `;
          }
        }
        if (isDailyLimit) {
          console.log("💸 Stopping batch — daily budget; job re-queued for later.");
          const otherIds = items.map((j: { id: number }) => j.id).filter((id: number) => id !== job.id);
          for (const oid of otherIds) {
            await sql`
              UPDATE generation_queue
              SET status = ${QueueStatus.DRAFT}
              WHERE id = ${oid} AND status IN ('generated', 'processing')
            `;
          }
          break;
        }
        failedCount++;
      }
    }

    try {
      await sql`SELECT pg_advisory_unlock(999999)`;
    } catch {}

  } catch (error: any) {
    console.error('Worker Fatal Error:', error);
    try { await sql`SELECT pg_advisory_unlock(999999)`; } catch {}
  }

  console.log('🏁 Worker batch complete.');
  console.log(`ORCH::COMPLETE=${JSON.stringify({ processedCount, failedCount })}`);
  try { await sql`INSERT INTO system_logs (event_type, message) VALUES ('worker_end', 'Worker completed batch')`; } catch(e) {}
  isWorkerRunning = false;

  return { success: true, processedCount, failedCount };
}

if (require.main === module) {
  const isManual = process.argv.includes('--manual');
  const limitArgIndex = process.argv.indexOf('--limit');
  const limit = limitArgIndex > -1 ? parseInt(process.argv[limitArgIndex + 1], 10) : undefined;
  
  const typeArgIndex = process.argv.indexOf('--type');
  const type = typeArgIndex > -1 ? process.argv[typeArgIndex + 1] : undefined;

  console.log("🔄 Starting Queue Drain Mode... " + (type ? `[Type: ${type}]` : ""));

  const startPolling = async () => {
    while (true) {
      try {
        const result = await runWorker({ manual: isManual, limit, type });
        
        if (result?.success === false) {
          console.log("🛑 Exiting: ", result?.reason);
          break;
        }

        if (result?.processedCount === 0 && result?.failedCount === 0) {
          console.log("🏁 No jobs left in queue, exiting");
          break;
        }

        if (isManual) {
          console.log("🏁 Manual single-batch complete. Exiting Drain Mode.");
          break;
        }

        await new Promise(res => setTimeout(res, 1000));
      } catch (err) {
        console.error("Loop error:", err);
        break;
      }
    }
    
    setTimeout(() => {
      console.log("Safely terminating process after 1500ms flush...");
      process.exit(0);
    }, 1500);
  }

  startPolling().catch(err => {
    console.error("Fatal polling error:", err);
    process.exit(1);
  });
}

```

### `lib/content-engine/relational-upsert.ts`

```typescript
import sql from '../db';

export function makeSlug(...parts: string[]) {
  return parts.filter(Boolean).join('-').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function upsertFailureMode(tx: any, system: string, mode: any) {
  const slug = makeSlug(system, mode.name);
  const result = await tx`
    INSERT INTO diagnostic_failure_modes (slug, name, description, system)
    VALUES (${slug}, ${mode.name}, ${mode.description}, ${system})
    ON CONFLICT (system, slug)
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      updated_at = now()
    RETURNING id
  `;
  return result[0].id;
}

export async function upsertCause(tx: any, system: string, cause: any, failureModeId: string) {
  const slug = makeSlug(system, cause.name);
  const result = await tx`
    INSERT INTO diagnostic_causes (
      slug, name, description, system, failure_mode_id, test, expected_result, severity
    )
    VALUES (
      ${slug}, ${cause.name}, ${cause.description}, ${system}, ${failureModeId},
      ${cause.test}, ${cause.expected_result}, ${cause.severity ?? null}
    )
    ON CONFLICT (system, slug)
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      failure_mode_id = EXCLUDED.failure_mode_id,
      test = EXCLUDED.test,
      expected_result = EXCLUDED.expected_result,
      severity = EXCLUDED.severity,
      updated_at = now()
    RETURNING id
  `;
  return result[0].id;
}

export async function upsertRepair(tx: any, system: string, repair: any) {
  const slug = makeSlug(system, repair.name);
  const result = await tx`
    INSERT INTO diagnostic_repairs (
      slug, name, description, difficulty, estimated_cost
    )
    VALUES (
      ${slug}, ${repair.name}, ${repair.description}, ${repair.difficulty}, ${repair.estimated_cost}
    )
    ON CONFLICT (slug)
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      difficulty = EXCLUDED.difficulty,
      estimated_cost = EXCLUDED.estimated_cost,
      updated_at = now()
    RETURNING id
  `;
  return result[0].id;
}

function fastAnswerForDb(fastAnswer: unknown): string {
  if (fastAnswer == null) return "";
  if (typeof fastAnswer === "string") return fastAnswer;
  return JSON.stringify(fastAnswer);
}

export async function upsertPage(tx: any, pageSlug: string, sourceId: string | null, payload: any) {
  const result = await tx`
    INSERT INTO diagnostic_pages (
      slug, title, symptom, system, fast_answer, mermaid_diagram, raw_json, source_page_id, source_table
    )
    VALUES (
      ${pageSlug}, ${payload.title}, ${payload.symptom}, ${payload.system},
      ${fastAnswerForDb(payload.fast_answer)}, ${payload.mermaid_diagram}, ${JSON.stringify(payload)}::jsonb, ${sourceId}, 'pages'
    )
    ON CONFLICT (slug)
    DO UPDATE SET
      title = EXCLUDED.title,
      symptom = EXCLUDED.symptom,
      system = EXCLUDED.system,
      fast_answer = EXCLUDED.fast_answer,
      mermaid_diagram = EXCLUDED.mermaid_diagram,
      raw_json = EXCLUDED.raw_json,
      source_page_id = EXCLUDED.source_page_id,
      updated_at = now()
    RETURNING id
  `;
  return result[0].id;
}

export async function clearPageRelations(tx: any, pageId: string) {
  await tx`DELETE FROM diagnostic_page_failure_modes WHERE page_id = ${pageId}`;
  await tx`DELETE FROM diagnostic_page_causes WHERE page_id = ${pageId}`;
  await tx`DELETE FROM diagnostic_guided_diagnosis WHERE page_id = ${pageId}`;
  await tx`DELETE FROM diagnostic_order_steps WHERE page_id = ${pageId}`;
}

export async function migrateOnePage(tx: any, sourceId: string | null, pageSlug: string, payload: any) {
  const pageId = await upsertPage(tx, pageSlug, sourceId, payload);
  await clearPageRelations(tx, pageId);

  const failureModeMap = new Map<string, string>();
  const sysName = payload.system || 'hvac';

  for (let i = 0; i < payload.failure_modes.length; i++) {
    const mode = payload.failure_modes[i];
    const modeId = await upsertFailureMode(tx, sysName, mode);
    failureModeMap.set(mode.name, modeId);

    await tx`
      INSERT INTO diagnostic_page_failure_modes (page_id, failure_mode_id, position)
      VALUES (${pageId}, ${modeId}, ${i})
      ON CONFLICT (page_id, failure_mode_id) DO NOTHING
    `;
  }

  const causeMap = new Map<string, string>();

  for (let i = 0; i < payload.causes.length; i++) {
    const cause = payload.causes[i];
    const failureModeId = failureModeMap.get(cause.failure_mode);
    if (!failureModeId) throw new Error(`Missing failure mode map for cause: ${cause.name}`);

    const causeId = await upsertCause(tx, sysName, cause, failureModeId);
    causeMap.set(cause.name, causeId);

    await tx`
      INSERT INTO diagnostic_page_causes (page_id, cause_id, position)
      VALUES (${pageId}, ${causeId}, ${i})
      ON CONFLICT (page_id, cause_id) DO NOTHING
    `;
  }

  for (const repair of payload.repairs) {
    const causeId = causeMap.get(repair.cause);
    if (!causeId) throw new Error(`Missing cause map for repair: ${repair.name}`);

    const repairId = await upsertRepair(tx, sysName, repair);

    const checkIdx = await tx`
      SELECT position FROM diagnostic_cause_repairs WHERE cause_id = ${causeId} ORDER BY position DESC LIMIT 1
    `;
    const position = checkIdx.length > 0 ? checkIdx[0].position + 1 : 0;

    await tx`
      INSERT INTO diagnostic_cause_repairs (cause_id, repair_id, position)
      VALUES (${causeId}, ${repairId}, ${position})
      ON CONFLICT (cause_id, repair_id) DO NOTHING
    `;
  }

  for (let i = 0; i < payload.guided_diagnosis.length; i++) {
    const gd = payload.guided_diagnosis[i];

    const gdResult = await tx`
      INSERT INTO diagnostic_guided_diagnosis (page_id, scenario, next_step, position)
      VALUES (${pageId}, ${gd.scenario}, ${gd.next_step}, ${i})
      RETURNING id
    `;
    const gdId = gdResult[0].id;

    for (const modeName of gd.likely_modes) {
      const modeId = failureModeMap.get(modeName);
      if (!modeId) throw new Error(`Missing mode map for guided diagnosis: ${modeName}`);

      await tx`
        INSERT INTO diagnostic_guided_diagnosis_modes (guided_diagnosis_id, failure_mode_id)
        VALUES (${gdId}, ${modeId})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  if (payload.diagnostic_order) {
    for (let i = 0; i < payload.diagnostic_order.length; i++) {
      await tx`
        INSERT INTO diagnostic_order_steps (page_id, step_text, position)
        VALUES (${pageId}, ${payload.diagnostic_order[i]}, ${i})
        ON CONFLICT (page_id, position) DO NOTHING 
      `;
    }
  }
}

```

### `lib/content-engine/generator.ts`

```typescript
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  assertDailySpendAllows,
  recordOpenAiChatUsage,
} from "@/lib/ai-spend-guard";
import { assertAutoModeEnabled } from "@/lib/generation-guards";
import OpenAI from "openai";
import {
  MASTER_GOLD_STANDARD_PROMPT,
  EXPECTED_PROMPT_HASH,
  ENGINE_VERSION,
  validateContent
} from "./core";

import {
  getFallback,
  SCHEMA_STRING
} from "./schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new OpenAI({ 
  apiKey: process.env.GEMINI_API_KEY, 
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/" 
});

function safeJsonParse<T>(str: string): T | null {
  try { return JSON.parse(str) as T; } catch { return null; }
}

function isJsonTruncated(str: string): boolean {
  return !str.trim().endsWith("}");
}

// --- RETRY ---
async function callWithRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number, pageType?: string } = {}
): Promise<T> {
  const { maxRetries = 3, pageType = "symptom" } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        const delay = 1000 * (attempt + 1);
        console.warn(`Retry ${attempt + 1}/${maxRetries} in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.error("FAILED_AFTER_3_ATTEMPTS", lastError);
  const hash = EXPECTED_PROMPT_HASH;
  return { ...getFallback(pageType), _prompt_hash: hash } as any as T;
}

function finalizeOutput(raw: string, pageType: string) {
  const fallback = getFallback(pageType);
  try {
    const cleaned = raw.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    const source = parsed?.payload ?? parsed;

    const result = validateContent(source, pageType);

    if (!result.success) {
      console.error("ZOD ERROR:", result.error?.flatten());
      return fallback;
    }

    return result.data;
  } catch (err) {
    console.error("PARSE ERROR:", err);
    return fallback;
  }
}

export async function generateTwoStagePage(
  problem: string,
  options: {
    slug?: string;
    system?: string;
    coreOnly?: boolean;
    pageType?: string;
    keyword?: string;
    scenario?: string;
    /** When true, skips system_state auto_mode check (e.g. worker --manual, canary). */
    bypassAutoMode?: boolean;
  } = {}
) {
  const { slug = "", system = "HVAC", pageType = "symptom", keyword = "", scenario = "" } = options;

  if (process.env.GENERATION_ENABLED !== "true") {
    console.log("🚫 Generation globally disabled");
    return undefined as any;
  }
  await assertAutoModeEnabled({ bypassAutoMode: options.bypassAutoMode === true });
  await assertDailySpendAllows("generateTwoStagePage:start");
  console.log("GENERATION TRIGGERED", new Date());

  return callWithRetry(async () => {
    await assertDailySpendAllows("generateTwoStagePage:retry");
    // --- STAGE 1: Fast/Cheap Structural Layout ---
    let userMsg1 = `Generate HVAC structural overview and SEO blueprint for:
ISSUE: "${problem}"
PROPERTY_TYPE: "commercial or residential depending on context"

Additional Context:
- SLUG: ${slug}
- SYSTEM: ${system}
- PAGE_TYPE: ${pageType}

Generate JSON matching this exact schema:
{
  "slug": "string",
  "page_type": "string",
  "title": "string",
  "relationships": { "system": [], "symptoms": [], "diagnostics": [], "causes": [], "components": [], "context": [], "repairs": [] },
  "content": {
    "hero": { "headline": "...", "subheadline": "..." },
    "symptoms": ["..."],
    "whyItHappens": ["..."],
    "quickChecks": ["..."],
    "faq": [{ "question": "...", "answer": "..." }]
  }
}`;
    let sysMsg = "You are the HVAC fast-routing AI. Output strict JSON.";

    if (pageType === 'authority') {
      userMsg1 = `You are generating a HIGH-CONVERSION HVAC authority page for a local service business.

This is NOT an SEO blog.

This page must:
- Build trust quickly
- Explain simply
- Lead to a service call
- Feel local and actionable

STRICT RULES:
- Output JSON only
- No markdown
- No explanations
- No fluff
- Short paragraphs only
- Every section must support conversion

TONE:
- Clear, confident, professional
- Not technical-heavy
- Homeowner-friendly

---

OUTPUT STRUCTURE:

{
  "type": "authority",
  "slug": "[lowercase, hyphenated slug]",
  "title": "[clean readable title]",
  "hero": {
    "headline": "[strong benefit-driven headline]",
    "subheadline": "[simple explanation + trust subheadline]"
  },
  "explanation": "[3-5 sentences simple breakdown with no jargon]",
  "whyItMatters": "[connect to real homeowner pain]",
  "commonIssues": ["[short issue 1]", "[short issue 2]", "[short issue 3]", "[short issue 4]"],
  "whenToCall": "[strong conversion trigger]",
  "localTrust": {
    "experience": "[experience statement]",
    "guarantee": "[guarantee statement]"
  },
  "cta": {
    "primary": "Call Now",
    "secondary": "Schedule Service"
  },
  "seo": {
    "metaTitle": "[seo meta title]",
    "metaDescription": "[seo meta description]"
  }
}

---

FIELD REQUIREMENTS:

slug:
- lowercase, hyphenated
- example: how-air-conditioners-work

title:
- clean and readable
- no clickbait

hero.headline:
- strong, benefit-driven
- example: "How Your AC Works (And Why It Stops)"

hero.subheadline:
- simple explanation + trust
- example: "Understanding your system helps you avoid costly breakdowns"

explanation:
- simple breakdown (3-5 sentences)
- no jargon

whyItMatters:
- connect to real homeowner pain
- energy bills, breakdowns, comfort

commonIssues:
- 4-6 items
- short phrases
- tied to real failures

whenToCall:
- strong conversion trigger
- urgency but not pushy

localTrust.experience:
- "Serving homeowners with fast, reliable HVAC service"

localTrust.guarantee:
- "Upfront pricing, no surprises"

cta:
- always service-focused

seo.metaTitle:
- include keyword + city placeholder

seo.metaDescription:
- benefit-driven + click-focused

---

CONTEXT:
Topic: ${slug || problem}
City: Tampa

Generate a complete JSON output.`;
    }

    if (pageType === 'hybrid') {
      userMsg1 = `You are generating a HIGH-AUTHORITY HVAC SERVICE PAGE optimized for conversion and local SEO.

This is NOT purely educational. This is a local service "money page".

OUTPUT STRUCTURE:
{
  "page_type": "hybrid",
  "slug": "${slug}",
  "title": "[clean readable title]",
  "hero": {
    "headline": "[urgent + credible headline e.g. AC Not Cooling in Tampa?]",
    "subheadline": "[fast, definitive subheadline]",
    "authorityLine": "[trust injection e.g. Voted #1 Local Experts]"
  },
  "problemSection": {
    "summary": "[clear description of the homeowner's experience]",
    "symptoms": ["[symptom 1]", "[symptom 2]", "[symptom 3]"],
    "impact": "[why waiting makes it worse]"
  },
  "authoritySection": {
    "technicalExplanation": "[simplified accurate technical explanation]",
    "commonCauses": ["[cause 1]", "[cause 2]", "[cause 3]"],
    "riskFactors": ["[risk 1]", "[risk 2]"]
  },
  "solutionSection": {
    "howWeFixIt": ["[step 1]", "[step 2]", "[step 3]"],
    "serviceApproach": "[explanation of your diagnostic method]",
    "timeToFix": "[expected time window]"
  },
  "trustSection": {
    "experience": "[years of experience statement]",
    "certifications": ["[certification 1]", "[certification 2]"],
    "guarantees": ["[guarantee 1]", "[guarantee 2]"]
  },
  "localSection": {
    "primaryCity": "Tampa",
    "areasServed": ["[area 1]", "[area 2]", "[area 3]"],
    "localProof": "[why local climate matters here]"
  },
  "cta": {
    "primary": "Call Now",
    "secondary": "Book Service Today",
    "urgency": "[why call today]"
  },
  "faq": [
    { "question": "[cost/time question]", "answer": "[clear direct answer]" }
  ]
}

CONTEXT:
Topic: ${slug || problem}
City: Tampa

Generate ONLY valid JSON. Keep sections snappy and conversion-focused.`;
      sysMsg = "You are an expert HVAC technician and local service authority. Output strict JSON.";
    }

    const stage1Response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sysMsg },
        { role: "user", content: userMsg1 },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    });
    await recordOpenAiChatUsage("gpt-4o-mini", stage1Response.usage, "two-stage:stage1");

    const raw1 = stage1Response.choices[0]?.message?.content;
    if (!raw1) throw new Error("Stage 1: empty response");
    if (isJsonTruncated(raw1)) throw new Error("Stage 1: output truncated");

    const parsedStage1 = safeJsonParse<any>(raw1.replace(/^\^\s*```json/i, "").replace(/```\s*$/i, "").trim());
    if (!parsedStage1) throw new Error("Stage 1: Invalid JSON");

    let finalObj = parsedStage1;

    if (pageType === "diagnostic") {
      await assertDailySpendAllows("generateTwoStagePage:stage2");
      // --- STAGE 2: Premium Reasoning & Logic Graphs ---
      const userMsg2 = `Act as a Senior HVAC Diagnostics Engineer. Build the deep mechanical reasoning and diagnostic logic for the symptom: "${problem}" (Title: "${parsedStage1.title || problem}").

Generate JSON matching this exact schema:
{
  "content": {
    "systemMechanics": { "downstreamEffects": [], "corePrinciple": "...", "whatBreaks": "..." },
    "graphBlock": { "description": "...", "nodes": [] },
    "safetyRisks": ["..."],
    "decisionFramework": { "recommendation": "..." },
    "technicalDeepDive": { "heatTransferOverview": "..." },
    "repairReasoning": ["..."],
    "diagnosticFlow": [{ "step": "...", "question": "...", "yes": "...", "no": "..." }],
    "commonCauses": ["..."],
    "solutions": ["..."]
  }
}`;

      const stage2Response = await gemini.chat.completions.create({
        model: "gemini-1.5-flash",
        messages: [
          { role: "system", content: "You are an expert HVAC Diagnostic AI. Output strict JSON." },
          { role: "user", content: userMsg2 },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 3500,
      });
      await recordOpenAiChatUsage("gpt-4o", stage2Response.usage, "two-stage:stage2");

      let parsedStage2 = null;
      try {
        const raw2 = stage2Response.choices[0]?.message?.content;
        if (!raw2) throw new Error("Stage 2: empty response");
        if (isJsonTruncated(raw2)) throw new Error("Stage 2: output truncated");

        parsedStage2 = safeJsonParse<any>(raw2.replace(/^\^\s*```json/i, "").replace(/```\s*$/i, "").trim());
        if (!parsedStage2) throw new Error("Stage 2: Invalid JSON");
      } catch (e) {
        console.warn("Stage 2 skipped or failed:", e);
      }

      if (!parsedStage2) {
        console.warn("Stage 2 skipped - falling back to Stage 1 safely");
      }

      // --- SAFE MERGE ---
      finalObj = {
        ...parsedStage1,
        ...(parsedStage2 || {}),
        content: {
          ...(parsedStage1.content || {}),
          ...(parsedStage2?.content || {})
        }
      };
    }

    const content = finalizeOutput(JSON.stringify(finalObj), pageType);

    // 🏆 GOLD STANDARD VALIDATION ENFORCEMENT
    const pageQuality = "GOLD_STANDARD";
    // Using loose checking across the object to support both flat and nested payload structures
    const activePayload = (content as any).content || content;
    const hasFixes = activePayload.fixSteps || activePayload.howWeFixIt || activePayload.solutionSection || activePayload.deep_causes || activePayload.repairOptions;
    const hasCauses = activePayload.causes || activePayload.commonCauses || activePayload.authoritySection;
    const hasFaq = activePayload.faq || activePayload.faqs || activePayload.deep_causes;

    if (!hasFixes || !hasCauses || !hasFaq) {
      throw new Error("NOT_GOLD_STANDARD");
    }

    // Assign locks so the worker can enforce them
    const hash = EXPECTED_PROMPT_HASH;
    (content as any)._prompt_hash = hash;
    (content as any).engineVersion = ENGINE_VERSION;

    try {
      const { getAllPages, generateInternalLinks } = await import('./links');
      const allPages = await getAllPages();
      const internalLinks = generateInternalLinks(slug, allPages);
      (content as any).internalLinks = internalLinks;
    } catch (e) {
      console.error("Failed to append internal links:", e);
    }

    return content;
  }, { pageType });
}

export function transformDGToUnified(dg: Record<string, any>, slug: string, pageType: string) {
  const unifiedTitle = dg.title ?? dg.content?.title ?? slug;

  const unified = {
    slug,
    page_type: pageType,
    title: unifiedTitle,
    relationships: dg.relationships || dg.content?.relationships || { system: [], symptoms: [], diagnostics: [], causes: [], repairs: [] },
    content: {
      // Preserve everything from raw DG first
      ...dg,

      // Keep canonical values stable
      slug,
      title: unifiedTitle,

      // Explicitly map critical DG fields so they are never ambiguous
      decision_tree: dg.decision_tree ?? dg.content?.decision_tree,
      system_explanation: dg.system_explanation ?? dg.content?.system_explanation,
      tech_observation: dg.tech_observation ?? dg.content?.tech_observation,
      diagnostic_flow: dg.diagnostic_flow ?? dg.content?.diagnostic_flow,
      top_causes: dg.top_causes ?? dg.content?.top_causes,
      repair_matrix: dg.repair_matrix ?? dg.content?.repair_matrix,
      quick_tools: dg.quick_tools ?? dg.content?.quick_tools,
    },
  };

  return unified;
}

export function assertCriticalDiagnosticFields(
  page: Record<string, any>,
  pageType?: string
): void {
  if (pageType !== "diagnostic") return;

  const c = page?.content ?? page;

  if (!c?.decision_tree) {
    throw new Error(`Diagnostic output missing decision_tree for slug: ${page?.slug}`);
  }

  if (!Array.isArray(c?.system_explanation) || c.system_explanation.length < 4) {
    throw new Error(`Diagnostic output missing robust system_explanation for slug: ${page?.slug}`);
  }

  if (!Array.isArray(c?.diagnostic_flow) || c.diagnostic_flow.length < 3) {
    throw new Error(`Diagnostic output missing diagnostic_flow for slug: ${page?.slug}`);
  }

  if (!Array.isArray(c?.top_causes) || c.top_causes.length < 3) {
    throw new Error(`Diagnostic output missing top_causes for slug: ${page?.slug}`);
  }
}

export const LAYER1_SYSTEM_LOCK = `You are a senior HVAC diagnostic engineer generating structured diagnostic data for a relational database.

You are NOT writing content.
You are building a diagnostic system.

All outputs must:
- Be mechanically accurate
- Use measurable thresholds
- Eliminate ambiguity
- Follow strict schema`;

export const LAYER2_HARD_CONSTRAINTS = `NON-NEGOTIABLE RULES:

0. TECHNICIAN DENSITY (MASTER)
You are a senior HVAC diagnostic technician.

You MUST explain failures using:
- airflow dynamics (CFM, static pressure, mass flow)
- thermodynamics (heat transfer, phase change, superheat/subcool, enthalpy)
- electrical behavior (capacitors, contactors, voltage, current, motors)

FORBIDDEN in fast_answer.technical_summary, fast_answer.primary_mechanism, cause.mechanism, repair.system_effect:
- Generic comfort-language-only explanations
- Consumer-blog tone
- Hedge words: "may", "might", "could" (use testable, decisive technician phrasing instead)

REQUIRED:
- Every cause MUST include a physical failure mechanism (chain: component → system effect → symptom).
- Every repair MUST include system_effect: what behavior is restored (compression cycle, airflow, control sequence, heat transfer).
- Every diagnostic step / test MUST tie to measurable or observable conditions (temperature, pressure, voltage, airflow).

---

1. FAILURE MODES
- Must represent physical system failure states
- Must NOT be generic categories
- Must describe what is physically failing

BAD EXAMPLES: Electrical Issues, Airflow Problems
GOOD EXAMPLES: Compressor Activation Failure, Refrigerant Circuit Pressure Loss, Heat Exchange Failure, Air Distribution Failure

---

2. TESTS (CRITICAL)
Every cause MUST include:
- A real-world diagnostic test
- A measurable or observable threshold

BAD: "Check capacitor"
GOOD: "Measure capacitance with multimeter; must be within ±6% of rating"

---

3. EXPECTED RESULT
Must define:
- what CONFIRMS the issue
- what ELIMINATES other failure modes

---

4. FLOWCHART
- Must be valid Mermaid flowchart TD
- MUST branch early by physical system state
- Each node MUST be a binary decision ending in a question mark (?)
- The exact, case-sensitive name of EVERY failure mode MUST appear as a node in the Mermaid diagram.

---

5. LANGUAGE
- Use technician confirmation language: "this confirms", "this indicates", "this eliminates"
- No blog phrasing
- No fluff

---

6. INTERNAL SELF-CHECK (MANDATORY)
Before returning JSON, verify internally:
- Each failure mode is a physical system state
- Each cause has a measurable test
- Each expected_result defines pass/fail
- Flowchart includes all failure modes exactly as named
- No generic terms are used

If any rule is violated, restructure your logic silently before outputting the final JSON.`;

export function buildLayer3TaskPrompt(symptom: string, system: string) {
  return `Generate a diagnostic system for:

SYMPTOM: ${symptom}
SYSTEM: ${system}

REQUIREMENTS:

- Produce 3–5 failure modes
- Produce >=4 causes
- Every cause must map to ONE failure mode
- Every cause must include:
  - test
  - expected_result
- Every cause must have >=1 repair

- Include:
  - diagnostic_order
  - guided_diagnosis (3+ scenarios)
  - mermaid_diagram

Return ONLY valid JSON matching schema.
`;
}

export async function generateDiagnosticEngineJson(input: { symptom: string, city: string, pageType?: string }, retryFeedback: string = "", orchestratorOptions: any = null) {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.log("🚫 Generation globally disabled");
    return undefined as any;
  }
  await assertAutoModeEnabled({ bypassAutoMode: true });
  await assertDailySpendAllows("generateDiagnosticEngineJson:start");
  console.log("GENERATION TRIGGERED", new Date());

  const taskPrompt = buildLayer3TaskPrompt(input.symptom, input.pageType || 'HVAC');
  let finalPrompt = `${LAYER1_SYSTEM_LOCK}\n\n${LAYER2_HARD_CONSTRAINTS}\n\n${taskPrompt}`;

  const { DiagnosticPageSchema } = await import("./schema");
  finalPrompt += `\n\nCRITICAL ENFORCEMENT:\nYou MUST return your JSON matching this exact schema specification. Do not deviate. Do not add nested roots.\n${JSON.stringify(DiagnosticPageSchema, null, 2)}\n`;

  if (orchestratorOptions && Object.keys(orchestratorOptions).length > 0) {
    finalPrompt += `\n\nCRITICAL SYSTEM OVERRIDES (ORCHESTRATOR FLAGS):\nYou MUST obey these strict conditions: ${JSON.stringify(orchestratorOptions, null, 2)}\n`;
  }
  return callWithRetry(async () => {
    await assertDailySpendAllows("generateDiagnosticEngineJson:retry");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are the core diagnostic parsing engine. You output strict JSON perfectly according to instructions." },
        { role: "user", content: finalPrompt }
      ],
      max_completion_tokens: 2800
    });
    
    console.log(`ORCH::METRIC=${JSON.stringify({ tokens: response.usage?.total_tokens || 0, cost: (response.usage?.total_tokens || 0) * 0.000002 })}`);
    await recordOpenAiChatUsage("gpt-4o-mini", response.usage, "master-validator-generator");

    const contentStr = response.choices[0]?.message?.content;
    if (!contentStr) throw new Error("Empty AI response");

    try {
      return JSON.parse(contentStr.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim());
    } catch(e: any) {
      console.error("❌ OpenAI API Parsing Failed:", e.message || e);
      throw new Error("Invalid JSON from LLM: " + e);
    }
  }, { maxRetries: 1 }); // Retries are handled cleanly in the generation-worker queue loop
}

```

### `app/diagnose/[symptom]/page.tsx`

```tsx
/**
 * Diagnose symptom route — no “strict lock” 404s:
 * Drift (wrong schema, bad JSON, unknown page_type) renders visible debug — never a blank 404.
 * Missing DB row: inline message + slug (still no 404). Content: normalize once, then branch.
 */
import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { inferDiagnosticSchemaVersion } from "@/lib/infer-diagnostic-schema";
import { normalizeDiagnosticToDisplayModel } from "@/lib/normalize-diagnostic-display";
import { normalizeContent } from "@/lib/normalize-content";
import GoldStandardPage from "@/components/gold/GoldStandardPage";
import DiagnosticGoldPage from "@/components/diagnostic/DiagnosticGoldPage";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Amber JSON footer — dev-only unless NEXT_PUBLIC_DIAGNOSE_DEBUG=1 */
function showDiagnoseDebugFooter(): boolean {
  return (
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DIAGNOSE_DEBUG === "1"
  );
}

/**
 * Soft Retry Proxy to handle Neon DB replica lag and race conditions.
 * Shields freshly generated pages from instantly 404ing while waiting for replica sync.
 */
async function getPageWithRetry(symptom: string, retries = 2) {
  const bare = symptom.replace(/^diagnose\//, "");
  const prefixed = `diagnose/${bare}`;

  for (let i = 0; i <= retries; i++) {
    const aiPage =
      (await getDiagnosticPageFromDB(symptom, "diagnose")) ??
      (await getDiagnosticPageFromDB(symptom, "symptom")) ??
      (await getDiagnosticPageFromDB(prefixed, "symptom")) ??
      (await getDiagnosticPageFromDB(prefixed, "diagnose")) ??
      (await getDiagnosticPageFromDB(symptom, "condition")) ??
      (await getDiagnosticPageFromDB(symptom, "system"));

    if (aiPage) {
      return aiPage;
    }

    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: { symptom: string };
}): Promise<Metadata> {
  const aiPage = await getPageWithRetry(params.symptom);
  if (aiPage?.quality_status === "noindex") {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

function DebugFooter({ meta }: { meta: Record<string, unknown> }) {
  return (
    <pre className="mx-auto mt-8 max-w-4xl whitespace-pre-wrap break-words rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-slate-800">
      {JSON.stringify(meta, null, 2)}
    </pre>
  );
}

export default async function SymptomPage({
  params,
}: {
  params: { symptom: string };
}) {
  const aiPage = await getPageWithRetry(params.symptom);

  const debugMeta = {
    slug: params.symptom,
    page_type: aiPage?.page_type,
    schema: aiPage?.schema_version,
    quality: aiPage?.quality_status,
  };

  if (!aiPage) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-slate-600">
        ❌ No page found: {params.symptom}
      </div>
    );
  }

  const row = aiPage as any;
  const schemaVersion = 
    row.schema_version || 
    inferDiagnosticSchemaVersion(row.content_json) || 
    "";

  let content = normalizeContent(row.content_json || row.data || {}, schemaVersion, { slug: params.symptom });

  if (schemaVersion === "v2_goldstandard" && content && typeof content === "object") {
    content = {
      ...(content as Record<string, unknown>),
      schemaVersion: "v1",
      slug: params.symptom,
    };
  }

  if (schemaVersion === "v5_master" || schemaVersion === "v6_dg_hvac_hybrid") {
    if (!content) {
      return (
        <div className="mx-auto max-w-4xl p-6 text-slate-600">
          ⚠️ Invalid v5 content {JSON.stringify(debugMeta)}
        </div>
      );
    }

    const display = normalizeDiagnosticToDisplayModel(content as Record<string, unknown>, {
      routeSlug: params.symptom,
    });

    return (
      <>
        <DiagnosticGoldPage display={display} routeSlug={params.symptom} />
        {showDiagnoseDebugFooter() ? <DebugFooter meta={debugMeta} /> : null}
      </>
    );
  }

  if (schemaVersion === "v2_goldstandard") {
    if (!content || typeof content !== "object") {
      return (
        <div className="mx-auto max-w-4xl p-6 text-slate-600">
          ⚠️ Invalid v2 content {JSON.stringify(debugMeta)}
        </div>
      );
    }

    const normalized = {
      ...(content as Record<string, unknown>),
      schemaVersion: "v1",
      slug: params.symptom,
    };

    return (
      <>
        <GoldStandardPage data={normalized} />
        <DebugFooter meta={debugMeta} />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 text-slate-600">
      ⚠️ Unknown schema: {String(schemaVersion || "(missing)")}
      {showDiagnoseDebugFooter() ? <DebugFooter meta={debugMeta} /> : null}
    </div>
  );
}

```

### `app/diagnose/[symptom]/error.tsx`

```tsx
"use client";

export default function DiagnoseSymptomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-slate-800">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-wide text-red-900">Diagnose page error</p>
        <p className="mt-2 text-sm text-slate-700">{error.message || "Something went wrong while rendering this page."}</p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-slate-500">digest: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

```

### `app/diagnose/[symptom]/loading.tsx`

```tsx
export default function DiagnoseSymptomLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10" aria-busy="true" aria-label="Loading diagnostic page">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-1/3 rounded bg-slate-200" />
        <div className="h-10 w-4/5 rounded bg-slate-200" />
        <div className="h-24 rounded-xl bg-slate-200" />
        <div className="h-48 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

```

### `lib/normalize-diagnostic-display.ts`

```typescript
/**
 * Single render contract: raw v5_master / v6 JSON → stable shape for DiagnosticGoldPage.
 * Keep validateV2 + relational upsert on the raw payload; this layer is presentation-only.
 */

export type QuickToolkitRow = { tool: string; purpose: string; difficulty: string };
export type ToolsNeededRow = { name: string; purpose: string; difficulty: string };

export type QuickDecisionRow = {
  question?: string;
  likelyModes?: string[];
  nextStep?: string;
};

export type TopCauseRow = {
  name: string;
  failureMode: string;
  signal: string;
  test: string;
  expected: string;
  confidence: number;
  mechanism: string;
  symptoms: string[];
};

export type RepairMatrixRow = {
  name: string;
  cause: string;
  effect: string;
  difficulty: string;
  cost: string;
  description: string;
};

export type BenchProcedureRow = {
  title: string;
  steps: string[];
  field_insight: string;
};

export type FaqRow = { question: string; answer: string };

/** Stable display model for the DG/HVAC hybrid shell (DiagnosticGoldPage). */
export type DiagnosticGoldDisplayModel = {
  title: string;
  symptom: string;
  system: string;

  summary: unknown;
  toolkit: QuickToolkitRow[];

  overview: string;

  quickDecisionTree: QuickDecisionRow[];
  /** Raw guided rows for FastIsolationPanel */
  guidedDiagnosis: unknown[];

  systemExplainer: string;
  diagnosticOrder: string[];
  mermaid: string;

  failureModeNames: string[];

  topCauses: TopCauseRow[];

  repairMatrix: RepairMatrixRow[];

  benchProcedures: BenchProcedureRow[];

  /** Structured tools list (explicit schema field tools_needed) */
  tools: ToolsNeededRow[];

  prevention: string[];

  faq: FaqRow[];

  internalLinks: unknown[];
};

/**
 * Older `content_json` rows used a "hub" shape (hero, commonCauses, mermaidGraph)
 * instead of v5_master field names. Map into v5-like fields before display mapping.
 */
function mergeLegacyHubContent(raw: Record<string, unknown>, routeSlug?: string): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };

  const hero = raw.hero as Record<string, unknown> | undefined;
  if (hero && typeof hero === "object") {
    if (!out.title && typeof hero.title === "string") out.title = hero.title;
    if (out.fast_answer == null) {
      const sub = hero.subtitle ?? hero.description;
      if (typeof sub === "string" && sub.trim()) out.fast_answer = sub;
    }
  }

  if ((!Array.isArray(out.causes) || out.causes.length === 0) && Array.isArray(raw.commonCauses)) {
    out.causes = raw.commonCauses.map((name) => ({
      name: String(name),
      failure_mode: String(name),
      diagnostic_signal: "Cross-check this pattern against operating conditions and quick checks.",
      test: "Verify the symptom and environment match this failure pattern.",
      expected_result: "Consistent with this contributor when supporting observations align.",
      mechanism: "",
      confidence: 0.5,
      symptoms: [] as string[],
    }));
  }

  if (!Array.isArray(out.failure_modes) || out.failure_modes.length === 0) {
    if (Array.isArray(out.causes) && out.causes.length > 0) {
      out.failure_modes = (out.causes as Record<string, unknown>[]).map((c) => ({
        name: String(c.name ?? "Failure mode"),
        description: String(c.diagnostic_signal ?? c.mechanism ?? ""),
      }));
    }
  }

  if (typeof out.mermaid_diagram !== "string" || !String(out.mermaid_diagram).trim()) {
    if (typeof raw.mermaidGraph === "string" && raw.mermaidGraph.trim()) {
      out.mermaid_diagram = raw.mermaidGraph;
    } else {
      const df = raw.diagnosticFlow as Record<string, unknown> | undefined;
      if (df && typeof df === "object") {
        const m = df.mermaid ?? df.chart ?? df.mermaidCode;
        if (typeof m === "string" && m.trim()) out.mermaid_diagram = m;
      }
    }
  }

  if (!Array.isArray(out.diagnostic_order) || out.diagnostic_order.length === 0) {
    const qc = raw.quickChecks;
    if (Array.isArray(qc) && qc.length > 0) {
      out.diagnostic_order = qc.map((x: unknown) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object" && "text" in (x as object)) {
          return String((x as { text?: unknown }).text);
        }
        if (x && typeof x === "object" && "label" in (x as object)) {
          return String((x as { label?: unknown }).label);
        }
        return String(x);
      });
    }
  }

  const bareSlug = routeSlug?.replace(/^diagnose\//, "") ?? "";
  if ((!out.symptom || String(out.symptom).trim() === "") && bareSlug) {
    out.symptom = bareSlug;
  }
  if ((!out.title || String(out.title).trim() === "") && bareSlug) {
    out.title = bareSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return out;
}

function inferToolkitFromTests(causes: unknown[]): QuickToolkitRow[] {
  const tools = new Set<string>();
  if (!Array.isArray(causes)) return [];
  for (const c of causes) {
    const t = typeof (c as { test?: string }).test === "string" ? (c as { test: string }).test : "";
    if (/multimeter|ohm|voltage|continuity/i.test(t)) tools.add("Digital multimeter");
    if (/manifold|gauge|psi|pressure/i.test(t)) tools.add("Manifold gauge set");
    if (/thermometer|°f|°c|temperature/i.test(t)) tools.add("Temperature probe");
    if (/inspect|visual|sight|flashlight/i.test(t)) tools.add("Inspection light");
  }
  return Array.from(tools).slice(0, 6).map((tool) => ({
    tool,
    purpose: "First-pass field verification",
    difficulty: "moderate",
  }));
}

export type NormalizeDiagnosticOptions = {
  /** URL param when DB row omits `symptom` / `title` (legacy hub JSON). */
  routeSlug?: string;
};

/**
 * Map raw diagnostic JSON (v5_master / v6) → DiagnosticGoldDisplayModel.
 */
export function normalizeDiagnosticToDisplayModel(
  raw: Record<string, unknown>,
  options?: NormalizeDiagnosticOptions
): DiagnosticGoldDisplayModel {
  const data = mergeLegacyHubContent(raw, options?.routeSlug);
  const failureModes = (data.failure_modes as { name?: string; description?: string }[]) || [];
  const fmCount = failureModes.length;

  const overview =
    (typeof data.problem_overview === "string" && data.problem_overview.trim()) ||
    `This symptom usually maps to ${fmCount || "several"} primary physical failure state${
      fmCount === 1 ? "" : "s"
    }. Use the isolation matrix to confirm before replacing parts.`;

  const guided = (data.guided_diagnosis as unknown[]) || [];

  const quickDecisionTree: QuickDecisionRow[] = guided.slice(0, 3).map((g: any) => ({
    question: g?.scenario,
    likelyModes: Array.isArray(g?.likely_modes) ? g.likely_modes : [],
    nextStep: g?.next_step,
  }));

  const causes = (data.causes as Record<string, unknown>[]) || [];
  const repairs = (data.repairs as Record<string, unknown>[]) || [];

  const qt = data.quick_toolkit as QuickToolkitRow[] | undefined;
  let toolkit: QuickToolkitRow[] =
    Array.isArray(qt) && qt.length > 0
      ? qt.map((x) => ({
          tool: String(x.tool ?? ""),
          purpose: String(x.purpose ?? ""),
          difficulty: String(x.difficulty ?? "moderate"),
        }))
      : inferToolkitFromTests(causes);

  const tn = data.tools_needed as ToolsNeededRow[] | undefined;
  let tools: ToolsNeededRow[] =
    Array.isArray(tn) && tn.length > 0
      ? tn.map((x) => ({
          name: String(x.name ?? ""),
          purpose: String(x.purpose ?? ""),
          difficulty: String(x.difficulty ?? "moderate"),
        }))
      : toolkit.map((k) => ({
          name: k.tool,
          purpose: k.purpose,
          difficulty: k.difficulty,
        }));

  let benchProcedures: BenchProcedureRow[] =
    Array.isArray(data.bench_procedures) && (data.bench_procedures as unknown[]).length > 0
      ? (data.bench_procedures as Record<string, unknown>[]).map((b) => ({
          title: String(b.title ?? ""),
          steps: Array.isArray(b.steps) ? (b.steps as unknown[]).map(String) : [],
          field_insight: String(b.field_insight ?? ""),
        }))
      : causes.map((c) => {
          const test = String(c.test ?? "");
          const exp = String(c.expected_result ?? "");
          const steps = [test, exp].filter((s) => s.trim().length > 0);
          if (steps.length === 1) steps.push("Re-run observation after conditions stabilize.");
          return {
            title: String(c.name ?? "Procedure"),
            steps,
            field_insight: String(c.diagnostic_signal ?? c.mechanism ?? ""),
          };
        });

  const topCauses: TopCauseRow[] = causes.map((c) => ({
    name: String(c.name ?? ""),
    failureMode: String(c.failure_mode ?? ""),
    signal: String(c.diagnostic_signal ?? ""),
    test: String(c.test ?? ""),
    expected: String(c.expected_result ?? ""),
    confidence: typeof c.confidence === "number" ? c.confidence : Number(c.confidence) || 0,
    mechanism: String(c.mechanism ?? ""),
    symptoms: Array.isArray(c.symptoms) ? (c.symptoms as unknown[]).map(String) : [],
  }));

  const repairMatrix: RepairMatrixRow[] = repairs.map((r) => ({
    name: String(r.name ?? ""),
    cause: String(r.cause ?? ""),
    effect: String(r.system_effect ?? ""),
    difficulty: String(r.difficulty ?? ""),
    cost: String(r.estimated_cost ?? ""),
    description: String(r.description ?? ""),
  }));

  const prevention = Array.isArray(data.prevention_tips)
    ? (data.prevention_tips as unknown[]).map(String)
    : [];

  const faq: FaqRow[] = Array.isArray(data.faq)
    ? (data.faq as unknown[]).map((f) => {
        if (typeof f === "string") return { question: "FAQ", answer: f };
        const rec = f as Record<string, unknown>;
        return {
          question: String(rec.question ?? ""),
          answer: String(rec.answer ?? ""),
        };
      })
    : [];

  const internalLinks = Array.isArray(data.internal_links) ? data.internal_links : [];

  return {
    title: String(data.title ?? ""),
    symptom: String(data.symptom ?? ""),
    system: String(data.system ?? ""),

    summary: data.fast_answer ?? null,
    toolkit,

    overview,

    quickDecisionTree,
    guidedDiagnosis: guided,

    systemExplainer: typeof data.system_explainer === "string" ? data.system_explainer : "",
    diagnosticOrder: Array.isArray(data.diagnostic_order)
      ? (data.diagnostic_order as unknown[]).map(String)
      : [],
    mermaid: typeof data.mermaid_diagram === "string" ? data.mermaid_diagram : "",

    failureModeNames: failureModes.map((m) => String(m.name ?? "")),

    topCauses,
    repairMatrix,
    benchProcedures,
    tools,
    prevention,
    faq,
    internalLinks,
  };
}

```

### `components/diagnostic/DiagnosticGoldPage.tsx`

```tsx
"use client";

import React from "react";
import Link from "next/link";
import type { DiagnosticGoldDisplayModel } from "@/lib/normalize-diagnostic-display";
import FastIsolationPanel from "@/components/FastIsolationPanel";
import QuickCheckTable from "@/components/QuickCheckTable";
import DiagnosticTestCard from "@/components/DiagnosticTestCard";
import MermaidRenderer from "@/components/MermaidRenderer";
import {
  BookOpen,
  ChevronRight,
  Cpu,
  Cog,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Wrench,
} from "lucide-react";

function SummaryBlock({ summary }: { summary: unknown }) {
  if (summary == null) return null;
  if (typeof summary === "string") return <p className="leading-relaxed">{summary}</p>;
  if (typeof summary === "object" && summary !== null && "technical_summary" in summary) {
    const o = summary as { technical_summary?: string; primary_mechanism?: string };
    return (
      <>
        {o.technical_summary ? <p className="mb-3 leading-relaxed">{o.technical_summary}</p> : null}
        {o.primary_mechanism ? (
          <p className="border-t border-blue-100 pt-3 text-base font-semibold text-slate-800 dark:border-blue-900/40 dark:text-slate-200">
            <span className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Primary mechanism —{" "}
            </span>
            {o.primary_mechanism}
          </p>
        ) : null}
      </>
    );
  }
  return <pre className="text-sm">{JSON.stringify(summary, null, 2)}</pre>;
}

type Props = {
  display: DiagnosticGoldDisplayModel;
  routeSlug: string;
};

/**
 * DG/HRB hybrid shell for v5_master (+ v6): one presentation contract, fixed section order.
 */
export default function DiagnosticGoldPage({ display, routeSlug }: Props) {
  const formatTitle = (s: string) =>
    s?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Diagnostic";

  const causesForQuickTable = display.topCauses.map((c) => ({ name: c.name }));

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-hvac-blue selection:text-white dark:bg-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-white pt-8 pb-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="pointer-events-none absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-800/50" />
        <div className="relative z-10 container mx-auto max-w-4xl px-4">
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <span>{display.system || "HVAC"}</span>
            <ChevronRight className="h-3 w-3" />
            <span>Diagnostic Gold</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-hvac-blue">{display.symptom || formatTitle(routeSlug)}</span>
          </div>
          <h1 className="mb-6 text-3xl leading-tight font-black text-slate-900 md:text-5xl dark:text-white">
            {display.title || `Diagnosing ${formatTitle(routeSlug)}`}
          </h1>

          {/* 30-Second Summary */}
          {display.summary ? (
            <div className="mb-6 rounded-r-xl border-l-4 border-hvac-blue bg-blue-50/80 p-5 shadow-sm dark:bg-blue-900/10">
              <div className="mb-2 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-blue-900 dark:text-blue-300">30-Second Summary</span>
              </div>
              <div className="text-lg leading-relaxed font-medium text-slate-700 dark:text-slate-300">
                <SummaryBlock summary={display.summary} />
              </div>
            </div>
          ) : null}

          {/* Quick Repair Toolkit */}
          {display.toolkit.length > 0 ? (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-3 flex items-center gap-2 font-black text-slate-900 dark:text-white">
                <Wrench className="h-5 w-5 text-hvac-navy" />
                Quick Repair Toolkit
              </div>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {display.toolkit.map((t, i) => (
                  <li key={i} className="flex flex-wrap gap-2">
                    <span className="font-bold text-hvac-blue">{t.tool}</span>
                    <span className="text-slate-400">—</span>
                    <span>{t.purpose}</span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold dark:bg-slate-600">
                      {t.difficulty}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Problem Overview */}
          {display.overview ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="mb-2 text-xs font-black tracking-wide text-amber-900 uppercase dark:text-amber-400">
                Problem Overview
              </div>
              <p className="text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200">{display.overview}</p>
            </div>
          ) : null}

          {/* Quick Decision Tree (condensed + diagnostic order lines) */}
          {(display.quickDecisionTree.length > 0 || display.diagnosticOrder.length > 0) && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 font-black text-slate-900 dark:text-white">Quick Decision Tree</div>
              {display.diagnosticOrder.length > 0 ? (
                <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                  {display.diagnosticOrder.slice(0, 6).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              ) : null}
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {display.quickDecisionTree.map((g, i) => (
                  <li key={i}>
                    <span className="font-semibold">{g.question}</span>
                    {g.likelyModes && g.likelyModes.length > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400"> → {g.likelyModes.join(", ")}</span>
                    ) : null}
                    {g.nextStep ? <div className="text-slate-500">Next: {g.nextStep}</div> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <FastIsolationPanel guidedDiagnosis={display.guidedDiagnosis as never} />
          <QuickCheckTable causes={causesForQuickTable as never} />
        </div>
      </div>

      <div className="container mx-auto mt-12 max-w-4xl space-y-16 px-4">
        {/* How the System Works */}
        {display.systemExplainer ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-hvac-blue" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">How the System Works</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{display.systemExplainer}</p>
          </section>
        ) : null}

        {/* Diagnostic Flow */}
        {display.mermaid ? (
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                <Cog className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Diagnostic Flow</h2>
                <p className="mt-1 text-sm text-slate-500">Isolation matrix — branch on measurements first.</p>
              </div>
            </div>
            <div className="relative flex justify-center overflow-x-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <MermaidRenderer chart={display.mermaid} />
            </div>
          </section>
        ) : null}

        {/* Top Causes */}
        {display.topCauses.length > 0 ? (
          <section>
            <h2 className="mb-6 text-3xl font-black text-slate-900 dark:text-white">Top Causes</h2>
            <div className="flex flex-col space-y-4">
              {display.topCauses.map((c, idx) => {
                const eliminated = display.failureModeNames.filter((m) => m && m !== c.failureMode);
                const severity = idx === 0 ? "high" : idx === 1 ? "medium" : "low";
                return (
                  <DiagnosticTestCard
                    key={idx}
                    name={c.name}
                    test={c.test}
                    expected={c.expected}
                    confirms={c.failureMode}
                    eliminates={eliminated.length ? eliminated.join(" and ") : "Other failure modes"}
                    severity={severity as "low" | "medium" | "high"}
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Repair Matrix */}
        {display.repairMatrix.length > 0 ? (
          <section>
            <h2 className="mb-4 text-3xl font-black text-slate-900 dark:text-white">Repair Matrix</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs font-black tracking-wide uppercase dark:bg-slate-800">
                  <tr>
                    <th className="p-3">Repair</th>
                    <th className="p-3">Cause</th>
                    <th className="p-3">System effect</th>
                    <th className="p-3">Difficulty</th>
                    <th className="p-3">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {display.repairMatrix.map((r, i) => (
                    <tr key={i} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="p-3 font-semibold">{r.name}</td>
                      <td className="p-3">{r.cause}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{r.effect}</td>
                      <td className="p-3">{r.difficulty}</td>
                      <td className="p-3">{r.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Bench Procedures */}
        {display.benchProcedures.length > 0 ? (
          <section>
            <h2 className="mb-6 text-3xl font-black text-slate-900 dark:text-white">Bench Procedures</h2>
            <div className="space-y-6">
              {display.benchProcedures.map((bp, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="mb-3 text-lg font-black text-hvac-navy dark:text-white">{bp.title}</h3>
                  <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                    {bp.steps.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ol>
                  <p className="border-l-4 border-hvac-blue pl-3 text-sm italic text-slate-600 dark:text-slate-400">
                    Field insight: {bp.field_insight}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Preventative Maintenance */}
        {display.prevention.length > 0 ? (
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
              <ShieldCheck className="h-6 w-6 text-hvac-blue" />
              Preventative Maintenance
            </h2>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {display.prevention.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Tools (explicit structured) */}
        {display.tools.length > 0 ? (
          <section>
            <h2 className="mb-4 text-2xl font-black text-slate-900 dark:text-white">Tools</h2>
            <ul className="space-y-2 text-sm">
              {display.tools.map((t, i) => (
                <li key={i} className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <span className="font-bold text-hvac-blue">{t.name}</span>
                  <span className="text-slate-500">—</span>
                  <span>{t.purpose}</span>
                  <span className="rounded bg-slate-100 px-2 text-xs font-bold dark:bg-slate-800">{t.difficulty}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Related Guides */}
        {Array.isArray(display.internalLinks) && display.internalLinks.length > 0 ? (
          <section className="border-t border-slate-200 pt-8 dark:border-slate-800">
            <h3 className="mb-4 text-sm font-bold tracking-widest text-slate-500 uppercase">Related Troubleshooting</h3>
            <div className="flex flex-wrap gap-2">
              {(display.internalLinks as { anchor?: string; slug?: string; title?: string }[]).map((link, i) => (
                <Link
                  key={i}
                  href={`/diagnose/${String(link.slug ?? "").replace(/^\//, "")}`}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {link.anchor ?? link.title ?? "Guide"}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Local Help CTA */}
        <section className="rounded-2xl bg-hvac-navy p-8 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-black">Need Local Help?</h3>
              <p className="mt-1 text-sm text-slate-300">
                HVAC Revenue Boost connects you with verified technicians when field risk is high.
              </p>
            </div>
            <Link
              href="/repair"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-hvac-gold px-6 py-3 font-black text-hvac-navy hover:bg-yellow-400"
            >
              <Phone className="h-5 w-5" />
              Find technicians
            </Link>
          </div>
        </section>

        {/* FAQ */}
        {display.faq.length > 0 ? (
          <section>
            <h2 className="mb-6 text-2xl font-black text-slate-900 dark:text-white">FAQ</h2>
            <div className="space-y-4">
              {display.faq.map((f, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="font-bold text-slate-900 dark:text-white">{f.question}</div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Editorial footer */}
        <footer className="border-t border-slate-200 pt-8 pb-4 text-center text-xs text-slate-500 dark:border-slate-800">
          Procedures are for educational isolation only. Follow manufacturer literature and local codes. Licensed
          technicians should perform work on refrigerant circuits, combustion, and high-voltage equipment.
        </footer>
      </div>
    </div>
  );
}

```

### `components/gold/GoldStandardPage.tsx`

```tsx
"use client";

import React, { useEffect, useId, useMemo, useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Wrench,
  DollarSign,
  Activity,
  ShieldAlert,
  ArrowRight,
  ClipboardList,
  Clock3,
  MapPin,
} from "lucide-react";

export type Probability = "High" | "Medium" | "Low";

export interface SummaryBullet {
  text: string;
}

export interface QuickCheckItem {
  text: string;
}

export interface CauseRow {
  problem: string;
  likelyCause: string;
  difficulty: string;
  cost: string;
  probability: Probability;
  href?: string;
}

export interface DeepDiveCause {
  title: string;
  whyItHappens: string;
  tools?: string[];
  fixSteps?: string[];
}

export interface RepairCard {
  title: string;
  difficulty: string;
  cost: string;
  summary: string;
  href?: string;
  urgency?: string;
  time?: string;
}

export interface ToolItem {
  name: string;
  whyNeeded: string;
}

export interface CostRow {
  repair: string;
  typicalRange: string;
  urgency: string;
}

export interface RelatedLink {
  title: string;
  href: string;
  label?: string;
}

export interface GoldStandardSymptomPageProps {
  breadcrumbSystem?: { label: string; href: string };
  breadcrumbSymptom?: string;
  title: string;
  intro: string;
  reviewedBy?: string;
  techNote?: string;

  fastAnswerTitle?: string;
  mostLikelyIssue: string;
  summaryBullets: SummaryBullet[];
  mostCommonFix?: {
    title: string;
    detail: string;
    difficulty?: string;
    cost?: string;
    time?: string;
  };

  checklist: QuickCheckItem[];
  diagnosticFlowTitle?: string;
  mermaidCode?: string;
  flowCaption?: string;
  decisionPrompts?: { condition: string; action: string }[];
  causeActionBridges?: { cause: string; action: string }[];
  confidenceSignalText?: string;

  causesTable: CauseRow[];
  deepDiveCauses: DeepDiveCause[];
  repairCards?: RepairCard[];
  tools?: ToolItem[];
  costs?: CostRow[];
  technicianInsights?: string[];
  ignoreRisk?: string;
  mistakesToAvoid?: string[];
  preventionTips?: string[];
  faqs?: { question: string; answer: string }[];
  relatedLinks?: RelatedLink[];
  cta?: {
    title: string;
    body: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel?: string;
    secondaryHref?: string;
  };
  techInterpretation?: {
    summary: string;
    safety?: string;
    commonCauses?: string[];
    steps?: string[];
    insight?: string;
    explanation?: string;
  };
  toolsTable?: { name: string; why: string; beginner?: string }[];
  repairOptionsTable?: { fix: string; cost: string; difficulty: string }[];
  comparison?: { category: string; budget: string; value: string }[];
  preventative?: string[];
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Mermaid must receive a string; malformed JSON sometimes nests chart data as objects. */
function toMermaidString(input: unknown): string | undefined {
  if (input == null) return undefined;
  if (typeof input === "string") {
    const t = input.trim();
    return t.length ? t : undefined;
  }
  if (typeof input === "object") {
    const o = input as Record<string, unknown>;
    const nested =
      (typeof o.mermaid === "string" && o.mermaid.trim()) ||
      (typeof o.chart === "string" && o.chart.trim()) ||
      (typeof o.code === "string" && o.code.trim());
    if (nested) return nested;
  }
  return undefined;
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 max-w-3xl text-slate-600">{subtitle}</p>
      ) : null}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-700">
      {children}
    </span>
  );
}

function ProbabilityPill({ value }: { value: Probability }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
        value === "High" && "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
        value === "Medium" &&
          "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
        value === "Low" && "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200"
      )}
    >
      {value}
    </span>
  );
}

function MermaidDiagram({ code }: { code?: string }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const safeCode = typeof code === "string" ? code : "";

    async function renderChart() {
      if (!ref.current || !safeCode.trim()) return;

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
          },
        });
        const { svg } = await mermaid.render(`mermaid-${id}`, safeCode);
        if (mounted && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch {
        if (mounted && ref.current) {
          ref.current.innerHTML = `
            <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Unable to render flowchart. Check Mermaid syntax.
            </div>
          `;
        }
      }
    }

    void renderChart();

    return () => {
      mounted = false;
    };
  }, [code, id]);

  return <div ref={ref} className="mermaid-diagram overflow-x-auto" />;
}

function DecisionPrompt({ prompts }: { prompts?: { condition: string; action: string }[] }) {
  if (!prompts?.length) return null;
  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Start Here</div>
      <h2 className="mt-2 text-xl font-black text-slate-900">Follow this decision path</h2>
      <div className="mt-4 space-y-3">
        {prompts.map((p, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-blue-100">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">{i + 1}</span>
            <div className="text-sm text-slate-700">
              <span className="font-semibold">{p.condition}</span>{" → "}<span className="font-semibold text-blue-700">{p.action}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PrimaryFlow({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-md">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">Diagnostic Flow (Start Here)</div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CauseActionBridge({ causes }: { causes?: { cause: string; action: string }[] }) {
  if (!causes?.length) return null;
  return (
    <section className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-green-700">What to Do Next</div>
      <div className="mt-4 space-y-3">
        {causes.map((c, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-green-100">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div className="text-sm text-slate-700">
              <span className="font-semibold">{c.cause}</span>{" → "}<span className="font-semibold text-green-700">{c.action}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConfidenceSignal({ text }: { text?: string }) {
  if (!text) return null;
  return <div className="mt-5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{text}</div>;
}

function StartButton({ href }: { href: string }) {
  return (
    <a href={href} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white shadow-md transition hover:-translate-y-0.5">
      Start Diagnosis
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

function FastAnswer({
  title = "Fast Answer",
  mostLikelyIssue,
  bullets,
  mostCommonFix,
}: {
  title?: string;
  mostLikelyIssue: string;
  bullets: SummaryBullet[];
  mostCommonFix?: {
    title: string;
    detail: string;
    difficulty?: string;
    cost?: string;
    time?: string;
  };
}) {
  return (
    <section
      id="fast-answer"
      className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-7"
    >
      <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
        {title}
      </div>

      <div className="mt-3 flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-red-50 p-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900 md:text-xl">
            Your system is most likely dealing with:
          </p>
          <p className="mt-1 text-xl font-black text-red-600 md:text-2xl">
            {mostLikelyIssue}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {(bullets || []).map((bullet, idx) => (
          <li key={`${bullet.text}-${idx}`} className="flex gap-3 text-slate-700">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-700" />
            <span>{bullet.text}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-sm text-slate-600">
        Want to confirm it in under a minute? Follow the checklist and diagnostic
        path below.
      </p>

      {mostCommonFix ? (
        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
            Most Common Fix
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900">
            {mostCommonFix.title}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-700">
            {mostCommonFix.detail}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {mostCommonFix.difficulty ? (
              <Badge>Difficulty: {mostCommonFix.difficulty}</Badge>
            ) : null}
            {mostCommonFix.cost ? <Badge>Cost: {mostCommonFix.cost}</Badge> : null}
            {mostCommonFix.time ? <Badge>Time: {mostCommonFix.time}</Badge> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function QuickChecklist({ items }: { items: QuickCheckItem[] }) {
  return (
    <section
      id="quick-diagnostic-checklist"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Quick Diagnostic Checklist"
        subtitle="Start here before replacing parts or scheduling service. These checks eliminate the most common failures fast."
      />
      <div className="grid gap-3">
        {(items || []).map((item, idx) => (
          <label
            key={`${item.text}-${idx}`}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800"
          >
            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300" />
            <span>{item.text}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function DiagnosticFlow({
  title = "Diagnostic Flow",
  caption,
  mermaidCode,
}: {
  title?: string;
  caption?: string;
  mermaidCode?: string;
}) {
  return (
    <section
      id="diagnostic-flow"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto"
    >
      <div className="bg-slate-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white">
        {title}
      </div>
      <div className="p-5 md:p-6">
        {caption ? <p className="mb-4 text-sm text-slate-600">{caption}</p> : null}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-6">
          {mermaidCode ? (
            <MermaidDiagram code={mermaidCode} />
          ) : (
            <div className="text-sm text-slate-500">No flowchart available.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function CausesAtAGlance({ rows }: { rows: CauseRow[] }) {
  return (
    <section
      id="causes-at-a-glance"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Causes at a Glance"
        subtitle="Use this table to narrow the fault before committing to a repair path."
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
            <tr>
              <th className="p-4 text-left">Problem</th>
              <th className="p-4 text-left">Likely Cause</th>
              <th className="p-4 text-left">Difficulty</th>
              <th className="p-4 text-left">Cost</th>
              <th className="p-4 text-left">Probability</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((row, idx) => {
              const content = (
                <>
                  <td className="p-4 font-semibold text-slate-900">{row.problem}</td>
                  <td className="p-4 text-slate-700">
                    {row.href ? (
                      <span className="font-semibold text-blue-700 underline-offset-2 hover:underline">
                        {row.likelyCause}
                      </span>
                    ) : (
                      row.likelyCause
                    )}
                  </td>
                  <td className="p-4 text-slate-700">{row.difficulty}</td>
                  <td className="p-4 text-slate-700">{row.cost}</td>
                  <td className="p-4">
                    <ProbabilityPill value={row.probability} />
                  </td>
                </>
              );

              return row.href ? (
                <tr
                  key={`${row.problem}-${idx}`}
                  className="cursor-pointer border-t border-slate-200 transition-colors hover:bg-slate-50"
                >
                  <td colSpan={5} className="p-0">
                    <a href={row.href} className="grid grid-cols-1 md:grid-cols-5">
                      {content}
                    </a>
                  </td>
                </tr>
              ) : (
                <tr
                  key={`${row.problem}-${idx}`}
                  className="border-t border-slate-200 transition-colors hover:bg-slate-50"
                >
                  {content}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DeepDive({ causes }: { causes: DeepDiveCause[] }) {
  return (
    <section
      id="common-causes-and-possible-fixes"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Common Causes and Possible Fixes"
        subtitle="Detailed breakdown of each failure point so you can judge what is DIY-safe and what needs a technician."
      />
      <div className="space-y-5">
        {(causes || []).map((cause, idx) => (
          <article
            key={`${cause.title}-${idx}`}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-xl font-bold text-slate-900">{cause.title}</h3>
            <p className="mt-3 font-medium leading-7 text-slate-600">
              {cause.whyItHappens}
            </p>

            {cause.tools?.length ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-700">
                  <Wrench className="h-4 w-4" />
                  Tools you may need
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {(cause.tools || []).map((tool, toolIdx) => (
                    <div
                      key={`${tool}-${toolIdx}`}
                      className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                      <span>{tool}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {cause.fixSteps?.length ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-700">
                  <ClipboardList className="h-4 w-4" />
                  Typical fix steps
                </div>
                <div className="space-y-2">
                  {(cause.fixSteps || []).map((step, stepIdx) => (
                    <div
                      key={`${step}-${stepIdx}`}
                      className="flex gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                        {stepIdx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function MidPageCTA({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
        Need HVAC help fast?
      </div>
      <h3 className="mt-2 text-xl font-black text-slate-900">
        If this issue is urgent, get a technician involved now.
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
        If the unit is tripping breakers, icing over, leaking heavily, or blowing warm
        air during extreme heat, professional diagnosis may save you from replacing
        the wrong part.
      </p>
      <a
        href={href}
        className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
      >
        {label}
      </a>
    </section>
  );
}

function RepairCards({ cards }: { cards: RepairCard[] }) {
  return (
    <section
      id="repair-paths"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Repair Paths"
        subtitle="These are the most common next-step fixes based on the symptoms above."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(cards || []).map((card, idx) => {
          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>Difficulty: {card.difficulty}</Badge>
                <Badge>Cost: {card.cost}</Badge>
                {card.time ? <Badge>Time: {card.time}</Badge> : null}
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">{card.summary}</p>
            </>
          );

          return card.href ? (
            <a
              key={`${card.title}-${idx}`}
              href={card.href}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {inner}
            </a>
          ) : (
            <div
              key={`${card.title}-${idx}`}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ToolsRequired({ items }: { items: ToolItem[] }) {
  return (
    <section
      id="tools-required"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Tools Required"
        subtitle="Only bring out tools that actually help confirm the fault or complete the repair safely."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {(items || []).map((item, idx) => (
          <div
            key={`${item.name}-${idx}`}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="font-semibold text-slate-900">{item.name}</div>
            <div className="mt-1 text-sm text-slate-600">{item.whyNeeded}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TypicalRepairCosts({ rows }: { rows: CostRow[] }) {
  return (
    <section
      id="typical-repair-costs"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Typical Repair Costs"
        subtitle="Repair pricing varies by system type, parts access, and technician labor in your area."
      />
      <div className="grid gap-3">
        {(rows || []).map((row, idx) => (
          <div
            key={`${row.repair}-${idx}`}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="font-semibold text-slate-900">{row.repair}</div>
              <div className="mt-1 text-sm text-slate-600">Urgency: {row.urgency}</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-slate-900 ring-1 ring-slate-200">
              <DollarSign className="h-4 w-4" />
              {row.typicalRange}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TechnicianInsights({ insights }: { insights: string[] }) {
  return (
    <section
      id="technician-insights"
      className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm"
    >
      <SectionHeading
        title="Technician Insights"
        subtitle="Field notes that help separate likely causes from expensive wrong guesses."
      />
      <div className="space-y-3">
        {(insights || []).map((insight, idx) => (
          <div
            key={`${insight}-${idx}`}
            className="rounded-xl bg-white/80 px-4 py-3 text-slate-700 ring-1 ring-blue-100"
          >
            “{insight}”
          </div>
        ))}
      </div>
    </section>
  );
}

function WarningBox({ title, body }: { title: string; body: string }) {
  return (
    <section
      id="what-happens-if-you-ignore-this"
      className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-white p-2 text-red-600 ring-1 ring-red-200">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <p className="mt-2 leading-7 text-slate-700">{body}</p>
        </div>
      </div>
    </section>
  );
}

function BulletColumns({
  title,
  items,
  icon,
  id,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  id: string;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2 text-slate-900">
        {icon}
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      <div className="grid gap-2">
        {(items || []).map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            className="flex gap-3 rounded-lg bg-slate-50 px-3 py-3 text-slate-700"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQs({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <section
      id="frequently-asked-questions"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading title="Frequently Asked Questions" />
      <div className="space-y-4">
        {(faqs || []).map((faq, idx) => (
          <details
            key={`${faq.question}-${idx}`}
            className="group rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <summary className="cursor-pointer list-none font-semibold text-slate-900">
              {faq.question}
            </summary>
            <p className="mt-3 text-sm leading-6 text-slate-700">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function RelatedReading({ links }: { links: RelatedLink[] }) {
  return (
    <section
      id="related-guides"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Related Guides"
        subtitle="Keep users inside the graph by linking upward, sideways, and downward into nearby diagnostic entities."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(links || []).map((link, idx) => (
          <a
            key={`${link.href}-${idx}`}
            href={link.href}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {link.label ? (
              <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                {link.label}
              </div>
            ) : null}
            <div className="mt-1 font-semibold text-slate-900">{link.title}</div>
          </a>
        ))}
      </div>
    </section>
  );
}

function CTA({ cta }: { cta: NonNullable<GoldStandardSymptomPageProps["cta"]> }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 text-white shadow-lg">
      <div className="max-w-3xl">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">
          Get Local HVAC Repair Help
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
          {cta.title}
        </h2>
        <p className="mt-3 leading-7 text-slate-200">{cta.body}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={cta.primaryHref}
          className="inline-flex items-center rounded-xl bg-white px-5 py-3 font-bold text-slate-900 transition hover:-translate-y-0.5"
        >
          {cta.primaryLabel}
        </a>
        {cta.secondaryLabel && cta.secondaryHref ? (
          <a
            href={cta.secondaryHref}
            className="inline-flex items-center rounded-xl border border-white/30 px-5 py-3 font-bold text-white transition hover:bg-white/10"
          >
            {cta.secondaryLabel}
          </a>
        ) : null}
      </div>
    </section>
  );
}

function TechInterpretation({
  title = "What This Problem Usually Means",
  summary,
  safety,
  commonCauses,
  steps,
  insight,
  explanation,
}: {
  title?: string;
  summary: string;
  safety?: string;
  commonCauses?: string[];
  steps?: string[];
  insight?: string;
  explanation?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        {title}
      </div>

      <p className="mt-3 text-slate-700 leading-7 font-medium">
        {summary}
      </p>

      {safety && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Safety Note:</strong> {safety}
        </div>
      )}

      {commonCauses?.length && (
        <div className="mt-5">
          <div className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">
            Most Common Causes
          </div>
          <ul className="mt-2 space-y-2 text-slate-700">
            {commonCauses.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-bold text-blue-700">{i + 1}.</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {steps?.length && (
        <div className="mt-5">
          <div className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">
            Quick Troubleshooting Steps
          </div>

          <div className="mt-3 space-y-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {insight && (
        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
          <strong>Field Insight:</strong> {insight}
        </div>
      )}

      {explanation && (
        <p className="mt-5 text-slate-600 leading-7">
          {explanation}
        </p>
      )}
    </section>
  );
}

function ToolsTable({
  tools,
}: {
  tools: { name: string; why: string; beginner?: string }[];
}) {
  if (!tools?.length) return null;

  return (
    <section id="tools-required" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">Tools Required for Diagnosis</h2>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 font-bold text-slate-700">
            <tr>
              <th className="p-3 text-left">Tool</th>
              <th className="p-3 text-left">Why You Need It</th>
              <th className="p-3 text-left">Beginner?</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((t, i) => (
              <tr key={i} className="border-t">
                <td className="p-3 font-semibold">{t.name}</td>
                <td className="p-3">{t.why}</td>
                <td className="p-3">{t.beginner || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RepairOptions({
  options,
}: {
  options: { fix: string; cost: string; difficulty: string }[];
}) {
  if (!options?.length) return null;

  return (
    <section id="repair-paths" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">Repair Options</h2>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 font-bold text-slate-700">
            <tr>
              <th className="p-3 text-left">Fix</th>
              <th className="p-3 text-left">Cost</th>
              <th className="p-3 text-left">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {options.map((o, i) => (
              <tr key={i} className="border-t">
                <td className="p-3 font-semibold">{o.fix}</td>
                <td className="p-3">{o.cost}</td>
                <td className="p-3">{o.difficulty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ComparisonTable({
  rows,
}: {
  rows: { category: string; budget: string; value: string }[];
}) {
  if (!rows?.length) return null;

  return (
    <section id="comparison-analysis" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">
        DecisionGrid Comparison: Replacement Parts
      </h2>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 font-bold text-slate-700">
            <tr>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Best Budget</th>
              <th className="p-3 text-left">Best Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-3 font-semibold">{r.category}</td>
                <td className="p-3">{r.budget}</td>
                <td className="p-3">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PreventativeMaintenance({
  tips,
}: {
  tips: string[];
}) {
  if (!tips?.length) return null;

  return (
    <section id="preventative-maintenance" className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">
        Preventative Maintenance
      </h2>

      <div className="mt-4 space-y-2">
        {tips.map((t, i) => (
          <div key={i} className="flex gap-2 text-slate-700">
            <span className="text-green-600 font-bold">✔</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function GoldStandardSymptomPage(props: GoldStandardSymptomPageProps) {
  const onThisPage = useMemo(() => {
    return [
      { label: "Fast Answer", href: "#fast-answer" },
      props.checklist?.length
        ? {
            label: "Quick Diagnostic Checklist",
            href: "#quick-diagnostic-checklist",
          }
        : null,
      props.mermaidCode?.trim()
        ? { label: "Diagnostic Flow", href: "#diagnostic-flow" }
        : null,
      props.causesTable?.length
        ? { label: "Causes at a Glance", href: "#causes-at-a-glance" }
        : null,
      props.deepDiveCauses?.length
        ? {
            label: "Common Causes and Possible Fixes",
            href: "#common-causes-and-possible-fixes",
          }
        : null,
      (props.toolsTable?.length ?? props.tools?.length) ? { label: "Tools Required", href: "#tools-required" } : null,
      (props.repairOptionsTable?.length ?? props.repairCards?.length) ? { label: "Repair Paths", href: "#repair-paths" } : null,
      props.comparison?.length ? { label: "Comparison Analysis", href: "#comparison-analysis" } : null,
      props.preventative?.length ? { label: "Preventative Maintenance", href: "#preventative-maintenance" } : null,
      props.costs?.length
        ? { label: "Typical Repair Costs", href: "#typical-repair-costs" }
        : null,
      props.technicianInsights?.length
        ? { label: "Technician Insights", href: "#technician-insights" }
        : null,
      props.ignoreRisk
        ? {
            label: "What Happens If You Ignore This?",
            href: "#what-happens-if-you-ignore-this",
          }
        : null,
      props.faqs?.length
        ? {
            label: "Frequently Asked Questions",
            href: "#frequently-asked-questions",
          }
        : null,
    ].filter(Boolean) as { label: string; href: string }[];
  }, [props]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <nav className="mb-6 text-sm text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <a href="/" className="hover:text-slate-700">
              Home
            </a>
            <span>/</span>
            {props.breadcrumbSystem ? (
              <>
                <a href={props.breadcrumbSystem.href} className="hover:text-slate-700">
                  {props.breadcrumbSystem.label}
                </a>
                <span>/</span>
              </>
            ) : null}
            <span className="text-slate-700">
              {props.breadcrumbSymptom ?? props.title}
            </span>
          </div>
        </nav>

        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Reviewed by Certified HVAC Technicians</Badge>
            {props.reviewedBy ? <Badge>{props.reviewedBy}</Badge> : null}
          </div>

          <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            {props.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
            {props.intro}
          </p>

          {props.techNote ? (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                Tech Note
              </div>
              <p className="mt-2 leading-7 text-slate-700">{props.techNote}</p>
            </div>
          ) : null}
        </header>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <FastAnswer
              title={props.fastAnswerTitle}
              mostLikelyIssue={props.mostLikelyIssue}
              bullets={props.summaryBullets}
              mostCommonFix={props.mostCommonFix}
            />

            {props.techInterpretation && (
              <TechInterpretation {...props.techInterpretation} />
            )}

            {props.confidenceSignalText ? <ConfidenceSignal text={props.confidenceSignalText} /> : null}
            <StartButton href="#diagnostic-flow" />

            {props.decisionPrompts?.length ? <DecisionPrompt prompts={props.decisionPrompts} /> : null}

            {props.checklist?.length ? <QuickChecklist items={props.checklist} /> : null}

            {props.mermaidCode || props.diagnosticFlowTitle ? (
              <PrimaryFlow>
                <DiagnosticFlow
                  title={props.diagnosticFlowTitle}
                  caption={
                    props.flowCaption ??
                    "Follow this step-by-step path to isolate the issue before spending money on the wrong repair."
                  }
                  mermaidCode={props.mermaidCode}
                />
              </PrimaryFlow>
            ) : null}

            {props.causesTable?.length ? (
              <CausesAtAGlance rows={props.causesTable} />
            ) : null}
            
            {props.causeActionBridges?.length ? <CauseActionBridge causes={props.causeActionBridges} /> : null}

            {props.deepDiveCauses?.length ? (
              <DeepDive causes={props.deepDiveCauses} />
            ) : null}

            {props.toolsTable?.length ? <ToolsTable tools={props.toolsTable} /> : (props.tools?.length ? <ToolsRequired items={props.tools} /> : null)}
            {props.repairOptionsTable?.length ? <RepairOptions options={props.repairOptionsTable} /> : (props.repairCards?.length ? <RepairCards cards={props.repairCards} /> : null)}
            {props.comparison?.length ? <ComparisonTable rows={props.comparison} /> : null}
            {props.preventative?.length ? <PreventativeMaintenance tips={props.preventative} /> : null}

            {props.cta?.primaryHref && props.cta?.primaryLabel ? (
              <MidPageCTA href={props.cta.primaryHref} label={props.cta.primaryLabel} />
            ) : null}

            {props.costs?.length ? <TypicalRepairCosts rows={props.costs} /> : null}
            {props.technicianInsights?.length ? (
              <TechnicianInsights insights={props.technicianInsights} />
            ) : null}
            {props.ignoreRisk ? (
              <WarningBox
                title="What Happens If You Ignore This?"
                body={props.ignoreRisk}
              />
            ) : null}

            {props.mistakesToAvoid?.length ? (
              <BulletColumns
                id="mistakes-to-avoid"
                title="Mistakes to Avoid"
                items={props.mistakesToAvoid}
                icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
              />
            ) : null}

            {props.preventionTips?.length && !props.preventative?.length ? (
              <BulletColumns
                id="prevention-tips"
                title="Prevention Tips"
                items={props.preventionTips}
                icon={<Activity className="h-5 w-5 text-blue-700" />}
              />
            ) : null}

            {props.faqs?.length ? <FAQs faqs={props.faqs} /> : null}
            {props.relatedLinks?.length ? <RelatedReading links={props.relatedLinks} /> : null}
            {props.cta ? <CTA cta={props.cta} /> : null}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                On This Page
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                {onThisPage.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-lg bg-slate-50 px-3 py-2 transition hover:bg-slate-100"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
                Most likely issue
              </div>
              <div className="mt-2 font-bold text-slate-900">{props.mostLikelyIssue}</div>
              {props.mostCommonFix?.cost ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 ring-1 ring-orange-200">
                  <DollarSign className="h-4 w-4" />
                  {props.mostCommonFix.cost}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Need help fast?
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                If the unit is tripping breakers, icing over, leaking heavily, or blowing
                warm air in extreme heat, a technician can save you from misdiagnosing it.
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-red-600" />
                  Fast diagnosis
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  Local service options
                </div>
              </div>
              <a
                href={props.cta?.primaryHref ?? "#"}
                className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
              >
                {props.cta?.primaryLabel ?? "Get AC Diagnosed Today"}
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function GoldStandardFallback({
  title,
  detail,
  extra,
}: {
  title: string;
  detail?: string;
  extra?: unknown;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-slate-800">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-wide text-amber-900">{title}</p>
        {detail ? <p className="mt-2 text-sm text-slate-700">{detail}</p> : null}
        {extra != null ? (
          <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-amber-200 bg-white p-3 text-xs text-slate-800">
            {typeof extra === "string" ? extra : JSON.stringify(extra, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

export default function GoldStandardPage({ data }: { data: any }) {
  if (!data) {
    return (
      <GoldStandardFallback
        title="Gold standard layout — no data"
        detail="The page record loaded but GoldStandardPage received no data object. Check normalization and props."
      />
    );
  }
  if (data?.schemaVersion && data.schemaVersion !== "v1") {
    return (
      <GoldStandardFallback
        title="Gold standard layout — schema mismatch"
        detail={`Expected schemaVersion "v1", got ${JSON.stringify(data.schemaVersion)}.`}
        extra={{ slug: data.slug, schemaVersion: data.schemaVersion }}
      />
    );
  }

  const validCauses = Array.isArray(data.causes) ? data.causes : [];
  const validDeepCauses = Array.isArray(data.deep_causes) ? data.deep_causes : [];
  const repairPaths = Array.isArray(data.repair_paths) ? data.repair_paths : [];
  const tools = Array.isArray(data.tools) ? data.tools : [];
  const insights = Array.isArray(data.insights)
    ? data.insights
    : Array.isArray(data.before_calling_tech)
    ? data.before_calling_tech
    : [];
  const mistakes = Array.isArray(data.mistakes) ? data.mistakes : [];
  const prevention = Array.isArray(data.prevention) ? data.prevention : [];
  const faqs = Array.isArray(data.faqs) ? data.faqs : [];

  const topCause =
    validCauses.length > 0
      ? validCauses.find((c: any) => c?.probability === "High") || validCauses[0]
      : null;

  const flow = data.diagnostic_flow;
  const chartRaw =
    flow != null && typeof flow === "object"
      ? (flow as Record<string, unknown>).chart ?? (flow as Record<string, unknown>).mermaid
      : flow ?? data.system_flow;
  const chart = toMermaidString(chartRaw);

  const defaultCTA = {
    title: "Need AC diagnosed by a local HVAC technician?",
    body:
      "If you're not comfortable checking capacitors, refrigerant-related issues, airflow restrictions, or electrical faults, a licensed HVAC technician can isolate the problem quickly and help you avoid replacing the wrong part.",
    primaryLabel: "Get AC Diagnosed Today",
    primaryHref: "/repair",
    secondaryLabel: "Browse Repair Guides",
    secondaryHref: "/diagnose",
  };

  const formatSlug = (slug?: string) => {
    if (!slug) return "";
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };
  const seoTitle = formatSlug(data.slug) || data.title || "Troubleshooting Guide";

  const finalProps: GoldStandardSymptomPageProps = {
    breadcrumbSystem: { label: "Diagnostics", href: "/diagnose" },
    breadcrumbSymptom: seoTitle,
    title: seoTitle,
    intro: data.problem_summary || data.ai_summary?.overview || "",

    fastAnswerTitle: "AI Diagnosis Summary",
    mostLikelyIssue:
      data.ai_summary?.most_likely_issue || topCause?.name || "System fault detected",
    summaryBullets: (data.ai_summary?.bullets || []).map((b: unknown) => ({
      text:
        typeof b === "string"
          ? b
          : b != null && typeof b === "object" && "text" in (b as object)
            ? String((b as { text?: unknown }).text ?? "")
            : String(b ?? ""),
    })),

    mostCommonFix: topCause
      ? {
          title: topCause.name || topCause.cause || "Target the most likely failure first",
          detail:
            topCause.fix_summary ||
            topCause.description ||
            "Start with the highest-probability fault before moving into lower-likelihood repairs.",
          difficulty: topCause.difficulty || "Moderate",
          cost: topCause.cost || "Varies by system",
          time: topCause.time || "30–90 minutes",
        }
      : undefined,
      
    confidenceSignalText: topCause ? "This is the most likely issue in ~60% of cases." : undefined,
    decisionPrompts: validCauses.slice(0, 3).map((c: any) => ({
      condition: c.name || "System fault",
      action: c.fix_summary || c.description || "Review diagnostics",
    })),
    causeActionBridges: validCauses.map((c: any) => ({
      cause: c.name || "System fault",
      action: c.fix_summary || c.description || "Review diagnostics and repair path",
    })),

    checklist: (data.checklist || []).map((c: unknown) => ({
      text: typeof c === "string" ? c : String(c ?? ""),
    })),
    diagnosticFlowTitle: "System Flowchart",
    mermaidCode: chart,

    causesTable: validCauses.map((c: any) => ({
      problem: data.title || "System fault",
      likelyCause: c.name || c.cause || "Unknown cause",
      difficulty: c.difficulty || "Variable",
      cost: c.cost || "Varies",
      probability: (c.probability as Probability) || "Medium",
      href: c.href || (c.name ? `/diagnose/${slugify(c.name)}` : undefined),
    })),

    deepDiveCauses: validDeepCauses.map((c: any) => ({
      title: c.title || c.cause || "Cause",
      whyItHappens: c.whyItHappens || c.why_it_happens || "No explanation provided.",
      tools: Array.isArray(c.tools_needed) ? c.tools_needed : [],
      fixSteps: Array.isArray(c.fix_steps) ? c.fix_steps : [],
    })),

    repairCards: repairPaths.map((r: any) => ({
      title: r.title || "Repair path",
      difficulty: r.difficulty || "Variable",
      cost: r.cost || "Varies by repair",
      summary: r.summary || "Further diagnosis may be required.",
      href: r.href,
      urgency: r.urgency || "Medium",
      time: r.time || "30–90 minutes",
    })),

    tools: tools.map((t: any) => ({
      name: t.name || "Tool",
      whyNeeded: t.purpose || t.why || "Diagnostic step",
    })),

    costs: repairPaths.map((r: any) => ({
      repair: r.title || "Repair",
      typicalRange: r.cost || "Varies by repair",
      urgency: r.urgency || "Medium",
    })),

    technicianInsights: insights,
    ignoreRisk: data.ignore_risk || data.what_happens_if_ignored || "",
    mistakesToAvoid: mistakes,
    preventionTips: prevention,
    faqs,

    relatedLinks: Array.isArray(data.related_links)
      ? data.related_links.map((link: any) => ({
          title: link.title,
          href: link.href,
          label: link.label,
        }))
      : [],

    cta: data.cta
      ? {
          title: data.cta.title || defaultCTA.title,
          body: data.cta.body || defaultCTA.body,
          primaryLabel: data.cta.primaryLabel || defaultCTA.primaryLabel,
          primaryHref: data.cta.primaryHref || defaultCTA.primaryHref,
          secondaryLabel: data.cta.secondaryLabel || defaultCTA.secondaryLabel,
          secondaryHref: data.cta.secondaryHref || defaultCTA.secondaryHref,
        }
      : defaultCTA,

    techInterpretation: data.problem_summary ? {
      summary: data.problem_summary || "",
      safety: data.safety_note,
      commonCauses: validCauses.slice(0, 3).map((c: any) => c.name || c.cause),
      steps: data.quick_steps || data.checklist || [],
      insight: insights[0],
      explanation: data.deep_explanation
    } : undefined,

    toolsTable: data.tools?.map((t: any) => ({
      name: t.name,
      why: t.purpose || t.description || t.why,
      beginner: t.beginner || "Moderate"
    })),

    repairOptionsTable: data.repair_paths?.map((r: any) => ({
      fix: r.title || r.name || r.fix,
      cost: r.cost || "Variable",
      difficulty: r.difficulty || "Variable"
    })),

    comparison: Array.isArray(data.comparison) ? data.comparison : [],
    preventative: Array.isArray(data.prevention) ? data.prevention : [],
  };

  return <GoldStandardSymptomPage {...finalProps} />;
}

```

### `components/MermaidRenderer.tsx`

```tsx
"use client";

import React, { useEffect, useId, useRef, useState } from "react";

/**
 * Loads mermaid only on the client via dynamic import() so the diagnose route
 * server chunk does not reference ./vendor-chunks/mermaid.js (Next bundling quirk).
 */
export default function MermaidRenderer({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    let mounted = true;

    async function renderChart() {
      if (!chart?.trim() || !containerRef.current) return;

      try {
        setHasError(false);
        containerRef.current.innerHTML = "";

        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#0f172a",
            primaryTextColor: "#ffffff",
            primaryBorderColor: "#1e293b",
            lineColor: "#64748b",
            secondaryColor: "#334155",
            tertiaryColor: "#f1f5f9",
          },
          flowchart: {
            htmlLabels: false,
            curve: "basis",
          },
        });

        const svgId = `mermaid-${id}-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(svgId, chart);

        if (mounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Mermaid parsing failed:", err);
        if (mounted) setHasError(true);
      }
    }

    void renderChart();

    return () => {
      mounted = false;
    };
  }, [chart, id]);

  if (hasError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/10">
        <p className="mb-2 font-bold text-red-600 dark:text-red-400">Error rendering diagnostic flowchart</p>
        <p className="text-sm text-red-500/80">
          The system encountered an structural issue while mapping the node relationships.
        </p>
        <div className="mt-4 overflow-x-auto rounded bg-slate-100 p-4 text-left text-xs text-slate-500 dark:bg-slate-900">
          <code>{chart}</code>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center overflow-x-auto py-4">
      <div ref={containerRef} className="mermaid-container" />
    </div>
  );
}

```
