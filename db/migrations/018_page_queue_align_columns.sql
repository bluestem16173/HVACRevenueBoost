-- Align `page_queue` with current worker/seed if the table was created by an older
-- CREATE TABLE IF NOT EXISTS (subsequent 015 runs do not add missing columns).
-- Run: npx tsx scripts/run-migration-018.ts

BEGIN;

ALTER TABLE public.page_queue ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE public.page_queue ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.page_queue ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMIT;
