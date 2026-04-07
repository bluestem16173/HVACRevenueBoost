/**
 * HVAC Revenue Boost — conversion-first generation (default).
 * DecisionGrid-style technician depth is opt-in: `DECISIONGRID_DIAGNOSTIC_MODE=true`.
 *
 * Page types: city_service, city_symptom, emergency, symptom (default pipeline).
 */

import type { PageTypeId } from "@/config/page-types";

export const HRB_BRAND = "hvac_revenue_boost" as const;

/** Required top-level fields for lead pages (plus existing v5 diagnostic fields). */
export const HRB_OUTPUT_CONTRACT = `
REQUIRED TOP-LEVEL JSON FIELDS (MANDATORY STRICT MATCH TO V3 AUTHORITY SCHEMA):
- "layout": "hvac_authority_v3"
- "page_type": "diagnostic"
- "schema_version": "v3"
- "meta_title" — ≤60 chars, local + benefit + brand intent
- "meta_description" — ≤155 chars, CTA-oriented
`;

export const HRB_SYSTEM_LOCK = `You generate structured JSON for HVAC Revenue Boost — a local LEAD GENERATION business.

ABSOLUTE RULES:
- Goal #1: Help the homeowner triage the issue, followed by a strong push to professional resolution.
- Tone: Clinical, authoritative, safety-first. No academic or technician-exam voice, but do not sound like a cheesy salesperson.
- FORBIDDEN: blog filler ("In this article", "This guide will explore").
- Location: weave in the provided CITY / SERVICE AREA naturally (trust + local SEO) without stuffing keywords.
- fast_answer: replaced by 'summary_30s' — keep it brief and helpful.
- Mermaid: strictly functional flowchart that tracks the 'advanced_diagnostic_flow' steps.
- Every page must feel like "call a pro" is the rational, safe next step after basic DIY checks fail.
`;

export function buildHrbTaskPrompt(params: {
  canonicalType: PageTypeId | string;
  symptom: string;
  city: string;
  pageTypeRaw?: string;
}): string {
  const { canonicalType, symptom, city, pageTypeRaw } = params;
  const loc = city?.trim() || "your area";

  const base = `
TOPIC: ${symptom}
SERVICE CITY / AREA: ${loc}
QUEUE page_type (raw): ${pageTypeRaw || "(default)"}
CANONICAL TYPE: ${canonicalType}

${HRB_OUTPUT_CONTRACT}
`;

  switch (canonicalType) {
    case "city_service":
      return `${base}

PAGE BLUEPRINT — city_service (e.g. AC Repair in ${loc}):
1) sections: hook (problem + urgency), whats_happening (simple), why_it_matters (cost/risk/discomfort), what_to_do_now, trust (years, licensed, insured, coverage), service_area
2) CTAs: "Call now", "Free estimate", "Speak to a local tech"
3) FAQ: short, conversion-focused (pricing ballpark, warranty, response time)
`;

    case "city_symptom":
      return `${base}

PAGE BLUEPRINT — city_symptom (e.g. "${symptom}" in ${loc}):
1) sections: fast_answer, likely_causes_simple, quick_checks (safe steps), cta_block, service_area
2) Likely causes: 3–4 plain-English bullets, not engineering chapters
3) FAQ: 3–5 items — when to call, what we check first, cost transparency
`;

    case "emergency":
      return `${base}

PAGE BLUEPRINT — emergency:
1) sections: urgency_hero (why now), immediate_steps (3–5 bullets), risks_of_waiting, trust_line, contact_block
2) HOOK: problem + urgency + same-day / fast response (honest, not alarmist)
3) CTA blocks must stress fast dispatch and phone
4) FAQ: 3–4 items max — dispatch, pricing transparency, service area
`;

    case "hybrid":
      return `${base}

PAGE BLUEPRINT — city_service (hybrid) (e.g. AC Repair in ${loc}):
1) sections: hook (problem + urgency), whats_happening (simple), why_it_matters (cost/risk/discomfort), what_to_do_now, trust (years, licensed, insured, coverage), service_area
2) CTAs: "Call now", "Free estimate", "Speak to a local tech"
3) FAQ: short, conversion-focused (pricing ballpark, warranty, response time)
`;

    default:
      return `${base}

PAGE BLUEPRINT — Authority Template v3 (diagnostic):
1) This is a strictly locked 19-step architecture.
2) Populate 'summary_30s', 'immediate_quick_checks', 'diy_tools', 'high_risk_warning', 'most_common_causes' (exactly 4), 'repair_matrix', 'when_to_stop_diy', etc.
3) All content must adhere precisely to the JSON schema keys provided. Do NOT output legacy 'fast_answer' or 'sections' keys.
`;
  }
}

export function isDecisionGridDiagnosticMode(): boolean {
  return process.env.DECISIONGRID_DIAGNOSTIC_MODE === "true";
}
