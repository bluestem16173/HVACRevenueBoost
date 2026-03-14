-- Migration 002: Full HVAC Diagnostic Graph Schema
-- Pillar → Cluster → Symptom → Condition → Cause → Repair → Component
-- Designed for 100k–300k page scale. Run on Neon Postgres.
--
-- Usage: psql $DATABASE_URL -f scripts/migrations/002-hvac-diagnostic-graph-schema.sql
--
-- Uses schema 'hvac' to avoid conflicts with existing decisiongrid tables.
-- App can migrate to read from hvac.* when ready; current routes stay intact.

CREATE SCHEMA IF NOT EXISTS hvac;

-- ============================================================
-- 1. PILLARS (top-level system domains)
-- ============================================================
CREATE TABLE hvac.pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hvac_pillars_slug ON hvac.pillars(slug);

-- ============================================================
-- 2. CLUSTERS (problem categories under pillars)
-- ============================================================
CREATE TABLE hvac.clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_id UUID REFERENCES hvac.pillars(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hvac_clusters_pillar ON hvac.clusters(pillar_id);
CREATE INDEX idx_hvac_clusters_slug ON hvac.clusters(slug);

-- ============================================================
-- 3. SYMPTOMS (observable problems under clusters)
-- Routes: /diagnose/[slug]
-- ============================================================
CREATE TABLE hvac.symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES hvac.clusters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hvac_symptoms_cluster ON hvac.symptoms(cluster_id);
CREATE INDEX idx_hvac_symptoms_slug ON hvac.symptoms(slug);

-- ============================================================
-- 4. CONDITION PATTERNS (templates for condition generation)
-- Example: {symptom} but unit running, {symptom} upstairs only
-- ============================================================
CREATE TABLE hvac.condition_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  slug_suffix TEXT UNIQUE NOT NULL,
  category TEXT,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hvac_condition_patterns_priority ON hvac.condition_patterns(priority);

-- ============================================================
-- 5. CONDITIONS (pattern-applied symptoms)
-- Routes: /conditions/[slug]
-- ============================================================
CREATE TABLE hvac.conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_id UUID REFERENCES hvac.symptoms(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES hvac.condition_patterns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hvac_conditions_symptom ON hvac.conditions(symptom_id);
CREATE INDEX idx_hvac_conditions_slug ON hvac.conditions(slug);

-- ============================================================
-- 6. CAUSES (root causes, shared across conditions)
-- ============================================================
CREATE TABLE hvac.causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hvac_causes_slug ON hvac.causes(slug);

-- ============================================================
-- 6b. CONDITION ↔ CAUSE (many-to-many)
-- ============================================================
CREATE TABLE hvac.condition_causes (
  condition_id UUID REFERENCES hvac.conditions(id) ON DELETE CASCADE,
  cause_id UUID REFERENCES hvac.causes(id) ON DELETE CASCADE,
  PRIMARY KEY (condition_id, cause_id)
);

CREATE INDEX idx_hvac_condition_causes_condition ON hvac.condition_causes(condition_id);
CREATE INDEX idx_hvac_condition_causes_cause ON hvac.condition_causes(cause_id);

-- ============================================================
-- 7. REPAIRS (resolve causes)
-- Routes: /fix/[slug]
-- ============================================================
CREATE TABLE hvac.repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cause_id UUID REFERENCES hvac.causes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  estimated_cost TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hvac_repairs_cause ON hvac.repairs(cause_id);
CREATE INDEX idx_hvac_repairs_slug ON hvac.repairs(slug);

-- ============================================================
-- 8. COMPONENTS (parts involved in repairs)
-- Routes: /components/[slug]
-- ============================================================
CREATE TABLE hvac.components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hvac_components_slug ON hvac.components(slug);

-- ============================================================
-- 8b. REPAIR ↔ COMPONENT (many-to-many)
-- ============================================================
CREATE TABLE hvac.repair_components (
  repair_id UUID REFERENCES hvac.repairs(id) ON DELETE CASCADE,
  component_id UUID REFERENCES hvac.components(id) ON DELETE CASCADE,
  PRIMARY KEY (repair_id, component_id)
);

CREATE INDEX idx_hvac_repair_components_repair ON hvac.repair_components(repair_id);
CREATE INDEX idx_hvac_repair_components_component ON hvac.repair_components(component_id);

-- ============================================================
-- 9. DIAGNOSTIC TESTS (technician verification procedures)
-- ============================================================
CREATE TABLE hvac.diagnostic_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  steps JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hvac_diagnostic_tests_slug ON hvac.diagnostic_tests(slug);

-- ============================================================
-- 9b. CAUSE ↔ DIAGNOSTIC TEST (many-to-many)
-- ============================================================
CREATE TABLE hvac.cause_diagnostic_tests (
  cause_id UUID REFERENCES hvac.causes(id) ON DELETE CASCADE,
  test_id UUID REFERENCES hvac.diagnostic_tests(id) ON DELETE CASCADE,
  PRIMARY KEY (cause_id, test_id)
);

CREATE INDEX idx_hvac_cause_diagnostic_tests_cause ON hvac.cause_diagnostic_tests(cause_id);
CREATE INDEX idx_hvac_cause_diagnostic_tests_test ON hvac.cause_diagnostic_tests(test_id);

-- ============================================================
-- 10. CITIES (for lead pages)
-- Routes: /repair/{city}/{symptom}
-- Uses public.cities if exists; hvac.cities as fallback/override
-- ============================================================
CREATE TABLE IF NOT EXISTS hvac.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hvac_cities_slug ON hvac.cities(slug);

-- ============================================================
-- VIEWS (convenience for generator)
-- ============================================================

-- Full graph path: cluster → symptom → condition → causes → repairs → components
CREATE OR REPLACE VIEW hvac.graph_full AS
SELECT
  p.slug AS pillar_slug,
  p.name AS pillar_name,
  c.slug AS cluster_slug,
  c.name AS cluster_name,
  s.slug AS symptom_slug,
  s.name AS symptom_name,
  cond.slug AS condition_slug,
  cond.name AS condition_name,
  ca.slug AS cause_slug,
  ca.name AS cause_name,
  r.slug AS repair_slug,
  r.name AS repair_name,
  comp.slug AS component_slug,
  comp.name AS component_name
FROM hvac.pillars p
JOIN hvac.clusters c ON c.pillar_id = p.id
JOIN hvac.symptoms s ON s.cluster_id = c.id
LEFT JOIN hvac.conditions cond ON cond.symptom_id = s.id
LEFT JOIN hvac.condition_causes cc ON cc.condition_id = cond.id
LEFT JOIN hvac.causes ca ON ca.id = cc.cause_id
LEFT JOIN hvac.repairs r ON r.cause_id = ca.id
LEFT JOIN hvac.repair_components rc ON rc.repair_id = r.id
LEFT JOIN hvac.components comp ON comp.id = rc.component_id
ORDER BY p.slug, c.slug, s.slug, cond.slug, ca.slug, r.slug;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON SCHEMA hvac IS 'HVAC Revenue Boost diagnostic knowledge graph. Pillar→Cluster→Symptom→Condition→Cause→Repair→Component.';
COMMENT ON TABLE hvac.pillars IS 'Top-level system domains (e.g. hvac-air-conditioning, hvac-heating-systems)';
COMMENT ON TABLE hvac.clusters IS 'Problem categories grouping symptoms (e.g. ac-not-cooling, weak-airflow)';
COMMENT ON TABLE hvac.symptoms IS 'Observable problems. Routes: /diagnose/[slug]';
COMMENT ON TABLE hvac.condition_patterns IS 'Templates: {symptom} but unit running, {symptom} upstairs only';
COMMENT ON TABLE hvac.conditions IS 'Pattern-applied symptoms. Routes: /conditions/[slug]';
COMMENT ON TABLE hvac.causes IS 'Root causes linking conditions to repairs';
COMMENT ON TABLE hvac.repairs IS 'Repair procedures. Routes: /fix/[slug]';
COMMENT ON TABLE hvac.components IS 'Parts. Routes: /components/[slug]';
