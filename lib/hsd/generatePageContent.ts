import { readFileSync } from "fs";
import path from "path";
import OpenAI from "openai";
import {
  assertDailySpendAllows,
  recordOpenAiChatUsage,
} from "@/lib/ai-spend-guard";
import type { HsdPageBuildRow } from "./types";

/** Structured `quick_checks[]` dg_authority_v2 JSON (separate from this HSD path): `prompts/DG_Authority_V2_Generation_Lock.md`. */

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function loadHsdLockPrompt(): string {
  const p = path.join(process.cwd(), "prompts", "HSD_Page_Build.md");
  return readFileSync(p, "utf8");
}

function stripJsonFence(raw: string): string {
  return raw.replace(/^\s*```json\s*/i, "").replace(/```\s*$/i, "").trim();
}

function normCat(category: string): "hvac" | "plumbing" | "electrical" {
  const c = category.trim().toLowerCase();
  if (c === "plumbing") return "plumbing";
  if (c === "electrical") return "electrical";
  return "hvac";
}

function systemMessageFor(row: HsdPageBuildRow): string {
  const v = normCat(row.category);
  const role =
    "You are a 30-year veteran residential systems diagnostic technician. Output one JSON object only. No markdown fences. No HTML. No Mermaid or flowchart syntax in any string field. This is a field diagnostic document — not marketing, not a blog.";
  if (v === "plumbing") {
    return `${role} Trade focus: plumbing only.`;
  }
  if (v === "electrical") {
    return `${role} Trade focus: electrical only.`;
  }
  return `${role} Trade focus: HVAC only.`;
}

function strictRulesFor(row: HsdPageBuildRow): string {
  const v = normCat(row.category);
  if (v === "plumbing") {
    return `
RUNTIME HARD RULES (PLUMBING — in addition to HSD_Page_Build.md above):
- Output ONLY the JSON keys in the template. Do NOT add keys.
- Include numeric field reality: PSI bands, temperatures, or element/continuity-style measurements where applicable (see field_insight / problem_overview).
- Across all string values, these substrings MUST appear verbatim: Professional diagnosis is not optional | Stop.
- Include at least two distinct plumbing-domain themes among: pressure, valve, drain, supply, fixture, sediment, scale, water heater, pipe, T&P, gas valve.
- stop_diy: professional threshold (tools, scald/gas/flood risk, complexity, warranty). End with: Professional diagnosis is not optional—it is the safe next step. No refrigerant language.
- NO step-by-step homeowner repair procedures (orientation / decision logic only).`;
  }
  if (v === "electrical") {
    return `
RUNTIME HARD RULES (ELECTRICAL — in addition to HSD_Page_Build.md above):
- Output ONLY the JSON keys in the template. Do NOT add keys.
- Include numeric / logical field checks: nominal voltage, continuity expectation, breaker vs load behavior (see field_insight / problem_overview).
- Across all string values, these substrings MUST appear verbatim: Professional diagnosis is not optional | Stop.
- Include at least two distinct electrical-domain themes among: breaker, panel, voltage, circuit, neutral, ground fault, arc, overload, continuity.
- stop_diy: shock, arc flash, mis-metering, unauthorized energized work, warranty. End with: Professional diagnosis is not optional—it is the safe next step.
- NO step-by-step homeowner repair procedures (orientation only).`;
  }
  return `
RUNTIME HARD RULES (HVAC — in addition to HSD_Page_Build.md above):
- Output ONLY the JSON keys in the template. Do NOT add keys.
- The server injects structured diagnostic_flow — never put diagram syntax in strings.
- problem_overview + field_insight MUST include measurable language (e.g. ΔT band, static pressure comment, supply/return temps, voltage at a test point, superheat/subcool where relevant).
- Across all string values, these EXACT substrings MUST appear verbatim:
  low charge equals a leak | refrigerant is not consumed | forces the compressor outside its design limits | Stop. | Professional diagnosis is not optional
- decision_moment MUST include verbatim: If airflow, thermostat, and power are confirmed and the system still is not cooling, the fault is no longer superficial. Continuing to run the system is what turns a manageable repair into a major failure.
- cost_pressure MUST include verbatim: What starts as a minor repair can become a multi-thousand-dollar failure when the system continues running under fault.
- Field insight MUST include: fan running ≠ system working AND the line: This is how minor complaints turn into compressor failures.
- stop_diy: refrigerant exposure, electrical hazard, injury/death, warranty; close with Professional diagnosis is not optional—it is the safe next step.
- cta: licensed contractor / documented diagnosis only — NO sales urgency (no “call now”, “act fast”, “don’t wait”).
- NO step-by-step DIY repair instructions (no "step 1", "turn off power", "remove the capacitor", "use a screwdriver").`;
}

/**
 * Calls the model; returns parsed locked JSON only (no envelope).
 */
export async function generatePageContent(row: HsdPageBuildRow): Promise<unknown> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("OPENAI_API_KEY is required for HSD_Page_Build");
  }

  await assertDailySpendAllows("HSD_Page_Build:generatePageContent");

  const lockDoc = loadHsdLockPrompt();
  const model = process.env.OPENAI_HSD_MODEL?.trim() || "gpt-4o-mini";

  const userPrompt = `${lockDoc}

---

Populate the JSON template exactly per **HSD_Page_Build.md** (DecisionGrid Authority field manual).

Return ONLY JSON (one object, no markdown fences, no commentary).

{
  "hero": "",
  "problem_overview": "",
  "decision_tree": "",
  "how_system_works": "",
  "top_causes": "",
  "cost_matrix": "",
  "repair_vs_replace": "",
  "electrical_warning": "",
  "field_insight": "",
  "maintenance": "",
  "decision_moment": "",
  "cost_pressure": "",
  "cta": "",
  "stop_diy": ""
}

${strictRulesFor(row)}

Issue: ${row.issue}
Category: ${row.category}
City: ${row.city}, ${row.state}
Storage slug: ${row.slug}
`;

  const response = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: systemMessageFor(row),
      },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: 4500,
  });

  await recordOpenAiChatUsage(model, response.usage, "HSD_Page_Build");

  const contentStr = response.choices[0]?.message?.content;
  if (!contentStr) throw new Error("HSD_Page_Build: empty model response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(contentStr));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`HSD_Page_Build: invalid JSON from model (${msg})`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("HSD_Page_Build: model returned non-object JSON");
  }

  return parsed;
}
