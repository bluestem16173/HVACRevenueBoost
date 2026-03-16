-- Migration 012: Fix seed 010 failures
-- Addresses: causes description, repairs description, vehicle_models, parts
-- Run: npm run db:migrate-012

BEGIN;

-- 1. Causes: ensure description exists
ALTER TABLE causes ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Repairs: ensure description, skill_level exist in public schema (DB has public + hvac.repairs)
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS skill_level TEXT;
-- Make cause_id nullable so seed can insert repairs without linking to a cause
ALTER TABLE public.repairs ALTER COLUMN cause_id DROP NOT NULL;

-- 3. Vehicle models: create table (uses SERIAL; no FK to UUID tables)
CREATE TABLE IF NOT EXISTS public.vehicle_models (
  id SERIAL PRIMARY KEY,
  make TEXT,
  model TEXT,
  year_range TEXT,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_models_slug ON vehicle_models(slug);

-- 4. Parts: create with UUID component_id (components uses UUID in this DB)
CREATE TABLE IF NOT EXISTS public.parts (
  id SERIAL PRIMARY KEY,
  component_id UUID REFERENCES components(id) ON DELETE SET NULL,
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

COMMIT;
