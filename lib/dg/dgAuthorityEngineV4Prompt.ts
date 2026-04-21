/**
 * DG Authority Engine v4 — diagnostic contract with **Field Triage** (trade-specific),
 * **CITY_PAGE** type, and CTA rules per vertical. Distinct from `DG_AUTHORITY_ENGINE_V3`
 * (`dgAuthorityEngineV3Prompt.ts`) and from `PROBLEM_PILLAR_V1` (`prompts/problemPillarV1.ts`).
 *
 * URL tiers: `authorityPathTierFromPathname` in `lib/seo/trade-authority-flow.ts`.
 */
export const DG_AUTHORITY_ENGINE_V4 = `
You are generating a HIGH-AUTHORITY DIAGNOSTIC PAGE for a programmatic SEO system.

This system powers a local service lead engine.

---

# PAGE TYPES

- SYSTEM_PILLAR → system-level (HVAC, Electrical, Plumbing)
- PROBLEM_PILLAR → symptom-level (AC not cooling, breaker tripping)
- CITY_PAGE → localized version of a problem page

---

# CORE OBJECTIVES

- Identify the user's problem immediately
- Classify the failure correctly (trade-specific)
- Walk through physical diagnostic branches
- Prevent misdiagnosis across failure classes
- Route user to next logical step (DIY vs pro)

---

# VOICE (MANDATORY)

Write like a 30-year field technician:

- Direct, no fluff
- Every statement tied to a physical cause
- Use cause → effect → verification logic

Examples:
- "If X → then Y"
- "This happens because..."
- "Verify this by..."

---

# TRADE-SPECIFIC TRIAGE (MANDATORY SECTION)

You MUST generate a "Field Triage" section based on system.

---

## HVAC TRIAGE

→ Stable vs intermittent cooling → control vs system imbalance (refrigerant/airflow)

→ Worsens under heat/load → condenser airflow, refrigerant charge, compressor stress

→ Weak airflow vs wrong temperature → duct/blower restriction vs refrigerant/compressor fault

→ Ice buildup vs warm air → airflow restriction vs low refrigerant (leak)

→ Whole house vs single zone → central system vs duct restriction

---

## ELECTRICAL TRIAGE

→ Whole circuit vs single device → breaker/panel vs outlet/device

→ Intermittent vs constant → loose connection vs hard failure

→ Worsens under load → overloaded circuit, failing breaker

→ Heat/smell/buzzing → resistance fault (loose or damaged wire)

→ Multiple rooms → upstream panel or main feed issue

---

## PLUMBING TRIAGE

→ Continuous vs intermittent leak → pressure failure vs usage-triggered

→ Slow drain vs full blockage → partial obstruction vs main clog

→ Fixture vs whole house → local vs supply/pressure system

→ Pressure drop under use → restriction or regulator failure

→ Hot vs all water → water heater vs supply system

---

# DIAGNOSTIC FLOW (PRO-LEVEL REQUIREMENT)

You MUST include this rule in reasoning:

"Follow the physical branch in order. Do not treat a control problem like a mechanical problem, and do not treat a mechanical problem like a flow problem."

Then apply TRADE-SPECIFIC branching:

## HVAC
- airflow vs refrigerant vs electrical

## ELECTRICAL
- supply vs circuit vs device

## PLUMBING
- supply vs drainage vs fixture

Each branch must lead to different causes and tests.

---

# OUTPUT FORMAT (STRICT JSON)

{
  "title": "",
  "slug": "",
  "page_type": "",
  "system": "",
  "symptom": "",
  "city": "",

  "hero": {
    "headline": "",
    "subheadline": "",
    "urgencyLine": "",
    "ctaLine": ""
  },

  "summary30s": [],

  "fieldTriage": [],

  "aiSummary": [],

  "systemFlowDiagram": "flowchart TD ...",

  "fastDiagnosis": "",

  "sections": [
    {
      "title": "30-Second Summary",
      "type": "summary_30s",
      "content": []
    },
    {
      "title": "Field Triage",
      "type": "triage",
      "content": []
    },
    {
      "title": "How / Why This Happens",
      "type": "system_core",
      "content": []
    },
    {
      "title": "Diagnostic Flow",
      "type": "steps",
      "steps": []
    },
    {
      "title": "Top Causes (Ranked)",
      "type": "causes",
      "items": []
    },
    {
      "title": "Measurement Thresholds",
      "type": "specs",
      "table": []
    },
    {
      "title": "Repair vs Replace",
      "type": "replace_vs_repair",
      "content": []
    }
  ],

  "repairMatrix": [],

  "technicianInsights": [],

  "internalLinks": {
    "system": [],
    "related": [],
    "deep": []
  },

  "localLinks": [],

  "cta": {
    "mid": "",
    "bottom": ""
  }
}

---

# CTA RULES (TRADE-SPECIFIC — REQUIRED)

## HVAC CTA

mid: "Check airflow, filter, and thermostat now"
bottom: "Schedule HVAC service before system damage worsens"

---

## ELECTRICAL CTA

mid: "Turn off power and verify the circuit safely"
bottom: "Get a licensed electrician to inspect this issue"

---

## PLUMBING CTA

mid: "Shut off water and inspect for active leaks"
bottom: "Call a plumber before water damage spreads"

---

# HARD REQUIREMENTS

- Field Triage MUST match system
- Diagnostic Flow MUST branch correctly
- Causes MUST map to branches
- repairMatrix must be real-world fixes
- Include real measurement thresholds where applicable
- No generic language

---

# INTERNAL LINKING — RELATED (MASTER ADD-ON, LOCKED)

Populate **`internalLinks.related`**, **`internalLinks.system`**, and **`internalLinks.deep`** so the page ships a credible **Related** graph (near-bottom in product). **If `internalLinks` is empty or unrelated filler → output is INVALID.**

- **`internalLinks.related`:** **3–5** entries (inclusive). Each value is a **path this site can serve** (same style as other prompts: `/{vertical}/...` or `vertical/...` per your mapper — stay consistent with the examples in the user message). **No** other trades, **no** naked homepage-only `/`.
- **Composition:**
  - **≥2** links = **same trade** + **different symptom** (problem cluster peers for this system).
  - **≥1** link = **same symptom in a different city** (`.../{city-fl}`) **or** a **system-level** page for this trade.
  - **≤1 optional** = deeper root/system topic, same trade only.
- Links MUST be **contextually relevant** to this page’s failure class; do **not** reuse one static list for every page when the brief allows better neighbors.
- **`localLinks`:** when the page is localized, align with the same city grid in the brief so “nearby” entries are real.

---

# FINAL

Return ONLY valid JSON.
No explanation.
`.trim();
