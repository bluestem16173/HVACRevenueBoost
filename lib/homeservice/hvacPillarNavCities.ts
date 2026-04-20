/**
 * HVAC pillar / authority-nav city bases (URL segment before state).
 * Mapped to storage slugs with `-fl` via {@link cityBaseToStorageSlug} unless already `city-st`.
 */
export const CITIES = [
  "fort-myers",
  "cape-coral",
  "estero",
  "fort-myers-beach",
  "sanibel",
  "tampa",
  "naples",
  "orlando",
] as const;

/** Southwest Florida / Lee County line on pillars (subset of {@link CITIES}). */
const GEO_HINT_BASES = [
  "fort-myers",
  "cape-coral",
  "estero",
  "fort-myers-beach",
  "sanibel",
  "naples",
] as const;

/** `tampa` → `tampa-fl`; `tampa-fl` unchanged. */
export function cityBaseToStorageSlug(base: string): string {
  const b = String(base ?? "").trim().toLowerCase();
  if (!b) return "";
  if (/^[a-z0-9]+-[a-z]{2}$/.test(b)) return b;
  return `${b}-fl`;
}

export function getHvacGeoHintStorageSlugs(): string[] {
  return [...GEO_HINT_BASES].map((c) => cityBaseToStorageSlug(c));
}

/**
 * Storage city segments for HVAC pillar + city authority nav (`/hvac/{sym}/{city}`).
 * Starts from {@link CITIES}; append `HVAC_PILLAR_NAV_CITIES` (comma-separated storage or base slugs).
 */
export function getHvacPillarNavCityStorageSlugs(): string[] {
  const fromConst = CITIES.map((c) => cityBaseToStorageSlug(c));
  const raw = (process.env.HVAC_PILLAR_NAV_CITIES || "").trim();
  const fromEnv = raw
    ? raw.split(",").map((s) => cityBaseToStorageSlug(s.trim().toLowerCase())).filter(Boolean)
    : [];
  return [...new Set([...fromConst, ...fromEnv])];
}
