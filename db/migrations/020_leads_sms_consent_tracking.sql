-- Twilio A2P 10DLC audit fields (optional columns; API tolerates missing on old DBs)

ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_consent_text_version TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_page TEXT;
