-- Migration 011: Seed Schema Compatibility
-- Ensures columns and constraints exist for 010_seed_initial_knowledge_graph
-- Run before: npm run db:seed-010
-- Idempotent: ADD COLUMN IF NOT EXISTS, CREATE UNIQUE INDEX IF NOT EXISTS

BEGIN;

-- Causes: ensure description exists
ALTER TABLE causes ADD COLUMN IF NOT EXISTS description TEXT;

-- Repairs: ensure description, skill_level exist (008 uses difficulty; some schemas use skill_level)
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS skill_level TEXT;
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS difficulty TEXT;

-- Cities: ensure state_code for seed
ALTER TABLE cities ADD COLUMN IF NOT EXISTS state_code TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS country TEXT;

-- Tools: ensure typical_price_range for seed (optional)
ALTER TABLE tools ADD COLUMN IF NOT EXISTS typical_price_range TEXT;

-- Vehicle models: create if missing (010 should have created it)
CREATE TABLE IF NOT EXISTS vehicle_models (
  id SERIAL PRIMARY KEY,
  make TEXT,
  model TEXT,
  year_range TEXT,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_models_slug ON vehicle_models(slug);

-- Parts: create if missing (seed Phase 9 needs it)
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

-- Pages: index_status for crawl safety (Authority Hub / expansion rule)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS index_status TEXT;

COMMIT;
