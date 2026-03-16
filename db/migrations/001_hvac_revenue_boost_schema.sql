-- Migration 001: HVAC Revenue Boost Scalable Schema (Production)
-- For 50k–500k pages: Knowledge graph stored ONCE, locations render dynamically.
-- Content page: ac-not-cooling-outdoor-unit-running
-- Renders as: /tampa/ac-not-cooling-outdoor-unit-running, /phoenix/..., /dallas/...
--
-- Run on fresh DB: psql $DATABASE_URL -f db/migrations/001_hvac_revenue_boost_schema.sql
-- NOTE: Existing schema uses UUID. This migration uses SERIAL for greenfield deployments.

-- ============================================================
-- KNOWLEDGE GRAPH (global, stored once)
-- ============================================================

CREATE TABLE IF NOT EXISTS systems (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_systems_slug ON systems(slug);

CREATE TABLE IF NOT EXISTS symptoms (
  id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_symptoms_slug ON symptoms(slug);
CREATE INDEX IF NOT EXISTS idx_symptoms_system_id ON symptoms(system_id);

CREATE TABLE IF NOT EXISTS conditions (
  id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conditions_slug ON conditions(slug);
CREATE INDEX IF NOT EXISTS idx_conditions_system_id ON conditions(system_id);

CREATE TABLE IF NOT EXISTS causes (
  id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_causes_slug ON causes(slug);
CREATE INDEX IF NOT EXISTS idx_causes_system_id ON causes(system_id);

CREATE TABLE IF NOT EXISTS repairs (
  id SERIAL PRIMARY KEY,
  cause_id INTEGER REFERENCES causes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  difficulty TEXT,
  estimated_cost_low INTEGER,
  estimated_cost_high INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_repairs_slug ON repairs(slug);
CREATE INDEX IF NOT EXISTS idx_repairs_cause_id ON repairs(cause_id);

-- ============================================================
-- RELATIONSHIP TABLES (junction)
-- ============================================================

CREATE TABLE IF NOT EXISTS symptom_causes (
  symptom_id INTEGER REFERENCES symptoms(id) ON DELETE CASCADE,
  cause_id INTEGER REFERENCES causes(id) ON DELETE CASCADE,
  PRIMARY KEY (symptom_id, cause_id)
);
CREATE INDEX IF NOT EXISTS idx_symptom_causes_symptom ON symptom_causes(symptom_id);
CREATE INDEX IF NOT EXISTS idx_symptom_causes_cause ON symptom_causes(cause_id);

CREATE TABLE IF NOT EXISTS symptom_conditions (
  symptom_id INTEGER REFERENCES symptoms(id) ON DELETE CASCADE,
  condition_id INTEGER REFERENCES conditions(id) ON DELETE CASCADE,
  PRIMARY KEY (symptom_id, condition_id)
);
CREATE INDEX IF NOT EXISTS idx_symptom_conditions_symptom ON symptom_conditions(symptom_id);
CREATE INDEX IF NOT EXISTS idx_symptom_conditions_condition ON symptom_conditions(condition_id);

CREATE TABLE IF NOT EXISTS condition_causes (
  condition_id INTEGER REFERENCES conditions(id) ON DELETE CASCADE,
  cause_id INTEGER REFERENCES causes(id) ON DELETE CASCADE,
  PRIMARY KEY (condition_id, cause_id)
);
CREATE INDEX IF NOT EXISTS idx_condition_causes_condition ON condition_causes(condition_id);
CREATE INDEX IF NOT EXISTS idx_condition_causes_cause ON condition_causes(cause_id);

CREATE TABLE IF NOT EXISTS cause_repairs (
  cause_id INTEGER REFERENCES causes(id) ON DELETE CASCADE,
  repair_id INTEGER REFERENCES repairs(id) ON DELETE CASCADE,
  PRIMARY KEY (cause_id, repair_id)
);
CREATE INDEX IF NOT EXISTS idx_cause_repairs_cause ON cause_repairs(cause_id);
CREATE INDEX IF NOT EXISTS idx_cause_repairs_repair ON cause_repairs(repair_id);

-- ============================================================
-- SEO + LEAD GENERATION LAYER
-- ============================================================

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  population INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);

CREATE TABLE IF NOT EXISTS contractors (
  id SERIAL PRIMARY KEY,
  company_name TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  service_radius INTEGER,
  lead_price INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  contractor_id INTEGER REFERENCES contractors(id),
  location_id INTEGER REFERENCES locations(id),
  symptom_id INTEGER REFERENCES symptoms(id),
  condition_id INTEGER REFERENCES conditions(id),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_location ON leads(location_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- ============================================================
-- PAGES (AI content storage — knowledge only, NO city)
-- Slug: ac-not-cooling-outdoor-unit-running (not tampa-ac-not-cooling)
-- City pages render dynamically by combining location + page slug
-- ============================================================

CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE,
  system_id INTEGER REFERENCES systems(id) ON DELETE SET NULL,
  symptom_id INTEGER REFERENCES symptoms(id) ON DELETE SET NULL,
  condition_id INTEGER REFERENCES conditions(id) ON DELETE SET NULL,
  page_type TEXT,
  content JSONB,
  confidence_score INTEGER,
  estimated_repair_cost_low INTEGER,
  estimated_repair_cost_high INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_symptom ON pages(symptom_id);
