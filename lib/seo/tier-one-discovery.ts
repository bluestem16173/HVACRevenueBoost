/**
 * Tier-1 “money” discovery model: expose only high-intent clusters in sitemaps and internal links.
 * Tier-2 pages stay **published** for humans if linked directly, but are omitted from sitemap graphs and
 * hub links point only at discoverable targets (pillars, repair, Tier-1 locals, extras).
 *
 * Env:
 * - `TIER_ONE_CITIES` — comma-separated storage city segments (default `tampa-fl`).
 * - `TIER_ONE_EXTRA_SLUGS` — optional full storage slugs (`plumbing/clogged-drain/tampa-fl`, …) promoted to Tier 1.
 * - `DISABLE_HSD_TIER_LINK_FILTER` — `1` / `true` skips client+renderer filtering of `internal_links` (debug only).
 */

import { HVAC_CORE_CLUSTER_SYMPTOM_ORDER } from "@/lib/homeservice/hsdHvacCoreCluster";
import { isLeeCountyMonetizationLocalizedSlug } from "@/lib/homeservice/leeCountyInitialMonetizationCluster";
import { enforceStoredSlug, isLocalizedPillarPageSlug } from "@/lib/slug-utils";

const HVAC_CORE_SYMPTOM_SET = new Set<string>(
  HVAC_CORE_CLUSTER_SYMPTOM_ORDER.map((s) => s.toLowerCase()),
);

export function getTierOneCityStorageSlugs(): string[] {
  const raw = (process.env.TIER_ONE_CITIES || "tampa-fl").trim();
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(list.length ? list : ["tampa-fl"])];
}

export function getTierOneExtraSlugsNormalized(): Set<string> {
  const raw = (process.env.TIER_ONE_EXTRA_SLUGS || "").trim();
  const set = new Set<string>();
  for (const part of raw.split(",")) {
    const s = enforceStoredSlug(part).toLowerCase();
    if (s) set.add(s);
  }
  return set;
}

export function isTierOneHvacCoreSymptom(symptom: string): boolean {
  return HVAC_CORE_SYMPTOM_SET.has(String(symptom ?? "").trim().toLowerCase());
}

/**
 * Tier-1 URLs for **sitemap + localized indexing robots**:
 * - explicit `TIER_ONE_EXTRA_SLUGS`
 * - `hvac/{symptom}` where symptom is HVAC core cluster
 * - `plumbing/{x}` / `electrical/{x}` national pillars (2 segments)
 * - `hvac/{symptom}/{city}` where symptom is core and city ∈ `TIER_ONE_CITIES`
 * - `plumbing|electrical/{symptom}/{city}` when slug is in the locked Lee monetization grid
 *   (`LEE_MONETIZATION_*` × **10** `LEE_COUNTY_CITIES`)
 */
export function isTierOneDiscoverableStorageSlug(slug: string): boolean {
  const s = enforceStoredSlug(slug).toLowerCase().replace(/\/+/g, "/");
  if (getTierOneExtraSlugsNormalized().has(s)) return true;

  const parts = s.split("/").filter(Boolean);
  if (parts.length === 2) {
    const v = parts[0].toLowerCase();
    const seg = parts[1].toLowerCase();
    if (v === "hvac") return isTierOneHvacCoreSymptom(seg);
    if (v === "plumbing" || v === "electrical") return true;
    return false;
  }

  if (parts.length === 3) {
    const [v, sym, city] = parts.map((p) => p.toLowerCase());
    if (v === "hvac") {
      return isTierOneHvacCoreSymptom(sym) && getTierOneCityStorageSlugs().includes(city);
    }
    if (v === "plumbing" || v === "electrical") {
      return isLeeCountyMonetizationLocalizedSlug(s);
    }
    return false;
  }

  return false;
}

/** Localized trade triplets (`hvac|plumbing|electrical/{sym}/{city}`) index in search only when Tier 1. */
export function isLocalizedTradeTripletEligibleForIndexingRobots(page: { slug?: unknown } | null): boolean {
  if (!page) return false;
  const slug = String(page.slug ?? "");
  if (!isLocalizedPillarPageSlug(slug)) return true;
  return isTierOneDiscoverableStorageSlug(slug);
}

export function tierLinkFilterDisabled(): boolean {
  return process.env.DISABLE_HSD_TIER_LINK_FILTER === "1" || process.env.DISABLE_HSD_TIER_LINK_FILTER === "true";
}

/**
 * Hub / renderer link targets: allow repair, any national trade pillar (2 segments), localized only Tier 1.
 * External URLs pass through.
 */
export function isDiscoverableInternalLinkTarget(raw: string): boolean {
  const t = String(raw ?? "").trim();
  if (!t) return false;
  if (/^https?:\/\//i.test(t)) return true;

  const path = t.replace(/^\/+/, "").split("?")[0].toLowerCase();
  if (!path) return false;
  if (path.startsWith("repair/")) return true;

  const parts = path.split("/").filter(Boolean);
  if (parts.length === 2) {
    const v = parts[0];
    if (v === "hvac" || v === "plumbing" || v === "electrical") return true;
  }
  if (parts.length === 3) {
    return isTierOneDiscoverableStorageSlug(path);
  }
  return false;
}

export function filterTierDiscoveryPaths(paths: readonly string[]): string[] {
  if (tierLinkFilterDisabled()) return [...paths];
  return paths.map((p) => String(p ?? "").trim()).filter((p) => p && isDiscoverableInternalLinkTarget(p));
}

/**
 * When the current city is outside Tier 1, hub `related_symptoms` would otherwise strip to empty.
 * Pad with Tier-1 money URLs (other core symptoms / cities) so the graph still points “up” into the indexable cluster.
 */
export function ensureDiscoverableRelatedSymptoms(
  symptom: string,
  city: string,
  seeds: readonly string[],
  min = 3,
  max = 5,
): string[] {
  if (tierLinkFilterDisabled()) {
    const raw = seeds.map((p) => String(p ?? "").trim()).filter(Boolean);
    return raw.slice(0, max);
  }
  const sym = symptom.trim().toLowerCase();
  const c = city.trim().toLowerCase();
  let out = filterTierDiscoveryPaths(seeds);
  if (out.length >= min) return out.slice(0, max);

  const pool: string[] = [];
  for (const tc of getTierOneCityStorageSlugs()) {
    for (const s of HVAC_CORE_CLUSTER_SYMPTOM_ORDER) {
      if (s === sym && tc === c) continue;
      pool.push(`hvac/${s}/${tc}`);
    }
  }
  for (const p of pool) {
    if (out.includes(p)) continue;
    if (!isDiscoverableInternalLinkTarget(p)) continue;
    out.push(p);
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}

const HUB_LINK_ARRAY_KEYS = [
  "related_symptoms",
  "relatedSymptoms",
  "causes",
  "system_pages",
  "repair_guides",
  "context_pages",
] as const;

/** Mutates `json.internal_links` arrays in place (renderer + generator safe). */
export function filterInternalLinksInPlace(json: Record<string, unknown>): void {
  if (tierLinkFilterDisabled()) return;
  const il = json.internal_links;
  if (!il || typeof il !== "object") return;
  const o = il as Record<string, unknown>;
  for (const k of HUB_LINK_ARRAY_KEYS) {
    const list = o[k];
    if (!Array.isArray(list)) continue;
    o[k] = filterTierDiscoveryPaths(list as string[]);
  }
}

/** `{ href, label }` for on-page “related issues” blocks (humanized symptom title). */
export function tierOneHvacRelatedIssueCardsForCity(cityStorage: string): ReadonlyArray<{ href: string; label: string }> {
  const city = cityStorage.trim().toLowerCase();
  return HVAC_CORE_CLUSTER_SYMPTOM_ORDER.map((sym) => {
    const words = sym.split("-").filter(Boolean);
    const label = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return { href: `/hvac/${sym}/${city}`, label };
  });
}

function repairCitySegmentForTier(cityStorage: string): string {
  const s = String(cityStorage ?? "").trim().toLowerCase();
  const m = s.match(/^(.+)-([a-z]{2})$/);
  return m ? m[1] : s;
}

/** Cross-city Tier-1 context links (replaces long-tail `hvac/{sym}-during-day` paths for discovery hygiene). */
export function crossCityTierOneContextSlugs(symptom: string, currentCity: string): string[] {
  const sym = String(symptom ?? "").trim().toLowerCase();
  const cur = String(currentCity ?? "").trim().toLowerCase();
  const cities = getTierOneCityStorageSlugs().filter((c) => c !== cur);
  const out: string[] = [];
  for (const c of cities.slice(0, 4)) {
    out.push(`hvac/${sym}/${c}`);
  }
  const pillar = `hvac/${sym}`;
  const repairPad = `repair/${repairCitySegmentForTier(cur)}/${sym}`;
  while (out.length < 2) {
    out.push(out.includes(pillar) ? repairPad : pillar);
  }
  return out.slice(0, 4);
}
