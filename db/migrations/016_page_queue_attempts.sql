-- page_queue: track claim/generation attempts (increment when status → generating).
-- Run: npx tsx scripts/run-migration-016.ts

BEGIN;

ALTER TABLE public.page_queue
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;

COMMIT;
