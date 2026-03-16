/**
 * Diagnostic Page Generator — UI-Layout Aligned
 * ---------------------------------------------
 * Produces structured JSON that matches the symptom page template 1:1.
 * Every generated page strictly follows the DecisionGrid / HVAC Diagnostic UI layout.
 */

import OpenAI from "openai";
import * as dotenv from "dotenv";
import { composeSystemPrompt } from "./ai-generator";
dotenv.config({ path: ".env.local" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** Output schema — matches frontend sections exactly */
export const DIAGNOSTIC_PAGE_SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    header_context: {
      type: "object",
      properties: {
        system: { type: "string" },
        subsystem: { type: "string" },
        problem: { type: "string" },
        breadcrumb_path: { type: "string" },
        most_common_cause: { type: "string" },
      },
      required: ["system", "subsystem", "problem", "most_common_cause"],
    },
    intro: { type: "string", description: "2-3 sentence fast diagnostic intro" },
    most_common_cause: {
      type: "object",
      properties: {
        cause: { type: "string" },
        short_explanation: { type: "string" },
        first_diagnostic_step: { type: "string" },
      },
      required: ["cause", "short_explanation", "first_diagnostic_step"],
    },
    why_this_happens: {
      type: "string",
      description: "Technical/educational explanation of the science behind the symptom. E.g. HVAC systems rely on refrigerant to transfer heat... When refrigerant levels drop, the evaporator coil cannot absorb enough heat. Builds authority and topic expertise.",
    },
    toc: {
      type: "array",
      items: { type: "string" },
      minItems: 12,
      description: "Anchor list for In This Guide",
    },
    diagnostic_flow: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      description: "Flowchart nodes: problem -> causes",
    },
    causes_table: {
      type: "array",
      minItems: 5,
      items: {
        type: "object",
        properties: {
          problem: { type: "string" },
          likely_cause: { type: "string" },
          fix_link: { type: "string" },
        },
        required: ["problem", "likely_cause", "fix_link"],
      },
    },
    troubleshoot_intro: { type: "string" },
    diagnostic_tree: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          if_no: { type: "string" },
          if_yes: { type: "string" },
        },
        required: ["question", "if_no", "if_yes"],
      },
    },
    causes: {
      type: "array",
      minItems: 5,
      items: {
        type: "object",
        properties: {
          cause_name: { type: "string" },
          why_it_happens: { type: "string" },
          symptoms: { type: "array", items: { type: "string" } },
          repair_steps: { type: "array", items: { type: "string" } },
          difficulty_level: { type: "string", enum: ["easy", "moderate", "advanced", "professional"] },
        },
        required: ["cause_name", "why_it_happens", "symptoms", "repair_steps", "difficulty_level"],
      },
    },
    related_problems: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
    },
    repair_costs: {
      type: "array",
      minItems: 5,
      items: {
        type: "object",
        properties: {
          repair: { type: "string" },
          diy_cost: { type: "string" },
          professional_cost: { type: "string" },
        },
        required: ["repair", "diy_cost", "professional_cost"],
      },
    },
    toolkit: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
    },
    common_mistakes: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
    },
    prevention: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
    },
    when_to_call_technician: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
    },
    continue_troubleshooting: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 5,
      description: "4-5 deeper diagnostic guide titles max",
    },
    faq: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "answer"],
      },
    },
  },
  required: [
    "header_context",
    "intro",
    "most_common_cause",
    "why_this_happens",
    "toc",
    "diagnostic_flow",
    "causes_table",
    "troubleshoot_intro",
    "diagnostic_tree",
    "causes",
    "related_problems",
    "repair_costs",
    "toolkit",
    "common_mistakes",
    "prevention",
    "when_to_call_technician",
    "continue_troubleshooting",
    "faq",
  ],
};

const DIAGNOSTIC_PAGE_PROMPT = `You are a senior residential HVAC diagnostic engineer. Generate structured content for a professional HVAC troubleshooting manual page.

GOAL: Produce JSON that matches the exact sections rendered by the HVAC Diagnostic UI. The page must resemble a professional HVAC diagnostic manual, not a generic article.

CONTENT QUALITY RULES:
- Minimum 5 causes, 5 repairs, 4 FAQ
- Diagnostic tree required
- Repair cost table required
- Use concise technician-style wording
- Prioritize real-world diagnostic clues

PAGE STRUCTURE (produce each in order):

1. header_context: system (e.g. HVAC), subsystem (e.g. Air Conditioning), problem (symptom name), most_common_cause
2. intro: 2-3 sentence summary. Example: "AC blowing warm air is most often caused by low refrigerant or restricted airflow. Check the air filter first, then follow the diagnostic flow below."
3. most_common_cause: cause name, short_explanation, first_diagnostic_step
4. why_this_happens: 2-4 sentence technical explanation of the science behind the symptom. Example: "HVAC systems rely on refrigerant to transfer heat from inside the home to the outdoor condenser. When refrigerant levels drop due to leaks, the evaporator coil cannot absorb enough heat, causing the system to blow warm air." Builds authority and topic expertise.
5. toc: List of section anchors: Diagnostic Flowchart, Causes at a Glance, Troubleshoot/DIY, Interactive Diagnostic Tree, Common Causes & Fixes, Related Problems, Typical Repair Costs, Quick Repair Toolkit, Common Mistakes, Prevention Tips, When to Call a Pro, Continue Troubleshooting, FAQ
6. diagnostic_flow: Array of cause names for flowchart (problem -> cause1, cause2, ...)
6. causes_table: Min 5 rows. problem | likely_cause | fix_link (e.g. "See Fix")
8. troubleshoot_intro: Short explanation encouraging airflow checks, thermostat verification, power inspection
8. diagnostic_tree: Decision-tree nodes. Each: question, if_no, if_yes
10. causes: Min 5. Each: cause_name, why_it_happens, symptoms[], repair_steps[], difficulty_level
11. related_problems: Related symptom page names (min 3)
12. repair_costs: Min 5. repair | diy_cost | professional_cost
12. toolkit: Tool list (multimeter, screwdriver, coil cleaner, etc.)
14. common_mistakes: Typical diagnostic errors (min 3)
15. prevention: Maintenance recommendations (min 3)
16. when_to_call_technician: Dangerous repairs to highlight (min 2)
17. continue_troubleshooting: Deeper diagnostic guide titles (min 2)
18. faq: Min 4. question + answer

Return ONLY valid JSON. No markdown, no explanations.`;

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

export async function generateDiagnosticPage(
  problem: string,
  context: { system?: string; subsystem?: string; graphCauses?: { name: string }[] } = {}
): Promise<Record<string, unknown>> {
  const system = context.system || "HVAC";
  const subsystem = context.subsystem || "Air Conditioning";
  const graphCauses = context.graphCauses || [];

  const userMsg = `Generate a full diagnostic page for:

Problem: ${problem}
System: ${system}
Subsystem: ${subsystem}
${graphCauses.length > 0 ? `Known causes from knowledge graph: ${graphCauses.map((c) => c.name).join(", ")}` : ""}

Produce structured JSON matching the schema. Ensure minimum 5 causes, 5 repairs, 4 FAQ.`;

  const systemPrompt = composeSystemPrompt(DIAGNOSTIC_PAGE_PROMPT);

  return callWithRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "diagnostic_page",
          strict: true,
          schema: DIAGNOSTIC_PAGE_SCHEMA as Record<string, unknown>,
        },
      },
      temperature: 0.2,
      max_tokens: 2000,
    });

    const contentStr = response.choices[0]?.message?.content;
    if (!contentStr) throw new Error("Empty AI response");
    return JSON.parse(contentStr) as Record<string, unknown>;
  });
}

/** Convert diagnostic_flow array to Mermaid flowchart string for UI */
export function diagnosticFlowToMermaid(problem: string, flow: string[]): string {
  const safe = (s: string) => s.replace(/[\[\]()]/g, "").replace(/\s+/g, " ");
  const nodes = flow.map((c, i) => `C${i}[${safe(c)}]`).join("\n  ");
  const edges = flow.map((_, i) => `A --> C${i}`).join("\n  ");
  return `graph TD\n  A[${safe(problem)}]\n  ${nodes}\n  ${edges}`;
}
