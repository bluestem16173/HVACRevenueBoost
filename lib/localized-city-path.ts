import { enforceStoredSlug } from "./slug-utils";

export type ServiceVertical = "hvac" | "plumbing" | "electrical";

/**
 * True when a path under a trade vertical ends with a **storage city** segment (`{city}-{st}`),
 * e.g. `ac-not-cooling/tampa-fl`, `clogged-drain/orlando-fl`. A single segment (`ac-not-cooling`) is national-only.
 */
export function joinedSlugEndsWithCityStorage(joinedUnderVertical: string): boolean {
  const parts = enforceStoredSlug(joinedUnderVertical).split("/").filter(Boolean);
  if (parts.length < 2) return false;
  const last = parts[parts.length - 1].toLowerCase();
  return /^[a-z0-9]+-[a-z]{2}$/.test(last);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strip wrapper segments from messy input (matches the HVAC + Tampa pattern, generalized):
 *
 * `raw.replace(/^\/+/, '').replace(/^hvac\//, '').replace(/\/tampa-fl$/, '').toLowerCase()`
 *
 * — here `vertical` and `citySlug` replace the hard-coded `hvac` / `tampa-fl`.
 */
export function normalizeLocalizedSlugInput(
  raw: string,
  vertical: ServiceVertical,
  citySlug: string
): string {
  const v = vertical.toLowerCase();
  const c = enforceStoredSlug(citySlug).toLowerCase();
  return enforceStoredSlug(raw)
    .replace(new RegExp(`^${escapeRegExp(v)}/`, "i"), "")
    .replace(new RegExp(`/${escapeRegExp(c)}$`, "i"), "")
    .toLowerCase()
    .trim();
}

/**
 * Canonical `pages.slug` / queue slug: `hvac/${normalizeLocalizedSlugInput(...)}/tampa-fl` (no leading slash).
 */
export function buildLocalizedStorageSlug(
  vertical: ServiceVertical,
  raw: string,
  citySlug: string
): string {
  const core = normalizeLocalizedSlugInput(raw, vertical, citySlug);
  const c = enforceStoredSlug(citySlug).toLowerCase();
  const v = vertical.toLowerCase() as ServiceVertical;
  if (!core) return enforceStoredSlug(raw);
  return `${v}/${core}/${c}`;
}

export function parseLocalizedStorageSlug(slug: string): {
  vertical: ServiceVertical;
  pillarCore: string;
  citySlug: string;
} | null {
  const s = enforceStoredSlug(slug);
  const parts = s.split("/").filter(Boolean);
  if (parts.length !== 3) return null;
  const v = parts[0].toLowerCase();
  if (v !== "hvac" && v !== "plumbing" && v !== "electrical") return null;
  return {
    vertical: v as ServiceVertical,
    pillarCore: parts[1],
    citySlug: parts[2],
  };
}

/** Tampa HVAC: "hvac/" + normalizeLocalizedSlugInput(input, "hvac", "tampa-fl") + "/tampa-fl". */
export function buildHvacTampaFlStorageSlug(input: string): string {
  return buildLocalizedStorageSlug("hvac", input, "tampa-fl");
}

/** If `slug` is `{vertical}/{pillar}/{city}`, rebuild with {@link normalizeLocalizedSlugInput}; else {@link enforceStoredSlug} only. */
export function canonicalLocalizedStorageSlug(slug: string): string {
  const parsed = parseLocalizedStorageSlug(slug);
  if (!parsed) return enforceStoredSlug(slug);
  return buildLocalizedStorageSlug(parsed.vertical, slug, parsed.citySlug);
}

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

/** `pages.slug` for localized HSD / city_symptom rows (no leading slash). */
export function pagesSlugForLocalizedPillar(
  vertical: ServiceVertical,
  pillarSlug: string,
  citySlug: string
): string {
  return buildLocalizedStorageSlug(vertical, pillarSlug, citySlug);
}

/** Storage or URL slug: `plumbing/no-hot-water` or `plumbing/no-hot-water/tampa-fl`. */
export function isPlumbingNoHotWaterSlug(slug: string): boolean {
  const p = enforceStoredSlug(slug)
    .split("/")
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  return p[0] === "plumbing" && p[1] === "no-hot-water";
}
