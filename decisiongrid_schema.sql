-- DecisionGrid Advanced Knowledge Graph Schema (Neon Postgres)

-- 1. Systems (HVAC, Heat Pumps, Boilers, etc.)
CREATE TABLE systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Symptoms
CREATE TABLE symptoms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_id UUID REFERENCES systems(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    search_intent TEXT,
    priority_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(system_id, slug)
);

-- 3. Causes
CREATE TABLE causes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_id UUID REFERENCES systems(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    difficulty TEXT,
    confidence_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(system_id, slug)
);

-- 4. Symptom-Cause Join Table
CREATE TABLE symptom_causes (
    symptom_id UUID REFERENCES symptoms(id) ON DELETE CASCADE,
    cause_id UUID REFERENCES causes(id) ON DELETE CASCADE,
    PRIMARY KEY (symptom_id, cause_id)
);

-- 5. Repairs
CREATE TABLE repairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cause_id UUID REFERENCES causes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    repair_type TEXT,
    skill_level TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Diagnostics (The high-level manual paths)
CREATE TABLE diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_id UUID REFERENCES systems(id) ON DELETE CASCADE,
    symptom_id UUID REFERENCES symptoms(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    priority_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Diagnostic Steps (The flow logic)
CREATE TABLE diagnostic_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnostic_id UUID REFERENCES diagnostics(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    question TEXT NOT NULL,
    yes_target_slug TEXT,
    no_target_slug TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Pages (The rendered content for the frontend)
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_type TEXT NOT NULL, -- 'symptom', 'cause', 'repair', 'diagnostic', 'city'
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'queued', -- 'queued', 'review', 'published'
    content_json JSONB,
    content_html TEXT,
    system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
    symptom_id UUID REFERENCES symptoms(id) ON DELETE SET NULL,
    cause_id UUID REFERENCES causes(id) ON DELETE SET NULL,
    repair_id UUID REFERENCES repairs(id) ON DELETE SET NULL,
    diagnostic_id UUID REFERENCES diagnostics(id) ON DELETE SET NULL,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Internal Links (For topical authority graph)
CREATE TABLE internal_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_slug TEXT NOT NULL,
    target_slug TEXT NOT NULL,
    anchor_text TEXT,
    link_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Generation Queue
CREATE TABLE generation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_type TEXT NOT NULL,
    status TEXT DEFAULT 'queued',
    proposed_slug TEXT NOT NULL,
    proposed_title TEXT,
    system_id UUID REFERENCES systems(id),
    symptom_id UUID REFERENCES symptoms(id),
    cause_id UUID REFERENCES causes(id),
    repair_id UUID REFERENCES repairs(id),
    diagnostic_id UUID REFERENCES diagnostics(id),
    city TEXT,
    page_id UUID REFERENCES pages(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Cities
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    population INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Contractors (Lead gen)
CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    trade TEXT,
    city TEXT,
    city_slug TEXT,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Supporting SEO Tables
CREATE TABLE breakout_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_slug TEXT NOT NULL,
    keyword TEXT,
    position NUMERIC,
    impressions INT,
    ctr NUMERIC,
    status TEXT DEFAULT 'pending'
);

CREATE TABLE symptom_harvest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    slug TEXT,
    system_id UUID REFERENCES systems(id),
    score NUMERIC,
    status TEXT DEFAULT 'pending'
);

CREATE TABLE cluster_expansion_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    page_slug TEXT,
    position NUMERIC,
    impressions INT,
    status TEXT DEFAULT 'pending'
);

CREATE TABLE environment_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL
);


-- 14. Leads (Lead Capture storage)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    zip_code TEXT,
    symptom_id UUID REFERENCES symptoms(id),
    city TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_page_type ON pages(page_type);
CREATE INDEX idx_internal_links_source ON internal_links(source_slug);
CREATE INDEX idx_internal_links_target ON internal_links(target_slug);
CREATE INDEX idx_generation_queue_status ON generation_queue(status);
CREATE INDEX idx_leads_email ON leads(email);

-- ============================================================
-- Knowledge Graph Extensions (Migration 001)
-- ============================================================

-- Diagnostic Tests (technician verification procedures)
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

-- Cause-Diagnostic-Tests Join
CREATE TABLE IF NOT EXISTS cause_diagnostic_tests (
  cause_id UUID REFERENCES causes(id) ON DELETE CASCADE,
  test_id UUID REFERENCES diagnostic_tests(id) ON DELETE CASCADE,
  PRIMARY KEY (cause_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_cause_diagnostic_tests_cause ON cause_diagnostic_tests(cause_id);
CREATE INDEX IF NOT EXISTS idx_cause_diagnostic_tests_test ON cause_diagnostic_tests(test_id);

-- Conditions Layer (symptom → condition → cause)
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
