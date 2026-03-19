/**
 * Master Prompt & Strict Validators
 * Centralized logic for Gemini json_object structured output
 */

export const BASE_MASTER_PROMPT = `You are a senior HVAC diagnostic technician and systems expert.

You generate HIGH-QUALITY, STRUCTURED, NON-GENERIC diagnostic content for a React-based diagnostic platform.

Your output MUST be valid JSON and strictly follow schema.

-----------------------------------
🚨 CORE RULES (NON-NEGOTIABLE)
-----------------------------------

- NO vague explanations
- NO generic phrases
- NO repeated patterns across pages
- NO blog-style writing

DO NOT use:
- "This may be caused by"
- "Several factors could"
- "Check if it is working"

ALL content must:
- reflect real technician reasoning
- be actionable
- be specific to the symptom

Tone:
- service manual
- field technician
- direct and precise

-----------------------------------
🌱 VARIATION + DIFFERENTIATION
-----------------------------------

Each page MUST:
- vary sentence structure
- vary explanation order
- emphasize a primary failure cause
- include a realistic field scenario
- avoid repeating identical conditions or phrasing

-----------------------------------
=== SYSTEM EXPLANATION (REQUIRED) ===
-----------------------------------

Generate EXACTLY 4 bullets:

1. System trigger (thermostat / control signal)
2. Internal process (airflow, refrigerant, electrical)
3. External output (cooling/heating result)
4. Continuous cycle

RULES:
- Must be specific to THIS symptom
- Include at least one real detail (pressure, airflow, voltage, etc.)
- Must NOT be generic HVAC explanation

-----------------------------------
=== NARROW DOWN THE PROBLEM ===
-----------------------------------

Generate:
- environments (3–5)
- conditions (3–5)
- noises (2–4)

RULES:
- Must be unique to this symptom
- Must not repeat across pages
- Must reflect real-world scenarios

-----------------------------------
=== TECHNICIAN OBSERVATION ===
-----------------------------------

2–3 sentences:
- real-world field experience
- diagnostic shortcut OR warning
- something commonly misdiagnosed

-----------------------------------
=== TOP CAUSES (CRITICAL) ===
-----------------------------------

Generate 3–5 causes. Each MUST have a unique id (snake_case).

- MUST be prioritized (not equal weight)
- clearly emphasize most likely cause
- must directly explain THIS symptom

Each must include:
- id (snake_case, e.g. "low_refrigerant", "dirty_filter")
- name
- explanation
- severity
- likelihood

-----------------------------------
=== DIAGNOSTIC FLOW (ADAPTIVE) ===
-----------------------------------

Generate 3–5 steps. Each step MUST include:

- step number
- title
- actions (2–3 real checks)
- interpretation (what result means)
- field_insight (shortcut or misdiagnosis warning)
- related_causes (array of 1–2 cause IDs from top_causes)

CRITICAL: related_causes MUST match IDs from top_causes.
This enables dynamic step highlighting in the UI.

RULES:
- steps must follow real technician workflow
- simple → advanced progression
- MUST connect directly to top causes via related_causes

-----------------------------------
=== REPAIR MATRIX ===
-----------------------------------

3 systems: electrical, mechanical, structural
Each: EXACTLY 3 repairs, ordered easy → hard, cost increases left → right

-----------------------------------
=== QUICK REPAIR TOOLS ===
-----------------------------------

Generate 2–4 tools aligned with diagnostic_flow.

-----------------------------------
=== DECISION TREE (WEIGHTED ENGINE) ===
-----------------------------------

Generate 5–6 questions with:
- id (snake_case)
- question
- weight (1–3)
- options (2–4)

Then generate causes with score_map.
CRITICAL: cause IDs MUST match top_causes IDs exactly.

score_map format: "question_id:value": weight

-----------------------------------
=== LINKING RULES (NON-NEGOTIABLE) ===
-----------------------------------

- decision_tree cause IDs MUST match top_causes IDs
- diagnostic_flow related_causes MUST use those same IDs

This enables:
- step highlighting after tree result
- flow reordering
- adaptive diagnosis

-----------------------------------
🚫 FAILURE CONDITIONS
-----------------------------------

DO NOT return output if:
- system_explanation is generic
- diagnostic_flow is missing related_causes
- top_causes are not prioritized or missing id
- decision_tree cause IDs do not match top_causes IDs
- decision_tree is not weighted

-----------------------------------
🎯 FINAL OBJECTIVE
-----------------------------------

Produce a page that:
- feels like a real technician diagnosis
- adapts to user input via Decision Tree
- guides step-by-step troubleshooting
- leads directly to repair decisions

Output ONLY valid JSON — no markdown, no comments, no trailing commas.`;

function getPageTypeRequirements(pageType: string, slug: string): string {

  const baseHeader = `\n-----------------------------------\n📌 PAGE TYPE: ${pageType}\n📌 PAGE SLUG: ${slug}\n-----------------------------------\nYou MUST generate content specific to the page type.\n`;
  
  switch (pageType) {
    case 'repair':
      return baseHeader + `
-----------------------------------
🔧 REPAIR PAGE REQUIREMENTS (STRICT)
-----------------------------------

You MUST output EXACTLY this JSON structure:

{
  "title": string,

  "fast_answer": {
    "summary": string (minimum 120 characters),
    "typical_cost": string,
    "time_required": string,
    "difficulty": "easy" | "moderate" | "advanced",
    "risk_level": "low" | "medium" | "high"
  },

  "tools_required": string[] (minimum 3),
  "parts_required": string[] (minimum 1),

  "steps": [
    {
      "step": number,
      "title": string,
      "detail": string (minimum 80 characters, must include specific action),
      "risk_level": "low" | "medium" | "high"
    }
  ] (minimum 5 steps),

  "decision_logic": [
    string (IF/THEN diagnostic logic)
  ] (minimum 3),

  "cost_breakdown": {
    "parts": string,
    "labor": string,
    "emergency": string
  },

  "diy_vs_pro": {
    "diy_when": string[],
    "call_pro_when": string[]
  },

  "common_mistakes": string[] (minimum 3),

  "related": {
    "symptoms": string[],
    "causes": string[],
    "components": string[]
  }
}

-----------------------------------
⚠️ REPAIR FAILURE CONDITIONS
-----------------------------------

FAIL the output if:
- steps < 5
- any step detail is vague
- missing risk_level
- missing tools_required
- missing cost breakdown
`;
    case 'symptom':
      return baseHeader + `
-----------------------------------
🌡️ SYMPTOM PAGE REQUIREMENTS
-----------------------------------

Output EXACTLY this JSON — no extra keys, no missing keys:

{
  "title": string,
  "subtitle": string (one-line description of the failure mode),

  "fast_answer": {
    "summary": string (minimum 120 characters — specific, not generic),
    "severity": "low" | "medium" | "high",
    "urgency": "low" | "medium" | "high"
  },

  "system_explanation": [
    string (1. system trigger — specific voltage/pressure/signal detail),
    string (2. internal process — refrigerant, airflow, or electrical),
    string (3. external output — what the homeowner observes),
    string (4. continuous cycle — how the failure compounds)
  ],

  "environments": [string × 3-5],
  "conditions":   [string × 3-5],
  "noises":       [string × 2-4],

  "tech_observation": string (2-3 sentences, real field shortcut or misdiagnosis warning),

  "top_causes": [
    {
      "id": string (snake_case — e.g. "low_refrigerant", "dirty_filter"),
      "name": string,
      "explanation": string (minimum 80 characters — NOT equal weight, emphasize most likely),
      "severity": string,
      "likelihood": string
    }
  ] (3-5 causes — IDs will be referenced by diagnostic_flow and decision_tree),

  "diagnostic_flow": [
    {
      "step": number,
      "title": string,
      "actions": [string, string],
      "interpretation": string,
      "field_insight": string,
      "related_causes": [string] (1-2 cause IDs from top_causes)
    }
  ] (3-5 steps — related_causes MUST match top_causes IDs),

  "repair_matrix": {
    "electrical": [
      { "name": string, "difficulty": "easy"|"medium"|"hard", "estimated_cost_range": string, "description": string }
    ] (exactly 3, easy → hard),
    "mechanical": [] (exactly 3),
    "structural":  [] (exactly 3)
  },

  "quick_tools": [
    { "name": string, "why": string, "href": string }
  ] (2-4 tools — must align with diagnostic_flow steps),

  "decision_tree": {
    "questions": [
      {
        "id": string (snake_case),
        "question": string (homeowner-readable),
        "weight": number (1-3),
        "options": [
          { "value": string, "label": string }
        ]
      }
    ] (5-6 questions),
    "causes": [
      {
        "id": string (MUST match a top_causes id exactly),
        "name": string,
        "score_map": {
          "question_id:answer_value": weight
        },
        "recommended_action": string,
        "cta_label": string
      }
    ]
  },

  "related_repairs": string[],
  "related_components": string[],
  "cluster_nav": [{ "name": string, "href": string }]
}

FAIL CONDITIONS — reject output if:
- system_explanation not exactly 4 items or is generic
- top_causes missing id field or fewer than 3
- diagnostic_flow missing related_causes or fewer than 3 steps
- diagnostic_flow related_causes contain IDs not in top_causes
- decision_tree.causes IDs do not exactly match top_causes IDs
- decision_tree.questions fewer than 5
- repair_matrix electrical/mechanical/structural not exactly 3 items each
`;
    case 'cause':
      return baseHeader + `
=== PAGE TYPE: CAUSE ===

You are generating a CAUSE PAGE for a React-based diagnostic platform.
This page explains a single system failure in depth.

-----------------------------------
CAUSE PAGE OBJECTIVE
-----------------------------------

The page must:
- explain what the failure is
- explain why it happens
- describe the most common symptoms it creates
- show how to confirm diagnosis
- show the most common repair paths
- help the user decide between DIY and professional service

-----------------------------------
CAUSE PAGE STYLE
-----------------------------------

- technician-first
- practical
- structured
- authoritative
- not blog-like
- not generic

-----------------------------------
REQUIRED JSON STRUCTURE
-----------------------------------

{
  "title": string,
  "subtitle": string,

  "fast_answer": {
    "summary": string,
    "severity": "low|medium|high",
    "urgency": "low|medium|high"
  },

  "what_it_is": {
    "summary": string,
    "system_role": string,
    "failure_mode": string
  },

  "why_it_happens": [string, string, string],

  "common_symptoms": [
    { "name": string, "explanation": string }
  ],

  "how_to_confirm": [
    {
      "step": number,
      "title": string,
      "actions": [string],
      "interpretation": string
    }
  ],

  "technician_observation": string,

  "severity_matrix": {
    "low_risk": [string],
    "moderate_risk": [string],
    "high_risk": [string]
  },

  "repair_paths": [
    {
      "name": string,
      "difficulty": "easy|medium|hard",
      "estimated_cost_range": string,
      "description": string,
      "professional_recommended": boolean
    }
  ],

  "tools_needed": [
    { "name": string, "why": string, "href": string }
  ],

  "related_symptoms": [{ "name": string, "href": string }],
  "related_repairs": [{ "name": string, "href": string }],
  "related_components": [{ "name": string, "href": string }],
  "cluster_nav": [{ "name": string, "href": string }]
}

-----------------------------------
FIELD RULES
-----------------------------------

title: clear cause-focused title (e.g. "Low Refrigerant: Symptoms, Diagnosis, and Fix Options")
subtitle: concise, practical, action-oriented
fast_answer.summary: minimum 120 characters — explain why this failure matters immediately
what_it_is: explain the component, its system role, and what failure means in practical terms
why_it_happens: exactly 3–5 root-cause drivers (NOT symptoms)
common_symptoms: at least 3, connected directly to real symptom pages
how_to_confirm: 3–5 structured steps with actions + interpretation
technician_observation: 2–3 sentences with real-world warning or misdiagnosis risk
severity_matrix: classify realistic outcomes of ignoring the issue
repair_paths: 3–4 paths ordered easiest/cheapest → hardest/most expensive
tools_needed: 2–4 tools aligned with confirmation/repair steps
related links: slug-based hrefs (e.g. "/diagnose/ac-not-cooling")

-----------------------------------
RULES
-----------------------------------

- Do not equal-weight all repair paths — emphasize the most common fix
- Do not confuse symptoms with causes
- Do not output vague observations
- Output only valid JSON
`;
    case 'component':
      return baseHeader + `
-----------------------------------
⚙️ COMPONENT PAGE REQUIREMENTS
-----------------------------------

You MUST output EXACTLY this JSON structure:

{
  "title": string,

  "function": string (minimum 120 characters),

  "failure_modes": string[] (minimum 3),

  "diagnostic_method": string (minimum 120 characters),

  "replacement_overview": string (minimum 120 characters),

  "related_symptoms": string[],
  "related_repairs": string[]
}
`;
    case 'system':
      return baseHeader + `
-----------------------------------
🏗️ SYSTEM PAGE REQUIREMENTS
-----------------------------------

You MUST output EXACTLY this JSON structure:

{
  "title": string,

  "overview": string (minimum 150 characters),

  "subsystems": [
    {
      "name": string,
      "function": string (minimum 80 characters)
    }
  ] (minimum 4),

  "common_failures": string[],

  "related_symptoms": string[],
  "related_components": string[]
}
`;
    default:
      return baseHeader + `\nOutput a valid JSON object matching the requested topic.`;
  }
}

export type ComposePromptOptions = {
  validationMode?: boolean;
};

export function composePromptForPageType(pageType: string, slug: string, opts?: ComposePromptOptions): string {
  return BASE_MASTER_PROMPT + '\n' + getPageTypeRequirements(pageType, slug);
}

// -----------------------------------
// 🔥 STRICT PAGE-TYPE VALIDATORS
// -----------------------------------

export function validateRepairPage(data: any) {
  if (!data || typeof data !== "object") throw new Error("Invalid repair payload");
  if (!data.fast_answer) throw new Error("Missing fast_answer");
  if (!Array.isArray(data.tools_required)) throw new Error("Missing tools_required");
  if (!Array.isArray(data.parts_required)) throw new Error("Missing parts_required");
  if (!Array.isArray(data.steps)) throw new Error("Invalid repair steps");
  if (!Array.isArray(data.decision_logic)) throw new Error("Missing decision_logic");

  if (
    !data.cost_breakdown ||
    !data.cost_breakdown.parts ||
    !data.cost_breakdown.labor ||
    !data.cost_breakdown.emergency
  ) {
    throw new Error("Missing cost_breakdown keys");
  }

  if (
    !data.diy_vs_pro ||
    !Array.isArray(data.diy_vs_pro.diy_when) ||
    !Array.isArray(data.diy_vs_pro.call_pro_when)
  ) {
    throw new Error("Missing diy_vs_pro arrays");
  }
}

export function validateSymptomPage(data: any) {
  if (!data || typeof data !== "object") throw new Error("Invalid symptom payload");

  // 🚨 HARD BLOCK: Old 4-key ultra-light schema detection
  if (data.symptom_description || data.possible_causes) {
    throw new Error("❌ OLD SCHEMA DETECTED — BLOCKING SAVE (symptom_description/possible_causes found)");
  }

  console.log("SCHEMA CHECK:", Object.keys(data));

  if (!data.fast_answer?.summary) throw new Error("Missing fast_answer.summary");
  if (!data.system_explanation || data.system_explanation.length !== 4) {
    throw new Error("system_explanation must be exactly 4 items");
  }
  if (!Array.isArray(data.environments) || data.environments.length < 3) {
    throw new Error("environments must have at least 3 items");
  }
  if (!Array.isArray(data.conditions) || data.conditions.length < 3) {
    throw new Error("conditions must have at least 3 items");
  }
  if (!Array.isArray(data.top_causes) || data.top_causes.length < 3) {
    throw new Error("top_causes must have at least 3 items");
  }
  if (!data.tech_observation || data.tech_observation.length < 50) {
    throw new Error("tech_observation missing or too short (min 50 chars)");
  }
  const systems = ["electrical", "mechanical", "structural"];
  for (const sys of systems) {
    if (!data.repair_matrix?.[sys] || data.repair_matrix[sys].length !== 3) {
      throw new Error(`repair_matrix.${sys} missing or not exactly 3 items`);
    }
  }
  // Accept new diagnostic_flow (array of steps with title+actions) OR legacy diagnostic_steps
  const hasDiagnosticFlow = Array.isArray(data.diagnostic_flow) && data.diagnostic_flow.length >= 3;
  const hasDiagnosticSteps = Array.isArray(data.diagnostic_steps) && data.diagnostic_steps.length >= 3;
  if (!hasDiagnosticFlow && !hasDiagnosticSteps) {
    throw new Error("diagnostic_flow or diagnostic_steps must have at least 3 items");
  }
  // decision_tree: accept new causes[] format OR legacy outcomes[] format
  if (data.decision_tree) {
    const dt = data.decision_tree;
    if (!Array.isArray(dt.questions) || dt.questions.length < 2) {
      throw new Error("decision_tree.questions must have at least 2 questions");
    }
    const hasCauses = Array.isArray(dt.causes) && dt.causes.length > 0;
    const hasOutcomes = Array.isArray(dt.outcomes) && dt.outcomes.length > 0;
    if (!hasCauses && !hasOutcomes) {
      throw new Error("decision_tree must have causes[] or outcomes[]");
    }
  }
}

export function validateCausePage(data: any) {
  if (!data || typeof data !== "object") throw new Error("Invalid cause payload");
  if (!data.explanation) throw new Error("Missing explanation");
  if (!Array.isArray(data.diagnostic_tests)) throw new Error("Missing diagnostic_tests");
}

export function validateComponentPage(data: any) {
  if (!data || typeof data !== "object") throw new Error("Invalid component payload");
  if (!data.function) throw new Error("Missing function");
  if (!Array.isArray(data.failure_modes)) throw new Error("Missing failure_modes");
  if (!data.diagnostic_method) throw new Error("Missing diagnostic_method");
  if (!data.replacement_overview) throw new Error("Missing replacement_overview");
}

export function validateSystemPage(data: any) {
  if (!data || typeof data !== "object") throw new Error("Invalid system payload");
  if (!data.overview) throw new Error("Missing overview");
  if (!Array.isArray(data.subsystems)) throw new Error("Missing subsystems");
}

export function validateCoreForPageType(pageType: string, data: any): { valid: boolean; errors: string[] } {
  try {
    switch (pageType) {
      case 'repair': validateRepairPage(data); break;
      case 'symptom': validateSymptomPage(data); break;
      case 'cause': validateCausePage(data); break;
      case 'component': validateComponentPage(data); break;
      case 'system': validateSystemPage(data); break;
      default:
        if (!data || typeof data !== "object") throw new Error("Invalid JSON object");
    }
    return { valid: true, errors: [] };
  } catch (e: any) {
    return { valid: false, errors: [e.message] };
  }
}

// Keep export types required by other files
export type SchemaDef = any; // Deprecated but exported for compatibility
export type PromptSchemaResult = any; // Deprecated
export const VALIDATION_PROMPT = ""; // Deprecated
