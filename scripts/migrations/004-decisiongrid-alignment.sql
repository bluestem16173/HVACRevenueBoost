-- Migration 004: DecisionGrid Knowledge Graph Alignment
-- Aligns HVAC Revenue Boost with DecisionGrid schema for shared data model.
-- Run: psql $DATABASE_URL -f scripts/migrations/004-decisiongrid-alignment.sql
--
-- Graph: System → Symptom → Condition → Diagnostic → Cause → Repair → Component

-- ============================================================
-- STEP 1: Core Entity Tables
-- ============================================================

-- Systems (HVAC types)
CREATE TABLE IF NOT EXISTS systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_systems_slug ON systems(slug);

-- Symptoms (observable problems)
CREATE TABLE IF NOT EXISTS symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_symptoms_system ON symptoms(system_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_slug ON symptoms(slug);

-- Conditions (pattern-applied symptoms)
CREATE TABLE IF NOT EXISTS conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conditions_system ON conditions(system_id);
CREATE INDEX IF NOT EXISTS idx_conditions_slug ON conditions(slug);

-- Diagnostics (manual diagnostic paths)
CREATE TABLE IF NOT EXISTS diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostics_system ON diagnostics(system_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_slug ON diagnostics(slug);

-- Diagnostic Steps (wizard flow logic)
CREATE TABLE IF NOT EXISTS diagnostic_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id UUID REFERENCES diagnostics(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  question TEXT NOT NULL,
  yes_target_slug TEXT,
  no_target_slug TEXT,
  yes_cause_slug TEXT,
  no_cause_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_steps_diagnostic ON diagnostic_steps(diagnostic_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_diagnostic_steps_unique ON diagnostic_steps(diagnostic_id, step_order);

-- Causes (root causes)
CREATE TABLE IF NOT EXISTS causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_causes_slug ON causes(slug);

-- Repairs (resolve causes)
CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  estimated_cost TEXT,
  skill_level TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_repairs_slug ON repairs(slug);

-- Components (parts involved in repairs)
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_components_slug ON components(slug);

-- ============================================================
-- STEP 2: Multiplier Context Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS environment_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  population INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);

CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  trade TEXT,
  city_slug TEXT REFERENCES cities(slug) ON DELETE SET NULL,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contractors_city ON contractors(city_slug);

-- ============================================================
-- STEP 3: Graph Junction Tables (Directed Edges)
-- ============================================================

-- Symptom ↔ Condition
CREATE TABLE IF NOT EXISTS symptom_conditions (
  symptom_id UUID REFERENCES symptoms(id) ON DELETE CASCADE,
  condition_id UUID REFERENCES conditions(id) ON DELETE CASCADE,
  PRIMARY KEY (symptom_id, condition_id)
);
CREATE INDEX IF NOT EXISTS idx_symptom_conditions_symptom ON symptom_conditions(symptom_id);
CREATE INDEX IF NOT EXISTS idx_symptom_conditions_condition ON symptom_conditions(condition_id);

-- Symptom ↔ Cause (direct)
CREATE TABLE IF NOT EXISTS symptom_causes (
  symptom_id UUID REFERENCES symptoms(id) ON DELETE CASCADE,
  cause_id UUID REFERENCES causes(id) ON DELETE CASCADE,
  PRIMARY KEY (symptom_id, cause_id)
);
CREATE INDEX IF NOT EXISTS idx_symptom_causes_symptom ON symptom_causes(symptom_id);
CREATE INDEX IF NOT EXISTS idx_symptom_causes_cause ON symptom_causes(cause_id);

-- Condition ↔ Cause
CREATE TABLE IF NOT EXISTS condition_causes (
  condition_id UUID REFERENCES conditions(id) ON DELETE CASCADE,
  cause_id UUID REFERENCES causes(id) ON DELETE CASCADE,
  PRIMARY KEY (condition_id, cause_id)
);
CREATE INDEX IF NOT EXISTS idx_condition_causes_condition ON condition_causes(condition_id);
CREATE INDEX IF NOT EXISTS idx_condition_causes_cause ON condition_causes(cause_id);

-- Condition ↔ Diagnostic
CREATE TABLE IF NOT EXISTS condition_diagnostics (
  condition_id UUID REFERENCES conditions(id) ON DELETE CASCADE,
  diagnostic_id UUID REFERENCES diagnostics(id) ON DELETE CASCADE,
  PRIMARY KEY (condition_id, diagnostic_id)
);
CREATE INDEX IF NOT EXISTS idx_condition_diagnostics_condition ON condition_diagnostics(condition_id);
CREATE INDEX IF NOT EXISTS idx_condition_diagnostics_diagnostic ON condition_diagnostics(diagnostic_id);

-- Diagnostic ↔ Cause
CREATE TABLE IF NOT EXISTS diagnostic_causes (
  diagnostic_id UUID REFERENCES diagnostics(id) ON DELETE CASCADE,
  cause_id UUID REFERENCES causes(id) ON DELETE CASCADE,
  PRIMARY KEY (diagnostic_id, cause_id)
);
CREATE INDEX IF NOT EXISTS idx_diagnostic_causes_diagnostic ON diagnostic_causes(diagnostic_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_causes_cause ON diagnostic_causes(cause_id);

-- Cause ↔ Repair
CREATE TABLE IF NOT EXISTS cause_repairs (
  cause_id UUID REFERENCES causes(id) ON DELETE CASCADE,
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  PRIMARY KEY (cause_id, repair_id)
);
CREATE INDEX IF NOT EXISTS idx_cause_repairs_cause ON cause_repairs(cause_id);
CREATE INDEX IF NOT EXISTS idx_cause_repairs_repair ON cause_repairs(repair_id);

-- Repair ↔ Component
CREATE TABLE IF NOT EXISTS repair_components (
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  component_id UUID REFERENCES components(id) ON DELETE CASCADE,
  PRIMARY KEY (repair_id, component_id)
);
CREATE INDEX IF NOT EXISTS idx_repair_components_repair ON repair_components(repair_id);
CREATE INDEX IF NOT EXISTS idx_repair_components_component ON repair_components(component_id);

-- ============================================================
-- STEP 4: Ensure pages, generation_queue, leads exist
-- ============================================================

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  content_json JSONB,
  system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
  symptom_id UUID REFERENCES symptoms(id) ON DELETE SET NULL,
  condition_id UUID REFERENCES conditions(id) ON DELETE SET NULL,
  diagnostic_id UUID REFERENCES diagnostics(id) ON DELETE SET NULL,
  cause_id UUID REFERENCES causes(id) ON DELETE SET NULL,
  repair_id UUID REFERENCES repairs(id) ON DELETE SET NULL,
  component_id UUID REFERENCES components(id) ON DELETE SET NULL,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_page_type ON pages(page_type);

CREATE TABLE IF NOT EXISTS generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  proposed_slug TEXT NOT NULL,
  proposed_title TEXT,
  system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
  symptom_id UUID REFERENCES symptoms(id) ON DELETE SET NULL,
  condition_id UUID REFERENCES conditions(id) ON DELETE SET NULL,
  cause_id UUID REFERENCES causes(id) ON DELETE SET NULL,
  repair_id UUID REFERENCES repairs(id) ON DELETE SET NULL,
  city TEXT,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generation_queue_status ON generation_queue(status);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  zip_code TEXT,
  system_type TEXT,
  issue_description TEXT,
  urgency TEXT,
  preferred_contact_time TEXT,
  symptom_id UUID REFERENCES symptoms(id) ON DELETE SET NULL,
  city_slug TEXT REFERENCES cities(slug) ON DELETE SET NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city_slug);
