import sql from "@/lib/db";
import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";

/** Serialize `content_json` for `::jsonb` binding (object or already-JSON string). */
export function serializePageContentJson(contentJson: unknown): string {
  if (typeof contentJson === "string") return contentJson;
  return JSON.stringify(contentJson ?? {});
}

export type UpsertHsdV2CitySymptomPageInput = {
  slug: string;
  title: string;
  contentJson: unknown;
};

/**
 * Published `city_symptom` row with **hsd_v2** `content_json` (Neon `sql` tag).
 */
export async function upsertHsdV2CitySymptomPage(input: UpsertHsdV2CitySymptomPageInput): Promise<void> {
  const contentJson = serializePageContentJson(input.contentJson);

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
      ${input.slug},
      ${input.title},
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
