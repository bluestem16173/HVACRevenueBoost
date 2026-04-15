/**
 * Parses URL segments like `tampa-fl` → display "Tampa, FL".
 * Heuristic: trailing `-xx` where xx is two letters = state abbreviation.
 */
export function formatCityPathSegmentForDisplay(citySlug: string): string {
  const raw = citySlug.trim().toLowerCase();
  const m = raw.match(/^(.+)-([a-z]{2})$/i);
  if (m) {
    const cityTitle = m[1]
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join(" ");
    return `${cityTitle}, ${m[2].toUpperCase()}`;
  }
  return raw
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}

/** Canonical pillar + city URL under HVAC vertical */
export function buildHvacLocalizedPillarPath(pillarSlug: string, citySlug: string): string {
  return `/hvac/${pillarSlug.trim().toLowerCase()}/${citySlug.trim().toLowerCase()}`;
}

/** Canonical pillar + city URL under plumbing vertical */
export function buildPlumbingLocalizedPillarPath(pillarSlug: string, citySlug: string): string {
  return `/plumbing/${pillarSlug.trim().toLowerCase()}/${citySlug.trim().toLowerCase()}`;
}

/** Canonical pillar + city URL under electrical vertical */
export function buildElectricalLocalizedPillarPath(pillarSlug: string, citySlug: string): string {
  return `/electrical/${pillarSlug.trim().toLowerCase()}/${citySlug.trim().toLowerCase()}`;
}

export type ServiceVertical = "hvac" | "plumbing" | "electrical";

export function buildLocalizedPillarPath(
  vertical: ServiceVertical,
  pillarSlug: string,
  citySlug: string
): string {
  const s = pillarSlug.trim().toLowerCase();
  const c = citySlug.trim().toLowerCase();
  if (vertical === "plumbing") return `/plumbing/${s}/${c}`;
  if (vertical === "electrical") return `/electrical/${s}/${c}`;
  return `/hvac/${s}/${c}`;
}
