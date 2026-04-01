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
REQUIRED TOP-LEVEL JSON FIELDS (in addition to schema-required diagnostic fields):
- "meta_title" — ≤60 chars, local + benefit + brand intent
- "meta_description" — ≤155 chars, CTA-oriented
- "cta_blocks" — array of exactly 3 objects:
  { "placement": "above_fold" | "mid_page" | "bottom", "headline": string, "subtext": string, "button_text": string, "phone_prompt": string }
- "sections" — array of { "id": string, "heading": string, "body": string } for the page-type blueprint below (keep bodies short: 2–5 sentences each)

FAQ: keep "faq" array short (3–5), answers focused on booking/reassurance, not engineering lectures.
`;

export const HRB_SYSTEM_LOCK = `You generate structured JSON for HVAC Revenue Boost — a local LEAD GENERATION business.

ABSOLUTE RULES:
- Goal #1: get the homeowner to CALL or REQUEST SERVICE. Education supports trust, not depth.
- Tone: clear, confident, helpful, action-oriented. No academic or technician-exam voice.
- FORBIDDEN: deep thermodynamics lectures, enthalpy/subcool tutorials, long diagnostic theory.
- FORBIDDEN: blog filler ("In this article", "This guide will explore").
- Location: weave in the provided CITY / SERVICE AREA naturally (trust + local SEO) without stuffing keywords.
- fast_answer.technical_summary: 2–3 short sentences a homeowner understands; name at most ONE technical term if helpful.
- fast_answer.primary_mechanism: ONE short sentence (cause in plain English).
- Mermaid: keep SMALL (≤10 nodes), plain-language labels, still valid flowchart TD with "?" binary checks where required.
- Causes/tests: simple homeowner-executable checks where possible; avoid requiring shop tools unless necessary.
- Every page must feel like "call now" is the rational next step — not "become an HVAC student."
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

PAGE BLUEPRINT — diagnostic symptom (lead-safe):
1) sections: fast_answer, likely_causes, quick_checks, when_to_call_pro, trust
2) Keep failure_modes / causes / mermaid for schema compliance but LANGUAGE stays homeowner-first
3) CTAs: primary above fold, mid, bottom — booking language
`;
  }
}

export function isDecisionGridDiagnosticMode(): boolean {
  return process.env.DECISIONGRID_DIAGNOSTIC_MODE === "true";
}
