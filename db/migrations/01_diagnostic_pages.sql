-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- TABLE: diagnostic_pages
-- =========================
CREATE TABLE IF NOT EXISTS diagnostic_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,

    -- 🔥 Core SEO / Routing (Top-Level Fields)
    headline TEXT NOT NULL,
    page_type TEXT DEFAULT 'dg_authority_v2',
    site TEXT DEFAULT 'hvacrevenueboost',

    -- 🧠 The AI Payload (True Contract)
    raw_json JSONB NOT NULL,

    -- ⏱️ Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS idx_diagnostic_pages_slug 
ON diagnostic_pages(slug);

CREATE INDEX IF NOT EXISTS idx_diagnostic_pages_page_type 
ON diagnostic_pages(page_type);

CREATE INDEX IF NOT EXISTS idx_diagnostic_pages_site 
ON diagnostic_pages(site);

-- =========================
-- AUTO UPDATE TIMESTAMP
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_updated_at ON diagnostic_pages;

CREATE TRIGGER trg_update_updated_at
BEFORE UPDATE ON diagnostic_pages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();