/**
 * Prompt + Schema Router — Page-Type-Specific Generation
 * ------------------------------------------------------
 * Stage 1: Lightweight prompts and schemas (no master prompt).
 * Each page type gets its own prompt and JSON schema.
 */

import type { PageType } from "@/lib/page-types";

/** Lightweight Stage 1 prompts — short, stable, no master prompt */
const SYMPTOM_PROMPT = `Return only data needed for a symptom diagnostic page. JSON only—no markdown.
- Summary: 1 sentence.
- Causes: 3 causes with name + indicator (short diagnostic clue).
- Repairs: 5+ repairs with name, difficulty, estimated_cost, fix_summary.
- Diagnostic steps: 4 steps with step, check_for, next_if_true, next_if_false.
Use concise technician-style wording. Avoid filler.`;

const CONDITION_PROMPT = `Return only data needed for a symptom+condition page. JSON only—no markdown.
- Summary: 1 sentence.
- Causes: 3 causes with name + indicator.
- Repairs: 5+ repairs with name, difficulty, estimated_cost, fix_summary.
- Diagnostic steps: 4 steps. Use concise technician-style wording.`;

const CAUSE_PROMPT = `Return only data needed for a cause page. JSON only—no markdown.
- Explanation: 2-4 sentences on why this cause happens.
- Affected symptoms: array of symptom names this cause creates.
- Repairs: array of repair names that fix this cause.
Be concise. Technician-style.`;

const REPAIR_PROMPT = `Return only data needed for a repair page. JSON only—no markdown.
- Steps: array of step descriptions (4-6 steps).
- Tools: array of tool names with brief reason.
- Difficulty: easy | moderate | advanced.
- Summary: 1 sentence overview.
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

/** Lightweight JSON schemas — small, type-specific, prevent truncation */
const SYMPTOM_SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "1 sentence summary" },
    causes: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          indicator: { type: "string", description: "short diagnostic clue" },
        },
        required: ["name", "indicator"],
      },
    },
    repairs: {
      type: "array",
      minItems: 4,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
          estimated_cost: { type: "string" },
          fix_summary: { type: "string", description: "1 sentence" },
        },
        required: ["name", "difficulty", "estimated_cost", "fix_summary"],
      },
    },
    diagnostic_steps: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          step: { type: "string" },
          check_for: { type: "string" },
          next_if_true: { type: "string" },
          next_if_false: { type: "string" },
        },
        required: ["step", "check_for", "next_if_true", "next_if_false"],
      },
    },
  },
  required: ["summary", "causes", "repairs", "diagnostic_steps"],
};

const CONDITION_SCHEMA = { ...SYMPTOM_SCHEMA };

const CAUSE_SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "1 sentence" },
    explanation: { type: "string", description: "2-4 sentences on why this cause happens" },
    affected_symptoms: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 8,
    },
    repairs: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 8,
    },
  },
  required: ["summary", "explanation", "affected_symptoms", "repairs"],
};

const REPAIR_SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "1 sentence overview" },
    steps: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 8,
    },
    tools: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          reason: { type: "string" },
        },
        required: ["name", "reason"],
      },
      minItems: 2,
      maxItems: 8,
    },
    difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
  },
  required: ["summary", "steps", "tools", "difficulty"],
};

const COMPONENT_SCHEMA = {
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
};

const SYSTEM_SCHEMA = {
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
};

const DIAGNOSTIC_SCHEMA = { ...SYMPTOM_SCHEMA };

export type PromptSchemaResult = {
  prompt: string;
  schema: Record<string, unknown>;
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
      const causes = core?.causes as unknown[] | undefined;
      if (!causes?.length) errors.push("Missing causes");
      if (causes && causes.length < 2) errors.push("Need at least 2 causes");
      const repairs = core?.repairs as unknown[] | undefined;
      const repairCount = (repairs?.length ?? 0) + (causes ?? []).reduce((sum: number, c: unknown) => {
        const co = c as Record<string, unknown>;
        return sum + ((co?.repair_options as unknown[])?.length ?? 0);
      }, 0);
      if (repairCount < 4) errors.push(`Need at least 4 total repair options (got ${repairCount})`);
      break;
    }
    case "cause": {
      const affected = core?.affected_symptoms as unknown[] | undefined;
      const repairs = core?.repairs as unknown[] | undefined;
      if (!affected?.length) errors.push("Missing affected_symptoms");
      if (!repairs?.length) errors.push("Missing repairs");
      break;
    }
    case "repair": {
      const steps = core?.steps as unknown[] | undefined;
      const tools = core?.tools as unknown[] | undefined;
      if (!steps?.length) errors.push("Missing steps");
      if (!tools?.length) errors.push("Missing tools");
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
