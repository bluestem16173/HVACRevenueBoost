-- page_queue: dedicated HSD / city diagnostic job table (product name "page_queue").
-- Status flow: pending → generating → done | failed
-- Run: npx tsx scripts/run-migration-015.ts

BEGIN;

CREATE TABLE IF NOT EXISTS public.page_queue (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'city_symptom',
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  last_error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT page_queue_status_check CHECK (
    status IN ('pending', 'generating', 'done', 'failed')
  ),
  CONSTRAINT page_queue_priority_check CHECK (
    priority IN ('high', 'medium', 'low')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_page_queue_slug_unique ON public.page_queue (slug);

CREATE INDEX IF NOT EXISTS idx_page_queue_status_priority ON public.page_queue (status, priority, id);

COMMIT;
