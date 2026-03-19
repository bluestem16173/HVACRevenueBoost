-- db/migrations/013_quality_scoring.sql
-- Add Quality Score and State columns to pages and generation_queue

-- Begin transaction handled by the runner
BEGIN;

-- 1. Add quality scoring columns to pages table
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quality_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS quality_notes JSONB,
ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMPTZ;

-- Update existing pages to have published status if they currently have status = 'published'
UPDATE pages 
SET quality_status = 'published', quality_score = 100 
WHERE status = 'published' AND quality_status = 'draft';

-- Create an index to support fast queries by quality status
CREATE INDEX IF NOT EXISTS idx_pages_quality_status ON pages(quality_status);

-- 2. Add exponential backoff/retry column to generation_queue table
ALTER TABLE generation_queue
ADD COLUMN IF NOT EXISTS regeneration_attempts INTEGER DEFAULT 0;

COMMIT;
