/**
 * Slug normalization and full slug building for pages.
 * Used by canary-batch, generation-worker, generate-save API.
 */

export function normalizeToBaseSlug(proposedSlug: string): string {
  return (proposedSlug || "")
    .toLowerCase()
    .replace(/^(conditions|repair|repairs|causes|diagnose)[/-]/, "")
    .replace(/^diagnose-/, "")
    .replace(/\/+$/, "")
    .trim();
}

export type SlugPageType =
  | "symptom"
  | "diagnose"
  | "topic"
  | "cause"
  | "repair"
  | "system"
  | "component"
  | "symptom_condition"
  | "location_hub"
  | "diagnostic";

export function buildSlug(baseSlug: string, pageType: SlugPageType | string): string {
  const t = (pageType || "").toLowerCase();
  switch (t) {
    case "symptom":
    case "diagnose":
    case "topic":
      return `conditions/${baseSlug}`;
    case "cause":
      return `causes/${baseSlug}`;
    case "repair":
    case "fix":
      return `repairs/${baseSlug}`;
    case "system":
    case "component":
    case "symptom_condition":
    case "condition":
    case "location_hub":
    case "city":
    case "diagnostic":
      return baseSlug;
    default:
      throw new Error(`Invalid page_type: ${pageType}`);
  }
}
