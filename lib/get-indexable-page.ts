import sql from "@/lib/db";
import { enforceStoredSlug, isIndexable } from "@/lib/slug-utils";
import {
  pagesSlugForLocalizedPillar,
  parseLocalizedStorageSlug,
  type ServiceVertical,
} from "@/lib/localized-city-path";

/**
 * Default city segment appended when only a national pillar row is requested
 * but the DB holds `{vertical}/{pillar}/{city}`. Swap for per-request geo / vendor routing later.
 */
const DEFAULT_FALLBACK_LOCATION_SLUG = "tampa-fl";

/** Published, indexable row from `pages` for public diagnostic rendering. */
export async function getIndexablePageBySlug(slug: string) {
  try {
    const normalized = enforceStoredSlug(slug);
    if (!normalized) return null;

    const locationSlug = DEFAULT_FALLBACK_LOCATION_SLUG;
    const localizedSuffix = `/${locationSlug}`;
    const alreadyAnyLocalizedPillar = parseLocalizedStorageSlug(normalized) !== null;
    const alreadyThisLocation =
      normalized.toLowerCase().endsWith(localizedSuffix.toLowerCase());
    const tampaVariant =
      alreadyAnyLocalizedPillar || alreadyThisLocation
        ? null
        : `${normalized}/${locationSlug}`;

    console.log("QUERY SLUG:", normalized, tampaVariant);

    const query = tampaVariant
      ? await sql`
          SELECT * FROM pages
          WHERE slug = ${normalized} OR slug = ${tampaVariant}
          ORDER BY CASE WHEN slug = ${normalized} THEN 0 ELSE 1 END
          LIMIT 1
        `
      : await sql`SELECT * FROM pages WHERE slug = ${normalized} LIMIT 1`;
    if (!query?.length) {
      console.log("QUERY SLUG: no matching row", { normalized, tampaVariant });
      return null;
    }
    const page = query[0] as Record<string, unknown>;
    if (!isIndexable(page)) {
      console.log("QUERY SLUG: row rejected by isIndexable", {
        normalized,
        tampaVariant,
        slug: page.slug,
        page_type: page.page_type,
        status: page.status,
      });
      return null;
    }
    return page;
  } catch {
    return null;
  }
}

/**
 * Localized route: prefer `pages.slug` = `{vertical}/{symptom}/{city}` (page_queue / HSD),
 * else fall back to national pillar `{symptom}`.
 */
export async function getIndexablePageForLocalizedRoute(
  vertical: ServiceVertical,
  symptom: string,
  city: string
) {
  const composite = pagesSlugForLocalizedPillar(vertical, symptom, city);
  let page = await getIndexablePageBySlug(composite);
  if (!page) page = await getIndexablePageBySlug(enforceStoredSlug(symptom));
  return page;
}
