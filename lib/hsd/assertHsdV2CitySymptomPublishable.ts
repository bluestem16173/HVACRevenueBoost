import { finalizeHsdV25Page } from "@/lib/hsd/finalizeHsdPage";
import { enforceStoredSlug } from "@/lib/slug-utils";

/**
 * Publish gate: {@link finalizeHsdV25Page} (schema + cleanup + content rules) + row slug match.
 * Strips non-schema envelope keys before finalize, then merges them back for storage.
 */
export function assertHsdV2CitySymptomPublishable(slug: string, contentJson: unknown): Record<string, unknown> {
  if (contentJson === null || typeof contentJson !== "object") {
    throw new Error(`${slug}: content_json must be an object`);
  }
  const o = { ...(contentJson as Record<string, unknown>) };
  const related_links = o.related_links;
  const city = o.city;
  const symptom = o.symptom;
  const vertical = o.vertical;
  delete o.related_links;
  delete o.city;
  delete o.symptom;
  delete o.vertical;

  const finalized = finalizeHsdV25Page(o);
  const out: Record<string, unknown> = { ...finalized };
  if (related_links !== undefined) out.related_links = related_links;
  if (city !== undefined) out.city = city;
  if (symptom !== undefined) out.symptom = symptom;
  if (vertical !== undefined) out.vertical = vertical;

  const row = enforceStoredSlug(slug);
  const jsonSlug = enforceStoredSlug(String(finalized.slug));
  if (jsonSlug && jsonSlug !== row) {
    throw new Error(`${slug}: content_json.slug "${jsonSlug}" must match row slug "${row}"`);
  }
  return out;
}
