import sql from "@/lib/db";
import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import { enforceStoredSlug, isIndexable, normalizePagesTableSlugLookup } from "@/lib/slug-utils";
import { pagesSlugForLocalizedPillar, type ServiceVertical } from "@/lib/localized-city-path";

function debugPageSlugLookup(): boolean {
  return process.env.DEBUG_PAGE_SLUG_LOOKUP === "1" || process.env.DEBUG_PAGE_SLUG_LOOKUP === "true";
}

/** Published, indexable row from `pages` for public diagnostic rendering. */
export async function getIndexablePageBySlug(slug: string) {
  try {
    const normalizedSlug = normalizePagesTableSlugLookup(slug);
    if (!normalizedSlug) return null;

    const row = await sql`
      SELECT *
      FROM pages
      WHERE slug = ${normalizedSlug}
      LIMIT 1
    `;

    if (debugPageSlugLookup()) {
      console.log("NORMALIZED:", normalizedSlug);
      console.log("ROWS:", row);
      const fuzzyRows = await sql`
        SELECT slug
        FROM pages
        WHERE slug ILIKE ${`%${normalizedSlug}%`}
      `;
      console.log("FUZZY MATCH:", fuzzyRows);
    }

    if (!row?.length) {
      return null;
    }
    const page = row[0] as Record<string, unknown>;
    if (!isIndexable(page)) {
      return null;
    }
    return page;
  } catch {
    return null;
  }
}

/**
 * `/diagnose/...` joined slug → `pages` row: candidate slugs + **`page_type = 'hsd'`** only.
 */
export async function getIndexablePageForDiagnoseJoinedSlug(rawSlug: string) {
  const base = normalizePagesTableSlugLookup(rawSlug);

  const withVertical = base.startsWith("hvac/") ? base : `hvac/${base}`;

  const candidates = [base, withVertical, `${base}/tampa-fl`, `${withVertical}/tampa-fl`];

  for (const s of candidates) {
    if (!s) continue;
    if (debugPageSlugLookup()) {
      console.log("TRYING:", s);
    }
    const rows = await sql`
      SELECT *
      FROM pages
      WHERE slug = ${s}
        AND page_type = 'hsd'
      LIMIT 1
    `;

    if (rows.length) {
      return rows[0] as Record<string, unknown>;
    }
  }

  return null;
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
  if (page && vertical === "hvac") {
    const pt = String((page as Record<string, unknown>).page_type ?? "");
    const sv = String((page as Record<string, unknown>).schema_version ?? "").trim();
    const allowed =
      pt === "hsd" || (pt === "city_symptom" && sv === HSD_V2_SCHEMA_VERSION);
    if (!allowed) {
      throw new Error(
        `Non-HSD page attempted to render in authority route: page_type=${pt} schema_version=${sv} slug=${composite}`,
      );
    }
  }
  if (!page) page = await getIndexablePageBySlug(enforceStoredSlug(symptom));
  return page;
}
