-- Migration 005: Schema Improvements for 300K+ Scale
-- Adds system_id to causes, confidence_score to cause junction tables.
-- Run: psql $DATABASE_URL -f scripts/migrations/005-schema-improvements.sql

-- ============================================================
-- 1. Add system_id to causes
-- Some causes belong to specific systems (e.g. bad-run-capacitor vs bad-water-pump)
-- ============================================================
ALTER TABLE causes
  ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES systems(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_causes_system ON causes(system_id);

COMMENT ON COLUMN causes.system_id IS 'Optional: cause may be system-specific (HVAC vs RV vs Marine)';

-- ============================================================
-- 2. Add confidence_score to cause junction tables
-- Enables ranking: most likely cause, secondary cause, rare cause
-- Improves diagnostic quality and SEO.
-- ============================================================

-- symptom_causes
ALTER TABLE symptom_causes
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_symptom_causes_confidence ON symptom_causes(confidence_score);

COMMENT ON COLUMN symptom_causes.confidence_score IS '1.0 = most likely, lower = secondary/rare. Used for ranking.';

-- condition_causes
ALTER TABLE condition_causes
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_condition_causes_confidence ON condition_causes(confidence_score);

COMMENT ON COLUMN condition_causes.confidence_score IS '1.0 = most likely, lower = secondary/rare. Used for ranking.';

-- diagnostic_causes
ALTER TABLE diagnostic_causes
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_diagnostic_causes_confidence ON diagnostic_causes(confidence_score);

COMMENT ON COLUMN diagnostic_causes.confidence_score IS '1.0 = most likely, lower = secondary/rare. Used for ranking.';
