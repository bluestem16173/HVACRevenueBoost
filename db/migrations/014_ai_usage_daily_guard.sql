-- Daily AI spend tracking (Layer 2 guard). Idempotent.
CREATE TABLE IF NOT EXISTS ai_usage (
  id BIGSERIAL PRIMARY KEY,
  cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,
  model_name TEXT,
  source TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage (created_at);
