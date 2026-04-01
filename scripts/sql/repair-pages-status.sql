-- One-time cleanup: normalize mistaken copies of queue-like values on `pages`.
-- Review before running against production.
-- (Optional) After this, run mark-stale logic only if you define "gold" criteria in app code.

BEGIN;

UPDATE pages SET status = 'draft' WHERE status = 'pending';
UPDATE pages SET status = 'generated' WHERE status = 'processing';
UPDATE pages SET status = 'published' WHERE status = 'completed';

COMMIT;
