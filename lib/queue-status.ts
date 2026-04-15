/**
 * generation_queue lifecycle (app-side; DB stores TEXT — no schema migration required).
 *
 * **Naming note:** some docs call the in-flight step `generating`. In this codebase the
 * worker claim step uses **`generated`** (see `getQueuedJobs` in `lib/generation-queue.ts`).
 *
 * draft       → seeded / waiting for worker (replaces legacy `pending`)
 * generated   → job claimed, worker running (replaces legacy `processing`) — maps to “generating”
 * validated   → validateV2 passed; relational + pages write next
 * published   → job finished successfully (replaces legacy `completed`)
 * failed      → terminal failure
 *
 * Claim queries accept `draft`, `stale`, and legacy `pending` where needed.
 *
 * **pages.status** (separate): worker writes `published` on successful dual-write;
 * `getDiagnosticPageFromDB` still allows published | validated | review for reads.
 */
export const QueueStatus = {
  DRAFT: "draft",
  GENERATED: "generated",
  VALIDATED: "validated",
  PUBLISHED: "published",
  FAILED: "failed",
} as const;

export type QueueStatusValue = (typeof QueueStatus)[keyof typeof QueueStatus];
