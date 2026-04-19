import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import { isHsdV1LockedJson } from "@/lib/hsd/isHsdV1LockedJson";

/** Legacy marker still seen in some `content_json` envelopes. */
export const HSD_V1_LOCKED_SCHEMA_LEGACY = "hsd_v1_locked" as const;

/**
 * Whether this row should use {@link HSDPage} (`hsd_v2` | `hsd_v1_locked` markers, or v1 locked shape).
 * Pass `schemaFromRowOrJson` = coalesce of `pages.schema_version` and `content_json.schema_version`.
 */
export function isHsdPageEnvelope(schemaFromRowOrJson: string, content: unknown): boolean {
  const s = String(schemaFromRowOrJson ?? "").trim().toLowerCase();
  if (s === HSD_V2_SCHEMA_VERSION) return true;
  if (s === HSD_V1_LOCKED_SCHEMA_LEGACY) return true;
  return isHsdV1LockedJson(content);
}
