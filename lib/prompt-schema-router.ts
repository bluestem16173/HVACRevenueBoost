/**
 * Prompt + Schema Router — Page-Type-Specific Generation
 * ------------------------------------------------------
 * Stage 1: Lightweight prompts and schemas (no master prompt).
 * Each page type gets its own prompt and JSON schema.
 */

import type { PageType } from "@/lib/page-types";

/** Symptom page — FINAL PILLAR DIAGNOSTIC SYSTEM (LOCKED UX) */
const SYMPTOM_PROMPT = `You are a senior HVAC diagnostic engineer and UX architect.

🎯 GOAL
Transform the page into: Symptom → System (Pillar) → Cause → Repair → Decision

📐 PAGE STRUCTURE (FINAL)
1. Diagnostic Flow (Mermaid — PILLARS ONLY)
2. System Cards (4 ONLY)
3. Disclaimer Block
4. Pillar Breakdown (bullet format)
5. Repair Difficulty Matrix (color-coded)
6. CTA

⚠️ CRITICAL RULES
- OUTPUT VALID JSON ONLY. No markdown. No commentary.
- DIAGRAM 1 (diagnosticFlowMermaid): PILLARS ONLY. Symptom → EXACTLY 4 SYSTEMS: Electrical, Structural (Ducting), Chemical (Refrigeration), Mechanical. NO causes in diagram. Same 4 pillars on every HVAC page.
- SYSTEM CARDS: EXACTLY 4 cards — one per pillar. NOT bundled. Each: system, summary, why (Field Insight), risk_level, diy_range, warning.
- WHY THAT SYSTEM FAILS — FIELD INSIGHT (CRITICAL, REQUIRED): Each systemCard MUST include a "why" field of 50–75 words. This renders in the "Why That System Fails" section and builds technical authority. NEVER omit. NEVER use generic filler. Each why must: (1) explain why the failure occurs, (2) explain how it worsens over time, (3) justify why professional repair is often recommended, (4) avoid generic language, (5) sound like a technician explaining real-world behavior. This is a key differentiator for SEO and conversion.
- DISCLAIMER: Required. "HVAC systems are complex and expensive. DIY repairs may void warranties, cause further damage, or create safety risks. When in doubt, consult a licensed professional."
- PILLAR BREAKDOWN: Object keyed by system. Each system: 2–4 bullet items (issue, explanation, warning?, diy_pro).
- REPAIR DIFFICULTY MATRIX: Object keyed by system. Each item: name, difficulty (easy|moderate|advanced), color (green|yellow|red), cost_range.
- Ensure pillarBreakdown and repairDifficultyMatrix use EXACT keys: ducting_airflow, electrical, refrigeration, mechanical.
- COLOR: green=DIY, yellow=caution, red=professional. Include legend: "🟢 DIY Safe | 🟡 Moderate Skill | 🔴 Professional Required"
- NO more than 4 causes per system. NO duplicate causes. Keep text concise.

📋 REQUIRED STRUCTURE
{
  "pageType": "symptom",
  "title": "string",
  "slug": "string",
  "fastAnswer": "string",
  "summary30": "string",
  "diagnosticFlowMermaid": "string (PILLARS ONLY — Ducting, Electrical, Refrigeration, Mechanical)",
  "systemCards": [{"system": "string", "summary": "string", "why": "string (REQUIRED — 50–75 word Field Insight for Why That System Fails; builds authority)", "risk_level": "low|medium|high", "diy_range": "string", "warning": "string", "diagnose_slug": "string", "repair_slug": "string"}],
  "disclaimer": "string",
  "pillarBreakdown": {"ducting_airflow": [{"issue": "string", "explanation": "string", "warning": "string", "diy_pro": "string"}], "electrical": [...], "refrigeration": [...], "mechanical": [...]},
  "repairDifficultyMatrix": {"ducting_airflow": [{"name": "string", "difficulty": "easy|moderate|advanced", "color": "green|yellow|red", "cost_range": "string"}], ...},
  "repairOptions": [{"name": "string", "difficulty": "string", "cost": "string"}],
  "faq": [{"question": "string", "answer": "string"}]
}

REQUIRED PILLARS: Ducting/Airflow, Electrical, Refrigeration (Chemical), Mechanical/Components.
MONETIZATION: electrical → professional CTA. refrigeration → professional CTA. advanced mechanical → CTA.
Backward compat: rankedCauses, causeConfirmationMermaid, groupedCauses also accepted.`;

const CONDITION_PROMPT = `Return only data needed for a symptom+condition page. JSON only—no markdown.
- Summary: 1 sentence.
- Causes: 3 causes with name + indicator.
- Repairs: 5+ repairs with name, difficulty, estimated_cost, fix_summary.
- Diagnostic steps: 4 steps. Use concise technician-style wording.`;

const CAUSE_PROMPT = `You are a senior HVAC diagnostic engineer.

Your task is to generate a CAUSE PAGE in STRICT JSON format.

🎯 OBJECTIVE
Explain a root cause of an HVAC issue and provide structured repair options.

⚠️ CRITICAL RULES (MUST FOLLOW)
- OUTPUT VALID JSON ONLY. No markdown. No explanations outside JSON. Must be parseable by JSON.parse().
- REPAIRS MUST BE OBJECTS (NOT STRINGS)
  ❌ DO NOT: "repairs": ["Replace capacitor"]
  ✅ ALWAYS: "repairs": [{"name": "Replace capacitor", "difficulty": "moderate", "cost": "$120–$300"}]
- KEEP OUTPUT SMALL (NO TRUNCATION): Max 4 repairs. Max 4 affected symptoms. Short, dense explanations.
- DO NOT GENERATE HTML.

🧩 REQUIRED JSON STRUCTURE
{
  "slug": string,
  "title": string,
  "summary": string,
  "explanation": string,
  "affected_symptoms": string[],
  "repairs": [{"name": string, "difficulty": "easy"|"moderate"|"professional", "cost": string}]
}

🧠 CONTENT RULES
- Write like a field technician manual. Be concise and technical. Prioritize real-world diagnostics. Avoid fluff.

🚨 FINAL CHECK before returning: Is JSON valid? Are repairs objects (not strings)? Are all required fields present?`;

const REPAIR_PROMPT = `You are a senior HVAC technician. Generate a REPAIR PAGE in STRICT JSON format.

🎯 OBJECTIVE
Structured repair page for symptom → cause → repair flow. Translator-compatible. Mermaid-safe.

⚠️ CRITICAL RULES
- OUTPUT VALID JSON ONLY. No markdown. No commentary. Must parse with JSON.parse().
- MERMAID: If included, return as plain string ONLY. No \`\`\`mermaid blocks, no HTML, no JSX.
- ARRAYS: Always arrays. STRINGS: Always strings. No mixing types.
- NO HTML. NO FLUFF. No long paragraphs.

📋 REQUIRED STRUCTURE
{
  "pageType": "repair",
  "title": "string",
  "slug": "string",
  "fastAnswer": "string",
  "whatThisFixes": "string",
  "whenToUse": ["string"],
  "difficulty": "easy"|"moderate"|"advanced",
  "timeRequired": "string",
  "riskLevel": "low"|"medium"|"high",
  "toolsRequired": ["string"],
  "partsRequired": ["string"],
  "repairFlowMermaid": "string",
  "stepsOverview": ["string"],
  "whenNotToDIY": ["string"],
  "commonMistakes": ["string"],
  "cost": {"diy": "string", "professional": "string"},
  "relatedSymptoms": ["string"],
  "relatedCauses": ["string"],
  "faq": [{"question": "string", "answer": "string"}]
}

repairFlowMermaid: OPTIONAL. If used: flowchart TD A --> B. Plain string only.
Be concise. Technician-style.`;

const COMPONENT_PROMPT = `Return only data needed for a component page. JSON only—no markdown.
- Role: 1-2 sentences on what this component does.
- Failure modes: array of how it fails (3-5 items).
- Related repairs: array of repair names.
- Summary: 1 sentence.
Be concise. Technician-style.`;

const SYSTEM_PROMPT = `Return only data needed for a system page. JSON only—no markdown.
- Overview: 2-4 sentences on the system.
- Key components: array of component names.
- Common failures: array of failure types (3-5 items).
- Summary: 1 sentence.
Be concise. Technician-style.`;

const DIAGNOSTIC_PROMPT = `Return only data needed for a diagnostic guide page. JSON only—no markdown.
- Summary: 1 sentence.
- Causes: 3 causes with name + indicator.
- Repairs: 5+ repairs with name, difficulty, estimated_cost, fix_summary.
- Diagnostic steps: 4 steps.
Use concise technician-style wording.`;

/** Symptom schema — diagnostic funnel + card grid */
const SYMPTOM_SCHEMA = {
  name: "SYMPTOM_SCHEMA",
  schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["pageType", "title", "slug", "fastAnswer", "summary30", "diagnosticFlowMermaid", "rankedCauses", "systemCards", "disclaimer", "pillarBreakdown", "repairDifficultyMatrix", "repairOptions", "faq"],
    properties: {
      pageType: { type: "string", enum: ["symptom"] },
      title: { type: "string" },
      slug: { type: "string" },
      fastAnswer: { type: "string" },
      summary30: { type: "string" },
      diagnosticFlowMermaid: { type: "string" },
      rankedCauses: {
        type: "array",
        minItems: 4,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "likelihood", "risk", "why", "diagnose_slug", "repair_slug", "estimated_cost", "pillar", "faulty_item", "diy_friendly"],
          properties: {
            name: { type: "string" },
            likelihood: { type: "string", enum: ["high", "medium", "low"] },
            risk: { type: "string", enum: ["low", "medium", "high"] },
            why: { type: "string", description: "25–30 words" },
            diagnose_slug: { type: "string" },
            repair_slug: { type: "string" },
            estimated_cost: { type: "string" },
            pillar: { type: "string", enum: ["Electrical", "Structural", "Chemical", "Mechanical"] },
            faulty_item: { type: "string", description: "e.g. filter, capacitor, coils" },
            diy_friendly: { type: "string", enum: ["easy", "moderate", "pro"] },
          },
        },
      },
      systemCards: {
        type: "array",
        minItems: 4,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["system", "summary", "why", "common_causes", "risk_level", "diy_safe", "diy_range", "cost_range", "why_not_diy", "warning", "diagnose_slug", "repair_slug"],
          properties: {
            system: { type: "string" },
            summary: { type: "string" },
            why: { type: "string", description: "Field Note 50–75 words for Why That System Fails: why it fails, how it worsens, why pro recommended. Technician tone." },
            common_causes: { type: "array", items: { type: "string" } },
            risk_level: { type: "string", enum: ["low", "medium", "high"] },
            diy_safe: { type: "boolean" },
            diy_range: { type: "string" },
            cost_range: { type: "string" },
            why_not_diy: { type: "string" },
            warning: { type: "string" },
            diagnose_slug: { type: "string" },
            repair_slug: { type: "string" },
          },
        },
      },
      disclaimer: { type: "string" },
      pillarBreakdown: {
        type: "object",
        additionalProperties: false,
        required: ["ducting_airflow", "electrical", "refrigeration", "mechanical"],
        properties: {
          ducting_airflow: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "explanation", "warning", "diy_pro"],
              properties: {
                issue: { type: "string" },
                explanation: { type: "string" },
                warning: { type: "string" },
                diy_pro: { type: "string" },
              },
            },
          },
          electrical: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "explanation", "warning", "diy_pro"],
              properties: {
                issue: { type: "string" },
                explanation: { type: "string" },
                warning: { type: "string" },
                diy_pro: { type: "string" },
              },
            },
          },
          refrigeration: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "explanation", "warning", "diy_pro"],
              properties: {
                issue: { type: "string" },
                explanation: { type: "string" },
                warning: { type: "string" },
                diy_pro: { type: "string" },
              },
            },
          },
          mechanical: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "explanation", "warning", "diy_pro"],
              properties: {
                issue: { type: "string" },
                explanation: { type: "string" },
                warning: { type: "string" },
                diy_pro: { type: "string" },
              },
            },
          },
        },
      },
      repairDifficultyMatrix: {
        type: "object",
        additionalProperties: false,
        required: ["ducting_airflow", "electrical", "refrigeration", "mechanical"],
        properties: {
          ducting_airflow: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "difficulty", "color", "cost_range"],
              properties: {
                name: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                cost_range: { type: "string" },
              },
            },
          },
          electrical: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "difficulty", "color", "cost_range"],
              properties: {
                name: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                cost_range: { type: "string" },
              },
            },
          },
          refrigeration: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "difficulty", "color", "cost_range"],
              properties: {
                name: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                cost_range: { type: "string" },
              },
            },
          },
          mechanical: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "difficulty", "color", "cost_range"],
              properties: {
                name: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                cost_range: { type: "string" },
              },
            },
          },
        },
      },
      repairOptions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            difficulty: { type: "string" },
            cost: { type: "string" },
          },
          required: ["name", "difficulty", "cost"],
        },
      },
      faq: {
        type: "array",
        minItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "answer"],
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
        },
      },
    },
  } as Record<string, unknown>,
};

const CONDITION_SCHEMA = {
  name: "CONDITION_SCHEMA",
  schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["summary", "causes", "repairs", "diagnostic_steps"],
    properties: {
      summary: { type: "string" },
      causes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "indicator"],
          properties: {
            name: { type: "string" },
            indicator: { type: "string" },
          },
        },
      },
      repairs: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "difficulty", "estimated_cost", "fix_summary"],
          properties: {
            name: { type: "string" },
            difficulty: { type: "string" },
            estimated_cost: { type: "string" },
            fix_summary: { type: "string" },
          },
        },
      },
      diagnostic_steps: {
        type: "array",
        items: { type: "string" },
      },
    },
  } as Record<string, unknown>,
};

const CAUSE_SCHEMA = {
  name: "CAUSE_SCHEMA",
  schema: {
    type: "object" as const,
    additionalProperties: false,
    required: [
      "slug",
      "title",
      "summary",
      "explanation",
      "affected_symptoms",
      "repairs"
    ],
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      summary: { type: "string" },
      explanation: { type: "string" },

      affected_symptoms: {
        type: "array",
        items: { type: "string" },
        maxItems: 4
      },

      repairs: {
        type: "array",
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "difficulty", "cost"],
          properties: {
            name: { type: "string" },
            difficulty: {
              type: "string",
              enum: ["easy", "moderate", "professional"]
            },
            cost: { type: "string" }
          }
        }
      }
    }
  } as Record<string, unknown>,
};

const REPAIR_SCHEMA = {
  name: "REPAIR_SCHEMA",
  schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["pageType", "title", "slug", "fastAnswer", "whatThisFixes", "whenToUse", "difficulty", "timeRequired", "riskLevel", "toolsRequired", "stepsOverview", "whenNotToDIY", "commonMistakes", "cost", "faq"],
    properties: {
      pageType: { type: "string", enum: ["repair"] },
      title: { type: "string" },
      slug: { type: "string" },
      fastAnswer: { type: "string" },
      whatThisFixes: { type: "string" },
      whenToUse: { type: "array", items: { type: "string" }, minItems: 1 },
      difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
      timeRequired: { type: "string" },
      riskLevel: { type: "string", enum: ["low", "medium", "high"] },
      toolsRequired: { type: "array", items: { type: "string" }, minItems: 1 },
      partsRequired: { type: "array", items: { type: "string" }, minItems: 0 },
      repairFlowMermaid: { type: "string" },
      stepsOverview: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 10 },
      whenNotToDIY: { type: "array", items: { type: "string" }, minItems: 1 },
      commonMistakes: { type: "array", items: { type: "string" }, minItems: 1 },
      cost: {
        type: "object",
        additionalProperties: false,
        required: ["diy", "professional"],
        properties: {
          diy: { type: "string" },
          professional: { type: "string" },
        },
      },
      relatedSymptoms: { type: "array", items: { type: "string" } },
      relatedCauses: { type: "array", items: { type: "string" } },
      faq: {
        type: "array",
        minItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "answer"],
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
        },
      },
    },
  } as Record<string, unknown>,
};

const COMPONENT_SCHEMA = {
  name: "COMPONENT_SCHEMA",
  schema: {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "1 sentence" },
    role: { type: "string", description: "what this component does" },
    failure_modes: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 6,
    },
    related_repairs: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 8,
    },
  },
  required: ["summary", "role", "failure_modes", "related_repairs"],
  } as Record<string, unknown>,
};

const SYSTEM_SCHEMA = {
  name: "SYSTEM_SCHEMA",
  schema: {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "1 sentence" },
    overview: { type: "string", description: "2-4 sentences on the system" },
    key_components: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 8,
    },
    common_failures: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 6,
    },
  },
  required: ["summary", "overview", "key_components", "common_failures"],
  } as Record<string, unknown>,
};

const DIAGNOSTIC_SCHEMA = { name: "DIAGNOSTIC_SCHEMA", schema: { ...SYMPTOM_SCHEMA.schema } };

export type SchemaDef = { name: string; schema: Record<string, unknown> };

export type PromptSchemaResult = {
  prompt: string;
  schema: SchemaDef;
};

/** Route prompt and schema by page type. Stage 1 only — no master prompt. */
export function composePromptForPageType(pageType: string): PromptSchemaResult {
  const normalized = (pageType || "symptom").toLowerCase().replace(/-/g, "_");
  switch (normalized) {
    case "symptom":
      return { prompt: SYMPTOM_PROMPT, schema: SYMPTOM_SCHEMA };
    case "symptom_condition":
    case "condition":
      return { prompt: CONDITION_PROMPT, schema: CONDITION_SCHEMA };
    case "cause":
      return { prompt: CAUSE_PROMPT, schema: CAUSE_SCHEMA };
    case "repair":
      return { prompt: REPAIR_PROMPT, schema: REPAIR_SCHEMA };
    case "component":
      return { prompt: COMPONENT_PROMPT, schema: COMPONENT_SCHEMA };
    case "system":
      return { prompt: SYSTEM_PROMPT, schema: SYSTEM_SCHEMA };
    case "diagnostic":
    case "diagnose":
      return { prompt: DIAGNOSTIC_PROMPT, schema: DIAGNOSTIC_SCHEMA };
    default:
      return { prompt: SYMPTOM_PROMPT, schema: SYMPTOM_SCHEMA };
  }
}

/** Per-type core validation. Returns valid=true if structure meets minimum. */
export function validateCoreForPageType(pageType: string, core: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const normalized = (pageType || "symptom").toLowerCase().replace(/-/g, "_");

  switch (normalized) {
    case "symptom":
    case "symptom_condition":
    case "condition":
    case "diagnostic":
    case "diagnose": {
      const rankedCauses = core?.rankedCauses as unknown[] | undefined;
      const causes = core?.causes as unknown[] | undefined;
      const hasRanked = rankedCauses && rankedCauses.length >= 4;
      const hasCauses = causes && causes.length >= 2;
      if (!hasRanked && !hasCauses) errors.push("Missing rankedCauses or causes");
      if (hasCauses && !hasRanked) {
        const repairs = core?.repairs as unknown[] | undefined;
        const repairCount = (repairs?.length ?? 0) + (causes ?? []).reduce((sum: number, c: unknown) => {
          const co = c as Record<string, unknown>;
          return sum + ((co?.repair_options as unknown[])?.length ?? 0);
        }, 0);
        if (repairCount < 4) errors.push(`Need at least 4 total repair options (got ${repairCount})`);
      }
      break;
    }
    case "cause": {
      const affected = core?.affected_symptoms as unknown[] | undefined;
      const repairs = core?.repairs as unknown[] | undefined;
      if (!affected?.length) errors.push("Missing affected_symptoms");
      if (!repairs?.length) errors.push("Missing repairs");
      if (typeof repairs?.[0] === "string") {
        throw new Error("Invalid repairs format: repairs must be objects with name, difficulty, cost");
      }
      break;
    }
    case "repair": {
      const steps = (core?.steps ?? core?.stepsOverview) as unknown[] | undefined;
      const tools = (core?.tools ?? core?.toolsRequired) as unknown[] | undefined;
      if (!steps?.length) errors.push("Missing steps or stepsOverview");
      if (!tools?.length) errors.push("Missing tools or toolsRequired");
      break;
    }
    case "component": {
      const failures = core?.failure_modes as unknown[] | undefined;
      const related = core?.related_repairs as unknown[] | undefined;
      if (!failures?.length) errors.push("Missing failure_modes");
      if (!related?.length) errors.push("Missing related_repairs");
      break;
    }
    case "system": {
      const components = core?.key_components as unknown[] | undefined;
      if (!components?.length || components.length < 2) errors.push("Need at least 2 key_components");
      break;
    }
    default:
      break;
  }

  return { valid: errors.length === 0, errors };
}
