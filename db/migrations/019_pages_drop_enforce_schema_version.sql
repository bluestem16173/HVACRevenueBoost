-- Allow new content eras (e.g. dg_authority_v3) without widening a brittle enum here.
-- Re-add a stricter CHECK later if you want governance keyed off known schema_version values.

ALTER TABLE pages DROP CONSTRAINT IF EXISTS enforce_schema_version;
