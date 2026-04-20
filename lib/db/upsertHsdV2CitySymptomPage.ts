import sql from "@/lib/db";
import { assertHsdV26AuthorityRules } from "@/lib/hsd/assertHsdV26AuthorityRules";
import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import { HSDV25Schema } from "@/lib/validation/hsdV25Schema";

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
 * Published **hsd_v2** `content_json` row (`page_type` **`hsd`** — canonical HSD authority engine).
 */
export async function upsertHsdV2CitySymptomPage(input: UpsertHsdV2CitySymptomPageInput): Promise<void> {
  const parsed = HSDV25Schema.safeParse(input.contentJson);
  if (!parsed.success) {
    throw new Error(
      `upsertHsdV2CitySymptomPage: invalid HSD payload — ${parsed.error.issues[0]?.message ?? parsed.error.message}`
    );
  }
  assertHsdV26AuthorityRules(parsed.data);

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
      'hsd'
    )
    ON CONFLICT (slug)
    DO UPDATE SET
      title = EXCLUDED.title,
      content_json = EXCLUDED.content_json,
      schema_version = ${HSD_V2_SCHEMA_VERSION},
      status = 'published',
      page_type = 'hsd',
      updated_at = NOW()
  `;
}
