-- Migration 001: Diagnostic Tests + Conditions Layer
-- Extends HVAC diagnostic knowledge graph. Backward compatible.
-- Run with: psql $DATABASE_URL -f scripts/migrations/001-diagnostic-tests-and-conditions.sql

-- ============================================================
-- STEP 1: Diagnostic Tests Table
-- ============================================================
CREATE TABLE IF NOT EXISTS diagnostic_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  test_steps JSONB,
  tools_required TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_tests_slug ON diagnostic_tests(slug);

-- ============================================================
-- STEP 2: Cause-Diagnostic-Tests Join Table
-- ============================================================
CREATE TABLE IF NOT EXISTS cause_diagnostic_tests (
  cause_id UUID REFERENCES causes(id) ON DELETE CASCADE,
  test_id UUID REFERENCES diagnostic_tests(id) ON DELETE CASCADE,
  PRIMARY KEY (cause_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_cause_diagnostic_tests_cause ON cause_diagnostic_tests(cause_id);
CREATE INDEX IF NOT EXISTS idx_cause_diagnostic_tests_test ON cause_diagnostic_tests(test_id);

-- ============================================================
-- STEP 5 (Prepare): Conditions Layer
-- symptom → condition → cause (does not remove symptom_causes)
-- ============================================================
CREATE TABLE IF NOT EXISTS conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID REFERENCES systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS symptom_conditions (
  symptom_id UUID REFERENCES symptoms(id) ON DELETE CASCADE,
  condition_id UUID REFERENCES conditions(id) ON DELETE CASCADE,
  PRIMARY KEY (symptom_id, condition_id)
);

CREATE TABLE IF NOT EXISTS condition_causes (
  condition_id UUID REFERENCES conditions(id) ON DELETE CASCADE,
  cause_id UUID REFERENCES causes(id) ON DELETE CASCADE,
  PRIMARY KEY (condition_id, cause_id)
);

CREATE INDEX IF NOT EXISTS idx_symptom_conditions_symptom ON symptom_conditions(symptom_id);
CREATE INDEX IF NOT EXISTS idx_condition_causes_condition ON condition_causes(condition_id);
