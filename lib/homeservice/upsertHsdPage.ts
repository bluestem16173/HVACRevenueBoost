import sql from "@/lib/db";
import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import { enforceStoredSlug } from "@/lib/slug-utils";
import { canonicalLocalizedStorageSlug } from "@/lib/localized-city-path";

/** Must satisfy `pages.page_type` check constraint (same as {@link upsertPageFromHsdCityJson}). */
const allowedPageTypes = new Set([
  "city_symptom",
  "hsd",
  "national_symptom",
  "repair",
  "guide",
  "landing",
]);

function inferCityColumn(slug: string): string | null {
  const parts = enforceStoredSlug(slug).split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && /-fl$|-tx$|-az$/i.test(last)) return last;
  return null;
}

export type UpsertHsdPageJob = { slug: string; page_type: string };

/**
 * Persist finalized **`hsd_v2`** diagnostic JSON to `pages` without DG-v2 envelope validation
 * (`summary_30s` is structured for HSD, not a DG string).
 */
export async function upsertHsdPage(job: UpsertHsdPageJob, json: Record<string, unknown>): Promise<void> {
  const cleanSlug = canonicalLocalizedStorageSlug(job.slug);
  const title = String(json.title || "Untitled");
  const dbPageType = allowedPageTypes.has(job.page_type) ? job.page_type : "hsd";
  const city = inferCityColumn(job.slug);
  json.slug = cleanSlug;
  json.schema_version = HSD_V2_SCHEMA_VERSION;

  await sql`
    INSERT INTO pages (
      slug,
      content_json,
      content_html,
      status,
      quality_status,
      page_type,
      title,
      city,
      schema_version,
      noindex,
      updated_at
    )
    VALUES (
      ${cleanSlug},
      ${JSON.stringify(json)}::jsonb,
      ${null},
      'published',
      'approved',
      ${dbPageType},
      ${title},
      ${city},
      ${HSD_V2_SCHEMA_VERSION},
      ${false},
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      page_type = EXCLUDED.page_type,
      status = EXCLUDED.status,
      quality_status = EXCLUDED.quality_status,
      content_json = EXCLUDED.content_json,
      content_html = EXCLUDED.content_html,
      schema_version = EXCLUDED.schema_version,
      city = COALESCE(EXCLUDED.city, pages.city),
      noindex = false,
      updated_at = NOW()
  `;
}
