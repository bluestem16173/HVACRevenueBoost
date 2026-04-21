import sql from "@/lib/db";
import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import {
  canonicalPagesSlugPathKeys,
  enforceStoredSlug,
  isIndexable,
  normalizePagesTableSlugLookup,
} from "@/lib/slug-utils";
import { pagesSlugForLocalizedPillar, type ServiceVertical } from "@/lib/localized-city-path";

function debugPageSlugLookup(): boolean {
  return process.env.DEBUG_PAGE_SLUG_LOOKUP === "1" || process.env.DEBUG_PAGE_SLUG_LOOKUP === "true";
}

/**
 * Exact `pages.slug` — **published** HSD-shaped rows only. No alternate slug fallbacks.
 * Use for `/hvac/...` catch-all so the database row is the single source of truth.
 */
export async function getPageBySlug(fullSlug: string): Promise<Record<string, unknown> | null> {
  try {
    const { withLeading, noLeading } = canonicalPagesSlugPathKeys(fullSlug);
    if (!noLeading) return null;
    const rows = await sql`
      SELECT *
      FROM pages
      WHERE (LOWER(slug) = ${noLeading} OR LOWER(slug) = ${withLeading})
        AND status = 'published'
        AND page_type IN ('hsd', 'city_symptom', 'problem_pillar')
      LIMIT 1
    `;
    if (!rows.length) return null;
    return rows[0] as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Published, indexable row from `pages` for public diagnostic rendering. */
export async function getIndexablePageBySlug(slug: string) {
  try {
    const normalizedSlug = normalizePagesTableSlugLookup(slug);
    if (!normalizedSlug) return null;

    const { withLeading, noLeading } = canonicalPagesSlugPathKeys(normalizedSlug);

    const row = await sql`
      SELECT *
      FROM pages
      WHERE LOWER(slug) = ${noLeading}
         OR LOWER(slug) = ${withLeading}
      LIMIT 1
    `;

    if (debugPageSlugLookup()) {
      console.log("NORMALIZED:", normalizedSlug, "| try:", noLeading, "or", withLeading);
      console.log("ROWS:", row);
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
 * `/hvac/...` joined slug → `pages` row: candidate slugs + published HSD-shaped types
 * (`hsd`, `city_symptom`, **`problem_pillar`** national pillars).
 */
export async function getIndexablePageForDiagnoseJoinedSlug(rawSlug: string) {
  const base = normalizePagesTableSlugLookup(rawSlug);

  /** Legacy diagnose URLs often omit the trade prefix; only then prepend `hvac/`. */
  const withVertical = /^(hvac|plumbing|electrical)\//i.test(base) ? base : `hvac/${base}`;

  const rawCandidates = [base, withVertical, `${base}/tampa-fl`, `${withVertical}/tampa-fl`];
  const candidates = [
    ...new Set(
      rawCandidates.flatMap((c) => {
        if (!c) return [];
        const k = canonicalPagesSlugPathKeys(c);
        return [c, k.noLeading, k.withLeading];
      }),
    ),
  ];

  for (const s of candidates) {
    if (!s) continue;
    const { withLeading, noLeading } = canonicalPagesSlugPathKeys(s);
    if (debugPageSlugLookup()) {
      console.log("TRYING:", noLeading, "|", withLeading);
    }
    const rows = await sql`
      SELECT *
      FROM pages
      WHERE (LOWER(slug) = ${noLeading} OR LOWER(slug) = ${withLeading})
        AND page_type IN ('hsd', 'city_symptom', 'problem_pillar')
        AND status = 'published'
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
 * else fall back to national pillar `{vertical}/{symptom}` (storage shape in `pages`).
 */
export async function getIndexablePageForLocalizedRoute(
  vertical: ServiceVertical,
  symptom: string,
  city: string
) {
  const composite = pagesSlugForLocalizedPillar(
    vertical,
    enforceStoredSlug(symptom).toLowerCase(),
    enforceStoredSlug(city).toLowerCase()
  );
  /**
   * Localized **electrical / plumbing** rows must render when `pages` has a published HSD row,
   * even if {@link isIndexable} would reject them (title heuristics / quality score are for SERP
   * gating — not for returning 404 to users). HVAC keeps the indexability filter on the composite slug.
   */
  let page: Record<string, unknown> | null =
    vertical === "hvac"
      ? await getIndexablePageBySlug(composite)
      : await getPageBySlug(composite);
  if (page && vertical === "hvac") {
    const pt = String((page as Record<string, unknown>).page_type ?? "");
    const sv = String((page as Record<string, unknown>).schema_version ?? "").trim();
    const allowed =
      pt === "hsd" ||
      pt === "problem_pillar" ||
      (pt === "city_symptom" && sv === HSD_V2_SCHEMA_VERSION);
    if (!allowed) {
      throw new Error(
        `Non-HSD page attempted to render in authority route: page_type=${pt} schema_version=${sv} slug=${composite}`,
      );
    }
  }
  if (!page) {
    const nationalSlug = `${vertical}/${enforceStoredSlug(symptom).toLowerCase()}`.replace(/\/+/g, "/");
    page =
      vertical === "hvac"
        ? await getIndexablePageBySlug(nationalSlug)
        : await getPageBySlug(nationalSlug);
  }
  return page;
}
