-- Migration 008: HVAC Revenue Boost / DecisionGrid Shared Graph Schema
-- Scalable knowledge graph + page generation + lead routing
-- Uses SERIAL IDs. Best for FRESH database.
-- WARNING: Existing DB uses UUID (004/007). Running this may conflict.
-- Run: npm run db:migrate-008

BEGIN;

-- ---------------------------------------------------------
-- Optional utility: updated_at trigger
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------
-- Core knowledge graph tables
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS systems (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS symptoms (
  id SERIAL PRIMARY KEY,
  system_id INTEGER NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conditions (
  id SERIAL PRIMARY KEY,
  system_id INTEGER NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS causes (
  id SERIAL PRIMARY KEY,
  system_id INTEGER NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repairs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  difficulty TEXT,
  estimated_cost_low INTEGER,
  estimated_cost_high INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT repairs_cost_check CHECK (
    estimated_cost_low IS NULL
    OR estimated_cost_high IS NULL
    OR estimated_cost_low <= estimated_cost_high
  )
);

-- ---------------------------------------------------------
-- Relationship tables
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS symptom_causes (
  symptom_id INTEGER NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
  cause_id INTEGER NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (symptom_id, cause_id)
);

CREATE TABLE IF NOT EXISTS symptom_conditions (
  symptom_id INTEGER NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
  condition_id INTEGER NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (symptom_id, condition_id)
);

CREATE TABLE IF NOT EXISTS condition_causes (
  condition_id INTEGER NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  cause_id INTEGER NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (condition_id, cause_id)
);

CREATE TABLE IF NOT EXISTS cause_repairs (
  cause_id INTEGER NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
  repair_id INTEGER NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cause_id, repair_id)
);

-- ---------------------------------------------------------
-- Monetization / lead routing
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  metro_area TEXT,
  population INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contractors (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  slug TEXT UNIQUE,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  service_radius_miles INTEGER,
  lead_price_cents INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contractors_service_radius_check CHECK (
    service_radius_miles IS NULL OR service_radius_miles >= 0
  ),
  CONSTRAINT contractors_lead_price_check CHECK (
    lead_price_cents IS NULL OR lead_price_cents >= 0
  )
);

CREATE TABLE IF NOT EXISTS contractor_locations (
  contractor_id INTEGER NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (contractor_id, location_id)
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  contractor_id INTEGER REFERENCES contractors(id) ON DELETE SET NULL,
  location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  system_id INTEGER REFERENCES systems(id) ON DELETE SET NULL,
  symptom_id INTEGER REFERENCES symptoms(id) ON DELETE SET NULL,
  condition_id INTEGER REFERENCES conditions(id) ON DELETE SET NULL,
  cause_id INTEGER REFERENCES causes(id) ON DELETE SET NULL,

  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  postal_code TEXT,
  message TEXT,

  status TEXT NOT NULL DEFAULT 'new',
  source TEXT DEFAULT 'organic',
  urgency TEXT,
  assigned_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT leads_status_check CHECK (
    status IN ('new', 'assigned', 'contacted', 'qualified', 'won', 'lost', 'spam')
  ),
  CONSTRAINT leads_urgency_check CHECK (
    urgency IS NULL OR urgency IN ('low', 'medium', 'high', 'emergency')
  )
);

-- ---------------------------------------------------------
-- Page targeting / generation queue
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS page_targets (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL,

  system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,
  symptom_id INTEGER REFERENCES symptoms(id) ON DELETE CASCADE,
  condition_id INTEGER REFERENCES conditions(id) ON DELETE CASCADE,
  cause_id INTEGER REFERENCES causes(id) ON DELETE CASCADE,
  repair_id INTEGER REFERENCES repairs(id) ON DELETE CASCADE,
  location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,

  parent_target_id INTEGER REFERENCES page_targets(id) ON DELETE SET NULL,

  priority_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  authority_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  monetization_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  search_intent_score NUMERIC(10,2) NOT NULL DEFAULT 0,

  generation_status TEXT NOT NULL DEFAULT 'pending',
  refresh_interval_days INTEGER NOT NULL DEFAULT 180,
  last_generated_at TIMESTAMPTZ,
  next_refresh_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT page_targets_status_check CHECK (
    generation_status IN ('pending', 'queued', 'generating', 'generated', 'failed', 'stale', 'skipped')
  ),
  CONSTRAINT page_targets_page_type_check CHECK (
    page_type IN (
      'system',
      'symptom',
      'symptom_condition',
      'cause',
      'repair',
      'diagnostic',
      'location_hub',
      'component',
      'comparison',
      'service',
      'faq_cluster'
    )
  ),
  CONSTRAINT page_targets_refresh_interval_check CHECK (
    refresh_interval_days > 0
  )
);

-- ---------------------------------------------------------
-- Generated page artifacts
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  page_target_id INTEGER REFERENCES page_targets(id) ON DELETE SET NULL,

  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL,

  system_id INTEGER REFERENCES systems(id) ON DELETE SET NULL,
  symptom_id INTEGER REFERENCES symptoms(id) ON DELETE SET NULL,
  condition_id INTEGER REFERENCES conditions(id) ON DELETE SET NULL,
  cause_id INTEGER REFERENCES causes(id) ON DELETE SET NULL,
  repair_id INTEGER REFERENCES repairs(id) ON DELETE SET NULL,

  title TEXT,
  meta_title TEXT,
  meta_description TEXT,

  content JSONB NOT NULL,
  schema_json JSONB,

  confidence_score INTEGER,
  estimated_repair_cost_low INTEGER,
  estimated_repair_cost_high INTEGER,

  content_hash TEXT,
  prompt_version TEXT,
  model_name TEXT,

  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pages_confidence_check CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)
  ),
  CONSTRAINT pages_cost_check CHECK (
    estimated_repair_cost_low IS NULL
    OR estimated_repair_cost_high IS NULL
    OR estimated_repair_cost_low <= estimated_repair_cost_high
  )
);

CREATE TABLE IF NOT EXISTS page_generation_runs (
  id SERIAL PRIMARY KEY,
  page_target_id INTEGER NOT NULL REFERENCES page_targets(id) ON DELETE CASCADE,
  created_page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL,

  model_name TEXT,
  prompt_version TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  error_message TEXT,

  token_input INTEGER,
  token_output INTEGER,
  generation_time_ms INTEGER,

  raw_response JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT page_generation_runs_status_check CHECK (
    status IN ('queued', 'running', 'success', 'failed', 'validation_failed')
  ),
  CONSTRAINT page_generation_runs_token_input_check CHECK (
    token_input IS NULL OR token_input >= 0
  ),
  CONSTRAINT page_generation_runs_token_output_check CHECK (
    token_output IS NULL OR token_output >= 0
  ),
  CONSTRAINT page_generation_runs_time_check CHECK (
    generation_time_ms IS NULL OR generation_time_ms >= 0
  )
);

-- ---------------------------------------------------------
-- Uniqueness constraints
-- ---------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uq_symptoms_system_name
  ON symptoms(system_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS uq_conditions_system_name
  ON conditions(system_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS uq_causes_system_name
  ON causes(system_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS uq_repairs_name
  ON repairs(name);

CREATE UNIQUE INDEX IF NOT EXISTS uq_locations_city_state
  ON locations(city, state);

-- ---------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_systems_slug ON systems(slug);

CREATE INDEX IF NOT EXISTS idx_symptoms_slug ON symptoms(slug);
CREATE INDEX IF NOT EXISTS idx_symptoms_system_id ON symptoms(system_id);

CREATE INDEX IF NOT EXISTS idx_conditions_slug ON conditions(slug);
CREATE INDEX IF NOT EXISTS idx_conditions_system_id ON conditions(system_id);

CREATE INDEX IF NOT EXISTS idx_causes_slug ON causes(slug);
CREATE INDEX IF NOT EXISTS idx_causes_system_id ON causes(system_id);

CREATE INDEX IF NOT EXISTS idx_repairs_slug ON repairs(slug);

CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);
CREATE INDEX IF NOT EXISTS idx_locations_state_city ON locations(state, city);

CREATE INDEX IF NOT EXISTS idx_contractors_active ON contractors(active);
CREATE INDEX IF NOT EXISTS idx_contractors_city_state ON contractors(state, city);
CREATE INDEX IF NOT EXISTS idx_contractor_locations_location_id ON contractor_locations(location_id);

CREATE INDEX IF NOT EXISTS idx_symptom_causes_symptom_id ON symptom_causes(symptom_id);
CREATE INDEX IF NOT EXISTS idx_symptom_causes_cause_id ON symptom_causes(cause_id);

CREATE INDEX IF NOT EXISTS idx_symptom_conditions_symptom_id ON symptom_conditions(symptom_id);
CREATE INDEX IF NOT EXISTS idx_symptom_conditions_condition_id ON symptom_conditions(condition_id);

CREATE INDEX IF NOT EXISTS idx_condition_causes_condition_id ON condition_causes(condition_id);
CREATE INDEX IF NOT EXISTS idx_condition_causes_cause_id ON condition_causes(cause_id);

CREATE INDEX IF NOT EXISTS idx_cause_repairs_cause_id ON cause_repairs(cause_id);
CREATE INDEX IF NOT EXISTS idx_cause_repairs_repair_id ON cause_repairs(repair_id);

CREATE INDEX IF NOT EXISTS idx_leads_location_id ON leads(location_id);
CREATE INDEX IF NOT EXISTS idx_leads_contractor_id ON leads(contractor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_symptom_condition ON leads(symptom_id, condition_id);

CREATE INDEX IF NOT EXISTS idx_page_targets_slug ON page_targets(slug);
CREATE INDEX IF NOT EXISTS idx_page_targets_status ON page_targets(generation_status);
CREATE INDEX IF NOT EXISTS idx_page_targets_priority ON page_targets(priority_score DESC, id ASC);
CREATE INDEX IF NOT EXISTS idx_page_targets_page_type ON page_targets(page_type);
CREATE INDEX IF NOT EXISTS idx_page_targets_system_id ON page_targets(system_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_symptom_id ON page_targets(symptom_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_condition_id ON page_targets(condition_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_cause_id ON page_targets(cause_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_repair_id ON page_targets(repair_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_location_id ON page_targets(location_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_next_refresh_at ON page_targets(next_refresh_at);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_page_target_id ON pages(page_target_id);
CREATE INDEX IF NOT EXISTS idx_pages_page_type ON pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pages_symptom_id ON pages(symptom_id);
CREATE INDEX IF NOT EXISTS idx_pages_condition_id ON pages(condition_id);
CREATE INDEX IF NOT EXISTS idx_pages_cause_id ON pages(cause_id);
CREATE INDEX IF NOT EXISTS idx_pages_repair_id ON pages(repair_id);
CREATE INDEX IF NOT EXISTS idx_pages_published_at ON pages(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_generation_runs_target_id ON page_generation_runs(page_target_id);
CREATE INDEX IF NOT EXISTS idx_page_generation_runs_status ON page_generation_runs(status);
CREATE INDEX IF NOT EXISTS idx_page_generation_runs_created_page_id ON page_generation_runs(created_page_id);
CREATE INDEX IF NOT EXISTS idx_page_generation_runs_created_at ON page_generation_runs(created_at DESC);

-- ---------------------------------------------------------
-- Updated_at triggers
-- ---------------------------------------------------------

DROP TRIGGER IF EXISTS trg_contractors_set_updated_at ON contractors;
CREATE TRIGGER trg_contractors_set_updated_at
BEFORE UPDATE ON contractors
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_leads_set_updated_at ON leads;
CREATE TRIGGER trg_leads_set_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_page_targets_set_updated_at ON page_targets;
CREATE TRIGGER trg_page_targets_set_updated_at
BEFORE UPDATE ON page_targets
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_pages_set_updated_at ON pages;
CREATE TRIGGER trg_pages_set_updated_at
BEFORE UPDATE ON pages
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

COMMIT;
