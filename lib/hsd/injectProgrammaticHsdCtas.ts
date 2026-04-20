import { formatCityPathSegmentForDisplay, parseLocalizedStorageSlug } from "@/lib/localized-city-path";

export const HSD_CTA_TYPES = ["top", "mid", "danger", "cost", "final"] as const;
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
  const title = String(json.title ?? "This issue").trim();
  const slug = String(json.slug ?? "").trim();
  const city = cityPhraseFromSlug(slug);
  const vertical = verticalFromSlug(slug);
  const issue = title.length > 140 ? `${title.slice(0, 137)}…` : title;
  const issueLower = issue.toLowerCase();

  const m = new Map<HsdCtaType, HsdCtaEntry>();
  m.set("top", {
    type: "top",
    text: `If ${issueLower} is not fixed in ${city}, costs can exceed $1,500 quickly. What starts as a small issue becomes a major failure once the system keeps running wrong.`,
  });
  m.set("mid", {
    type: "mid",
    text:
      vertical === "hvac"
        ? `If quick checks fail, continuing to run the system risks compressor damage in ${city}.`
        : `If quick checks fail, continuing to operate the system worsens damage in ${city}.`,
  });
  m.set("danger", {
    type: "danger",
    text:
      vertical === "hvac"
        ? `Misdiagnosing airflow vs refrigerant vs electrical can lead to $3,500+ repairs. Do not guess.`
        : `Misdiagnosing the root cause can add thousands in repair cost in ${city}. Do not guess.`,
  });
  m.set("cost", {
    type: "cost",
    text: `Small issues escalate fast: what starts as a $300 repair can become a $3,500 class failure when fault hours stack. Use the matrix below as bands—not quotes—after measurement, not guessing.`,
  });
  m.set("final", {
    type: "final",
    text: `In ${city}, delay accelerates failure—book a licensed technician before damage spreads. Waiting can turn a $300 issue into $1,500+ worst-case damage under load.`,
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
