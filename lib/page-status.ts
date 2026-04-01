/**
 * `pages.status` values — independent from `generation_queue.status`.
 * Never assign queue/job status directly to `pages.status` (they use different lifecycles).
 */
/** Stored in `pages.schema_version` for DG-style HVAC + display-bridge payloads. */
export const SCHEMA_VERSION_V6_DG_HVAC = "v6_dg_hvac_hybrid" as const;

export const PagesStatus = {
  DRAFT: "draft",
  GENERATED: "generated",
  VALIDATED: "validated",
  PUBLISHED: "published",
  FAILED: "failed",
  STALE: "stale",
} as const;

export type PagesStatusValue = (typeof PagesStatus)[keyof typeof PagesStatus];

/** Successful dual-write from the generation worker: always `published` (not queue `published`). */
export function pagesStatusAfterSuccessfulGeneration(): PagesStatusValue {
  return PagesStatus.PUBLISHED;
}
