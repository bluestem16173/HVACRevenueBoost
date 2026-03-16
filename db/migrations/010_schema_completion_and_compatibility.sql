-- Migration 010: Schema Completion and Compatibility
-- DecisionGrid + HVAC Revenue Boost
-- Creates missing tables referenced by code. Idempotent, non-destructive.
-- Run: npx tsx scripts/run-migration-010.ts (or psql $DATABASE_URL -f ...)
--
-- Resolves: generation_queue, diagnostics, diagnostic_steps, cities, tools,
--           components, internal_links, related_nodes, + SEO expansion tables

BEGIN;

-- =============================================================================
-- PART 1: CORE TABLES REQUIRED BY CODE
-- =============================================================================

-- 1. generation_queue (workers, lib/db, city-generator)
CREATE TABLE IF NOT EXISTS generation_queue (
  id SERIAL PRIMARY KEY,
  page_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  proposed_slug TEXT NOT NULL,
  proposed_title TEXT,
  system_id INTEGER REFERENCES systems(id) ON DELETE SET NULL,
  symptom_id INTEGER REFERENCES symptoms(id) ON DELETE SET NULL,
  condition_id INTEGER REFERENCES conditions(id) ON DELETE SET NULL,
  cause_id INTEGER REFERENCES causes(id) ON DELETE SET NULL,
  repair_id INTEGER REFERENCES repairs(id) ON DELETE SET NULL,
  city TEXT,
  page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_generation_queue_status ON generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_generation_queue_page_type ON generation_queue(page_type);
CREATE INDEX IF NOT EXISTS idx_generation_queue_proposed_slug ON generation_queue(proposed_slug);

-- 2. diagnostics (diagnostic-steps API, sitemap, graph-link-builder)
CREATE TABLE IF NOT EXISTS diagnostics (
  id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(id) ON DELETE SET NULL,
  symptom_id INTEGER REFERENCES symptoms(id) ON DELETE SET NULL,
  condition_id INTEGER REFERENCES conditions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  summary TEXT,
  confidence_score INTEGER,
  mermaid_graph TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_diagnostics_slug ON diagnostics(slug);
CREATE INDEX IF NOT EXISTS idx_diagnostics_symptom_id ON diagnostics(symptom_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_condition_id ON diagnostics(condition_id);

-- 3. diagnostic_steps (diagnostic-steps API)
CREATE TABLE IF NOT EXISTS diagnostic_steps (
  id SERIAL PRIMARY KEY,
  diagnostic_id INTEGER NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  question TEXT,
  instruction TEXT,
  yes_target_slug TEXT,
  no_target_slug TEXT,
  yes_cause_slug TEXT,
  no_cause_slug TEXT,
  answer_yes_next_step INTEGER,
  answer_no_next_step INTEGER,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_diagnostic_id ON diagnostic_steps(diagnostic_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_step ON diagnostic_steps(diagnostic_id, step_order);

-- 4. cities (lead API, city-generator) - compatibility with locations
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  state_code TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  population INTEGER,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_state_code ON cities(state_code);

-- 5. tools (lib/db getToolsFromDB)
CREATE TABLE IF NOT EXISTS tools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  typical_price_range TEXT,
  affiliate_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);

-- 6. components (graph-link-builder)
CREATE TABLE IF NOT EXISTS components (
  id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_components_slug ON components(slug);
CREATE INDEX IF NOT EXISTS idx_components_system_id ON components(system_id);

-- 7. internal_links (seo-linking, build-links)
CREATE TABLE IF NOT EXISTS internal_links (
  id SERIAL PRIMARY KEY,
  source_slug TEXT NOT NULL,
  target_slug TEXT NOT NULL,
  anchor_text TEXT,
  link_reason TEXT,
  link_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_internal_links_source_slug ON internal_links(source_slug);
CREATE INDEX IF NOT EXISTS idx_internal_links_target_slug ON internal_links(target_slug);
CREATE INDEX IF NOT EXISTS idx_internal_links_link_reason ON internal_links(link_reason);
CREATE UNIQUE INDEX IF NOT EXISTS idx_internal_links_unique ON internal_links(source_slug, target_slug, link_reason);

-- 8. related_nodes (link-engine, build-related-graph)
CREATE TABLE IF NOT EXISTS related_nodes (
  id SERIAL PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id TEXT,
  source_slug TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  target_slug TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  score NUMERIC DEFAULT 1,
  is_bidirectional BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_related_nodes_source_slug ON related_nodes(source_slug);
CREATE INDEX IF NOT EXISTS idx_related_nodes_target_slug ON related_nodes(target_slug);
CREATE INDEX IF NOT EXISTS idx_related_nodes_relation_type ON related_nodes(relation_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_related_nodes_unique ON related_nodes(source_slug, target_slug, relation_type);

-- =============================================================================
-- PART 2: SEO EXPANSION TABLES
-- =============================================================================

-- 9. environments (contextual modifiers)
CREATE TABLE IF NOT EXISTS environments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_environments_slug ON environments(slug);

-- 10. vehicle_models (RV/equipment expansion)
CREATE TABLE IF NOT EXISTS vehicle_models (
  id SERIAL PRIMARY KEY,
  make TEXT,
  model TEXT,
  year_range TEXT,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vehicle_models_slug ON vehicle_models(slug);

-- 11. parts (affiliate monetization)
CREATE TABLE IF NOT EXISTS parts (
  id SERIAL PRIMARY KEY,
  component_id INTEGER REFERENCES components(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  manufacturer TEXT,
  affiliate_url TEXT,
  price_range TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parts_slug ON parts(slug);
CREATE INDEX IF NOT EXISTS idx_parts_component_id ON parts(component_id);

-- 12. diagnostic_paths (troubleshooting flows)
CREATE TABLE IF NOT EXISTS diagnostic_paths (
  id SERIAL PRIMARY KEY,
  symptom_id INTEGER REFERENCES symptoms(id) ON DELETE SET NULL,
  condition_id INTEGER REFERENCES conditions(id) ON DELETE SET NULL,
  probability NUMERIC,
  confidence_score NUMERIC,
  diagnostic_flow JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_diagnostic_paths_symptom_id ON diagnostic_paths(symptom_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_paths_condition_id ON diagnostic_paths(condition_id);

-- 13. link_graph (internal linking engine)
CREATE TABLE IF NOT EXISTS link_graph (
  id SERIAL PRIMARY KEY,
  source_page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL,
  target_page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL,
  link_strength INTEGER DEFAULT 1,
  relationship TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_link_graph_source ON link_graph(source_page_id);
CREATE INDEX IF NOT EXISTS idx_link_graph_target ON link_graph(target_page_id);

-- =============================================================================
-- PART 3: RELATION TABLES (cause_components for graph-link-builder)
-- =============================================================================

CREATE TABLE IF NOT EXISTS cause_components (
  cause_id INTEGER NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
  component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cause_id, component_id)
);
CREATE INDEX IF NOT EXISTS idx_cause_components_cause_id ON cause_components(cause_id);
CREATE INDEX IF NOT EXISTS idx_cause_components_component_id ON cause_components(component_id);

-- condition_diagnostics (graph-link-builder: diagnostics ↔ conditions)
CREATE TABLE IF NOT EXISTS condition_diagnostics (
  condition_id INTEGER NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  diagnostic_id INTEGER NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (condition_id, diagnostic_id)
);
CREATE INDEX IF NOT EXISTS idx_condition_diagnostics_condition_id ON condition_diagnostics(condition_id);
CREATE INDEX IF NOT EXISTS idx_condition_diagnostics_diagnostic_id ON condition_diagnostics(diagnostic_id);

-- repair_components (graph-link-builder)
CREATE TABLE IF NOT EXISTS repair_components (
  repair_id INTEGER NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
  component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (repair_id, component_id)
);
CREATE INDEX IF NOT EXISTS idx_repair_components_repair_id ON repair_components(repair_id);
CREATE INDEX IF NOT EXISTS idx_repair_components_component_id ON repair_components(component_id);

-- =============================================================================
-- PART 4: CITIES BACKFILL FROM LOCATIONS (safe, skips if locations missing)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    INSERT INTO cities (city, state, slug, country, created_at, updated_at)
    SELECT l.city, l.state, l.slug, 'US', NOW(), NOW()
    FROM locations l
    WHERE NOT EXISTS (SELECT 1 FROM cities c WHERE c.slug = l.slug);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- ignore if columns mismatch
END $$;

-- =============================================================================
-- PART 5: LEADS TABLE COMPATIBILITY (lead API expects first_name, city_slug, etc.)
-- =============================================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city_slug TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS system_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS issue_description TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS urgency TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_contact_time TEXT;

-- =============================================================================
-- PART 6: SYMPTOM_CAUSES confidence_score (graph-link-builder ORDER BY)
-- =============================================================================

ALTER TABLE symptom_causes ADD COLUMN IF NOT EXISTS confidence_score NUMERIC;

-- =============================================================================
-- PART 7: ADD MISSING INDEXES (idempotent)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_symptoms_slug ON symptoms(slug);
CREATE INDEX IF NOT EXISTS idx_conditions_slug ON conditions(slug);
CREATE INDEX IF NOT EXISTS idx_causes_slug ON causes(slug);
CREATE INDEX IF NOT EXISTS idx_repairs_slug ON repairs(slug);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

COMMIT;
