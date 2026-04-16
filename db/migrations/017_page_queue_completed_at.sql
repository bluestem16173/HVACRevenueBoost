-- page_queue: timestamp when a job finishes successfully (status = done).
-- Run: npx tsx scripts/run-migration-017.ts

BEGIN;

ALTER TABLE public.page_queue
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMIT;
