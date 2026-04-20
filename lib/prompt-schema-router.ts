import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import { buildHsdV2VeteranTechnicianPrompt } from "@/src/lib/ai/prompts/diagnostic-engine-json";
import {
  formatCityPathSegmentForDisplay,
  parseLocalizedStorageSlug,
} from "@/lib/localized-city-path";
import { buildVerticalPromptPreamble, normalizeVerticalId } from "@/lib/verticals";
import { getDgAuthorityV3SceneRequirementsBlock } from "@/lib/dg-authority-v3-scenario-prompts";
import { enforceStoredSlug } from "@/lib/slug-utils";
import { getMasterAuthorityConversionPrompt } from "@/prompts/masterAuthorityConversion";
import { getHvacHighConversionDecisiongridMasterPrompt } from "@/prompts/hvacHighConversionDecisiongridMaster";

export const BASE_MASTER_PROMPT = `
You are generating a HIGH-CONVERSION, TECHNICAL AUTHORITY PAGE for a troubleshooting system.

This page MUST follow the GOLD STANDARD MONEY PRINTER FORMAT.

STRICT REQUIREMENTS:

## CORE STRUCTURE (MANDATORY)
- Fast Answer (2-3 sentences, direct, confident)
- Most Common Fix (include cost, difficulty, time)
- Quick Diagnostic Checklist (5-7 actionable checkbox items)
- Diagnostic Flow (step-by-step or decision tree logic)
- Causes Overview Table
- Detailed Causes Section (MINIMUM 3 causes)
- Repairs Section (MINIMUM 5 repair options)
- Tools Required
- Cost Breakdown (Low / Medium / High tiers)
- What Happens If Ignored
- Technician Insights (expert tone, non-generic)
- Internal Linking Section

## INTERNAL DEPTH (MANDATORY)
You MUST include:
- 2-3 diagnostics
- 2-3 causes (minimum 3 required)
- 5+ repairs (minimum 5 required)
- 1 system-level contextual reference

## QUICK DIAGNOSTIC CHECKLIST
- Must be scannable
- Must feel actionable
- Must help user self-identify issue quickly

## UNIQUE ELEMENT (CRITICAL – ANTI-AI FOOTPRINT)
Each page MUST include EXACTLY ONE unique contextual element:
Examples:
- Climate-specific scenario (Florida humidity, Arizona heat)
- Usage pattern (RV while driving, night usage)
- Edge-case failure scenario
- Seasonal or environmental trigger

This must feel NATURAL, not labeled as "unique element."

## CONTENT STYLE
- Write like a senior HVAC technician
- Clear, direct, confident
- No fluff, no filler
- Every section must add diagnostic or repair value

## CONVERSION OPTIMIZATION
- Prioritize clarity over length
- Highlight urgency when appropriate
- Include subtle CTA framing (repair vs ignore consequences)

## INTERNAL LINKING
Naturally reference:
- Related symptoms
- Diagnostics
- Repairs
- System pages

## OUTPUT FORMAT
Return STRICT JSON ONLY.
No explanations.
No markdown.
No extra text.
`;

export const PAGE_TYPE_INSTRUCTIONS: Record<string, string> = {
  system: `
You are generating a GOLD STANDARD SYSTEM PAGE.

This is a technical authority page built on real mechanical, thermodynamic, and airflow principles.

DO NOT write generic explanations.

---

GOALS:
- Teach how the system actually works
- Explain the physics (heat, pressure, phase change)
- Show how failures emerge from system imbalance
- Build authority and trust
- Support diagnostics and conversion

---

REQUIRED SECTIONS:

1. Insight-driven introduction (non-generic)

2. Core Physical Principles
- heat transfer (conduction, convection, phase change)
- pressure-temperature relationship
- airflow dynamics
- humidity and latent heat

3. System Operation (4–6 steps)
- real thermodynamic cycle

4. Mermaid system diagram (required)

5. Component Breakdown
- function + failure mode + effect

6. Failure Mechanics
- explain how breakdowns emerge from system imbalance

7. Humidity & Air Quality Impact

8. Technical Observation (expert insight)

9. Common Symptoms (connect to diagnostics)

10. Maintenance & Prevention

11. When to Call a Professional

---

RULES:
- no fluff
- no generic content
- must include real system reasoning
- must feel like technician-level explanation
- 1400–1800 words

---

OUTPUT SCHEMA RULES:
You must return a raw JSON object containing these exact top-level keys:
{
  "insight_intro": "...",
  "core_physics": ["..."],
  "system_operation": ["..."],
  "decision_tree": "graph TD\\n...", 
  "component_breakdown": [{"component": "...", "function": "...", "failure": "..."}],
  "failure_mechanics": "...",
  "humidity_impact": "...",
  "tech_observation": "...",
  "common_symptoms": ["..."],
  "maintenance": ["..."],
  "call_professional": "..."
}

CRITICAL: The Mermaid system diagram MUST BE placed securely in the "decision_tree" property.
`.trim(),

  symptom: `
SYMPTOM PAGE GOAL
- explain what a symptom usually means
- separate obvious from hidden causes
- help user narrow the issue

Must include:
- what the symptom means
- common causes ranked by likelihood
- simple user checks
- danger or escalation signs
- expert observation
- next action guidance
`.trim(),

  diagnostic: `
DIAGNOSTIC PAGE GOAL
- guide a user step-by-step toward the most likely cause

Must include:
- decision logic
- structured flow
- likely causes
- repair/action matrix
- expert observation
- when to stop DIY

CRITICAL DIAGNOSTIC FIELDS
Return and fully populate:
- decision_tree
- system_explanation
- tech_observation
- diagnostic_flow
- top_causes
- repair_matrix
- quick_tools

decision_tree must be valid Mermaid syntax.
system_explanation should contain 4–6 concise, specific steps.
`.trim(),

  cause: `
CAUSE PAGE GOAL
- deeply explain one specific root cause

Must include:
- what this cause is
- why it happens
- symptoms it creates
- how to confirm it
- how it is fixed
- expert observation
- prevention guidance
`.trim(),

  repair: `
REPAIR PAGE GOAL
- explain the repair path clearly and honestly

Must include:
- what the repair addresses
- signs this repair is relevant
- repair difficulty
- tools/materials
- cost expectations
- risks/mistakes
- expert observation
- when professional service is better
`.trim(),

  component: `
COMPONENT PAGE GOAL
- explain the component’s function, failure signs, and diagnostic role

Must include:
- what the component does
- how it fits into the system
- common failures
- symptoms of failure
- testing/inspection overview
- replacement considerations
- expert observation
`.trim(),

  condition: `
CONDITION PAGE GOAL
- explain a broader operating condition or pattern

Must include:
- what the condition means
- why it develops
- associated symptoms
- common related causes
- action guidance
- expert observation
`.trim(),

  authority: `
AUTHORITY PAGE GOAL
- teach foundational understanding and build trust

Must include:
- conceptual explanation
- key subtopics
- misconceptions
- practical implications
- expert observation
- recommended next pages
`.trim(),

  city: `
CITY PAGE GOAL
- connect issue intent with local service action

Must include:
- localized framing without spam
- issue/service explanation
- realistic local relevance
- urgency guidance where appropriate
- trust-building explanation
- conversion pathway

Do not make local pages thin, duplicated, or spun.
They must still teach something useful.
`.trim(),
};

export function buildMasterPrompt(pageType: string): string {
  const typePrompt = PAGE_TYPE_INSTRUCTIONS[pageType] ?? "";
  return [BASE_MASTER_PROMPT, typePrompt].filter(Boolean).join("\\n\\n");
}

export function buildRetryPromptFragment(reasons: string[]): string {
  return [
    "Your previous output failed quality validation.",
    "",
    "You must revise the page to correct these issues:",
    ...reasons.map((r) => "- " + r),
    "",
    "Requirements for revision:",
    "- strengthen specificity",
    "- improve educational value",
    "- add expert-level insight in plain language",
    "- remove generic filler",
    "- preserve schema exactly",
    "- keep content scannable and conversion-aware",
    "- ensure page matches intent precisely",
    "",
    "Return only corrected structured output."
  ].join("\\n");
}

export const GOLD_STANDARD_PROMPT = `
You are generating a HIGH-CONVERSION, HYPER-TECHNICAL AUTHORITY PAGE for an HVAC troubleshooting system.

This page MUST follow the GOLD STANDARD MONEY PRINTER FORMAT.
Your payload MUST EXACTLY match the following JSON structure. 

STRICT HYPER-TECHNICAL REQUIREMENTS:
- WRITE LIKE A VETERAN HVAC TECHNICIAN (Master Level). Do NOT write generic "homeowner" advice.
- You MUST include hardcore technical data: precise multimeter readings (Ohms, Volts, Amps), expected pressures (psig), subcooling/superheat targets, compressor winding sequence checks, ECM vs PSC motor specifics, or true mechanical failure points matching the symptom.
- Provide a concise AI summary with 3-5 bullet points and the most likely issue (include the actual mechanical/electrical point of failure).
- Generate a system flowchart in Mermaid syntax (flowchart LR) outlining the specific thermodynamic and electrical cycle.
- Generate a diagnostic flowchart in Mermaid syntax (flowchart TD) that includes exact testing benchmarks (e.g., "Check capacitor microfarads (µF)").
- Provide critical thresholds for system performance (e.g., Target Subcooling, T.E.S.P., Delta-T ranges, or specific voltage drops).
- Provide a quick checks table mapping symptoms to exact causes and technical testing actions.
- Provide common causes with High/Medium/Low probability, including a highly specific fix (e.g., "Hard start kit installation").
- Provide a deep dive into the top causes with hyper-specific fix_steps and highly technical tools_needed (e.g., "Fieldpiece SMAN manifold, Megohmmeter, Dual-display multimeter").
- Provide a list of recommended tools and their exact industrial purposes.
- Provide 3-5 safe pre-call steps, focusing on safe homeowner observations vs what requires EPA 608/electrical certification.
- Provide a realistic cost boundary (low, medium, high) based on actual OEM part prices + standard labor rates.
- INTERNAL LINKING FLYWHEEL: You MUST provide an array of related_links explicitly connecting this symptom to its underlying 'Condition', 'System', and 'Location'. Do NOT output generic links. Use strict categorical labels.

## OUTPUT FORMAT (MANDATORY EXACT JSON STRUCTURE)
Return a single JSON object containing exactly these fields:
{
  "schemaVersion": "v1",
  "problem_summary": "Overall context of what the homeowner is experiencing.",
  "safety_note": "A critical, urgent safety warning (electrical shock, refrigerant burns, etc).",
  "deep_explanation": "Hyper-technical mechanical/thermodynamic explanation of the failure.",
  "quick_steps": [
    "Actionable step 1",
    "Actionable step 2"
  ],
  "ai_summary": {
    "bullets": ["Point 1", "Point 2"],
    "most_likely_issue": "Specific Component Failure"
  },
  "system_flow": "flowchart LR\\n...",
  "diagnostic_flow": {
    "chart": "flowchart TD\\n...",
    "steps": [
      {
        "step": "Step Name (from chart)",
        "detail": "Extremely technical details about testing procedure, exact parts, and required multimeter/gauge readings."
      }
    ]
  },
  "quick_diagnosis": [
    {
      "symptom": "...",
      "likely_cause": "...",
      "action": "..."
    }
  ],
  "causes": [
    {
      "name": "Cause Name",
      "probability": "High", 
      "description": "Short explanation",
      "quick_fix": "Quick resolution"
    }
  ],
  "deep_causes": [
    {
      "cause": "Same Cause Name",
      "why_it_happens": "Detailed technical explanation...",
      "fix_steps": ["Step 1", "Step 2"],
      "tools_needed": ["Tool 1", "Tool 2"]
    }
  ],
  "repair_paths": [
    {
      "title": "Specific Repair",
      "cost": "$150 - $300",
      "difficulty": "Moderate"
    }
  ],
  "comparison": [
    {
      "category": "Contactor / Motor / Board",
      "budget": "Standard OEM replacement",
      "value": "Upgraded/Heavy-duty component"
    }
  ],
  "prevention": [
    "Preventative maintenance step 1",
    "Preventative maintenance step 2"
  ],
  "tools": [
    {
      "name": "Tool Name",
      "purpose": "What it is used for",
      "beginner": "Yes/No/Moderate"
    }
  ],
  "before_calling_tech": [
    "Check step 1",
    "Check step 2"
  ],
  "faq": [
    {
      "question": "Common user question",
      "answer": "Technical but directly understandable answer"
    }
  ],
  "cost": {
    "low": "$50",
    "medium": "$200",
    "high": "$1000+"
  },
  "related_links": [
    {
      "label": "Condition",
      "title": "Related Condition Concept",
      "href": "/diagnose/related-condition-slug"
    },
    {
      "label": "System",
      "title": "Underlying System Architecture",
      "href": "/diagnose/related-system-slug"
    },
    {
      "label": "Location",
      "title": "Component Location Guide",
      "href": "/diagnose/related-location-slug"
    }
  ]
}

No extra text. Return ONLY valid JSON matching this exact structure.
`;

export type ComposePromptOptions = {
  validationMode?: boolean;
  schemaVersion?: string;
  /** Home Service Authority vertical (hvac, plumbing, electrical, …) */
  verticalId?: string | null;
  /** City / metro label for localized city diagnostic JSON (optional). */
  city?: string | null;
  /** US state (e.g. FL) when `city` is not already "City, ST" (optional; DG_AUTHORITY_V3). */
  state?: string | null;
  /** Human-readable issue for DG_AUTHORITY_V3 (optional; defaults from slug). */
  primaryIssue?: string | null;
};

/** Use with {@link composePromptForPageType} / orchestrator `schemaVersion`. */
export const HSD_CITY_DIAGNOSTIC_SCHEMA_VERSION = "hsd_city_diagnostic_v1" as const;

/** DecisionGrid-style diagnostic engine JSON (v3). Use with `schemaVersion` or `pageType` `dg_authority_v3`. */
export const DG_AUTHORITY_V3_SCHEMA_VERSION = "dg_authority_v3" as const;

const ACRONYMS_PRIMARY_ISSUE = new Set([
  "ac",
  "hvac",
  "rv",
  "fl",
  "uv",
  "led",
  "diy",
  "co",
  "voc",
]);

/** "ac-not-cooling" / "hvac/ac-not-cooling" → "AC Not Cooling" style label for prompts. */
export function humanizeSlugAsPrimaryIssue(slug: string): string {
  const s = enforceStoredSlug(slug);
  const tail = s.replace(/^(?:hvac|plumbing|electrical)\//i, "");
  return tail
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      if (ACRONYMS_PRIMARY_ISSUE.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Parse "Tampa, FL" or combine `city` + `state` for DG per-page INPUT.
 */
export function parseCityStateForPrompt(
  cityLine?: string | null,
  stateHint?: string | null
): { display: string; city: string; state: string } {
  const raw = (cityLine || "").trim();
  const st = (stateHint || "").trim();
  const comma = raw.match(/^([^,]+),\s*([A-Za-z]{2})\s*$/);
  if (comma) {
    const c = comma[1].trim();
    const abbr = comma[2].trim().toUpperCase();
    return { display: `${c}, ${abbr}`, city: c, state: abbr };
  }
  if (raw && st) {
    return { display: `${raw}, ${st.toUpperCase()}`, city: raw, state: st.toUpperCase() };
  }
  if (raw) return { display: raw, city: raw, state: st ? st.toUpperCase() : "" };
  if (st) return { display: st.toUpperCase(), city: "", state: st.toUpperCase() };
  return { display: "", city: "", state: "" };
}

const DG_AUTHORITY_V3_MASTER_PROMPT = `
MASTER CONTRACT (DG_AUTHORITY_V3) — diagnostic engine, not a blog post.

You are a 30-year HVAC diagnostic technician building a structured diagnostic system for homeowners.

Goals (in order):
1) Identify the exact problem quickly
2) Guide a simple decision path
3) Add technical depth only after clarity
4) Lead to an informed repair-or-call decision

CORE PRINCIPLES:
- Think like a technician on a real service call
- Decision-making beats long explanation
- Plain English first; technical second
- Assume the reader is stressed and wants fast answers
- Every block must reduce uncertainty

---

REQUIREMENTS:

LOCALIZE THE DIAGNOSIS
- Account for climate (heat, humidity, load) for the Location given in INPUT above
- Briefly mention how the environment shifts failure patterns (run time, coil loading, condenser stress, corrosion) where true — no keyword stuffing

BUILD A CLEAR DECISION TREE (decision_tree_mermaid)
- Start from the user symptom in INPUT
- Branch on observable homeowner conditions: airflow, supply air temperature / feel, and system response (runs nonstop, short cycles, trips breaker, frozen line, etc.)
- Each tree endpoint MUST map to exactly one \`paths[].id\` (same id string)
- MERMAID: use simple words in node labels (no psig, superheat, subcool jargon in nodes)
- Max depth: 3 levels from the root symptom
- Valid Mermaid only; start with: flowchart TD
- Do not wrap the diagram in markdown fences inside the JSON string

CREATE 3–5 CORE PATHS (paths array)
Each path object MUST include:
- id: kebab-case slug (e.g. "low-airflow", "refrigerant-charge", "control-electrical")
- title: short homeowner headline
- simple_explanation: 2–3 short sentences (plain English)
- technical_explanation: deeper mechanical / thermodynamic reasoning (still tight; 1–3 short paragraphs max)
- how_to_confirm: specific observable signals (what they see/hear/feel; what pattern confirms this path)
- typical_cost_range: realistic band for the Location in INPUT — no fake precision

Cover at least these diagnostic buckets across your paths (ids may vary but concepts must appear):
- Low / restricted airflow
- Refrigerant / heat-transfer performance issue
- Electrical or control failure

WRITE A STRONG SUMMARY (summary_30s object)
- most_likely_cause: one clear sentence
- what_to_check_first: what to verify before anything else (1–2 tight sentences)
- diy_vs_pro: whether this issue is usually homeowner-safe vs typically needs a licensed tech (one sentence)

QUICK CHECKS (top-level quick_checks array)
- 3–5 strings
- Homeowner-safe only: filter, stat mode, breaker, visual ice/water, obvious disconnect, gentle register checks
- No refrigerant handling, no brazing, no opening sealed refrigerant circuits

TECHNICIAN SECTION (technician_section object)
- what_they_measure: array of strings — MUST meaningfully include where relevant: suction pressure, head (liquid) pressure, superheat, subcooling, compressor amp draw, supply/return delta-T, and airflow / static pressure when useful
- how_they_decide: short paragraph tying those readings to the paths above
- authority_note: one short calm paragraph — no bravado

COST SECTION (costs object)
- local_context_note: one sentence tying bands to the Location in INPUT (market + climate realism)
- items: 3–6 objects { "label", "band", "notes" } — realistic ranges for that metro; no exact dollar quotes as guarantees

WHEN TO STOP DIY (when_to_stop_diy array of strings)
Include clear triggers such as: repeated failure after reset, sustained electrical symptoms, ice formation that returns, water leaks that spread, burning smell, any 240V / smoke / sparking, refrigerant work, compressor noise extremes

CTA (string)
- Calm, practical; tie to difficulty or safety — not salesy

STYLE:
- Short paragraphs (1–3 lines) inside string fields where possible
- Scannable; no fluff; no repetition
- No "in this article"; no generic SEO filler

OUTPUT — return ONE valid JSON object ONLY.
No commentary outside JSON. No markdown outside JSON.

Shape (populate every key; arrays non-empty where specified):

{
  "layout": "dg_authority_v3",
  "summary_30s": {
    "most_likely_cause": "",
    "what_to_check_first": "",
    "diy_vs_pro": ""
  },
  "decision_tree_mermaid": "",
  "quick_checks": [],
  "paths": [
    {
      "id": "",
      "title": "",
      "simple_explanation": "",
      "technical_explanation": "",
      "how_to_confirm": "",
      "typical_cost_range": ""
    }
  ],
  "technician_section": {
    "what_they_measure": [],
    "how_they_decide": "",
    "authority_note": ""
  },
  "costs": {
    "local_context_note": "",
    "items": []
  },
  "when_to_stop_diy": [],
  "cta": ""
}
`.trim();

/**
 * Per-page user prompt: INPUT (issue + location) plus DG_AUTHORITY_V3 master contract.
 * Use with {@link composePromptForPageType} (slug still supplies PRIMARY PAGE SEED below the fold).
 */
export function buildDgAuthorityV3PerPageUserPrompt(
  slug: string,
  opts?: ComposePromptOptions
): string {
  const issue =
    (opts?.primaryIssue && opts.primaryIssue.trim()) ||
    humanizeSlugAsPrimaryIssue(slug);
  const loc = parseCityStateForPrompt(opts?.city, opts?.state);
  const locationLine = loc.display.trim()
    ? loc.display
    : "Infer city and state from the PRIMARY PAGE SLUG when possible; otherwise temperate US residential.";

  const inputBlock = `
GENERATION PROMPT (PER PAGE)

This is what you run for each page (Tampa, Orlando, etc.)

Generate a DecisionGrid diagnostic page using DG_AUTHORITY_V3.

INPUT:
- Primary Issue: ${issue}
- Location: ${locationLine}
- System Type: Residential HVAC (central air)
`.trim();

  const scenarioBody = getDgAuthorityV3SceneRequirementsBlock(
    slug,
    locationLine,
    opts?.primaryIssue
  );
  const scenarioSection = scenarioBody
    ? `\n\n---\n\nSCENARIO REQUIREMENTS (MANDATORY for this page — follow exactly):\n\n${scenarioBody}`
    : "";

  return `${inputBlock}${scenarioSection}

---

${getMasterAuthorityConversionPrompt()}

---

${getHvacHighConversionDecisiongridMasterPrompt()}

---

${DG_AUTHORITY_V3_MASTER_PROMPT}`.trim();
}

/** Maps Master Authority + Conversion narrative beats onto {@link HSD_CITY_DIAGNOSTIC_SCHEMA_VERSION} JSON keys only. */
const HSD_JSON_MAPPING_FROM_CONVERSION_MASTER = `
---
MAPPING — apply the Master Authority + Conversion contract using ONLY the JSON keys defined below (do not add new top-level keys).

- Top summary box → problem + summary_30s (risk if ignored; 2–3 quick checks; subtle technician-needed signal).
- Decision-flow branches → quick_decision_tree (mirror symptom forks; use situation/leads_to text that signals safe checks vs airflow vs refrigerant/electrical “pro recommended”).
- Quick checks closing line → last quick_checks item must state that if unresolved, the issue is likely internal and requires a technician.
- Causes with consequences → each likely_causes string packs what it is, why it happens, and what happens if ignored.
- How the system works → how_system_starts (startup_sequence + environment + symptom mapping; cover heat transfer, airflow load, refrigerant cycle in tight plain language).
- Repair matrix (symptom / fix / cost bands) → weave realistic bands into diagnostic_steps and/or likely_causes (no fake precision).
- Repair vs replace + 50% rule → repair_vs_pro and/or diagnostic_steps.
- Bench / advanced + high-voltage warnings → diagnostic_steps only when relevant; discourage risky homeowner execution.
- Field insights → diagnostic_steps (optional short “Field insight:” lead-ins) and how_system_starts.authority_line.
- Preventative maintenance → tail of diagnostic_steps and/or environment_bullets.
- Primary CTA + escalation → cta primary/secondary (risk-based, calm; not salesy).
- When to stop DIY → repair_vs_pro.call_pro must cover refrigerant, electrical, compressor boundaries where applicable; include “stop running the system to avoid further damage” when escalation risk is real.
---
`.trim();

/** Maps High-Conversion DecisionGrid master (13-part order) onto {@link HSD_CITY_DIAGNOSTIC_SCHEMA_VERSION} JSON keys only. */
const HSD_JSON_MAPPING_FROM_HIGH_CONVERSION_DG = `
---
MAPPING (High-Conversion DecisionGrid master) — same top-level JSON keys only; no emojis in any string values.

1. CTR title pattern → title and meta_title (e.g. “[Problem]? N Causes + Fix Cost (2026 Guide)”); meta_description with stakes + cause hint + cost curiosity.
2. 30-second summary → summary_30s plus problem line (stakes: comfort, cost, damage; name failure buckets).
3. Cost of waiting → problem, summary_30s, and early diagnostic_steps lines (escalation “small becomes large”; homeowner delay pattern; numeric cost bands).
4. Quick binary tree → quick_decision_tree (airflow vs not; outdoor running vs not; explicit next checks in situation/leads_to).
5. Decision fork → quick_decision_tree rows plus repair_vs_pro framing; include one clear “most homeowners call a pro” style resolution in text.
6. How the system works → how_system_starts (heat transfer not “making cold”; refrigerant loop; airflow load).
7. Top causes (5–7) → likely_causes (each string: what it is, why symptom, risk if ignored).
8. Repair matrix → diagnostic_steps as scannable lines using “symptom pattern | likely fix | cost band” style where possible.
9. Replace vs repair → repair_vs_pro and diagnostic_steps (10–15 year rule, 50% repair cost rule, refrigerant generation note when relevant).
10. Technician insight → diagnostic_steps (field reality; misdiagnosis; why pros narrow faster) and how_system_starts.authority_line.
11. When to stop DIY → repair_vs_pro.call_pro (warm air with normal airflow; frost/ice; loud noise; compressor, warranty, multi-thousand risk).
12. Preventative → tail of diagnostic_steps and/or environment_bullets (filters, coil cleaning, annual tune-up).
13. Final CTA → cta.primary and cta.secondary (strong loss-aversion headline tone in primary; secondary e.g. find local tech). No hype words.

Conversion psychology: escalation and loss aversion primarily in problem, summary_30s, diagnostic_steps; controlled confidence in quick_checks and diy_ok; decision pressure toward call_pro without sounding like a sales page.
---
`.trim();

/**
 * LLM instructions + output contract: single JSON object for a localized
 * symptom × city diagnostic page (homeservicediagnostics.com tone).
 */
export function buildHsdCityDiagnosticJsonPrompt(
  slug: string,
  cityHint?: string | null
): string {
  const s = enforceStoredSlug(slug);
  const cityBlock = cityHint?.trim()
    ? `City / region context (weave in naturally; do not repeat the city name in every sentence): "${cityHint.trim()}"`
    : "Infer city/region from the slug only when it is explicit (e.g. repair/city-slug/symptom). If unclear, keep locality light and accurate.";

  return `
${getMasterAuthorityConversionPrompt()}

---

${getHvacHighConversionDecisiongridMasterPrompt()}

${HSD_JSON_MAPPING_FROM_CONVERSION_MASTER}

${HSD_JSON_MAPPING_FROM_HIGH_CONVERSION_DG}

Generate a production-ready diagnostic page in JSON.

Slug: ${s}

${cityBlock}

Requirements:
- The JSON slug field must use the same canonical form as the seed (no leading slash): "${s}"
- Return JSON only (no markdown fences, no commentary)
- Assume this is for homeservicediagnostics.com
- Tone: experienced technician, clear, direct, no fluff
- Audience: homeowner with an active problem
- This is a city page, so include local phrasing naturally but do not stuff the city name
- Sections required (exact top-level keys):
  - title
  - meta_title
  - meta_description
  - slug
  - vertical
  - problem
  - city
  - summary_30s
  - how_system_starts (object: DG-style technical briefing — NOT a wall of text; see rules below)
  - quick_decision_tree (array: dominant “start here” triage — NOT a buried flowchart)
  - quick_checks
  - likely_causes
  - diagnostic_steps
  - repair_vs_pro
  - cta
  - internal_links

Rules:
- Keep the problem narrowly focused to this slug only
- Do not drift into unrelated issues
- Do not create duplicate-intent content
- title: H1-style headline including city when the slug is localized (e.g. "AC Not Turning On in Tampa, FL")
- problem: One subhead sentence under the title: Tampa heat urgency + consequence if misdiagnosed or ignored (plain string)
- summary_30s: Plain string; strongly prefer exactly three lines separated by newline, each starting with "• " — (1) most likely cause class, (2) fastest safe check, (3) risk level (e.g. "Moderate → High if ignored"). Alternative: one tight paragraph if bullets do not fit the symptom.
- how_system_starts: REQUIRED object (DecisionGrid / authority tone — technical briefing for homeowners). Goals: credibility, how the system behaves, tie behavior to diagnosis. Fields:
  - "section_title": e.g. "How Your AC System Starts (And Why It Fails)" or "How Your AC System Starts (Simplified)"
  - "eyebrow" (optional): short label above title, e.g. "Technical briefing"
  - "authority_line": one confident sentence, e.g. systems fail predictably under load / electrical stress / wear (no fluff)
  - "startup_sequence": array of 4–6 objects { "title": "short step name", "detail": "one–two tight sentences" } in real power-on order: thermostat signal → indoor control/contactor → capacitor assist → compressor + outdoor fan (adapt to symptom vertical)
  - "environment_title": e.g. "Why failures show up faster in Tampa"
  - "environment_bullets": 2–5 short strings (heat, humidity, peak demand, capacitor life, etc.) — concrete, not generic marketing
  - "mapping_title": e.g. "What this means for your issue"
  - "symptom_mapping": 2–4 objects { "cue": "what the homeowner notices", "points_to": "failure bucket / next check" } — must align with quick_decision_tree language where applicable
  STYLE: concise, field-tech voice; no long intros; no generic "HVAC comfort" filler.
  DESIGN (for the React renderer): content will be shown with a subtle top divider and numbered steps only — do NOT rely on colored background boxes in the text; keep paragraphs short.
- quick_decision_tree: REQUIRED. Array of 4–6 objects, each with:
  - "situation": homeowner-visible state (short)
  - "leads_to": likely diagnosis bucket (short label)
  - "anchor": unique kebab-case id for this branch (used in href="#anchor"); prefix "qdt-" recommended (e.g. "qdt-thermostat-no-power")
  - "section_ids" (optional): array of 1–4 strings, each one of: "section-quick-checks", "section-likely-causes", "section-diagnostic-steps", "section-repair-vs-pro" — where to send the reader after they pick this branch (conversion: tree → deep sections).
  This block is the conversion engine: branches must map to on-page anchors, not off-site links.
- quick_checks: 4–6 items; safe, realistic homeowner observations (power, filters, stats, obvious leaks, breaker, airflow basics)
- likely_causes: 4–6 strings; each states the cause and the key differentiator for this symptom
- diagnostic_steps: 6–10 strings; technician-style narrowing (what to observe, what to measure if homeowner-safe, what result implies); ordered logically
- repair_vs_pro: object with diy_ok (3–5 strings) and call_pro (3–5 strings); clearly separate simple checks from licensed/pro-only work
- cta: object with primary and secondary; primary label should be action-oriented (default tone: "Get Local HVAC Help"); secondary can be self-serve triage / related guide

Internal link rules (path-only strings relative to site, no domain):
- internal_links.parent: vertical hub slug/path for this trade (e.g. hub for HVAC / plumbing / electrical on this site)
- internal_links.siblings: exactly 3 strings — related diagnostic or symptom pages in the same city cluster as this slug
- internal_links.service: best matching local service page slug/path for this city + problem
- internal_links.authority: relevant deep authority / guide page slug/path (national or evergreen, not a duplicate city page)
- For the 10 Tampa FL HVAC + plumbing hub paths in the platform registry, internal_links are merged server-side after generation using exact parent/siblings/service/authority mappings — still output a syntactically valid internal_links object in your JSON

Output shape (populate every field; arrays must be non-empty where specified above):
{
  "title": "",
  "meta_title": "",
  "meta_description": "",
  "slug": "",
  "vertical": "",
  "problem": "",
  "city": "",
  "summary_30s": "",
  "how_system_starts": {
    "section_title": "How Your AC System Starts (And Why It Fails)",
    "eyebrow": "Technical briefing",
    "authority_line": "AC systems don't fail randomly — they fail in predictable ways based on load, electrical stress, and component wear.",
    "startup_sequence": [
      { "title": "Thermostat calls for cooling", "detail": "Low-voltage signal leaves the stat when indoor temp is above setpoint." },
      { "title": "Contactor pulls in", "detail": "Control closes the high-voltage path to the outdoor unit." },
      { "title": "Capacitor assists start", "detail": "Start/run assist helps compressor and fan motor come up to speed." },
      { "title": "Compressor + fan run", "detail": "Refrigerant circulates; outdoor fan rejects heat." }
    ],
    "environment_title": "Why failures happen faster in Tampa",
    "environment_bullets": [
      "Capacitors age faster when case temps stay high.",
      "Peak demand can show marginal voltage / weak contacts.",
      "High latent load keeps run times long."
    ],
    "mapping_title": "What this means for your issue",
    "symptom_mapping": [
      { "cue": "No indoor response", "points_to": "Thermostat power / low-voltage path" },
      { "cue": "Clicking but no start", "points_to": "Capacitor or contactor" },
      { "cue": "Outdoor silent", "points_to": "Disconnect, breaker, or compressor circuit" }
    ]
  },
  "quick_decision_tree": [
    {
      "situation": "",
      "leads_to": "",
      "anchor": "qdt-example-branch",
      "section_ids": ["section-quick-checks", "section-diagnostic-steps"]
    }
  ],
  "quick_checks": [],
  "likely_causes": [],
  "diagnostic_steps": [],
  "repair_vs_pro": {
    "diy_ok": [],
    "call_pro": []
  },
  "cta": {
    "primary": "",
    "secondary": ""
  },
  "internal_links": {
    "parent": "",
    "siblings": [],
    "service": "",
    "authority": ""
  }
}

Return valid JSON only.
`.trim();
}

function withVerticalAndTopicContext(
  basePrompt: string,
  slug: string,
  opts?: ComposePromptOptions
): string {
  const verticalKey = normalizeVerticalId(opts?.verticalId);
  const preamble = buildVerticalPromptPreamble(verticalKey);
  const topicLine = `PRIMARY PAGE SLUG / TOPIC SEED: "${enforceStoredSlug(slug)}"`;
  if (!preamble) {
    return `${topicLine}\n\n---\n\n${basePrompt}`;
  }
  return `${preamble}\n\n${topicLine}\n\n---\n\n${basePrompt}`;
}

export function composePromptForPageType(pageType: string, slug: string, opts?: ComposePromptOptions): string {
  let core: string;
  if (opts?.schemaVersion === HSD_V2_SCHEMA_VERSION) {
    const storageSlug = enforceStoredSlug(slug);
    const localized = parseLocalizedStorageSlug(storageSlug);
    const cityLine =
      (opts?.city && String(opts.city).trim()) ||
      (localized ? formatCityPathSegmentForDisplay(localized.citySlug) : "");
    const { city, state } = parseCityStateForPrompt(cityLine, opts?.state ?? null);
    const symptom =
      (opts?.primaryIssue && String(opts.primaryIssue).trim()) ||
      (localized
        ? humanizeSlugAsPrimaryIssue(`${localized.vertical}/${localized.pillarCore}`)
        : humanizeSlugAsPrimaryIssue(storageSlug));
    const cityOut = city.trim() || cityLine.replace(/,\s*[A-Z]{2}\s*$/i, "").trim() || cityLine;
    const stateOut =
      state.trim() ||
      (() => {
        const m = localized?.citySlug.match(/-([a-z]{2})$/i);
        return m ? m[1].toUpperCase() : "";
      })();
    core = buildHsdV2VeteranTechnicianPrompt(symptom, cityOut, stateOut);
    return withVerticalAndTopicContext(core, storageSlug, opts);
  }
  if (opts?.schemaVersion === HSD_CITY_DIAGNOSTIC_SCHEMA_VERSION) {
    core = buildHsdCityDiagnosticJsonPrompt(slug, opts?.city);
    return withVerticalAndTopicContext(core, slug, opts);
  }
  if (opts?.schemaVersion === "v2_goldstandard") {
    core = GOLD_STANDARD_PROMPT;
  } else if (
    opts?.schemaVersion === "diagnostic_engine" ||
    opts?.schemaVersion === "hvac_authority_v1" ||
    pageType === "diagnostic_engine" ||
    pageType === "hvac_authority_v1"
  ) {
    core = HRB_AUTHORITY_PROMPT;
  } else {
    core = buildMasterPrompt(pageType);
  }
  return withVerticalAndTopicContext(core, slug, opts);
}

export function validateCoreForPageType(pageType: string, data: any): { valid: boolean; errors: string[] } {
  return { valid: true, errors: [] };
}
export type SchemaDef = any; 
export type PromptSchemaResult = any;
export const VALIDATION_PROMPT = "";

export const GOLD_STANDARD_CANARY_PROMPT = `
You are generating ONE GOLD STANDARD PAGE for each core page type in a diagnostic authority system.

This is a CANARY TEST. Output must be PERFECT.

You must generate the following page types:

1. SYSTEM PAGE
2. SYMPTOM PAGE
3. DIAGNOSTIC PAGE
4. CAUSE PAGE
5. REPAIR PAGE
6. LOCATION PAGE

Each page must follow GOLD STANDARD STRUCTURE adapted to its type.

-----------------------------------
GLOBAL RULES (ALL PAGES)
-----------------------------------

- Output STRICT JSON
- No explanations
- No markdown
- No extra text

- WRITE LIKE A VETERAN HVAC TECHNICIAN (Master Level). Do NOT write generic "homeowner" advice.
- You MUST include hardcore technical data where applicable: precise multimeter readings (Ohms, Volts, Amps), expected pressures (psig), subcooling/superheat targets, compressor winding sequence checks, ECM vs PSC motor specifics, or true mechanical failure points matching the symptom.
- Clear, confident, diagnostic-first tone
- No fluff

- EACH PAGE MUST INCLUDE:
  - Fast Answer
  - Quick Diagnostic Checklist (5–7 highly technical steps involving parts/tools)
  - Technician Insights (cite specific failure modes, exact pressures or temperatures)
  - Cost context where applicable
  - Internal linking

- EACH PAGE MUST INCLUDE:
  - EXACTLY ONE unique contextual element
    (climate, usage scenario, environment, edge case)

-----------------------------------
INTERNAL DEPTH REQUIREMENTS
-----------------------------------

- Minimum 3 causes (where applicable)
- Minimum 5 repairs (where applicable)
- 2–3 diagnostics
- 1 system reference

-----------------------------------
PAGE TYPE ADAPTATIONS
-----------------------------------

## SYSTEM PAGE
- Overview of system
- Common failure points
- Link to symptoms
- High-level diagnostic logic

## SYMPTOM PAGE
- Strong conversion intent
- "Most Common Fix" REQUIRED
- Diagnostic flow REQUIRED
- Causes + Repairs REQUIRED

## DIAGNOSTIC PAGE
- Step-by-step troubleshooting process
- Generate a diagnostic flowchart in Mermaid syntax (flowchart TD) for the diagnosticFlow property. Do not use markdown backticks.
- Clear pass/fail checkpoints

## CAUSE PAGE
- Deep explanation of root issue
- Symptoms it creates
- Repairs tied to it

## REPAIR PAGE
- Step-by-step repair overview
- Tools required
- Difficulty + cost
- When NOT to DIY

## LOCATION PAGE (CITY)
- Localized context (heat, humidity, usage)
- Common issues in this region
- Strong CTA framing (repair intent)

-----------------------------------
SCHEMA (ALL PAGES MUST FOLLOW)
-----------------------------------

You must output exactly this JSON structure. It must be a single JSON object with a "pages" key containing the array of 6 objects. Do not add any extra keys.

{
  "pages": [
    {
      "schemaVersion": "v1",
      "pageType": "system",
      "slug": "residential-hvac-system",
      "title": "...",
      "fastAnswer": "...",
      "mostCommonFix": {
        "title": "...",
        "cost": "...",
        "difficulty": "...",
        "time": "...",
        "summary": "..."
      },
      "diagnosticFlow": {
        "chart": "flowchart TD\\n...",
        "steps": [
          {
            "step": "Step Name (from chart)",
            "detail": "Extremely technical details about testing procedure, exact parts, and required multimeter/gauge readings."
          }
        ]
      },
      "repairOptions": [{ "name": "...", "description": "...", "cost": "...", "difficulty": "..." }],
      "tools": ["..."],
      "costBreakdown": { "low": "...", "medium": "...", "high": "..." },
      "ignoredConsequences": "...",
      "technicianInsights": "...",
      "uniqueElement": "...",
      "internalLinks": { "diagnostics": ["..."], "causes": ["..."], "repairs": ["..."], "system": "..." }
    },
    {
      "pageType": "symptom",
      "slug": "ac-not-cooling",
      ... // same keys
    },
    { "pageType": "diagnostic", "slug": "how-to-diagnose-warm-air", ... },
    { "pageType": "cause", "slug": "refrigerant-leak", ... },
    { "pageType": "repair", "slug": "seal-refrigerant-leak", ... },
    { "pageType": "location", "slug": "ac-repair-tampa", ... }
  ]
}

No additional text.
`;

export const HRB_AUTHORITY_PROMPT = `You output a single JSON object for an HVAC Revenue Boost authority page.

RETURN RULES
- Return ONLY valid JSON
- No markdown fences (except inside mermaid)
- No commentary
- No extra text
- Every required field must be populated
- Optional fields must be omitted if unused
- Do not output null except where explicitly allowed

PRIMARY GOAL
Generate a high-authority, homeowner-facing HVAC diagnostic page for a local lead-generation site. This is a "cousin" to the highly technical DecisionGrid. It must be homeowner-readable but deeply authoritative, acting as a veteran HVAC diagnostician triaging an issue for a customer.

TONE & NEGATIVE CONSTRAINTS
- Professional restraint and serious expert tone.
- NO listicle tone. NO "there are many possible reasons."
- NO thin consumer-blog filler phrasing.
- NO casual leap to "check refrigerant first." Always prioritize airflow and electrical basics.
- Use licensed-tech boundaries (clarify when a pro is legally or physically required).
- Avoid generic SEO intro language.

CONTENT DENSITY & HARD VALIDATION RULES
- summary_30s: MUST have minimum 2–4 strong bullets.
- system_explanation: MUST have minimum 3 substantive paragraphs or structured blocks.
- failure_clusters: MUST have at least 4 clusters (Strictly separate: Airflow, Refrigerant, Electrical, Control, and Mechanical domains).
- repair_matrix: MUST have minimum 4–6 rows.
- when_to_stop_diy: MUST include specific electrical/safety/refrigerant escalation triggers.
- decision_tree_mermaid: MUST have at least 6 nodes.
- diagnostic_flow: MUST have at least 3 steps with branch logic.

REQUIRED JSON KEYS & SCHEMA

1. CONSTANTS
- layout: Must be exactly "hvac_authority_v1"
- vertical: Must be exactly "residential_hvac"
- page_type: Must be exactly "diagnostic"
- technical_depth: Must be exactly "homeowner_authority"

2. METADATA
- slug: Exactly matches input path
- title: SEO-friendly headline (e.g., "AC Not Cooling: A Complete Diagnostic Guide")
- symptom_family: (e.g. airflow, temperature, electrical, noise, water)
- primary_intent: (e.g. troubleshoot, repair, replace)

3. TOP OF FUNNEL (Identify & Reduce Panic)
- intro: 2 sentences. 1 stating exact problem, 1 identifying user expectation.
- summary_30s: Array of 2-4 strong, action-oriented bullets.
- what_this_usually_means: 2-3 sentences providing immediate clarity on the likelihood of the fault.

4. DIAGNOSTICS & TEACHING (Teach & Triage)
- quick_checks: Array of 3-5 immediate DIY homeowner-safe checks.
- system_explanation: Array of 3+ substantive paragraphs explaining why each symptom points toward a given failure bucket.
- decision_tree_mermaid: String containing valid flowchart TD mermaid code. (6+ nodes).
- diagnostic_flow: Array of step-by-step logic.
  - Each step: step (number), question, yes, no, next_step (number or null).

5. AUTHORITY CLUSTERING
- failure_clusters: Array of exactly 4+ clusters.
  - category: (Airflow, Refrigerant, Electrical, Control, or Mechanical)
  - why_it_causes_this_symptom: 1-2 tight sentences.
  - signals: Array of 2-3 observable signs.
  - first_checks: Specific check to verify.
  - typical_fix_path: What a tech will do.
  - risk_if_ignored: Why they can't wait.

6. CONVERSION & DECISION (Force Decision & Convert)
- repair_matrix: Array of 4-6 repair rows.
  - issue_name
  - cost_band: (e.g. "$150-$300")
  - urgency: ("Low", "Medium", "High", "Critical")
  - pro_required: (boolean)
- next_actions: Array of 2-3 specific steps for the homeowner.
- replace_vs_repair: 2-3 sentences advising when to stop fixing and upgrade.
- prevention_tips: Array of 3+ specific maintenance actions.
- when_to_stop_diy: Array of 3-4 escalation triggers (e.g., live 240V, handling refrigerant).
- cta: Service call prompt text (e.g. "Ready for a pro diagnostic? Schedule below.")

7. SEO FLYWHEEL
- seo: metaTitle, metaDescription (140-160 chars)
- seo_flywheel:
  - funnel_stage ("TOFU", "MOFU", "BOFU")
  - search_intent ("diagnostic", "repair", "comparison")
  - lateral_expansions [{slug, type}]
  - monetization_expansions [{slug, type}]
  - next_best_pages [3 precise query strings]

8. OPTIONAL
- internal_links: related_symptoms [{slug, title}], related_causes [{slug, title}]

FINAL OUTPUT RULE
Return exactly one valid JSON object and nothing else.`;

