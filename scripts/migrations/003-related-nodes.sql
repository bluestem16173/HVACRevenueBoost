-- Migration 003: Related Nodes Graph (Phase 16)
-- Dense internal linking between pages beyond parent-child.
-- Supports: related-problem, similar-cause, alternative-repair, same-component-family,
--           same-condition-family, same-system-cluster
--
-- Usage: psql $DATABASE_URL -f scripts/migrations/003-related-nodes.sql

CREATE TABLE IF NOT EXISTS related_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_slug TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_slug TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  score NUMERIC DEFAULT 1,
  is_bidirectional BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_related_nodes_source ON related_nodes(source_type, source_slug);
CREATE INDEX idx_related_nodes_target ON related_nodes(target_type, target_slug);
CREATE INDEX idx_related_nodes_relation ON related_nodes(relation_type);
CREATE UNIQUE INDEX idx_related_nodes_unique ON related_nodes(source_slug, target_slug, relation_type);

COMMENT ON TABLE related_nodes IS 'Phase 16: Dense internal linking. 4-8 related nodes per page.';
