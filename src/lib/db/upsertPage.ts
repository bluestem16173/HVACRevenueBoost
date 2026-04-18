import sql from "@/lib/db";
import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import { serializePageContentJson } from "@/lib/db/upsertHsdV2CitySymptomPage";

/**
 * Full row payload to persist: `slug` / `title` columns plus entire object as `content_json`
 * (typical: return value of `generateHsdPage` from `src/lib/ai/generateHsdPage.ts`).
 */
export type UpsertPageInput = Record<string, unknown> & {
  slug: string;
  title: string;
};

/**
 * Upsert a published **hsd_v2** `city_symptom` row (`pages` table, Neon `sql` tag).
 * `content_json` is the serialized `page` object (must include valid contract fields).
 *
 * @remarks Do **not** interpolate a raw object as `${page}` for `content_json` — bind a
 * JSON **string** and cast with `::jsonb` (see {@link serializePageContentJson}).
 */
export async function upsertPage(page: UpsertPageInput): Promise<void> {
  const contentJson = serializePageContentJson(page);

  await sql`
    INSERT INTO pages (
      slug,
      title,
      content_json,
      schema_version,
      status,
      page_type
    )
    VALUES (
      ${page.slug},
      ${page.title},
      ${contentJson}::jsonb,
      ${HSD_V2_SCHEMA_VERSION},
      'published',
      'city_symptom'
    )
    ON CONFLICT (slug)
    DO UPDATE SET
      title = EXCLUDED.title,
      content_json = EXCLUDED.content_json,
      schema_version = ${HSD_V2_SCHEMA_VERSION},
      status = 'published',
      page_type = 'city_symptom',
      updated_at = NOW()
  `;
}
