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
You are generating a HIGH-CONVERSION, TECHNICAL AUTHORITY PAGE for a troubleshooting system.

This page MUST follow the GOLD STANDARD MONEY PRINTER FORMAT.
Your payload MUST EXACTLY match the following JSON structure. 

STRICT REQUIREMENTS:
- Provide a concise AI summary with 3-5 bullet points and the most likely issue.
- Generate a system flow flowchart in Mermaid syntax (flowchart LR).
- Generate a diagnostic flowchart in Mermaid syntax (flowchart TD).
- Provide critical thresholds for system performance.
- Provide a quick diagnosis table mapping symptoms to causes and actions.
- Provide common causes with High/Medium/Low probability and a quick fix.
- Provide a deep dive into the top causes with fix_steps and tools_needed.
- Provide a list of recommended tools and their purposes.
- Provide 3-5 steps a user can safely take before calling a technician.
- Provide a realistic cost boundary (low, medium, high).

## OUTPUT FORMAT (MANDATORY EXACT JSON STRUCTURE)
Return a single JSON object containing exactly these fields:
{
  "ai_summary": {
    "bullets": ["Point 1", "Point 2"],
    "most_likely_issue": "Specific Component Failure"
  },
  "system_flow": "flowchart LR\\n...",
  "diagnostic_flow": "flowchart TD\\n...",
  "critical_thresholds": [
    {
      "metric": "Temperature",
      "normal_range": "...",
      "problem_range": "..."
    }
  ],
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
      "probability": "High", // MUST be High, Medium, or Low
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
  "tools": [
    {
      "name": "Tool Name",
      "purpose": "What it is used for"
    }
  ],
  "before_calling_tech": [
    "Check step 1",
    "Check step 2"
  ],
  "cost": {
    "low": "$50",
    "medium": "$200",
    "high": "$1000+"
  }
}

No extra text. Return ONLY valid JSON matching this exact structure.
`;

export type ComposePromptOptions = {
  validationMode?: boolean;
  schemaVersion?: string;
};

export function composePromptForPageType(pageType: string, slug: string, opts?: ComposePromptOptions): string {
  if (opts?.schemaVersion === "v2_goldstandard") {
    return GOLD_STANDARD_PROMPT;
  }
  return buildMasterPrompt(pageType);
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

- Write like a senior HVAC technician
- Clear, confident, diagnostic-first tone
- No fluff

- EACH PAGE MUST INCLUDE:
  - Fast Answer
  - Quick Diagnostic Checklist (5–7 items)
  - Technician Insights
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
- Decision-tree style logic
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
      "quickChecklist": ["..."],
      "diagnosticFlow": ["..."],
      "causes": [{ "name": "...", "description": "..." }],
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
