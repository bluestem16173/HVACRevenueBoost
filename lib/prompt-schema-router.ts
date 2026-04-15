import { buildVerticalPromptPreamble, normalizeVerticalId } from "@/lib/verticals";

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
- Provide a quick diagnosis table mapping symptoms to exact causes and technical testing actions.
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
};

function withVerticalAndTopicContext(
  basePrompt: string,
  slug: string,
  opts?: ComposePromptOptions
): string {
  const verticalKey = normalizeVerticalId(opts?.verticalId);
  const preamble = buildVerticalPromptPreamble(verticalKey);
  const topicLine = `PRIMARY PAGE SLUG / TOPIC SEED: "${slug}"`;
  if (!preamble) {
    return basePrompt;
  }
  return `${preamble}\n\n${topicLine}\n\n---\n\n${basePrompt}`;
}

export function composePromptForPageType(pageType: string, slug: string, opts?: ComposePromptOptions): string {
  let core: string;
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

