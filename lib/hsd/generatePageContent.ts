import { readFileSync } from "fs";
import path from "path";
import OpenAI from "openai";
import {
  assertDailySpendAllows,
  recordOpenAiChatUsage,
} from "@/lib/ai-spend-guard";
import type { HsdPageBuildRow } from "./types";
import { hvacCoreClusterPromptAppendix } from "@/lib/homeservice/hsdHvacCoreCluster";

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

/** Mirrors prompts/HSD_Page_Build.md — DG-style mechanical reasoning, not blog branching. */
const DG_BRANCHING_AUTHORITY_RULES = `
BRANCHING REQUIREMENTS (DecisionGrid-style authority — service manual, not blog):
- Minimum **6** explicit branches across all narrative string fields (server-enforced). Use chains: **If X → Y**, **When X, then Y**, and **X indicates Y because Z** (indicates + because counts).
- Must include all three branch types:
  1) **Electrical test branch** — named electrical check (volts, amps, continuity, control voltage, transformer, contactor) → observed result → diagnostic implication. **Plumbing only:** substitute **one instrumented test branch** with the same triple-beat structure (PSI, temperature, element ohms, gas proving).
  2) **Mechanical failure branch** — physical fault path → field signature → failure class implied.
  3) **Stop DIY escalation branch** — explicit stop threshold → hazard or off-design readings → licensed verification as the correct next branch.
- Each branch must follow: If [condition] → [test/result] → [implication] (use → or -> between beats).
`.trim();

function systemMessageFor(row: HsdPageBuildRow): string {
  const v = normCat(row.category);
  const role =
    "You are a 30-year residential diagnostic technician. You write like a service manual, not a blog. You do not speculate, soften language, or give general advice. Output one JSON object only — no markdown fences, no HTML, no Mermaid or flowchart syntax in any string field.";
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
- Include numeric field reality: PSI bands, temperatures, or element/continuity-style measurements where applicable (see diagnostic_steps / summary_30s).
- Across all string values, these substrings MUST appear verbatim: Professional diagnosis is not optional | Stop.
- Include at least two distinct plumbing-domain themes among: pressure, valve, drain, supply, fixture, sediment, scale, water heater, pipe, T&P, gas valve.
- stop_diy: professional threshold (tools, scald/gas/flood risk, complexity, warranty). End with: Professional diagnosis is not optional—it is the safe next step. No refrigerant language.
- NO step-by-step homeowner repair procedures (orientation / decision logic only).

${DG_BRANCHING_AUTHORITY_RULES}

Do not describe causes without actionable branching logic.`;
  }
  if (v === "electrical") {
    return `
RUNTIME HARD RULES (ELECTRICAL — in addition to HSD_Page_Build.md above):
- Output ONLY the JSON keys in the template. Do NOT add keys.
- Include numeric / logical field checks: nominal voltage, continuity expectation, breaker vs load behavior (see diagnostic_steps / summary_30s).
- Across all string values, these substrings MUST appear verbatim: Professional diagnosis is not optional | Stop.
- Include at least two distinct electrical-domain themes among: breaker, panel, voltage, circuit, neutral, ground fault, arc, overload, continuity.
- stop_diy: shock, arc flash, mis-metering, unauthorized energized work, warranty. End with: Professional diagnosis is not optional—it is the safe next step.
- NO step-by-step homeowner repair procedures (orientation only).

${DG_BRANCHING_AUTHORITY_RULES}

Do not describe causes without actionable branching logic.`;
  }
  return `
RUNTIME HARD RULES (HVAC — in addition to HSD_Page_Build.md above):
- Output ONLY the JSON keys in the template. Do NOT add keys.
- The server injects structured diagnostic_flow — never put diagram syntax in strings.
- summary_30s + diagnostic_steps + how_system_works MUST include measurable language (e.g. ΔT band, static pressure comment, supply/return temps, voltage at a test point, superheat/subcool where relevant).
- Across all string values, these EXACT substrings MUST appear verbatim:
  low charge equals a leak | refrigerant is not consumed | refrigerant loss is not normal maintenance | forces the compressor outside its design limits | Stop. | Professional diagnosis is not optional
- diagnostic_steps and/or how_system_works MUST include verbatim: If airflow, thermostat, and power are confirmed and the system still is not cooling, the fault is no longer superficial. Continuing to run the system is what turns a manageable repair into a major failure.
- diagnostic_steps and/or how_system_works MUST include verbatim: What starts as a minor repair can become a multi-thousand-dollar failure when the system continues running under fault.
- diagnostic_steps, top_causes, and/or how_system_works MUST include: fan running ≠ system working AND the line: This is how minor complaints turn into compressor failures.
- stop_diy: refrigerant exposure, electrical hazard, injury/death, warranty; close with Professional diagnosis is not optional—it is the safe next step. No sales-urgency CTA tone (no “call now”, “act fast”, “don’t wait”).
- NO step-by-step DIY repair instructions (no "step 1", "turn off power", "remove the capacitor", "use a screwdriver").

${DG_BRANCHING_AUTHORITY_RULES}

Do not describe causes without actionable branching logic.`;
}

const INTERNAL_LINKING_REQUIREMENTS = `
INTERNAL LINKING — HUB GRAPH (MANDATORY — server-validated on HVAC):
- related_symptoms: 3–5 slug paths (lateral symptom expansion; same trade prefix)
- causes: 3–6 slug paths (root failure / cause isolation — HVAC only)
- repair_guides: 1–3 paths — use \`repair/{city}/{symptom}\` for local conversion where applicable, else trade-prefixed escalation guides
- system_pages: 1–2 slug paths (system-law / authority reinforcement)
- context_pages: 2–4 slug paths (long-tail variants; HVAC only)
- No full URLs; optional leading /
- HVAC: lateral + cause + system strings MUST match \`^/?hvac/\`; repair_guides may be \`^/?repair/\` or \`hvac/...\`
- Plumbing / electrical: trade-prefixed paths; repair_guides may use \`repair/...\` where appropriate
- Links must be mechanism-relevant to the issue on this page
`.trim();

const REPLACE_VS_REPAIR_FIELD_RULE = `
replace_vs_repair (single field):
- Full diagnostic decision logic: cost thresholds ($ or numeric bands), equipment age, catastrophic vs minor failure class, when changeout wins — server validates cost/age/framing substrings.
`.trim();

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

Populate the JSON template exactly per **HSD_Page_Build.md** (HSD Authority — aligned + linkable). Do not output diagnostic_flow, layout, or schema_version (server merges those).

Return ONLY JSON (one object, no markdown fences, no commentary).

${INTERNAL_LINKING_REQUIREMENTS}

${REPLACE_VS_REPAIR_FIELD_RULE}

{
  "summary_30s": "",
  "decision_tree": "",
  "top_causes": "",
  "how_system_works": "",
  "diagnostic_steps": "",
  "cost_matrix": "",
  "replace_vs_repair": "",
  "stop_diy": "",
  "prevention_tips": "",
  "tools_needed": "",
  "bench_test_notes": "",
  "internal_links": {
    "related_symptoms": [],
    "causes": [],
    "repair_guides": [],
    "system_pages": [],
    "context_pages": []
  }
}

${strictRulesFor(row)}
${hvacCoreClusterPromptAppendix(row.slug)}

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
