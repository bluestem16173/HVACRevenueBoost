import sql from "@/lib/db";
import { enforceStoredSlug } from "@/lib/slug-utils";
import type { ServiceVertical } from "@/lib/localized-city-path";
import { pagesSlugForLocalizedPillar } from "@/lib/localized-city-path";

/**
 * Which `pages.slug` values exist as **published** HSD rows (national `vertical/symptom`
 * or localized `vertical/symptom/city`).
 */
export async function publishedSlugsAmong(candidates: string[]): Promise<Set<string>> {
  const clean = [...new Set(candidates.map((c) => enforceStoredSlug(c).toLowerCase()).filter(Boolean))];
  if (!clean.length) return new Set();
  const rows = await sql`
    SELECT slug
    FROM pages
    WHERE status = 'published'
      AND page_type IN ('hsd', 'city_symptom', 'problem_pillar')
      AND slug = ANY(${clean}::text[])
  `;
  return new Set((rows as { slug: string }[]).map((r) => String(r.slug ?? "").toLowerCase()));
}

/** Keep symptom slugs whose **localized** page exists for this city. */
export async function safeRelatedPillarSlugsForCity(
  vertical: ServiceVertical,
  relatedPillarSlugs: readonly string[],
  cityStorageSlug: string
): Promise<string[]> {
  const city = enforceStoredSlug(cityStorageSlug).toLowerCase();
  if (!city) return [];
  const symSet = relatedPillarSlugs.map((s) => String(s ?? "").trim().toLowerCase()).filter(Boolean);
  const candidates = symSet.map((s) => pagesSlugForLocalizedPillar(vertical, s, city).toLowerCase());
  const hit = await publishedSlugsAmong(candidates);
  return symSet.filter((s, i) => hit.has(candidates[i]!));
}

/** Keep symptom slugs whose **national** pillar row exists (`{vertical}/{symptom}`). */
export async function safeRelatedPillarSlugsNational(
  vertical: ServiceVertical,
  relatedPillarSlugs: readonly string[]
): Promise<string[]> {
  const symSet = relatedPillarSlugs.map((s) => String(s ?? "").trim().toLowerCase()).filter(Boolean);
  const candidates = symSet.map((s) => `${vertical}/${s}`.toLowerCase());
  const hit = await publishedSlugsAmong(candidates);
  return symSet.filter((s, i) => hit.has(candidates[i]!));
}

/** City segments that have a published page for this vertical + pillar. */
export async function filterCitySlugsWithPublishedPillar(
  vertical: ServiceVertical,
  pillarSlug: string,
  citySlugs: readonly string[]
): Promise<string[]> {
  const sym = String(pillarSlug ?? "").trim().toLowerCase();
  if (!sym) return [];
  const uniq = [...new Set(citySlugs.map((c) => enforceStoredSlug(c).toLowerCase()).filter(Boolean))];
  const candidates = uniq.map((c) => pagesSlugForLocalizedPillar(vertical, sym, c).toLowerCase());
  const hit = await publishedSlugsAmong(candidates);
  return uniq.filter((c, i) => hit.has(candidates[i]!));
}
