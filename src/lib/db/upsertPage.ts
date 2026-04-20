import sql from "@/lib/db";
import { assertHsdV26AuthorityRules } from "@/lib/hsd/assertHsdV26AuthorityRules";
import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import { serializePageContentJson } from "@/lib/db/upsertHsdV2CitySymptomPage";
import { HSDV25Schema } from "@/lib/validation/hsdV25Schema";

/**
 * Full row payload to persist: `slug` / `title` columns plus entire object as `content_json`
 * (typical: return value of `generateHsdPage` from `src/lib/ai/generateHsdPage.ts`).
 */
export type UpsertPageInput = Record<string, unknown> & {
  slug: string;
  title: string;
};

/**
 * Upsert a published **hsd_v2** row (`pages` table, Neon `sql` tag). `page_type` may be `hsd` or legacy `city_symptom`.
 * `content_json` is the serialized `page` object (must include valid contract fields).
 *
 * @remarks Do **not** interpolate a raw object as `${page}` for `content_json` — bind a
 * JSON **string** and cast with `::jsonb` (see {@link serializePageContentJson}).
 */
export async function upsertPage(page: UpsertPageInput): Promise<void> {
  const row = page as Record<string, unknown>;
  if (
    row.schema_version === HSD_V2_SCHEMA_VERSION &&
    (row.page_type === "city_symptom" || row.page_type === "hsd")
  ) {
    const parsed = HSDV25Schema.safeParse(page);
    if (!parsed.success) {
      throw new Error(
        `upsertPage: HSD v2 payload failed schema before save — ${parsed.error.issues[0]?.message ?? parsed.error.message}`
      );
    }
    assertHsdV26AuthorityRules(parsed.data);
  }

  const contentJson = serializePageContentJson(page);

  const persistedPageType =
    row.page_type === "hsd" || row.page_type === "city_symptom" ? String(row.page_type) : "city_symptom";

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
      ${persistedPageType}
    )
    ON CONFLICT (slug)
    DO UPDATE SET
      title = EXCLUDED.title,
      content_json = EXCLUDED.content_json,
      schema_version = ${HSD_V2_SCHEMA_VERSION},
      status = 'published',
      page_type = ${persistedPageType},
      updated_at = NOW()
  `;
}
