/**
 * Generation queue: claim jobs in batches and enforce max queue-level retries.
 */
import sql from "@/lib/db";
import { QueueStatus } from "@/lib/queue-status";

/** Default jobs per worker batch. Override with GENERATION_BATCH_SIZE or QUEUE_BATCH_SIZE. */
export const BATCH_SIZE =
  Number(process.env.GENERATION_BATCH_SIZE ?? process.env.QUEUE_BATCH_SIZE ?? 25) || 25;

export function queueAttemptCount(job: Record<string, unknown>): number {
  const a = job.attempts;
  const r = job.regeneration_attempts;
  if (typeof a === "number" && !Number.isNaN(a)) return a;
  if (typeof r === "number" && !Number.isNaN(r)) return r;
  const n = Number(a ?? r ?? 0);
  return Number.isNaN(n) ? 0 : n;
}

/** Claim up to `batchSize` draft jobs (FIFO). Accepts legacy `pending` rows. */
export async function getQueuedJobs(
  batchSize: number,
  pageType?: string
): Promise<Record<string, unknown>[]> {
  if (pageType) {
    return sql`
      UPDATE generation_queue SET status = ${QueueStatus.GENERATED}
      WHERE id IN (
        SELECT id FROM generation_queue
        WHERE status IN ('draft', 'stale', 'pending', 'queued')
          AND page_type = ${pageType}
          AND COALESCE(attempts, regeneration_attempts, 0) <= 1
        ORDER BY created_at ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      ) RETURNING *;
    ` as Promise<Record<string, unknown>[]>;
  }
  return sql`
    UPDATE generation_queue SET status = ${QueueStatus.GENERATED}
    WHERE id IN (
      SELECT id FROM generation_queue
      WHERE status IN ('draft', 'stale', 'pending', 'queued')
        AND COALESCE(attempts, regeneration_attempts, 0) <= 1
      ORDER BY created_at ASC
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    ) RETURNING *;
  ` as Promise<Record<string, unknown>[]>;
}

/**
 * Read-only peek at the next jobs — does NOT claim or update rows.
 * Use for orchestrator “preview before run” (same ordering/filter as getQueuedJobs).
 */
export async function peekQueuedJobs(
  limit: number,
  pageType?: string
): Promise<Record<string, unknown>[]> {
  const cap = Math.min(50, Math.max(1, limit));
  if (pageType) {
    return sql`
      SELECT id, proposed_slug, proposed_title, page_type, status, city, created_at,
        COALESCE(attempts, regeneration_attempts, 0) AS attempt_count
      FROM generation_queue
      WHERE status IN ('draft', 'stale', 'pending', 'queued')
        AND page_type = ${pageType}
        AND COALESCE(attempts, regeneration_attempts, 0) <= 1
      ORDER BY created_at ASC
      LIMIT ${cap}
    ` as Promise<Record<string, unknown>[]>;
  }
  return sql`
    SELECT id, proposed_slug, proposed_title, page_type, status, city, created_at,
      COALESCE(attempts, regeneration_attempts, 0) AS attempt_count
    FROM generation_queue
    WHERE status IN ('draft', 'stale', 'pending', 'queued')
      AND COALESCE(attempts, regeneration_attempts, 0) <= 1
    ORDER BY created_at ASC
    LIMIT ${cap}
  ` as Promise<Record<string, unknown>[]>;
}

/** Terminal failure — no further automatic retries. */
export async function markFailedPermanent(jobId: number): Promise<void> {
  await sql`
    UPDATE generation_queue
    SET
      status = ${QueueStatus.FAILED},
      last_error = 'max_attempts_exceeded'
    WHERE id = ${jobId}
  `;
}
