-- Migration 009: Align existing schema for 008 compatibility
-- Adds locations (mirrors cities) and location_id so 008 indexes can apply.
-- Run before or instead of 008 on existing UUID/cities schema.
--
-- Why: 008 uses locations + location_id. Existing DB has cities + city_id.
-- This migration bridges the gap without breaking existing data.

-- Locations table (mirrors cities for 008 compatibility)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  metro_area TEXT,
  population INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);
CREATE INDEX IF NOT EXISTS idx_locations_state_city ON locations(state, city);

-- Populate locations from cities (idempotent)
INSERT INTO locations (id, city, state, slug, population)
SELECT id, city, state, slug, population FROM cities
ON CONFLICT (id) DO NOTHING;

-- Add location_id to contractor_locations (008 expects this)
ALTER TABLE contractor_locations ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE CASCADE;
UPDATE contractor_locations cl SET location_id = cl.city_id
WHERE cl.location_id IS NULL AND cl.city_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM locations l WHERE l.id = cl.city_id);
CREATE INDEX IF NOT EXISTS idx_contractor_locations_location_id ON contractor_locations(location_id);

-- Add location_id to page_targets (008 expects this; we have city_id)
ALTER TABLE page_targets ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
UPDATE page_targets pt SET location_id = pt.city_id
WHERE pt.location_id IS NULL AND pt.city_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM locations l WHERE l.id = pt.city_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_location_id ON page_targets(location_id);

-- Add location_id to leads (008 expects this; we have city_slug)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
UPDATE leads l SET location_id = c.id
FROM cities c
WHERE l.location_id IS NULL AND l.city_slug = c.slug;
CREATE INDEX IF NOT EXISTS idx_leads_location_id ON leads(location_id);
