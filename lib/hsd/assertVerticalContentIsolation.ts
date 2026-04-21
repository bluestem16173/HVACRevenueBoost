import type { ServiceVertical } from "@/lib/localized-city-path";
import { enforceStoredSlug } from "@/lib/slug-utils";

/** Substrings that must not appear in serialized **electrical** HSD JSON before publish. */
export const ELECTRICAL_PUBLISH_FORBIDDEN_SUBSTRINGS = [
  "refrigerant",
  "compressor",
  "airflow",
  "evaporator",
  "coil",
  "tank",
  "sediment",
] as const;

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

/** First forbidden substring found, or `null` if none. */
export function electricalPublishGuardHit(content: string): string | null {
  const lc = content.toLowerCase();
  for (const word of ELECTRICAL_PUBLISH_FORBIDDEN_SUBSTRINGS) {
    if (lc.includes(word)) return word;
  }
  return null;
}

export function assertVerticalContentIsolation(storageSlug: string, content: string): void {
  const vertical = verticalFromStorageSlug(storageSlug);
  if (!vertical) return;

  if (vertical === "electrical") {
    if (/refrigerant|compressor|airflow/i.test(content)) {
      throw new Error("HVAC contamination");
    }
    const hit = electricalPublishGuardHit(content);
    if (hit) {
      throw new Error(`Bad electrical content: ${hit}`);
    }
  }

  if (vertical === "plumbing") {
    if (content.toLowerCase().includes("compressor")) {
      throw new Error(
        `assertVerticalContentIsolation: plumbing page slug "${storageSlug}" must not contain "compressor" (HVAC).`,
      );
    }
  }
}
