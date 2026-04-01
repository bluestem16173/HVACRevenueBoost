import sql from "@/lib/db";
import { QueueStatus } from "@/lib/queue-status";

/** Reset a failed job back to draft for another worker pass (use with care). */
export async function resetJobForRetry(jobId: number) {
  await sql`
    UPDATE generation_queue
    SET status = ${QueueStatus.DRAFT}, last_error = NULL
    WHERE id = ${jobId}
  `;
}
