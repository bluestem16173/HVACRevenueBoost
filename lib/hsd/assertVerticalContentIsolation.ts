import type { ServiceVertical } from "@/lib/localized-city-path";
import { enforceStoredSlug } from "@/lib/slug-utils";

/** First path segment when slug is `{vertical}/{pillar}/…`. */
export function verticalFromStorageSlug(slug: string): ServiceVertical | null {
  const head = enforceStoredSlug(slug).split("/").filter(Boolean)[0]?.toLowerCase();
  if (head === "hvac" || head === "plumbing" || head === "electrical") return head;
  return null;
}

/**
 * Blocks cross-trade contamination in serialized HSD JSON before publish.
 * Uses case-insensitive substring checks on the full payload string.
 */
export function assertVerticalContentIsolation(storageSlug: string, content: string): void {
  const vertical = verticalFromStorageSlug(storageSlug);
  if (!vertical) return;

  const lc = content.toLowerCase();

  if (vertical === "electrical") {
    if (lc.includes("refrigerant")) {
      throw new Error(
        `assertVerticalContentIsolation: electrical page slug "${storageSlug}" must not contain "refrigerant" (HVAC).`,
      );
    }
    if (lc.includes("airflow")) {
      throw new Error(
        `assertVerticalContentIsolation: electrical page slug "${storageSlug}" must not contain "airflow" (HVAC).`,
      );
    }
  }

  if (vertical === "plumbing") {
    if (lc.includes("compressor")) {
      throw new Error(
        `assertVerticalContentIsolation: plumbing page slug "${storageSlug}" must not contain "compressor" (HVAC).`,
      );
    }
  }
}
