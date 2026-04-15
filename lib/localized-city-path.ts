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
