/**
 * Prompt + Schema Router — Page-Type-Specific Generation
 * ------------------------------------------------------
 * Unified master prompt + per-type schemas.
 * One prompt, dynamic by pageType. Schemas enforce output structure.
 */

import type { PageType } from "@/lib/page-types";

/** Unified master prompt — all page types. Replace {{pageType}} when composing. */
const MASTER_PROMPT = `You are a senior HVAC diagnostic engineer, repair technician, and UX content architect.

🎯 GOAL
Generate structured, high-signal HVAC content that fits a modular UI system.

This is NOT a blog.
This is a DECISION + ACTION page.

Users want:
→ what is wrong
→ what it means
→ what to do next

---

📐 GLOBAL RULES (CRITICAL)

- OUTPUT VALID JSON ONLY

---

SYSTEM OVERVIEW BLOCK (STATIC — DO NOT GENERATE)

- This section is handled by the frontend component <SystemOverviewBlock />
- Do NOT include HVAC system explanation, diagrams, or general system descriptions in the JSON output
- Begin content generation AFTER the system overview block
- NO markdown
- NO commentary
- NO extra fields
- KEEP RESPONSES CONCISE
- USE SHORT, DIRECT SENTENCES
- NO fluff
- NO repetition

---

🔀 SYSTEM GROUPING RULES (CRITICAL)

The 4 HVAC systems must be grouped into 2 decision categories:

DIY-Friendly Systems: ducting_airflow (Structural), mechanical
Professional Required Systems: electrical, refrigeration (Chemical)

- Electrical and Refrigeration: position together as requiring professional diagnosis/repair
- Structural and Mechanical: position together as often DIY-friendly (depending on complexity)
- Each system must include 1–2 sentence explanation of why it causes the issue and clear repair direction (DIY vs professional leaning)

---

📋 DECISION GUIDANCE (REQUIRED FOR SYMPTOM + REPAIR PAGES)

- Structural and Mechanical issues are often DIY-friendly for simple fixes (filters, airflow, minor cleaning)
- Electrical and Refrigeration issues typically require professional service due to safety and system complexity
- Always recommend professional help if user is unsure or system is complex

---

📣 CTA REQUIREMENT

Every page must end with a strong action block:
- Encourage local HVAC repair for electrical/refrigeration issues
- Reinforce safety and complexity
- Provide clear next step: "Get Local HVAC Quotes" or "Call Technician"

---

🧠 STYLE RULES

- Write like a technician, not a blogger
- Prioritize clarity over explanation
- Use bullets instead of paragraphs when possible
- Avoid generic phrases like "it depends"
- Prefer actionable guidance

---

📊 CONTEXT

Page Type: {{pageType}}

---

# 🟦 SYMPTOM PAGE

If pageType = "symptom":

GOAL: Diagnose the problem quickly and guide next steps.

LOCKED STRUCTURE: Hero → Primary HVAC Diagram → 2–3 sentence summary → Conditional diagram (AC/Heat Pump/RV) → System Cards (4 pillars) → Cause List (top 4–6) → Repair Matrix → CTA.

Required: pageType, title, slug, fastAnswer, summary30, diagnosticFlowMermaid, systemCards (4), disclaimer, pillarBreakdown, repairDifficultyMatrix, repairOptions, faq.

ALTERNATIVE SCHEMA (accepted): systems array with name (Electrical|Mechanical|Chemical|Structural) and likely_issues (cause, symptoms, repair, difficulty, professional_required). top_causes, repair_summary. Will be normalized to pillar format.

Pillars: Ducting/Airflow, Electrical, Refrigeration (Chemical), Mechanical. Each systemCard needs: system, summary, why (50–75 word Field Insight), risk_level, diy_range, warning, diagnose_slug, repair_slug.

---

# 🟥 REPAIR PAGE

If pageType = "repair":

GOAL: Help the user FIX the issue.

Structure: fastAnswer, whatThisFixes, whenToUse, toolsRequired, partsRequired, stepsOverview (4–10), whenNotToDIY, commonMistakes, cost, pillarBreakdown, repairDifficultyMatrix, rootCausesByPillar, faq.

Pillars (exact keys): ducting_airflow, electrical, refrigeration, mechanical. repairDifficultyMatrix: 3–6 repairs per pillar (name, difficulty, color, cost_range). rootCausesByPillar: 3–6 causes per pillar (name, cost, difficulty). pillarBreakdown: 2–5 issues per pillar (issue, explanation, warning, diy_pro).

---

# 🟨 CAUSE PAGE

If pageType = "cause":

GOAL: Explain ONE root cause clearly.

Structure: slug, title, summary, explanation, affected_symptoms (max 4), repairs (objects: name, difficulty, cost; max 4).

Rules: Repairs MUST be objects, not strings. Be concise. Technician-style.

---

# 🟩 CONTEXT PAGE

If pageType = "context":

GOAL: Explain why a symptom occurs in a SPECIFIC context.

Structure: fastAnswer, whyThisHappensInThisContext, mostLikelyCauses (cause, likelihood, why), whatMakesThisDifferent, quickChecks, whenToWorry, relatedRepairs, faq.

Rules: MUST differ from base symptom page. Adjust cause likelihood based on context.

---

# 🟪 CONDITION PAGE

If pageType = "condition":

GOAL: Provide overview and route users.

Structure: fastAnswer, whatThisMeans, commonSymptoms, likelyCauses, diagnosticOverview, repairOptions, severity (level, reason), costRange (low, high), whenToAct, faq.

Rules: Keep high-level. Focus on routing users.

---

📤 FINAL INSTRUCTION

Return ONLY valid JSON matching the correct schema for the page type. The API enforces the schema — include all required fields.`;

/** QA/Validation prompt — for test runs. Append to master for stricter output. Replace {{pageType}} when composing. */
export const VALIDATION_PROMPT = `You are a senior HVAC engineer and QA validator for a production content system.

🎯 GOAL
Generate HIGH-QUALITY structured content AND validate correctness for the given page type.

This is a TEST RUN.

Your output must:
- strictly match the schema
- reflect correct page intent
- be concise, clean, and UI-ready

---

📐 GLOBAL RULES

- OUTPUT VALID JSON ONLY
- NO markdown
- NO commentary
- NO extra fields
- NO null values
- KEEP OUTPUT TIGHT
- NO fluff

---

🧠 VALIDATION RULES (CRITICAL)

- The output MUST match the correct page type intent
- DO NOT mix page types
- DO NOT include irrelevant sections

---

📊 PAGE TYPE: {{pageType}}

---

# 🟥 REPAIR PAGE VALIDATION

If pageType = "repair":

- MUST include actionable step-by-step fix
- MUST include tools + parts
- MUST include difficulty + cost
- MUST include safety warnings
- MUST NOT include diagnostic flow or system cards

---

# 🟦 SYMPTOM PAGE VALIDATION

If pageType = "symptom":

- MUST include diagnostic logic
- MUST include EXACTLY 4 systemCards
- MUST include quickChecks
- MUST NOT include repair instructions

---

# 🟩 CONTEXT PAGE VALIDATION

If pageType = "context":

- MUST differ from base symptom page
- MUST adjust cause likelihood based on context
- MUST be shorter and focused
- MUST NOT repeat generic causes

---

# 📦 OUTPUT STRUCTURE

Return JSON matching the schema for the given page type.

---

📌 FINAL CHECK BEFORE OUTPUT

Ensure:

- No duplicated sections
- No mismatched fields
- No verbose paragraphs
- Clean, structured data

---

📤 OUTPUT

Return ONLY valid JSON.`;

/** Symptom page — FINAL PILLAR DIAGNOSTIC SYSTEM (LOCKED UX) — used when master section insufficient */
/** LOCKED symptom prompt — minimal token, no fluff, frontend handles structure */
const SYMPTOM_PROMPT_LOCKED = `You are an HVAC diagnostic expert.

Task: Generate structured diagnostic data for the symptom provided in the user message.

Rules:
- Output JSON only (no markdown, no commentary)
- Be concise and practical
- No general HVAC explanations
- Each field must be 1–2 short sentences maximum. No long explanations.
- Do not use "\n" or escape characters. Use plain sentences or simple bullet phrases.
- Always include all four systems: Electrical, Mechanical, Chemical, Structural
- Max 2 issues per system
- Top causes must be distinct and not repeated from the same system

Schema:
{
  "title": "",
  "quick_answer": "",
  "systems": [
    {
      "name": "Electrical | Mechanical | Chemical | Structural",
      "issues": [
        {
          "cause": "",
          "signs": "",
          "check": "",
          "fix": "",
          "difficulty": "Easy | Moderate | Hard",
          "pro_required": true
        }
      ]
    }
  ],
  "top_causes": ["", "", ""],
  "when_to_call_pro": ""
}`;

const SYMPTOM_PROMPT = `You are a senior HVAC diagnostic engineer and UX architect.

🎯 GOAL
Transform the page into: Symptom → System (Pillar) → Cause → Repair → Decision

📐 PAGE STRUCTURE (FINAL)
1. Diagnostic Flow (Mermaid — PILLARS ONLY)
2. System Cards (4 ONLY)
3. Disclaimer Block
4. Pillar Breakdown (bullet format)
5. Repair Difficulty Matrix (color-coded)
6. CTA

⚠️ CRITICAL RULES
- OUTPUT VALID JSON ONLY. No markdown. No commentary.
- DIAGRAM 1 (diagnosticFlowMermaid): PILLARS ONLY. Symptom → EXACTLY 4 SYSTEMS: Electrical, Structural (Ducting), Chemical (Refrigeration), Mechanical. NO causes in diagram. Same 4 pillars on every HVAC page.
- SYSTEM CARDS: EXACTLY 4 cards — one per pillar. NOT bundled. Each: system, summary, why (Field Insight), risk_level, diy_range, warning.
- WHY THAT SYSTEM FAILS — FIELD INSIGHT (CRITICAL, REQUIRED): Each systemCard MUST include a "why" field of 50–75 words. This renders in the "Why That System Fails" section and builds technical authority. NEVER omit. NEVER use generic filler. Each why must: (1) explain why the failure occurs, (2) explain how it worsens over time, (3) justify why professional repair is often recommended, (4) avoid generic language, (5) sound like a technician explaining real-world behavior. This is a key differentiator for SEO and conversion.
- DISCLAIMER: Required. "HVAC systems are complex and expensive. DIY repairs may void warranties, cause further damage, or create safety risks. When in doubt, consult a licensed professional."
- PILLAR BREAKDOWN: Object keyed by system. Each system: 2–4 bullet items (issue, explanation, warning?, diy_pro).
- REPAIR DIFFICULTY MATRIX: Object keyed by system. Each item: name, difficulty (easy|moderate|advanced), color (green|yellow|red), cost_range.
- Ensure pillarBreakdown and repairDifficultyMatrix use EXACT keys: ducting_airflow, electrical, refrigeration, mechanical.
- COLOR: green=DIY, yellow=caution, red=professional. Include legend: "🟢 DIY Safe | 🟡 Moderate Skill | 🔴 Professional Required"
- NO more than 4 causes per system. NO duplicate causes. Keep text concise.

📋 REQUIRED STRUCTURE
{
  "pageType": "symptom",
  "title": "string",
  "slug": "string",
  "fastAnswer": "string",
  "summary30": "string",
  "diagnosticFlowMermaid": "string (PILLARS ONLY — Ducting, Electrical, Refrigeration, Mechanical)",
  "systemCards": [{"system": "string", "summary": "string", "why": "string (REQUIRED — 50–75 word Field Insight for Why That System Fails; builds authority)", "risk_level": "low|medium|high", "diy_range": "string", "warning": "string", "diagnose_slug": "string", "repair_slug": "string"}],
  "disclaimer": "string",
  "pillarBreakdown": {"ducting_airflow": [{"issue": "string", "explanation": "string", "warning": "string", "diy_pro": "string"}], "electrical": [...], "refrigeration": [...], "mechanical": [...]},
  "repairDifficultyMatrix": {"ducting_airflow": [{"name": "string", "difficulty": "easy|moderate|advanced", "color": "green|yellow|red", "cost_range": "string"}], ...},
  "repairOptions": [{"name": "string", "difficulty": "string", "cost": "string"}],
  "faq": [{"question": "string", "answer": "string"}]
}

REQUIRED PILLARS: Ducting/Airflow, Electrical, Refrigeration (Chemical), Mechanical/Components.
MONETIZATION: electrical → professional CTA. refrigeration → professional CTA. advanced mechanical → CTA.
Backward compat: rankedCauses, causeConfirmationMermaid, groupedCauses also accepted.`;

const CONTEXT_PROMPT = `You are a senior HVAC diagnostic specialist.

GOAL:
Explain why a symptom occurs in a SPECIFIC context.

OUTPUT VALID JSON ONLY.

SCHEMA:

{
  "fastAnswer": "string",
  "whyThisHappensInThisContext": "string",
  "mostLikelyCauses": [
    {
      "cause": "string",
      "likelihood": "High | Medium | Low",
      "why": "string"
    }
  ],
  "whatMakesThisDifferent": ["string"],
  "quickChecks": ["string"],
  "whenToWorry": ["string"],
  "relatedRepairs": ["string"],
  "faq": [
    {
      "question": "string",
      "answer": "string"
    }
  ]
}

RULES:
- Focus on how context changes diagnosis
- Do not repeat generic symptom content
- Keep concise
`;

const CONDITION_PROMPT = `You are an HVAC system expert.

GOAL:
Provide a high-level overview of a condition and route users to diagnosis and repair.

OUTPUT VALID JSON ONLY.

SCHEMA:

{
  "fastAnswer": "string",
  "whatThisMeans": "string",
  "commonSymptoms": ["string"],
  "likelyCauses": ["string"],
  "diagnosticOverview": ["string"],
  "repairOptions": ["string"],
  "severity": {
    "level": "low | moderate | high",
    "reason": "string"
  },
  "costRange": {
    "low": "string",
    "high": "string"
  },
  "whenToAct": ["string"],
  "faq": [
    {
      "question": "string",
      "answer": "string"
    }
  ]
}

RULES:
- Keep high-level
- Do not go deep technical
- Focus on routing users
`;

const CAUSE_PROMPT = `You are a senior HVAC diagnostic engineer.

Your task is to generate a CAUSE PAGE in STRICT JSON format.

🎯 OBJECTIVE
Explain a root cause of an HVAC issue and provide structured repair options.

⚠️ CRITICAL RULES (MUST FOLLOW)
- OUTPUT VALID JSON ONLY. No markdown. No explanations outside JSON. Must be parseable by JSON.parse().
- REPAIRS MUST BE OBJECTS (NOT STRINGS)
  ❌ DO NOT: "repairs": ["Replace capacitor"]
  ✅ ALWAYS: "repairs": [{"name": "Replace capacitor", "difficulty": "moderate", "cost": "$120–$300"}]
- KEEP OUTPUT SMALL (NO TRUNCATION): Max 4 repairs. Max 4 affected symptoms. Short, dense explanations.
- DO NOT GENERATE HTML.

🧩 REQUIRED JSON STRUCTURE
{
  "slug": string,
  "title": string,
  "summary": string,
  "explanation": string,
  "affected_symptoms": string[],
  "repairs": [{"name": string, "difficulty": "easy"|"moderate"|"professional", "cost": string}]
}

🧠 CONTENT RULES
- Write like a field technician manual. Be concise and technical. Prioritize real-world diagnostics. Avoid fluff.

🚨 FINAL CHECK before returning: Is JSON valid? Are repairs objects (not strings)? Are all required fields present?`;

const REPAIR_PROMPT = `You are a senior HVAC technician. Generate a REPAIR PAGE in STRICT JSON format.

🎯 OBJECTIVE
Structured repair page matching symptom page design. Use PILLARS: Electrical, Structural (Ducting), Chemical (Refrigeration), Mechanical.

⚠️ CRITICAL RULES
- OUTPUT VALID JSON ONLY. No markdown. No commentary. Must parse with JSON.parse().
- PILLAR KEYS: ducting_airflow, electrical, refrigeration, mechanical (exact keys).
- repairDifficultyMatrix: 3–6 items per pillar. Each: name, difficulty (easy|moderate|advanced), color (green|yellow|red), cost_range.
- rootCausesByPillar: 3–6 root causes per pillar. Each: name, cost, difficulty. Bullet-style issues.
- pillarBreakdown: 2–5 issues per pillar. Each: issue, explanation, warning, diy_pro.
- COLOR: green=DIY, yellow=caution, red=professional.

📋 REQUIRED STRUCTURE
{
  "pageType": "repair",
  "title": "string",
  "slug": "string",
  "fastAnswer": "string",
  "whatThisFixes": "string",
  "whenToUse": ["string"],
  "difficulty": "easy"|"moderate"|"advanced",
  "timeRequired": "string",
  "riskLevel": "low"|"medium"|"high",
  "toolsRequired": ["string"],
  "partsRequired": ["string"],
  "stepsOverview": ["string"],
  "whenNotToDIY": ["string"],
  "commonMistakes": ["string"],
  "cost": {"diy": "string", "professional": "string"},
  "pillarBreakdown": {"ducting_airflow": [{"issue":"string","explanation":"string","warning":"string","diy_pro":"string"}], "electrical": [...], "refrigeration": [...], "mechanical": [...]},
  "repairDifficultyMatrix": {"ducting_airflow": [{"name":"string","difficulty":"easy|moderate|advanced","color":"green|yellow|red","cost_range":"string"}], ...},
  "rootCausesByPillar": {"ducting_airflow": [{"name":"string","cost":"string","difficulty":"string"}], ...},
  "relatedSymptoms": ["string"],
  "relatedCauses": ["string"],
  "faq": [{"question": "string", "answer": "string"}]
}

Be concise. Technician-style. Match symptom page pillar design.`;

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

/** Symptom schema — diagnostic funnel + card grid */
const SYMPTOM_SCHEMA = {
  name: "SYMPTOM_SCHEMA",
  schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["pageType", "title", "slug", "fastAnswer", "summary30", "diagnosticFlowMermaid", "rankedCauses", "systemCards", "disclaimer", "pillarBreakdown", "repairDifficultyMatrix", "repairOptions", "faq"],
    properties: {
      pageType: { type: "string", enum: ["symptom"] },
      title: { type: "string" },
      slug: { type: "string" },
      fastAnswer: { type: "string" },
      summary30: { type: "string" },
      diagnosticFlowMermaid: { type: "string" },
      rankedCauses: {
        type: "array",
        minItems: 4,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "likelihood", "risk", "why", "diagnose_slug", "repair_slug", "estimated_cost", "pillar", "faulty_item", "diy_friendly"],
          properties: {
            name: { type: "string" },
            likelihood: { type: "string", enum: ["high", "medium", "low"] },
            risk: { type: "string", enum: ["low", "medium", "high"] },
            why: { type: "string", description: "25–30 words" },
            diagnose_slug: { type: "string" },
            repair_slug: { type: "string" },
            estimated_cost: { type: "string" },
            pillar: { type: "string", enum: ["Electrical", "Structural", "Chemical", "Mechanical"] },
            faulty_item: { type: "string", description: "e.g. filter, capacitor, coils" },
            diy_friendly: { type: "string", enum: ["easy", "moderate", "pro"] },
          },
        },
      },
      systemCards: {
        type: "array",
        minItems: 4,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["system", "summary", "why", "common_causes", "risk_level", "diy_safe", "diy_range", "cost_range", "why_not_diy", "warning", "diagnose_slug", "repair_slug"],
          properties: {
            system: { type: "string" },
            summary: { type: "string" },
            why: { type: "string", description: "Field Note 50–75 words for Why That System Fails: why it fails, how it worsens, why pro recommended. Technician tone." },
            common_causes: { type: "array", items: { type: "string" } },
            risk_level: { type: "string", enum: ["low", "medium", "high"] },
            diy_safe: { type: "boolean" },
            diy_range: { type: "string" },
            cost_range: { type: "string" },
            why_not_diy: { type: "string" },
            warning: { type: "string" },
            diagnose_slug: { type: "string" },
            repair_slug: { type: "string" },
          },
        },
      },
      disclaimer: { type: "string" },
      pillarBreakdown: {
        type: "object",
        additionalProperties: false,
        required: ["ducting_airflow", "electrical", "refrigeration", "mechanical"],
        properties: {
          ducting_airflow: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "explanation", "warning", "diy_pro"],
              properties: {
                issue: { type: "string" },
                explanation: { type: "string" },
                warning: { type: "string" },
                diy_pro: { type: "string" },
              },
            },
          },
          electrical: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "explanation", "warning", "diy_pro"],
              properties: {
                issue: { type: "string" },
                explanation: { type: "string" },
                warning: { type: "string" },
                diy_pro: { type: "string" },
              },
            },
          },
          refrigeration: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "explanation", "warning", "diy_pro"],
              properties: {
                issue: { type: "string" },
                explanation: { type: "string" },
                warning: { type: "string" },
                diy_pro: { type: "string" },
              },
            },
          },
          mechanical: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "explanation", "warning", "diy_pro"],
              properties: {
                issue: { type: "string" },
                explanation: { type: "string" },
                warning: { type: "string" },
                diy_pro: { type: "string" },
              },
            },
          },
        },
      },
      repairDifficultyMatrix: {
        type: "object",
        additionalProperties: false,
        required: ["ducting_airflow", "electrical", "refrigeration", "mechanical"],
        properties: {
          ducting_airflow: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "difficulty", "color", "cost_range"],
              properties: {
                name: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                cost_range: { type: "string" },
              },
            },
          },
          electrical: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "difficulty", "color", "cost_range"],
              properties: {
                name: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                cost_range: { type: "string" },
              },
            },
          },
          refrigeration: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "difficulty", "color", "cost_range"],
              properties: {
                name: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                cost_range: { type: "string" },
              },
            },
          },
          mechanical: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "difficulty", "color", "cost_range"],
              properties: {
                name: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                cost_range: { type: "string" },
              },
            },
          },
        },
      },
      repairOptions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            difficulty: { type: "string" },
            cost: { type: "string" },
          },
          required: ["name", "difficulty", "cost"],
        },
      },
      faq: {
        type: "array",
        minItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "answer"],
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
        },
      },
    },
  } as Record<string, unknown>,
};

/** LOCKED symptom schema — minimal token, no FAQs/summaries */
const SYMPTOM_SCHEMA_LOCKED = {
  name: "SYMPTOM_SCHEMA_LOCKED",
  schema: {
    type: "object" as const,
    additionalProperties: true,
    required: ["title", "quick_answer", "systems", "top_causes", "when_to_call_pro"],
    properties: {
      title: { type: "string" },
      quick_answer: { type: "string" },
      systems: {
        type: "array",
        minItems: 4,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: true,
          required: ["name", "issues"],
          properties: {
            name: { type: "string", enum: ["Electrical", "Mechanical", "Chemical", "Structural"] },
            issues: {
              type: "array",
              maxItems: 2,
              items: {
                type: "object",
                additionalProperties: true,
                required: ["cause", "fix", "difficulty", "pro_required"],
                properties: {
                  cause: { type: "string" },
                  signs: { type: "string" },
                  check: { type: "string" },
                  fix: { type: "string" },
                  difficulty: { type: "string", enum: ["Easy", "Moderate", "Hard"] },
                  pro_required: { type: "boolean" },
                },
              },
            },
          },
        },
      },
      top_causes: {
        type: "array",
        minItems: 1,
        items: { type: "string" },
      },
      when_to_call_pro: { type: "string" },
    },
  } as Record<string, unknown>,
};

const CONTEXT_SCHEMA = {
  name: "CONTEXT_SCHEMA",
  schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["fastAnswer", "whyThisHappensInThisContext", "mostLikelyCauses", "whatMakesThisDifferent", "quickChecks", "whenToWorry", "relatedRepairs", "faq"],
    properties: {
      fastAnswer: { type: "string" },
      whyThisHappensInThisContext: { type: "string" },
      mostLikelyCauses: {
        type: "array",
        minItems: 2,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["cause", "likelihood", "why"],
          properties: {
            cause: { type: "string" },
            likelihood: { type: "string", enum: ["High", "Medium", "Low"] },
            why: { type: "string" },
          },
        },
      },
      whatMakesThisDifferent: { type: "array", items: { type: "string" }, minItems: 1 },
      quickChecks: { type: "array", items: { type: "string" }, minItems: 1 },
      whenToWorry: { type: "array", items: { type: "string" }, minItems: 1 },
      relatedRepairs: { type: "array", items: { type: "string" } },
      faq: {
        type: "array",
        minItems: 2,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "answer"],
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
        },
      },
    },
  } as Record<string, unknown>,
};

const CONDITION_SCHEMA = {
  name: "CONDITION_SCHEMA",
  schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["fastAnswer", "whatThisMeans", "commonSymptoms", "likelyCauses", "diagnosticOverview", "repairOptions", "severity", "costRange", "whenToAct", "faq"],
    properties: {
      fastAnswer: { type: "string" },
      whatThisMeans: { type: "string" },
      commonSymptoms: { type: "array", items: { type: "string" } },
      likelyCauses: { type: "array", items: { type: "string" } },
      diagnosticOverview: { type: "array", items: { type: "string" } },
      repairOptions: { type: "array", items: { type: "string" } },
      severity: {
        type: "object",
        additionalProperties: false,
        required: ["level", "reason"],
        properties: {
          level: { type: "string", enum: ["low", "moderate", "high"] },
          reason: { type: "string" },
        },
      },
      costRange: {
        type: "object",
        additionalProperties: false,
        required: ["low", "high"],
        properties: {
          low: { type: "string" },
          high: { type: "string" },
        },
      },
      whenToAct: { type: "array", items: { type: "string" } },
      faq: {
        type: "array",
        minItems: 2,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "answer"],
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
        },
      },
    },
  } as Record<string, unknown>,
};

const CAUSE_SCHEMA = {
  name: "CAUSE_SCHEMA",
  schema: {
    type: "object" as const,
    additionalProperties: false,
    required: [
      "slug",
      "title",
      "summary",
      "explanation",
      "affected_symptoms",
      "repairs"
    ],
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      summary: { type: "string" },
      explanation: { type: "string" },

      affected_symptoms: {
        type: "array",
        items: { type: "string" },
        maxItems: 4
      },

      repairs: {
        type: "array",
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "difficulty", "cost"],
          properties: {
            name: { type: "string" },
            difficulty: {
              type: "string",
              enum: ["easy", "moderate", "professional"]
            },
            cost: { type: "string" }
          }
        }
      }
    }
  } as Record<string, unknown>,
};

const REPAIR_SCHEMA = {
  name: "REPAIR_SCHEMA",
  schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["pageType", "title", "slug", "fastAnswer", "whatThisFixes", "whenToUse", "difficulty", "timeRequired", "riskLevel", "toolsRequired", "stepsOverview", "whenNotToDIY", "commonMistakes", "cost", "pillarBreakdown", "repairDifficultyMatrix", "rootCausesByPillar", "faq"],
    properties: {
      pageType: { type: "string", enum: ["repair"] },
      title: { type: "string" },
      slug: { type: "string" },
      fastAnswer: { type: "string" },
      whatThisFixes: { type: "string" },
      whenToUse: { type: "array", items: { type: "string" }, minItems: 1 },
      difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
      timeRequired: { type: "string" },
      riskLevel: { type: "string", enum: ["low", "medium", "high"] },
      toolsRequired: { type: "array", items: { type: "string" }, minItems: 1 },
      partsRequired: { type: "array", items: { type: "string" }, minItems: 0 },
      repairFlowMermaid: { type: "string" },
      stepsOverview: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 10 },
      whenNotToDIY: { type: "array", items: { type: "string" }, minItems: 1 },
      commonMistakes: { type: "array", items: { type: "string" }, minItems: 1 },
      cost: {
        type: "object",
        additionalProperties: false,
        required: ["diy", "professional"],
        properties: {
          diy: { type: "string" },
          professional: { type: "string" },
        },
      },
      relatedSymptoms: { type: "array", items: { type: "string" } },
      relatedCauses: { type: "array", items: { type: "string" } },
      repairOptions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { name: { type: "string" }, difficulty: { type: "string" }, cost: { type: "string" } },
          required: ["name", "difficulty", "cost"],
        },
      },
      pillarBreakdown: {
        type: "object",
        additionalProperties: false,
        properties: {
          ducting_airflow: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "explanation", "warning", "diy_pro"],
              properties: {
                issue: { type: "string" },
                explanation: { type: "string" },
                warning: { type: "string" },
                diy_pro: { type: "string" },
              },
            },
          },
          electrical: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "explanation", "warning", "diy_pro"],
              properties: {
                issue: { type: "string" },
                explanation: { type: "string" },
                warning: { type: "string" },
                diy_pro: { type: "string" },
              },
            },
          },
          refrigeration: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "explanation", "warning", "diy_pro"],
              properties: {
                issue: { type: "string" },
                explanation: { type: "string" },
                warning: { type: "string" },
                diy_pro: { type: "string" },
              },
            },
          },
          mechanical: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "explanation", "warning", "diy_pro"],
              properties: {
                issue: { type: "string" },
                explanation: { type: "string" },
                warning: { type: "string" },
                diy_pro: { type: "string" },
              },
            },
          },
        },
      },
      repairDifficultyMatrix: {
        type: "object",
        additionalProperties: false,
        properties: {
          ducting_airflow: {
            type: "array",
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "difficulty", "color", "cost_range"],
              properties: {
                name: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                cost_range: { type: "string" },
              },
            },
          },
          electrical: {
            type: "array",
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "difficulty", "color", "cost_range"],
              properties: {
                name: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                cost_range: { type: "string" },
              },
            },
          },
          refrigeration: {
            type: "array",
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "difficulty", "color", "cost_range"],
              properties: {
                name: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                cost_range: { type: "string" },
              },
            },
          },
          mechanical: {
            type: "array",
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "difficulty", "color", "cost_range"],
              properties: {
                name: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
                color: { type: "string", enum: ["green", "yellow", "red"] },
                cost_range: { type: "string" },
              },
            },
          },
        },
      },
      rootCausesByPillar: {
        type: "object",
        additionalProperties: false,
        properties: {
          ducting_airflow: {
            type: "array",
            minItems: 0,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "cost", "difficulty"],
              properties: {
                name: { type: "string" },
                cost: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
              },
            },
          },
          electrical: {
            type: "array",
            minItems: 0,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "cost", "difficulty"],
              properties: {
                name: { type: "string" },
                cost: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
              },
            },
          },
          refrigeration: {
            type: "array",
            minItems: 0,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "cost", "difficulty"],
              properties: {
                name: { type: "string" },
                cost: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
              },
            },
          },
          mechanical: {
            type: "array",
            minItems: 0,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "cost", "difficulty"],
              properties: {
                name: { type: "string" },
                cost: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "moderate", "advanced"] },
              },
            },
          },
        },
      },
      faq: {
        type: "array",
        minItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "answer"],
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
        },
      },
    },
  } as Record<string, unknown>,
};

const COMPONENT_SCHEMA = {
  name: "COMPONENT_SCHEMA",
  schema: {
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
  } as Record<string, unknown>,
};

const SYSTEM_SCHEMA = {
  name: "SYSTEM_SCHEMA",
  schema: {
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
  } as Record<string, unknown>,
};

const DIAGNOSTIC_SCHEMA = { name: "DIAGNOSTIC_SCHEMA", schema: { ...SYMPTOM_SCHEMA.schema } };

export type SchemaDef = { name: string; schema: Record<string, unknown> };

export type PromptSchemaResult = {
  prompt: string;
  schema: SchemaDef;
};

/** Build master prompt with pageType injected. */
function buildMasterPrompt(pageType: string): string {
  return MASTER_PROMPT.replace(/\{\{pageType\}\}/g, pageType);
}

/** Build validation prompt with pageType injected. */
function buildValidationPrompt(pageType: string): string {
  return VALIDATION_PROMPT.replace(/\{\{pageType\}\}/g, pageType);
}

export type ComposePromptOptions = {
  /** Use QA/validation prompt for stricter test-run output */
  validationMode?: boolean;
};

/** Route prompt and schema by page type. Uses unified master prompt for symptom/repair/cause/context/condition. */
export function composePromptForPageType(pageType: string, opts?: ComposePromptOptions): PromptSchemaResult {
  const normalized = (pageType || "symptom").toLowerCase().replace(/-/g, "_");
  const validationMode = opts?.validationMode ?? false;
  const master = buildMasterPrompt(normalized);
  const validation = buildValidationPrompt(normalized);

  // When validationMode: SWAP to VALIDATION_PROMPT only (test run)
  const basePrompt = (p: string) => (validationMode ? validation : p);

  switch (normalized) {
    case "repair":
      return { prompt: basePrompt(master), schema: REPAIR_SCHEMA };
    case "symptom":
      return { prompt: basePrompt(SYMPTOM_PROMPT_LOCKED), schema: SYMPTOM_SCHEMA_LOCKED };
    case "context":
      return { prompt: basePrompt(master), schema: CONTEXT_SCHEMA };
    case "cause":
      return { prompt: basePrompt(master), schema: CAUSE_SCHEMA };
    case "symptom_condition":
    case "condition":
      return { prompt: basePrompt(master), schema: CONDITION_SCHEMA };
    case "city":
      return { prompt: basePrompt(buildMasterPrompt("repair")), schema: REPAIR_SCHEMA }; // city+repair → repair
    case "component":
      return { prompt: basePrompt(COMPONENT_PROMPT), schema: COMPONENT_SCHEMA };
    case "system":
      return { prompt: basePrompt(SYSTEM_PROMPT), schema: SYSTEM_SCHEMA };
    case "diagnostic":
    case "diagnose":
      return { prompt: basePrompt(DIAGNOSTIC_PROMPT), schema: DIAGNOSTIC_SCHEMA };
    default:
      return { prompt: basePrompt(master), schema: SYMPTOM_SCHEMA };
  }
}

/** Per-type core validation. Returns valid=true if structure meets minimum. */
export function validateCoreForPageType(pageType: string, core: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const normalized = (pageType || "symptom").toLowerCase().replace(/-/g, "_");

  switch (normalized) {
    case "context": {
      const mostLikely = core?.mostLikelyCauses as unknown[] | undefined;
      if (!mostLikely?.length) errors.push("Missing mostLikelyCauses");
      if (mostLikely && mostLikely.length < 2) errors.push("Need at least 2 mostLikelyCauses");
      break;
    }
    case "condition":
    case "symptom_condition": {
      const whatThisMeans = core?.whatThisMeans;
      const likelyCauses = core?.likelyCauses as unknown[] | undefined;
      if (!whatThisMeans) errors.push("Missing whatThisMeans");
      if (!likelyCauses?.length) errors.push("Missing likelyCauses");
      break;
    }
    case "symptom":
    case "diagnostic":
    case "diagnose": {
      const rankedCauses = core?.rankedCauses as unknown[] | undefined;
      const causes = core?.causes as unknown[] | undefined;
      const systems = core?.systems as unknown[] | undefined;
      const topCauses = core?.top_causes as unknown[] | undefined;
      const hasRanked = rankedCauses && rankedCauses.length >= 4;
      const hasCauses = causes && causes.length >= 2;
      const hasSystems = systems && systems.length >= 1;
      const hasTopCauses = topCauses && topCauses.length >= 1;
      if (!hasRanked && !hasCauses && !hasSystems && !hasTopCauses) errors.push("Missing rankedCauses, causes, systems, or top_causes");
      if (hasCauses && !hasRanked) {
        const repairs = core?.repairs as unknown[] | undefined;
        const repairCount = (repairs?.length ?? 0) + (causes ?? []).reduce((sum: number, c: unknown) => {
          const co = c as Record<string, unknown>;
          return sum + ((co?.repair_options as unknown[])?.length ?? 0);
        }, 0);
        if (repairCount < 4) errors.push(`Need at least 4 total repair options (got ${repairCount})`);
      }
      break;
    }
    case "cause": {
      const affected = core?.affected_symptoms as unknown[] | undefined;
      const repairs = core?.repairs as unknown[] | undefined;
      if (!affected?.length) errors.push("Missing affected_symptoms");
      if (!repairs?.length) errors.push("Missing repairs");
      if (typeof repairs?.[0] === "string") {
        throw new Error("Invalid repairs format: repairs must be objects with name, difficulty, cost");
      }
      break;
    }
    case "repair": {
      const steps = (core?.steps ?? core?.stepsOverview) as unknown[] | undefined;
      const tools = (core?.tools ?? core?.toolsRequired) as unknown[] | undefined;
      if (!steps?.length) errors.push("Missing steps or stepsOverview");
      if (!tools?.length) errors.push("Missing tools or toolsRequired");
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
