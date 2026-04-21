import { formatCityPathSegmentForDisplay, parseLocalizedStorageSlug } from "@/lib/localized-city-path";

export const HSD_CTA_TYPES = ["top", "mid", "danger", "final"] as const;
export type HsdCtaType = (typeof HSD_CTA_TYPES)[number];

export type HsdCtaEntry = { type: HsdCtaType; text: string };

const ALLOWED = new Set<string>(HSD_CTA_TYPES);

/** Keep first entry per `type`; drop unknown types and empty text. */
export function normalizeCtasOnJson(json: Record<string, unknown>): HsdCtaEntry[] {
  const raw = json.ctas;
  if (!Array.isArray(raw)) return [];
  const byType = new Map<string, HsdCtaEntry>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const type = String(o.type ?? "").trim().toLowerCase();
    const text = String(o.text ?? "").trim();
    if (!ALLOWED.has(type) || !text) continue;
    if (!byType.has(type)) byType.set(type, { type: type as HsdCtaType, text });
  }
  return HSD_CTA_TYPES.map((t) => byType.get(t)).filter((x): x is HsdCtaEntry => Boolean(x));
}

function cityPhraseFromSlug(slug: string): string {
  const p = parseLocalizedStorageSlug(String(slug ?? "").trim());
  if (!p) return "your area";
  return formatCityPathSegmentForDisplay(p.citySlug) || "your area";
}

function verticalFromSlug(slug: string): string {
  return String(slug ?? "").split("/")[0]?.trim().toLowerCase() || "hvac";
}

function buildDefaultCtasMap(json: Record<string, unknown>): Map<HsdCtaType, HsdCtaEntry> {
  const slug = String(json.slug ?? "").trim();
  const city = cityPhraseFromSlug(slug);
  const vertical = verticalFromSlug(slug);

  const m = new Map<HsdCtaType, HsdCtaEntry>();
  /** Do not splice `title` into "If … is not fixed in {city}" — titles often repeat the city or read as questions and break grammar. */
  m.set("top", {
    type: "top",
    text:
      vertical === "hvac"
        ? `In ${city}, comfort system faults rarely get cheaper on their own. Once equipment keeps running under the wrong conditions, repair costs often climb past $1,500—address the root cause before major components fail.`
        : vertical === "plumbing"
          ? `In ${city}, active leaks and drain backups do not self-resolve—water damage, mold, and sewer exposure stack fast. Urgent: stop the spread and book a licensed plumber before a $300 fix becomes $1,500+ tear-out.`
          : vertical === "electrical"
            ? `In ${city}, breaker trips, heat at devices, or partial power are emergency-class signals. Stop the risk — connect with a local electrician now before arc faults or panel damage push repairs past $1,500.`
            : `In ${city}, this kind of fault usually worsens with continued use. Repair exposure commonly exceeds $1,500 when problems are left unresolved—have a licensed professional verify before damage spreads.`,
  });
  m.set("mid", {
    type: "mid",
    text:
      vertical === "hvac"
        ? `If quick checks fail, continuing to run the system risks compressor damage in ${city}.`
        : vertical === "plumbing"
          ? `If water keeps running, pressure is dropping, or sewage is backing up, every hour widens damage in ${city}—treat it as urgent.`
          : vertical === "electrical"
            ? `If this has tripped more than once in ${city}, you're no longer testing — you're stressing the wiring.`
            : `If quick checks fail, continuing to operate the system worsens damage in ${city}.`,
  });
  m.set("danger", {
    type: "danger",
    text:
      vertical === "hvac"
        ? `Misdiagnosing airflow vs refrigerant vs electrical can lead to $3,500+ repairs. Do not guess.`
        : vertical === "plumbing"
          ? `Guessing on supply lines vs drains vs water heaters wastes time while finishes and framing soak—urgent: get measured diagnosis from a licensed plumber in ${city}.`
          : vertical === "electrical"
            ? `Misdiagnosing branch circuits vs panel vs grounding risks fire and shock—urgent: do not guess in ${city}; get a licensed electrician.`
            : `Misdiagnosing the root cause can add thousands in repair cost in ${city}. Do not guess.`,
  });
  m.set("final", {
    type: "final",
    text:
      vertical === "plumbing"
        ? `In ${city}, delay turns drips into drywall, cabinet, and subfloor damage—urgent: book a licensed plumber now. Waiting commonly pushes a contained repair past $1,500 once mold and tear-out enter the picture.`
        : vertical === "electrical"
          ? `Most electrical issues in ${city} start under $300 and turn into $1,500+ when ignored. Stop the risk — connect with a local electrician now before fault current damages panels, feeders, or devices.`
          : vertical === "hvac"
            ? `In ${city}, delay accelerates failure—book a licensed HVAC technician before damage spreads. Waiting can turn a $300 issue into $1,500+ worst-case damage under load.`
            : `In ${city}, delay accelerates failure—book a licensed technician before damage spreads. Waiting can turn a $300 issue into $1,500+ worst-case damage under load.`,
  });
  return m;
}

/**
 * Merges JSON `ctas` with programmatic defaults for any missing `type`.
 * Mutates `json.ctas` in place (server-side, pre-render / pre-Zod).
 */
export function injectProgrammaticHsdCtas(json: Record<string, unknown>): void {
  const existing = normalizeCtasOnJson(json);
  const defaults = buildDefaultCtasMap(json);
  const byType = new Map<HsdCtaType, HsdCtaEntry>();
  for (const c of existing) {
    byType.set(c.type, c);
  }
  const merged: HsdCtaEntry[] = [];
  for (const t of HSD_CTA_TYPES) {
    if (byType.has(t)) merged.push(byType.get(t)!);
    else {
      const d = defaults.get(t);
      if (d) merged.push(d);
    }
  }
  json.ctas = merged;
}
