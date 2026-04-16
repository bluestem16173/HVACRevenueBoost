/**
 * Florida DG batch grid — keep in sync with `scripts/generate-dg-authority-fl-grid.ts`.
 * Used for internal `related_links` on localized HVAC pages.
 */

export const DG_FL_GRID_ISSUE_PHRASES = [
  "ac not cooling",
  "ac freezing up",
  "ac not turning on",
  "ac leaking water",
  "ac blowing warm air",
] as const;

export const DG_FL_GRID_CITY_SLUGS = [
  "tampa-fl",
  "orlando-fl",
  "fort-myers-fl",
  "cape-coral-fl",
] as const;

/** Human keys → storage segment (batch script / related links). */
export const DG_FL_SPOKEN_CITY_TO_SLUG: Record<string, string> = {
  tampa: "tampa-fl",
  orlando: "orlando-fl",
  "fort myers": "fort-myers-fl",
  "cape coral": "cape-coral-fl",
};

/** Pillar segment order — must match phrases → slugs in the batch script. */
export const DG_FL_GRID_PILLARS = [
  "ac-not-cooling",
  "ac-freezing-up",
  "ac-not-turning-on",
  "ac-leaking-water",
  "ac-blowing-warm-air",
] as const;

export function issuePhraseToPillar(issue: string): string {
  return issue.toLowerCase().trim().replace(/\s+/g, "-");
}

/**
 * Same-city (2 other issues) + cross-city (1 other metro), path-only.
 * Example: `/hvac/ac-not-cooling/tampa-fl` →
 * `["/hvac/ac-freezing-up/tampa-fl","/hvac/ac-leaking-water/tampa-fl","/hvac/ac-not-cooling/orlando-fl"]`
 */
export function buildDgFloridaGridRelatedLinks(storageSlug: string): string[] {
  const parts = storageSlug.split("/").filter(Boolean);
  if (parts.length !== 3) return [];
  const [vertical, pillar, city] = parts;
  if (vertical.toLowerCase() !== "hvac") return [];

  const sameCity: string[] = [];
  for (const p of DG_FL_GRID_PILLARS) {
    if (p === pillar) continue;
    sameCity.push(`/${vertical}/${p}/${city}`);
    if (sameCity.length >= 2) break;
  }

  const cities = [...DG_FL_GRID_CITY_SLUGS];
  const idx = cities.indexOf(city as (typeof DG_FL_GRID_CITY_SLUGS)[number]);
  const otherCity: string[] = [];
  if (idx >= 0) {
    const next = cities[(idx + 1) % cities.length];
    if (next !== city) {
      otherCity.push(`/${vertical}/${pillar}/${next}`);
    }
  }

  return [...sameCity, ...otherCity].slice(0, 3);
}
