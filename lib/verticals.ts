/**
 * Home Service Authority — vertical registry (umbrella site).
 * HVAC remains the flagship; other trades are scaffolded for routing + prompts.
 */

export type HomeServiceVertical = {
  /** URL segment, e.g. /plumbing */
  id: string;
  /** Human label */
  label: string;
  /** Short expert voice line for prompts */
  expertRole: string;
  /** Domains to prioritize in diagnostics (prompt injection) */
  diagnosticDomains: string[];
  /** Example pillar slugs (programmatic cluster roots) */
  pillarExamples: { slug: string; title: string; href: string }[];
  /** Trades/topics that must not appear in copy for this vertical */
  forbiddenCrossTrade: string[];
};

export const HOME_SERVICE_VERTICALS: Record<string, HomeServiceVertical> = {
  hvac: {
    id: "hvac",
    label: "HVAC",
    expertRole:
      "senior residential HVAC diagnostician (airflow, refrigeration, electrical controls, combustion where applicable)",
    diagnosticDomains: [
      "airflow & static pressure",
      "refrigeration circuit & charge",
      "low-voltage controls",
      "electrical supply & motors",
      "condensate & freeze-ups",
      "thermostats & zoning",
    ],
    pillarExamples: [
      { slug: "ac-not-cooling", title: "AC not cooling", href: "/diagnose/ac-not-cooling" },
      { slug: "ac-not-turning-on", title: "AC not turning on", href: "/diagnose/ac-not-turning-on" },
      { slug: "furnace-not-heating", title: "Furnace not heating", href: "/diagnose/furnace-not-heating" },
      { slug: "hvac-making-noise", title: "HVAC making noise", href: "/diagnose/hvac-making-noise" },
      { slug: "thermostat-not-working", title: "Thermostat issues", href: "/diagnose/thermostat-display-blank" },
    ],
    forbiddenCrossTrade: [],
  },
  plumbing: {
    id: "plumbing",
    label: "Plumbing",
    expertRole:
      "licensed plumber mindset (supply pressure, DWV venting, fixture operation, water heaters, leak isolation)",
    diagnosticDomains: [
      "supply pressure & restriction",
      "drainage, venting & blockages",
      "water heater & mixing valves",
      "fixture & shutoff failures",
      "hidden leaks & moisture mapping",
    ],
    pillarExamples: [
      { slug: "water-heater-not-working", title: "Water heater not working", href: "/plumbing" },
      { slug: "low-water-pressure", title: "Low water pressure", href: "/plumbing" },
      { slug: "drain-clogged", title: "Drain clogged / slow", href: "/plumbing" },
    ],
    forbiddenCrossTrade: ["refrigerant", "compressor", "heat pump reversing valve"],
  },
  electrical: {
    id: "electrical",
    label: "Electrical",
    expertRole:
      "master electrician triage voice (branch circuits, GFCIs/AFCI, panels, grounding, voltage drop, safe isolation)",
    diagnosticDomains: [
      "overcurrent & tripping",
      "ground fault & neutral issues",
      "panel & breaker defects",
      "device & switch loops",
      "voltage drop under load",
    ],
    pillarExamples: [
      { slug: "breaker-keeps-tripping", title: "Breaker keeps tripping", href: "/electrical" },
      { slug: "outlet-not-working", title: "Outlet not working", href: "/electrical" },
      { slug: "lights-flickering", title: "Lights flickering", href: "/electrical" },
    ],
    forbiddenCrossTrade: ["refrigerant charge", "condensate pan"],
  },
  roofing: {
    id: "roofing",
    label: "Roofing",
    expertRole:
      "roofing estimator / foreman tone (deck, flashing, penetrations, drainage, storm damage patterns)",
    diagnosticDomains: [
      "flashing & penetrations",
      "shingle or membrane failure",
      "drainage & ponding",
      "attic ventilation correlation",
      "storm / impact patterns",
    ],
    pillarExamples: [
      { slug: "roof-leak", title: "Roof leak / ceiling stain", href: "/symptom/roofing" },
      { slug: "missing-shingles", title: "Missing or damaged shingles", href: "/symptom/roofing" },
    ],
    forbiddenCrossTrade: ["TXV", "evaporator coil"],
  },
  "appliance-repair": {
    id: "appliance-repair",
    label: "Appliance repair",
    expertRole:
      "field appliance technician (motors, controls, water valves, heating elements, sealed systems policy)",
    diagnosticDomains: [
      "power & control boards",
      "mechanical drive & motors",
      "water inlet & drain pumps",
      "thermal / heating elements",
      "user-observable error codes",
    ],
    pillarExamples: [
      { slug: "dishwasher-not-draining", title: "Dishwasher not draining", href: "/symptom/appliance-repair" },
      { slug: "dryer-not-heating", title: "Dryer not heating", href: "/symptom/appliance-repair" },
    ],
    forbiddenCrossTrade: ["duct static pressure", "superheat"],
  },
  "mold-remediation": {
    id: "mold-remediation",
    label: "Mold remediation",
    expertRole:
      "IEP / remediation PM voice (moisture drivers, containment, HEPA workflow, clearance — no medical claims)",
    diagnosticDomains: [
      "moisture source identification",
      "HVAC-facilitated condensation vs bulk water",
      "containment & sequencing",
      "material removal decisions",
      "prevention & drying plan",
    ],
    pillarExamples: [
      { slug: "musty-smell", title: "Musty smell after leak", href: "/symptom/mold-remediation" },
      { slug: "visible-mold", title: "Visible mold growth", href: "/symptom/mold-remediation" },
    ],
    forbiddenCrossTrade: [],
  },
};

/** Slugs that render a vertical hub from `app/symptom/[symptom]/page.tsx` */
export const UMBRELLA_VERTICAL_HUB_SLUGS = [
  "plumbing",
  "electrical",
  "roofing",
  "appliance-repair",
  "mold-remediation",
] as const;

export type UmbrellaVerticalHubSlug = (typeof UMBRELLA_VERTICAL_HUB_SLUGS)[number];

export function isUmbrellaVerticalHubSlug(slug: string): slug is UmbrellaVerticalHubSlug {
  return (UMBRELLA_VERTICAL_HUB_SLUGS as readonly string[]).includes(slug);
}

/** Primary nav / hub link: dedicated routes for HVAC + trades with `app/{trade}/page`, else `/symptom/{id}`. */
export function verticalHubNavHref(verticalId: string): string {
  const id = normalizeVerticalId(verticalId);
  if (id === "hvac") return "/hvac";
  if (id === "plumbing") return "/plumbing";
  if (id === "electrical") return "/electrical";
  return `/symptom/${id}`;
}

export function normalizeVerticalId(raw?: string | null): string {
  const v = (raw || "hvac").trim().toLowerCase();
  if (HOME_SERVICE_VERTICALS[v]) return v;
  return "hvac";
}

export function getVertical(id: string): HomeServiceVertical {
  const key = normalizeVerticalId(id);
  return HOME_SERVICE_VERTICALS[key];
}

/**
 * Injected ahead of router prompts so the same JSON engines can be steered per trade.
 */
export function buildVerticalPromptPreamble(verticalId?: string | null): string {
  const v = getVertical(normalizeVerticalId(verticalId));
  if (v.id === "hvac") {
    return "";
  }

  const forbidden = v.forbiddenCrossTrade.length
    ? `\n- Do NOT use unrelated-trade concepts as primary diagnoses: ${v.forbiddenCrossTrade.join(", ")}.`
    : "";

  return `
UMBRELLA SITE — ACTIVE VERTICAL: ${v.label} (id: "${v.id}")
You write like a ${v.expertRole}.
Prioritize diagnostic domains: ${v.diagnosticDomains.join("; ")}.${forbidden}
Keep the same JSON output contract requested below (keys/layout), but all examples, tests, failure modes, and tools must be specific to ${v.label}.
If a required field name contains "hvac" historically, treat it as the branding/layout id only — content must still be ${v.label}-accurate.
`.trim();
}
