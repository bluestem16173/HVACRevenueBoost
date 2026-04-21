import {
  isLeeCountyMonetizationLocalizedSlug,
  LEE_MONETIZATION_ELECTRICAL_SYMPTOMS,
} from "@/lib/homeservice/leeCountyInitialMonetizationCluster";
import { enforceStoredSlug } from "@/lib/slug-utils";
import { LEE_COUNTY_CITIES, LEE_COUNTY_CROSS_CITY_HUB } from "@/lib/vertical-hub-shared";

/** Hub anchor for Related graphs on all Lee County localized electrical pages (skipped on this URL). */
export const ELECTRICAL_LEE_RELATED_ANCHOR = "electrical/breaker-keeps-tripping/fort-myers-fl";

function crossCityTailForSlug(symptom: string, city: string, pageSlugLower: string): string {
  const hub = LEE_COUNTY_CROSS_CITY_HUB.toLowerCase();
  const c = city.toLowerCase();
  const anchor = ELECTRICAL_LEE_RELATED_ANCHOR.toLowerCase();
  const ordered = [...LEE_COUNTY_CITIES].map((x) => x.toLowerCase());
  const prefer = c === hub ? ordered.find((x) => x !== hub) ?? "cape-coral-fl" : hub;
  const candidates = [
    prefer,
    ...ordered.filter((x) => x !== c && x !== prefer),
  ];
  for (const t of candidates) {
    const path = enforceStoredSlug(`electrical/${symptom}/${t}`).toLowerCase();
    if (path !== anchor && path !== pageSlugLower) return t;
  }
  return prefer;
}

/**
 * Deterministic `internal_links.related_symptoms` (3–5 paths) for
 * `electrical/{symptom}/{city}` in the locked Lee monetization grid.
 *
 * Includes {@link ELECTRICAL_LEE_RELATED_ANCHOR} unless the current page is that URL.
 */
export function electricalLeeMonetizationRelatedSymptoms(storageSlug: string): string[] | null {
  const slug = enforceStoredSlug(storageSlug).toLowerCase();
  if (!isLeeCountyMonetizationLocalizedSlug(slug)) return null;
  const parts = slug.split("/").filter(Boolean);
  if (parts.length !== 3 || parts[0] !== "electrical") return null;

  const symptom = parts[1]!;
  const city = parts[2]!.toLowerCase();

  const lateralSymptoms = LEE_MONETIZATION_ELECTRICAL_SYMPTOMS.filter(
    (s) => s !== symptom && s !== "breaker-keeps-tripping"
  );
  const lateralPaths = lateralSymptoms
    .map((s) => enforceStoredSlug(`electrical/${s}/${city}`).toLowerCase())
    .filter((p) => p !== slug)
    .map((p) => enforceStoredSlug(p));

  const pillar = enforceStoredSlug(`electrical/${symptom}`);
  const crossTail = crossCityTailForSlug(symptom, city, slug);
  const crossPath = enforceStoredSlug(`electrical/${symptom}/${crossTail}`);

  const anchor = ELECTRICAL_LEE_RELATED_ANCHOR.toLowerCase();
  const needLaterals = slug === anchor ? 3 : 2;

  const out: string[] = [];
  if (slug !== anchor) out.push(ELECTRICAL_LEE_RELATED_ANCHOR);
  out.push(...lateralPaths.slice(0, needLaterals));
  out.push(pillar);
  out.push(crossPath);

  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const raw of out) {
    const p = enforceStoredSlug(raw).toLowerCase();
    if (!p || seen.has(p) || p === slug) continue;
    seen.add(p);
    uniq.push(enforceStoredSlug(raw));
  }

  return uniq.slice(0, 5);
}
