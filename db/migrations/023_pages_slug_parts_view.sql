-- Derived trade / symptom / city from pages.slug (storage: no leading slash).
-- Matches app logic in lib/seo/pagesSlugLinkingEngine.ts (split_part 1..3).
--
-- Query examples:
--   SELECT * FROM pages_slug_parts WHERE trade = 'plumbing' AND city = 'fort-myers-fl';
--   SELECT slug, national_hub_slug FROM pages_slug_parts WHERE slug LIKE 'plumbing/%';

CREATE OR REPLACE VIEW pages_slug_parts AS
SELECT
  id,
  slug,
  page_type,
  NULLIF(TRIM(LOWER(split_part(slug, '/', 1))), '') AS trade,
  NULLIF(TRIM(LOWER(split_part(slug, '/', 2))), '') AS symptom,
  NULLIF(TRIM(LOWER(split_part(slug, '/', 3))), '') AS city,
  CASE
    WHEN NULLIF(TRIM(LOWER(split_part(slug, '/', 2))), '') IS NOT NULL THEN
      concat_ws(
        '/',
        NULLIF(TRIM(LOWER(split_part(slug, '/', 1))), ''),
        NULLIF(TRIM(LOWER(split_part(slug, '/', 2))), '')
      )
    ELSE NULL
  END AS national_hub_slug
FROM pages
WHERE slug ~* '^(hvac|plumbing|electrical)/';
