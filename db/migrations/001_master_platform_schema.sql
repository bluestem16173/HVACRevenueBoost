-- Migration 001: Master Platform Schema
-- Programmatic SEO + Diagnostic Knowledge Graph + Lead Marketplace
-- DecisionGrid + HVAC Revenue Boost
--
-- IDEMPOTENT: CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS, ADD COLUMN IF NOT EXISTS
-- NEVER drops tables or breaks existing data.
--
-- Run: psql $DATABASE_URL -f db/migrations/001_master_platform_schema.sql

BEGIN;

-- ============================================================
-- UTILITY: set_updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- LAYER 1: DIAGNOSTIC KNOWLEDGE GRAPH
-- ============================================================

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
    estimated_cost_low IS NULL OR estimated_cost_high IS NULL OR estimated_cost_low <= estimated_cost_high
  )
);

CREATE TABLE IF NOT EXISTS components (
  id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction tables
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

-- cause_components: use UUID to match existing 004/007 schema (causes.id, components.id are UUID)
CREATE TABLE IF NOT EXISTS cause_components (
  cause_id UUID NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cause_id, component_id)
);

-- ============================================================
-- LAYER 2: LOCAL SEO (locations, contractors — before page_targets)
-- ============================================================

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  metro_area TEXT,
  population INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  hvac_demand_score INTEGER,
  competition_score INTEGER,
  seo_priority INTEGER,
  contractor_count INTEGER,
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
  CONSTRAINT contractors_service_radius_check CHECK (service_radius_miles IS NULL OR service_radius_miles >= 0),
  CONSTRAINT contractors_lead_price_check CHECK (lead_price_cents IS NULL OR lead_price_cents >= 0)
);

-- contractor_locations: UUID to match existing 007/009 schema
CREATE TABLE IF NOT EXISTS contractor_locations (
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (contractor_id, location_id)
);

-- contractor_services: UUID to match existing contractors
CREATE TABLE IF NOT EXISTS contractor_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LAYER 3: CONTENT GENERATION ENGINE
-- ============================================================

CREATE TABLE IF NOT EXISTS page_targets (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL,

  system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,
  symptom_id INTEGER REFERENCES symptoms(id) ON DELETE CASCADE,
  condition_id INTEGER REFERENCES conditions(id) ON DELETE CASCADE,
  cause_id INTEGER REFERENCES causes(id) ON DELETE CASCADE,
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,

  parent_target_id UUID REFERENCES page_targets(id) ON DELETE SET NULL,

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
  CONSTRAINT page_targets_refresh_interval_check CHECK (refresh_interval_days > 0)
);

CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  page_target_id UUID REFERENCES page_targets(id) ON DELETE SET NULL,

  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL,

  system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
  symptom_id UUID REFERENCES symptoms(id) ON DELETE SET NULL,
  condition_id UUID REFERENCES conditions(id) ON DELETE SET NULL,
  cause_id UUID REFERENCES causes(id) ON DELETE SET NULL,
  repair_id UUID REFERENCES repairs(id) ON DELETE SET NULL,

  title TEXT,
  meta_title TEXT,
  meta_description TEXT,

  content JSONB NOT NULL DEFAULT '{}',
  schema_json JSONB,

  confidence_score INTEGER,
  estimated_repair_cost_low INTEGER,
  estimated_repair_cost_high INTEGER,

  content_hash TEXT,
  prompt_version TEXT,
  model_name TEXT,

  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  avg_position NUMERIC(10,2),
  last_indexed TIMESTAMPTZ,
  refresh_score NUMERIC(5,2),

  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pages_confidence_check CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
  CONSTRAINT pages_cost_check CHECK (
    estimated_repair_cost_low IS NULL OR estimated_repair_cost_high IS NULL OR estimated_repair_cost_low <= estimated_repair_cost_high
  )
);

CREATE TABLE IF NOT EXISTS page_generation_runs (
  id SERIAL PRIMARY KEY,
  page_target_id INTEGER NOT NULL REFERENCES page_targets(id) ON DELETE CASCADE,
  created_page_id UUID REFERENCES pages(id) ON DELETE SET NULL,

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
  CONSTRAINT page_generation_runs_token_input_check CHECK (token_input IS NULL OR token_input >= 0),
  CONSTRAINT page_generation_runs_token_output_check CHECK (token_output IS NULL OR token_output >= 0),
  CONSTRAINT page_generation_runs_time_check CHECK (generation_time_ms IS NULL OR generation_time_ms >= 0)
);

-- ============================================================
-- LAYER 4: LEADS (references pages, contractors, locations)
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
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

  lead_price_cents INTEGER,
  revenue_received_cents INTEGER,
  job_value_estimate INTEGER,
  contractor_response_time_minutes INTEGER,
  closed_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT leads_status_check CHECK (
    status IN ('new', 'assigned', 'contacted', 'qualified', 'won', 'lost', 'spam')
  ),
  CONSTRAINT leads_urgency_check CHECK (
    urgency IS NULL OR urgency IN ('low', 'medium', 'high', 'emergency')
  )
);

-- ============================================================
-- LAYER 3: CONTENT GENERATION ENGINE
-- ============================================================

CREATE TABLE IF NOT EXISTS page_targets (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL,

  system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,
  symptom_id INTEGER REFERENCES symptoms(id) ON DELETE CASCADE,
  condition_id INTEGER REFERENCES conditions(id) ON DELETE CASCADE,
  cause_id INTEGER REFERENCES causes(id) ON DELETE CASCADE,
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,

  parent_target_id UUID REFERENCES page_targets(id) ON DELETE SET NULL,

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
  CONSTRAINT page_targets_refresh_interval_check CHECK (refresh_interval_days > 0)
);

CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  page_target_id UUID REFERENCES page_targets(id) ON DELETE SET NULL,

  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL,

  system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
  symptom_id UUID REFERENCES symptoms(id) ON DELETE SET NULL,
  condition_id UUID REFERENCES conditions(id) ON DELETE SET NULL,
  cause_id UUID REFERENCES causes(id) ON DELETE SET NULL,
  repair_id UUID REFERENCES repairs(id) ON DELETE SET NULL,

  title TEXT,
  meta_title TEXT,
  meta_description TEXT,

  content JSONB NOT NULL DEFAULT '{}',
  schema_json JSONB,

  confidence_score INTEGER,
  estimated_repair_cost_low INTEGER,
  estimated_repair_cost_high INTEGER,

  content_hash TEXT,
  prompt_version TEXT,
  model_name TEXT,

  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  avg_position NUMERIC(10,2),
  last_indexed TIMESTAMPTZ,
  refresh_score NUMERIC(5,2),

  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pages_confidence_check CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
  CONSTRAINT pages_cost_check CHECK (
    estimated_repair_cost_low IS NULL OR estimated_repair_cost_high IS NULL OR estimated_repair_cost_low <= estimated_repair_cost_high
  )
);

CREATE TABLE IF NOT EXISTS page_generation_runs (
  id SERIAL PRIMARY KEY,
  page_target_id INTEGER NOT NULL REFERENCES page_targets(id) ON DELETE CASCADE,
  created_page_id UUID REFERENCES pages(id) ON DELETE SET NULL,

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
  CONSTRAINT page_generation_runs_token_input_check CHECK (token_input IS NULL OR token_input >= 0),
  CONSTRAINT page_generation_runs_token_output_check CHECK (token_output IS NULL OR token_output >= 0),
  CONSTRAINT page_generation_runs_time_check CHECK (generation_time_ms IS NULL OR generation_time_ms >= 0)
);

-- ============================================================
-- LAYER 4: PROGRAMMATIC SEO ENGINE (Snowball)
-- ============================================================

CREATE TABLE IF NOT EXISTS page_patterns (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  template_spec JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS snowball_expansions (
  id SERIAL PRIMARY KEY,
  pattern_id INTEGER REFERENCES page_patterns(id) ON DELETE SET NULL,
  discovered_slug TEXT NOT NULL,
  source_slug TEXT,
  source_type TEXT,
  priority_score NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expansion_queue (
  id SERIAL PRIMARY KEY,
  snowball_expansion_id INTEGER REFERENCES snowball_expansions(id) ON DELETE CASCADE,
  page_target_id UUID REFERENCES page_targets(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pattern_expansion_logs (
  id SERIAL PRIMARY KEY,
  pattern_id INTEGER REFERENCES page_patterns(id) ON DELETE SET NULL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pages_discovered INTEGER DEFAULT 0,
  pages_queued INTEGER DEFAULT 0,
  details JSONB
);

-- ============================================================
-- LAYER 5: AUTHORITY CLUSTERS
-- ============================================================

CREATE TABLE IF NOT EXISTS topic_clusters (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  pillar_slug TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cluster_pages (
  id SERIAL PRIMARY KEY,
  cluster_id INTEGER NOT NULL REFERENCES topic_clusters(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  page_type TEXT,
  slug TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LAYER 6: INTERNAL LINK AUTHORITY
-- ============================================================

CREATE TABLE IF NOT EXISTS page_links (
  id SERIAL PRIMARY KEY,
  source_page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  target_page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  anchor_text TEXT,
  link_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_rules (
  id SERIAL PRIMARY KEY,
  source_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  rule_spec JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_graph (
  id SERIAL PRIMARY KEY,
  source_slug TEXT NOT NULL,
  target_slug TEXT NOT NULL,
  anchor_text TEXT,
  link_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LAYER 7: SEO INTELLIGENCE
-- ============================================================

CREATE TABLE IF NOT EXISTS gsc_queries (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  page_slug TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  position NUMERIC(10,2),
  ctr NUMERIC(5,4),
  report_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gsc_page_metrics (
  id SERIAL PRIMARY KEY,
  page_slug TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  avg_position NUMERIC(10,2),
  report_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keyword_opportunities (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  difficulty INTEGER,
  intent TEXT,
  status TEXT DEFAULT 'pending',
  page_target_id UUID REFERENCES page_targets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS serp_competitors (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  competitor_url TEXT,
  competitor_title TEXT,
  position INTEGER,
  report_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_gaps (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  suggested_page_type TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS index_status (
  id SERIAL PRIMARY KEY,
  page_slug TEXT NOT NULL,
  indexed BOOLEAN DEFAULT FALSE,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LAYER 8: ANALYTICS & REPORTING
-- ============================================================

CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  page_slug TEXT,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,
  dwell_seconds INTEGER,
  scroll_percent INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_events (
  id SERIAL PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id SERIAL PRIMARY KEY,
  model_name TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cost_estimate NUMERIC(10,6),
  run_id UUID REFERENCES page_generation_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_site_reports (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  report_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_contractor_reports (
  id SERIAL PRIMARY KEY,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  leads_received INTEGER DEFAULT 0,
  leads_won INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS traffic_forecasts (
  id SERIAL PRIMARY KEY,
  page_slug TEXT,
  forecast_date DATE NOT NULL,
  predicted_impressions INTEGER,
  predicted_clicks INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES (idempotent)
-- ============================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES pages(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES systems(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS condition_id UUID REFERENCES conditions(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cause_id UUID REFERENCES causes(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_price_cents INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS revenue_received_cents INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_value_estimate INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contractor_response_time_minutes INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS closed_reason TEXT;

ALTER TABLE locations ADD COLUMN IF NOT EXISTS hvac_demand_score INTEGER;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS competition_score INTEGER;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS seo_priority INTEGER;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS contractor_count INTEGER;

ALTER TABLE pages ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS avg_position NUMERIC(10,2);
ALTER TABLE pages ADD COLUMN IF NOT EXISTS last_indexed TIMESTAMPTZ;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS refresh_score NUMERIC(5,2);
ALTER TABLE pages ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- page_targets may lack condition_id, location_id (007 used city_id)
ALTER TABLE page_targets ADD COLUMN IF NOT EXISTS condition_id UUID REFERENCES conditions(id) ON DELETE CASCADE;
ALTER TABLE page_targets ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE CASCADE;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_systems_slug ON systems(slug);

CREATE INDEX IF NOT EXISTS idx_symptoms_slug ON symptoms(slug);
CREATE INDEX IF NOT EXISTS idx_symptoms_system_id ON symptoms(system_id);

CREATE INDEX IF NOT EXISTS idx_conditions_slug ON conditions(slug);
CREATE INDEX IF NOT EXISTS idx_conditions_system_id ON conditions(system_id);

CREATE INDEX IF NOT EXISTS idx_causes_slug ON causes(slug);
CREATE INDEX IF NOT EXISTS idx_causes_system_id ON causes(system_id);

CREATE INDEX IF NOT EXISTS idx_repairs_slug ON repairs(slug);

CREATE INDEX IF NOT EXISTS idx_components_slug ON components(slug);
CREATE INDEX IF NOT EXISTS idx_components_system_id ON components(system_id);

CREATE INDEX IF NOT EXISTS idx_symptom_causes_symptom_id ON symptom_causes(symptom_id);
CREATE INDEX IF NOT EXISTS idx_symptom_causes_cause_id ON symptom_causes(cause_id);

CREATE INDEX IF NOT EXISTS idx_symptom_conditions_symptom_id ON symptom_conditions(symptom_id);
CREATE INDEX IF NOT EXISTS idx_symptom_conditions_condition_id ON symptom_conditions(condition_id);

CREATE INDEX IF NOT EXISTS idx_condition_causes_condition_id ON condition_causes(condition_id);
CREATE INDEX IF NOT EXISTS idx_condition_causes_cause_id ON condition_causes(cause_id);

CREATE INDEX IF NOT EXISTS idx_cause_repairs_cause_id ON cause_repairs(cause_id);
CREATE INDEX IF NOT EXISTS idx_cause_repairs_repair_id ON cause_repairs(repair_id);

CREATE INDEX IF NOT EXISTS idx_cause_components_cause_id ON cause_components(cause_id);
CREATE INDEX IF NOT EXISTS idx_cause_components_component_id ON cause_components(component_id);

CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);
CREATE INDEX IF NOT EXISTS idx_locations_state_city ON locations(state, city);

CREATE INDEX IF NOT EXISTS idx_contractors_active ON contractors(active);
CREATE INDEX IF NOT EXISTS idx_contractor_locations_location_id ON contractor_locations(location_id);

CREATE INDEX IF NOT EXISTS idx_leads_location_id ON leads(location_id);
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='page_id') THEN CREATE INDEX IF NOT EXISTS idx_leads_page_id ON leads(page_id); END IF; END $$;
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_targets_slug ON page_targets(slug);
CREATE INDEX IF NOT EXISTS idx_page_targets_status ON page_targets(generation_status);
CREATE INDEX IF NOT EXISTS idx_page_targets_priority ON page_targets(priority_score DESC, id ASC);
CREATE INDEX IF NOT EXISTS idx_page_targets_page_type ON page_targets(page_type);
CREATE INDEX IF NOT EXISTS idx_page_targets_system_id ON page_targets(system_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_symptom_id ON page_targets(symptom_id);
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='page_targets' AND column_name='condition_id') THEN CREATE INDEX IF NOT EXISTS idx_page_targets_condition_id ON page_targets(condition_id); END IF; END $$;
CREATE INDEX IF NOT EXISTS idx_page_targets_cause_id ON page_targets(cause_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_repair_id ON page_targets(repair_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_location_id ON page_targets(location_id);
CREATE INDEX IF NOT EXISTS idx_page_targets_next_refresh_at ON page_targets(next_refresh_at);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_page_target_id ON pages(page_target_id);
CREATE INDEX IF NOT EXISTS idx_pages_page_type ON pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pages_symptom_id ON pages(symptom_id);
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='condition_id') THEN CREATE INDEX IF NOT EXISTS idx_pages_condition_id ON pages(condition_id); END IF; END $$;
CREATE INDEX IF NOT EXISTS idx_pages_cause_id ON pages(cause_id);
CREATE INDEX IF NOT EXISTS idx_pages_repair_id ON pages(repair_id);
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='published_at') THEN CREATE INDEX IF NOT EXISTS idx_pages_published_at ON pages(published_at DESC); END IF; END $$;

CREATE INDEX IF NOT EXISTS idx_page_generation_runs_target_id ON page_generation_runs(page_target_id);
CREATE INDEX IF NOT EXISTS idx_page_generation_runs_status ON page_generation_runs(status);
CREATE INDEX IF NOT EXISTS idx_page_generation_runs_created_page_id ON page_generation_runs(created_page_id);
CREATE INDEX IF NOT EXISTS idx_page_generation_runs_created_at ON page_generation_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gsc_queries_query ON gsc_queries(query);
CREATE INDEX IF NOT EXISTS idx_gsc_queries_report_date ON gsc_queries(report_date);

CREATE INDEX IF NOT EXISTS idx_keyword_opportunities_keyword ON keyword_opportunities(keyword);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

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
