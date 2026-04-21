/**
 * Locked prompt for **national problem pillar** URLs (`/{vertical}/{symptom}` — no city).
 * Model output is mapped to `hsd_v2` / `HsdV25Payload` before save + `renderHsdV25`.
 *
 * **Production generator** (`generateProblemPillarPage`) uses **`DG_AUTHORITY_ENGINE_V4`**
 * (`lib/dg/dgAuthorityEngineV4Prompt.ts`). Keep this file for legacy / A–B tests.
 */
export const PROBLEM_PILLAR_V1 = `
You are generating a HIGH-AUTHORITY PROBLEM PILLAR PAGE.

This page targets a specific failure symptom in a mechanical system.

---

# CORE OBJECTIVE

- Match the user's problem immediately
- Explain what is physically happening
- Walk through diagnostic logic (branching)
- Rank the most likely causes
- Route users to local pages

---

# STYLE (MANDATORY)

Write like a 30-year field technician:

- Direct, no fluff
- Every statement tied to a physical cause
- Use diagnostic reasoning:
  - "If X → then Y"
  - "This happens because..."
  - "Verify this by..."

---

# OUTPUT FORMAT (STRICT JSON)

{
  "title": "",
  "slug": "",
  "page_type": "problem_pillar",
  "system": "",
  "symptom": "",

  "hero": {
    "headline": "",
    "subheadline": "",
    "urgencyLine": "Ignoring this can lead to system damage or higher repair costs",
    "ctaLine": "Start diagnosing below"
  },

  "summary30s": [
    "Immediate problem explanation",
    "Most likely cause",
    "Quick first check",
    "When to stop DIY"
  ],

  "aiSummary": [
    "what is happening",
    "why it happens",
    "what it affects",
    "where to start"
  ],

  "systemFlowDiagram": "flowchart TD ...",

  "fastDiagnosis": "",

  "sections": [
    {
      "title": "30-Second Summary",
      "type": "summary_30s",
      "content": []
    },
    {
      "title": "Why This Happens",
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
      "title": "Measurement Thresholds (Specs)",
      "type": "specs",
      "table": []
    },
    {
      "title": "Repair vs Replace",
      "type": "replace_vs_repair",
      "content": []
    }
  ],

  "repairMatrix": [
    {
      "symptom": "",
      "likelyCause": "",
      "fix": "",
      "costRange": ""
    }
  ],

  "technicianInsights": [
    "Real-world diagnostic insight",
    "Common misdiagnosis warning"
  ],

  "internalLinks": {
    "system": [],
    "related": [],
    "deep": []
  },

  "localLinks": [
    "tampa-fl",
    "fort-myers-fl",
    "cape-coral-fl",
    "estero-fl",
    "naples-fl"
  ],

  "cta": {
    "mid": "Start Diagnosis",
    "bottom": "Find Local Repair"
  }
}

---

# REQUIREMENTS

- Diagnostic Flow MUST branch (If X → then Y)
- Top Causes MUST be ranked by likelihood
- Include real measurement thresholds where applicable
- repairMatrix must include real-world fixes

---

# INTERNAL LINKING — RELATED (MASTER ADD-ON, LOCKED)

**National problem pillar** (\`page_type: "problem_pillar"\`, two-segment \`slug\`): populate \`internalLinks\` so the shipped page has a real **Related** graph.

- \`internalLinks.related\`: **3–5** same-trade entries (paths this site can serve — **two segments only** here: \`{vertical}/{symptom}\`; **do not** put \`*-fl\` tails inside \`internalLinks\` for this national template). **≥2** = different symptom, same trade, same cluster/system story. **≥1** = system primer / root topic (\`internalLinks.system\` may overlap but Related must still read as lateral discovery). **No** cross-trade links, **no** homepage-only \`/\`.
- \`localLinks\`: list real city tails for downstream localized pages (e.g. \`fort-myers-fl\`) — that is where city segments live for this schema.
- **Localized city pages** are **not** this template — they use **\`prompts/HSD_Page_Build.md\`** + runtime **HSD_HARD_ENFORCEMENT_RULES** (\`internal_links.related_symptoms\` with **three-segment** paths including \`{city-fl}\`).

**If \`internalLinks.related\` is missing or empty → output is INVALID.**

---

Return ONLY JSON.
No explanation.
`.trim();
