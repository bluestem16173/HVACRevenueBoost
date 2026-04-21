-- Optional attribution columns for /api/lead (SMS + modal). API tolerates missing columns on old DBs.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS page_slug TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS page_city_slug TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term TEXT;
