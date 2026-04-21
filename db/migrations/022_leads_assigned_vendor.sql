-- Admin leads UI: vendor assignment + contacted timestamp

ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_vendor TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;
