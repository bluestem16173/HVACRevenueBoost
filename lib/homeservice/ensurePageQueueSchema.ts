/**
 * Idempotent column alignment for `public.page_queue` using the Neon driver.
 * Use when `CREATE TABLE IF NOT EXISTS` skipped a newer definition (older table shape).
 */
import sql from "@/lib/db";

export async function ensurePageQueueSchema(): Promise<void> {
  await sql`ALTER TABLE public.page_queue ADD COLUMN IF NOT EXISTS last_error TEXT`;
  await sql`ALTER TABLE public.page_queue ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE public.page_queue ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`;
}
