import { assertHsdV25ContentRules } from "@/lib/hsd/assertHsdV25ContentRules";
import { HSDV25Schema } from "@/src/lib/validation/hsdV25Schema";
import { enforceStoredSlug } from "@/lib/slug-utils";

/**
 * Publish gate: Zod {@link HSDV25Schema} + row slug must match `content_json.slug` when present.
 */
export function assertHsdV2CitySymptomPublishable(slug: string, contentJson: unknown): void {
  const parsed = HSDV25Schema.safeParse(contentJson);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`${slug}: ${msg}`);
  }
  assertHsdV25ContentRules(parsed.data);
  const row = enforceStoredSlug(slug);
  const jsonSlug = enforceStoredSlug(parsed.data.slug);
  if (jsonSlug && jsonSlug !== row) {
    throw new Error(`${slug}: content_json.slug "${jsonSlug}" must match row slug "${row}"`);
  }
}
