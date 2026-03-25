/**
 * Generation queue: claim jobs in batches and enforce max queue-level retries.
 */
import sql from "@/lib/db";

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

/** Claim up to `batchSize` pending jobs (FIFO). Skips rows already over attempt budget. */
export async function getQueuedJobs(
  batchSize: number,
  pageType?: string
): Promise<Record<string, unknown>[]> {
  if (pageType) {
    return sql`
      UPDATE generation_queue SET status = 'processing', updated_at = NOW()
      WHERE id IN (
        SELECT id FROM generation_queue
        WHERE status = 'pending'
          AND page_type = ${pageType}
          AND COALESCE(attempts, regeneration_attempts, 0) <= 1
        ORDER BY created_at ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      ) RETURNING *;
    ` as Promise<Record<string, unknown>[]>;
  }
  return sql`
    UPDATE generation_queue SET status = 'processing', updated_at = NOW()
    WHERE id IN (
      SELECT id FROM generation_queue
      WHERE status = 'pending'
        AND COALESCE(attempts, regeneration_attempts, 0) <= 1
      ORDER BY created_at ASC
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    ) RETURNING *;
  ` as Promise<Record<string, unknown>[]>;
}

/** Terminal failure — no further automatic retries. */
export async function markFailedPermanent(jobId: number): Promise<void> {
  await sql`
    UPDATE generation_queue
    SET
      status = 'failed',
      last_error = 'max_attempts_exceeded',
      updated_at = NOW()
    WHERE id = ${jobId}
  `;
}
