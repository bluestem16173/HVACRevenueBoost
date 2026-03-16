-- Migration 007: Page Targets + Generation Runs (Topic Expansion Layer)
-- ---------------------------------------------------------
-- Adds the missing expansion/queue layer for scalable programmatic SEO.
-- page_targets = canonical list of pages that should exist (roadmap/queue)
-- page_generation_runs = observability for every AI generation attempt
-- pages.page_target_id = links generated artifact back to target
--
-- Run after 004: psql $DATABASE_URL -f db/migrations/007_page_targets_expansion.sql
-- Compatible with UUID-based 004 schema (systems, symptoms, cities, etc.)

-- ============================================================
-- 1. CONTRACTOR_LOCATIONS (many-to-many for scale)
-- ============================================================
CREATE TABLE IF NOT EXISTS contractor_locations (
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  PRIMARY KEY (contractor_id, city_id)
);
CREATE INDEX IF NOT EXISTS idx_contractor_locations_contractor ON contractor_locations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_locations_city ON contractor_locations(city_id);

-- ============================================================
-- 2. PAGE_TARGETS (canonical list of pages to generate)
-- ---------------------------------------------------------
-- Why separate from pages: roadmap vs artifact.
-- page_targets = what should exist (priority, status, refresh)
-- pages = actual generated content
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS page_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  page_type TEXT NOT NULL,

  system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
  symptom_id UUID REFERENCES symptoms(id) ON DELETE SET NULL,
  condition_id UUID REFERENCES conditions(id) ON DELETE SET NULL,
  cause_id UUID REFERENCES causes(id) ON DELETE SET NULL,
  repair_id UUID REFERENCES repairs(id) ON DELETE SET NULL,
  city_id UUID REFERENCES cities(id) ON DELETE SET NULL,

  parent_target_id UUID REFERENCES page_targets(id) ON DELETE SET NULL,

  priority_score NUMERIC(10,2) DEFAULT 0,
  authority_score NUMERIC(10,2) DEFAULT 0,
  monetization_score NUMERIC(10,2) DEFAULT 0,
  search_intent_score NUMERIC(10,2) DEFAULT 0,

  generation_status TEXT NOT NULL DEFAULT 'pending',
  token_input INTEGER,
  token_output INTEGER,
  generation_time_ms INTEGER,
  raw_response JSONB,

  refresh_interval_days INTEGER DEFAULT 180,
  next_refresh_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT page_targets_status_check CHECK (
    generation_status IN ('pending', 'queued', 'running', 'success', 'failed', 'validation_failed')
  ),
  CONSTRAINT page_targets_token_input_check CHECK (
    token_input IS NULL OR token_input >= 0
  ),
  CONSTRAINT page_targets_token_output_check CHECK (
    token_output IS NULL OR token_output >= 0
  ),
  CONSTRAINT page_targets_time_check CHECK (
    generation_time_ms IS NULL OR generation_time_ms >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_page_targets_slug ON page_targets(slug);
CREATE INDEX IF NOT EXISTS idx_page_targets_status ON page_targets(generation_status);
CREATE INDEX IF NOT EXISTS idx_page_targets_priority ON page_targets(priority_score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_page_targets_page_type ON page_targets(page_type);
CREATE INDEX IF NOT EXISTS idx_page_targets_system_id ON page_targets(system_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_symptom_id ON page_targets(symptom_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_condition_id ON page_targets(condition_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_cause_id ON page_targets(cause_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_repair_id ON page_targets(repair_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_city_id ON page_targets(city_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_next_refresh ON page_targets(next_refresh_at);

-- ============================================================
-- 3. PAGE_GENERATION_RUNS (observability + retries)
-- ---------------------------------------------------------
-- Tracks every AI generation attempt: model, tokens, status, created page.
-- Required for: cost tracking, retries, debugging failed generations.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS page_generation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_target_id UUID NOT NULL REFERENCES page_targets(id) ON DELETE CASCADE,
  model_name TEXT,
  prompt_version TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  error_message TEXT,
  token_input INTEGER,
  token_output INTEGER,
  generation_time_ms INTEGER,
  created_page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT page_generation_runs_status_check CHECK (
    status IN ('queued', 'running', 'success', 'failed', 'validation_failed')
  )
);

CREATE INDEX IF NOT EXISTS idx_page_generation_runs_target ON page_generation_runs(page_target_id);
CREATE INDEX IF NOT EXISTS idx_page_generation_runs_status ON page_generation_runs(status);
CREATE INDEX IF NOT EXISTS idx_page_generation_runs_created_page ON page_generation_runs(created_page_id);
CREATE INDEX IF NOT EXISTS idx_page_generation_runs_created_at ON page_generation_runs(created_at DESC);

-- ============================================================
-- 4. PAGES: add page_target_id (links artifact → target)
-- ============================================================
ALTER TABLE pages ADD COLUMN IF NOT EXISTS page_target_id UUID REFERENCES page_targets(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pages_page_target_id ON pages(page_target_id);

-- ============================================================
-- 5. UPDATED_AT trigger helper (if not exists)
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_page_targets_updated_at ON page_targets;
CREATE TRIGGER trg_page_targets_updated_at
  BEFORE UPDATE ON page_targets
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();
