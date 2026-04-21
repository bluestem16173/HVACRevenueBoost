/**
 * Deterministic **linking engine** from `pages.slug` (storage shape, no leading slash).
 *
 * Mirrors SQL shape (PostgreSQL):
 * - `split_part(slug, '/', 1)` → trade (`hvac` | `plumbing` | `electrical`)
 * - `split_part(slug, '/', 2)` → symptom pillar segment
 * - `split_part(slug, '/', 3)` → city storage tail (`{city}-st`, often `*-fl`)
 *
 * Buckets (cluster graph):
 * - **UP (pillar):** `nationalHubSlug` — two-segment `{trade}/{symptom}` (national topic hub).
 * - **SIDEWAYS:** `sameCityPeerSlugs` — other symptoms, **same `{city}`** tail (lateral crawl).
 * - **CROSS-CITY:** `crossGeoSameSymptomSlugs` — same symptom, **other cities** in the grid.
 *
 * Plumbing + electrical + Lee grid use {@link LEE_MONETIZATION_* } × {@link LEE_COUNTY_CITIES}.
 * HVAC localized uses core cluster symptoms × `TIER_ONE_CITIES` for cross-geo.
 */
import type { ServiceVertical } from "@/lib/localized-city-path";
import { HVAC_CORE_CLUSTER_SYMPTOM_ORDER } from "@/lib/homeservice/hsdHvacCoreCluster";
import {
  LEE_MONETIZATION_ELECTRICAL_SYMPTOMS,
  LEE_MONETIZATION_PLUMBING_SYMPTOMS,
} from "@/lib/homeservice/leeCountyInitialMonetizationCluster";
import { getTierOneCityStorageSlugs } from "@/lib/seo/tier-one-discovery";
import { enforceStoredSlug } from "@/lib/slug-utils";
import { LEE_COUNTY_CITIES } from "@/lib/vertical-hub-shared";

const LEE_CITY_SET = new Set(LEE_COUNTY_CITIES.map((c) => c.toLowerCase()));

/** Parsed `{trade}/{symptom}` or `{trade}/{symptom}/{city}` storage slug. */
export type ParsedTradeStorageSlug = {
  trade: ServiceVertical | null;
  symptom: string | null;
  city: string | null;
};

/**
 * Parse trade vertical + symptom (+ optional city) from storage `slug`.
 * Unknown vertical → `trade: null` and symptom/city null.
 */
export function parseTradeStorageSlug(slug: string): ParsedTradeStorageSlug {
  const parts = enforceStoredSlug(slug).split("/").filter(Boolean);
  const v = (parts[0] ?? "").toLowerCase();
  const trade: ServiceVertical | null =
    v === "hvac" || v === "plumbing" || v === "electrical" ? (v as ServiceVertical) : null;
  if (!trade) return { trade: null, symptom: null, city: null };
  if (parts.length === 1) return { trade, symptom: null, city: null };
  if (parts.length === 2) return { trade, symptom: parts[1]!.toLowerCase(), city: null };
  return {
    trade,
    symptom: parts[1]!.toLowerCase(),
    city: parts[2]!.toLowerCase(),
  };
}

export type TradeLocalLinkBuckets = {
  /** A — same city, different symptoms (storage slugs, no leading slash). */
  sameCityPeerSlugs: string[];
  /** B — same symptom, other cities (storage slugs). */
  crossGeoSameSymptomSlugs: string[];
  /** C — national hub (two-segment storage slug). */
  nationalHubSlug: string | null;
};

function peerSymptomsForTrade(trade: ServiceVertical): readonly string[] {
  if (trade === "electrical") return LEE_MONETIZATION_ELECTRICAL_SYMPTOMS;
  if (trade === "plumbing") return LEE_MONETIZATION_PLUMBING_SYMPTOMS;
  return HVAC_CORE_CLUSTER_SYMPTOM_ORDER;
}

function crossGeoCitiesForTrade(trade: ServiceVertical, currentCity: string): readonly string[] {
  if (trade === "plumbing" || trade === "electrical") {
    return LEE_COUNTY_CITIES as unknown as readonly string[];
  }
  return getTierOneCityStorageSlugs().filter((c) => c.toLowerCase() !== currentCity.toLowerCase());
}

/** Plumbing / electrical localized page whose city tail is in the locked Lee grid. */
function isLeeCountyTradeLocal(trade: ServiceVertical, city: string | null): boolean {
  if (trade !== "plumbing" && trade !== "electrical") return false;
  return Boolean(city && LEE_CITY_SET.has(city.toLowerCase()));
}

/**
 * Build A/B/C link targets for a **three-segment** localized trade page.
 * Returns `null` if `slug` is not `{hvac|plumbing|electrical}/{sym}/{city}`.
 *
 * For plumbing/electrical **outside** the Lee city grid, returns **hub only** (`nationalHubSlug`)
 * and empty A/B (caller may fall back to LLM / DB links).
 */
export function buildTradeLocalLinkBuckets(slug: string): TradeLocalLinkBuckets | null {
  const parsed = parseTradeStorageSlug(slug);
  const { trade, symptom, city } = parsed;
  if (!trade || !symptom || !city) return null;

  const nationalHubSlug = `${trade}/${symptom}`;

  let sameCityPeerSlugs: string[] = [];
  let crossGeoSameSymptomSlugs: string[] = [];

  const peers = peerSymptomsForTrade(trade);
  const leeTradeLocal = isLeeCountyTradeLocal(trade, city);

  if (trade === "hvac") {
    sameCityPeerSlugs = peers
      .filter((s) => s !== symptom)
      .map((s) => `${trade}/${s}/${city}`);
  } else if (leeTradeLocal) {
    sameCityPeerSlugs = peers.filter((s) => s !== symptom).map((s) => `${trade}/${s}/${city}`);
  }

  if (trade === "hvac" || leeTradeLocal) {
    const geo = crossGeoCitiesForTrade(trade, city);
    crossGeoSameSymptomSlugs = geo
      .filter((c) => c.toLowerCase() !== city.toLowerCase())
      .map((c) => `${trade}/${symptom}/${c}`);
  }

  return {
    sameCityPeerSlugs,
    crossGeoSameSymptomSlugs,
    nationalHubSlug,
  };
}

/** Public URL path (leading slash) from storage slug. */
export function storageSlugToUrlPath(storageSlug: string): string {
  const s = enforceStoredSlug(storageSlug).replace(/\/+/g, "/");
  if (!s) return "/";
  return `/${s}`;
}
