/**
 * Canary Generator — Master Prompt Aligned
 * ----------------------------------------
 * Uses the MASTER-PROMPT-CANARY schema for structured, layout-aware content.
 * Output: { layout, sections } — each section independently renderable.
 *
 * @see docs/MASTER-PROMPT-CANARY.md
 */

import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { normalizeToString, safeJsonParse } from "@/lib/utils";
dotenv.config({ path: ".env.local" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MASTER_PROMPT_PATH = path.join(process.cwd(), "docs", "MASTER-PROMPT-CANARY.md");

/** Appended AFTER everything else — never replaces, just appends */
const RENDERING_PATCH = `

### RENDERING COMPATIBILITY RULES
Each section must be fully independent and renderable in isolation.
Do NOT rely on: previous sections, implied context, shared narrative flow.
Every section must: make sense on its own, contain complete information, avoid referencing "above", "below", or other sections.
BAD: "As mentioned above...", "See below...", "Earlier we discussed..."
GOOD: Each section stands alone with complete clarity.

### SECTION COMPLETENESS RULE
ALL sections defined in the schema MUST be present. Do NOT omit sections. Do NOT return null. Do NOT return empty arrays. If content is minimal, still return valid structured data.

### LAYOUT COMPATIBILITY RULE
The "layout" field ONLY controls display order. Content inside "sections" must NOT depend on layout. The same content must work regardless of layout: diagnostic_first, repair_first, cost_first, scenario_first.

### CONTENT DENSITY RULE
Each section should be concise: 1–3 short paragraphs OR 3–5 bullets OR 3–5 steps. Avoid long walls of text and repeated explanations across sections.

### INTERNAL LINK QUALITY RULE
Internal links must be relevant, naturally phrased (no generic anchors), mapped to real entities. Return 5–8 internal links maximum.

### JSON COMPLETENESS RULE
Ensure all JSON is fully closed. Do not leave trailing objects, arrays, or strings unclosed. Truncation causes parse failures.
`;

import { MASTER_UNIFIED_PROMPT } from "@/lib/content-engine/core";

function getMasterPrompt(): string {
  return MASTER_UNIFIED_PROMPT;
}

/** Strict JSON schema matching MASTER-PROMPT-CANARY */
const CANARY_SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    layout: {
      type: "string",
      enum: ["diagnostic_first", "repair_first", "cost_first", "scenario_first"],
    },
    sections: {
      type: "object",
      additionalProperties: false,
      properties: {
        hero: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            description: { type: "string" },
          },
          required: ["title", "description"],
        },
        technician_summary: { type: "string" },
        fast_answer: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            likely_cause: { type: "string" },
          },
          required: ["summary", "likely_cause"],
        },
        most_common_fix: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            steps: { type: "array", items: { type: "string" } },
            difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
            estimated_cost: { type: "string" },
          },
          required: ["title", "steps", "difficulty", "estimated_cost"],
        },
        diagnostic_flow: {
          type: "object",
          additionalProperties: false,
          properties: { mermaid: { type: "string" } },
          required: ["mermaid"],
        },
        guided_filters: {
          type: "object",
          additionalProperties: false,
          properties: {
            environment: { type: "array", items: { type: "string" } },
            symptoms: { type: "array", items: { type: "string" } },
            noise: { type: "array", items: { type: "string" } },
          },
          required: ["environment", "symptoms", "noise"],
        },
        causes: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              probability: { type: "string", enum: ["high", "medium", "low"] },
              description: { type: "string" },
              indicators: { type: "array", items: { type: "string" } },
              related_repairs: { type: "array", items: { type: "string" } },
            },
            required: ["name", "description"],
          },
        },
        repairs: {
          type: "array",
          minItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              slug: { type: "string" },
              difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
              estimated_cost: { type: "string" },
              tools_required: { type: "array", items: { type: "string" } },
              steps: { type: "array", items: { type: "string" } },
            },
            required: ["name", "slug", "difficulty", "estimated_cost"],
          },
        },
        repair_matrix: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              repair: { type: "string" },
              difficulty: { type: "string" },
              cost: { type: "string" },
              time: { type: "string" },
            },
          },
        },
        tools: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              purpose: { type: "string" },
            },
            required: ["name", "purpose"],
          },
        },
        components: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              role: { type: "string" },
            },
            required: ["name", "role"],
          },
        },
        costs: {
          type: "object",
          additionalProperties: false,
          properties: {
            diy: { type: "string" },
            moderate: { type: "string" },
            professional: { type: "string" },
          },
          required: ["diy", "moderate", "professional"],
        },
        insights: { type: "array", items: { type: "string" } },
        warnings: {
          type: "object",
          additionalProperties: false,
          properties: {
            ignore_risk: { type: "string" },
            safety: { type: "string" },
          },
          required: ["ignore_risk", "safety"],
        },
        mistakes: { type: "array", items: { type: "string" } },
        environmental_factors: { type: "array", items: { type: "string" } },
        prevention: { type: "array", items: { type: "string" } },
        cta: {
          type: "object",
          additionalProperties: false,
          properties: {
            primary: { type: "string" },
            secondary: { type: "string" },
          },
          required: ["primary", "secondary"],
        },
        faq: {
          type: "array",
          minItems: 1,
          maxItems: 2,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "answer"],
          },
        },
        internal_links: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              type: { type: "string", enum: ["symptom", "condition", "repair", "component"] },
              slug: { type: "string" },
              anchor: { type: "string" },
            },
            required: ["type", "slug", "anchor"],
          },
        },
      },
      required: ["hero", "fast_answer", "causes", "repairs", "faq"],
    },
  },
  required: ["layout", "sections"],
};

/** @deprecated Use resolveLayout from @/lib/layout-resolver and SYMPTOM_LAYOUTS from @/templates/layouts/symptom-layouts */
export { SYMPTOM_LAYOUTS as LAYOUT_ORDERS } from "@/templates/layouts/symptom-layouts";

async function callWithRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  throw lastError;
}

export interface CanaryGenerateOptions {
  pageType?: string;
  slug?: string;
  system?: string;
  keyword?: string;
  context?: string;
  graphCauses?: { name: string }[];
}

/**
 * Generate page content using MASTER-PROMPT-CANARY schema.
 * Returns { layout, sections } for modular rendering.
 */
export async function generateCanaryPage(
  problem: string,
  options: CanaryGenerateOptions = {}
): Promise<{ layout: string; sections: Record<string, unknown>; engine_version: string }> {
  const {
    pageType = "symptom",
    slug = "",
    system = "HVAC",
    keyword = "",
    context = "",
    graphCauses = [],
  } = options;

  const masterPrompt = getMasterPrompt();
  const pagePrompt = `
OBJECTIVE: Generate a complete diagnostic page.

PAGE_TYPE: ${pageType}
SLUG: ${slug || problem}
SYSTEM: ${system}
PRIMARY_KEYWORD: ${keyword || problem}
CONTEXT: ${context || "Residential HVAC"}

${graphCauses.length > 0 ? `Known causes from knowledge graph: ${graphCauses.map((c) => c.name).join(", ")}` : ""}

Return ONLY valid JSON. No markdown, no explanations. Follow the schema exactly.
CRITICAL: Ensure all JSON is fully closed. Do not leave trailing objects, arrays, or strings unclosed.`;

  const systemContent = `${masterPrompt}\n\n---\n\n${pagePrompt}`;

  const result = await callWithRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: `Generate the page for: ${problem}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 1600,
    });

    const contentStr = response.choices[0]?.message?.content;
    if (!contentStr) throw new Error("Empty AI response");

    const parsed = safeJsonParse<{ layout?: string; sections?: Record<string, unknown> }>(contentStr);
    if (!parsed) {
      if (process.env.DEBUG_CANARY === "true") {
        console.log("RAW AI OUTPUT (last 500 chars):", contentStr.slice(-500));
      }
      throw new Error("AI returned unrecoverable JSON");
    }
    return parsed;
  });

  const layout = result.layout || "diagnostic_first";
  const sections = result.sections || {};

  return {
    layout,
    sections,
    engine_version: "6.0.0-Canary-MasterPrompt",
  };
}

/**
 * Convert canary output to content_json format compatible with symptom-page template.
 * Enables backward compatibility while transitioning to modular renderer.
 */
export function canaryToContentJson(canary: {
  layout: string;
  sections: Record<string, unknown>;
}): Record<string, unknown> {
  const s = canary.sections as any;
  return {
    layout: canary.layout,
    sections: canary.sections,
    // Map to existing template fields for backward compat
    fast_answer: s.fast_answer?.summary ?? s.fast_answer?.likely_cause,
    most_common_fix: s.most_common_fix
      ? {
          name: s.most_common_fix.title,
          description: (s.most_common_fix.steps || []).join(". "),
          cost: s.most_common_fix.estimated_cost,
          difficulty: s.most_common_fix.difficulty,
          diy: s.most_common_fix.difficulty === "easy",
        }
      : null,
    diagnostic_tree_mermaid: s.diagnostic_flow?.mermaid,
    guided_diagnosis_filters: s.guided_filters
      ? {
          categories: [
            { name: "Environment", options: (s.guided_filters.environment || []).map((o: any) => ({ slug: normalizeToString(o).toLowerCase().replace(/\s+/g, "-"), label: normalizeToString(o) })) },
            { name: "Conditions", options: (s.guided_filters.symptoms || []).map((o: any) => ({ slug: normalizeToString(o).toLowerCase().replace(/\s+/g, "-"), label: normalizeToString(o) })) },
            { name: "Noise", options: (s.guided_filters.noise || []).map((o: any) => ({ slug: normalizeToString(o).toLowerCase().replace(/\s+/g, "-"), label: normalizeToString(o) })) },
          ],
        }
      : null,
    causes: (s.causes || []).map((c: any) => ({
      name: c.name,
      explanation: c.description,
      difficulty: c.probability === "high" ? "Easy" : "Moderate",
      difficultyColor: "text-hvac-blue",
      cost: "$50–$450",
      repairs: (c.related_repairs || []).map((slug: string) => ({ name: slug, slug, link: `/fix/${slug}` })),
    })),
    repairs: (s.repair_matrix || s.repairs || []).map((r: any) => ({
      name: r.repair ?? r.name,
      difficulty: r.difficulty ?? "moderate",
      difficultyBg: r.difficulty === "advanced" ? "bg-hvac-safety" : "bg-hvac-gold",
      cost: r.cost ?? r.estimated_cost ?? "$50–$150",
      diyText: r.difficulty === "easy" ? "Yes" : "Not recommended",
      diyColor: r.difficulty === "easy" ? "text-green-600" : "text-hvac-safety",
    })),
    technician_statement: s.technician_summary,
    technician_insights: (s.insights || []).map((t: string) => ({ text: t, cite: "Top Rated Local Techs" })),
    common_mistakes: (s.mistakes || []).map((m: string) => ({ name: m, description: m, time: "" })),
    environment_conditions: (s.environmental_factors || []).map((e: string) => ({ name: e, description: e })),
    prevention_tips: (s.prevention || []).map((p: string) => ({ name: p, description: p })),
    when_to_call_pro: s.warnings
      ? {
          warnings: [
            { type: "Safety", description: s.warnings.safety },
            { type: "Ignore Risk", description: s.warnings.ignore_risk },
          ],
        }
      : null,
    cost_estimates: s.costs,
    tools_required: (s.tools || []).map((t: any) => ({ name: t.name, reason: t.purpose })),
    components: (s.components || []).map((c: any) => ({ name: c.name, description: c.role })),
    faq: s.faq || [],
    internal_links: s.internal_links || [],
  };
}
