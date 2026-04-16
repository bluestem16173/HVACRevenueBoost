import sql from "@/lib/db";
import { enforceStoredSlug, isIndexable } from "@/lib/slug-utils";
import {
  pagesSlugForLocalizedPillar,
  type ServiceVertical,
} from "@/lib/localized-city-path";

/** Published, indexable row from `pages` for public diagnostic rendering. */
export async function getIndexablePageBySlug(slug: string) {
  try {
    const normalized = enforceStoredSlug(slug);
    const query = await sql`SELECT * FROM pages WHERE slug = ${normalized} LIMIT 1`;
    if (!query?.length) return null;
    const page = query[0] as Record<string, unknown>;
    return isIndexable(page) ? page : null;
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
