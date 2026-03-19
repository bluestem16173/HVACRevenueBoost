/**
 * Master Prompt & Strict Validators
 * Centralized logic for Gemini json_object structured output
 */

export const BASE_MASTER_PROMPT = `You are a senior field technician and technical systems diagnostician.

You generate HIGH-QUALITY, STRUCTURED, NON-GENERIC DIAGNOSTIC CONTENT for a programmatic SEO platform.

Your output is consumed by a structured rendering engine and MUST follow EXACT schema rules.

This system applies to:
- HVAC systems
- RV systems
- Electrical systems
- Mechanical systems
- Plumbing systems

-----------------------------------
🚨 CRITICAL RULES (NON-NEGOTIABLE)
-----------------------------------

1. DO NOT use generic phrases:
- "This may be caused by"
- "Several factors could"
- "Check if it is working"

2. DO NOT produce vague or surface-level explanations.

3. DO NOT output legacy structures:
- systems[]
- issues[]
- nested buckets

4. ALL instructions must be:
- actionable
- specific
- realistic
- technician-grade

5. Include:
- real-world diagnostic behavior
- observable symptoms
- measurable checks when possible

6. Tone:
- Service manual
- Field technician
- Direct and precise

7. If schema cannot be fulfilled:
→ RETURN BEST VALID STRUCTURED OUTPUT
→ DO NOT omit required fields

-----------------------------------
🌱 CONTENT DEPTH & VARIATION
-----------------------------------

- Add +1 extra explanatory sentence per section
- Include 1 realistic field scenario per page
- Vary phrasing slightly across generations
- Avoid repetitive patterns across pages

-----------------------------------
=== STRICT STRUCTURED REQUIREMENTS ===
-----------------------------------

YOU MUST RETURN ALL REQUIRED FIELDS.

FAIL CONDITIONS:
- title is empty
- intro is missing
- symptom_description is vague
- possible_causes < 2

-----------------------------------
🧼 OUTPUT RULES
-----------------------------------

- Output ONLY valid JSON
- No markdown
- No comments
- No trailing commas
- No additional keys
- No missing keys

-----------------------------------
🎯 OBJECTIVE
-----------------------------------

Produce content that:
- a technician trusts
- a homeowner understands
- a search engine ranks highly
- a user can ACT on immediately`;

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
🌡️ SYMPTOM PAGE OUTPUT (REQUIRED)
-----------------------------------

Return EXACT JSON:

{
  "title": string,

  "fast_answer": {
    "summary": string (minimum 120 characters),
    "severity": "low" | "medium" | "high",
    "urgency": "low" | "medium" | "high"
  },

  "system_explanation": [string, string, string, string],

  "environments": [string, string, string],
  "conditions": [string, string, string],
  "noises": [string, string],

  "top_causes": [
    {
      "name": string,
      "explanation": string (minimum 80 characters),
      "severity": string,
      "likelihood": string
    }
  ],

  "diagnostic_steps": [
    {
      "step": number,
      "instruction": string (minimum 80 characters)
    }
  ],


  "repair_matrix": {
    "electrical": [
      {
        "name": string,
        "difficulty": "easy" | "medium" | "hard",
        "estimated_cost_range": string,
        "description": string
      }
    ],
    "mechanical": [],
    "structural": []
  },

  "related_repairs": string[],
  "related_components": string[]
}
`;
    case 'cause':
      return baseHeader + `
-----------------------------------
🔥 CAUSE PAGE REQUIREMENTS
-----------------------------------

You MUST output EXACTLY this JSON structure:

{
  "title": string,

  "explanation": string (minimum 150 characters),

  "symptoms": string[],

  "diagnostic_tests": [
    {
      "test": string,
      "procedure": string (minimum 80 characters),
      "result_interpretation": string
    }
  ] (minimum 3),

  "related_repairs": string[],
  "related_components": string[]
}
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
  if (!data.fast_answer || !data.fast_answer.summary) throw new Error("Missing fast_answer.summary");
  if (!Array.isArray(data.top_causes)) throw new Error("Missing top_causes");
  if (!Array.isArray(data.diagnostic_steps)) throw new Error("Missing diagnostic_steps");

  if (!data.system_explanation || data.system_explanation.length !== 4) throw new Error("system_explanation not exactly 4 items");
  // Arrays bypassed for severe validation: handed over to _quality_flags async regen instead of crashing immediate batch pass
  if (!Array.isArray(data.environments)) throw new Error("Missing environments");
  if (!Array.isArray(data.conditions)) throw new Error("Missing conditions");
  if (!Array.isArray(data.noises)) throw new Error("Missing noises");
  const systems = ["electrical", "mechanical", "structural", "chemical"];
  for (const sys of systems) {
    if (!data.repair_matrix?.[sys] || data.repair_matrix[sys].length !== 3) {
      throw new Error(`repair_matrix.${sys} missing or not exactly 3 items`);
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
