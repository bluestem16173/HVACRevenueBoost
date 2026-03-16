-- Platform Verification Queries
-- Run: npm run db:master-verify
-- Or: psql $DATABASE_URL -f scripts/verify_platform.sql

-- 1. GRAPH TRAVERSAL: system → symptom → condition → cause → repair → component
SELECT
  sys.slug AS system,
  sym.slug AS symptom,
  cond.slug AS condition,
  c.slug AS cause,
  r.slug AS repair,
  comp.slug AS component
FROM systems sys
JOIN symptoms sym ON sym.system_id = sys.id
JOIN symptom_conditions sc ON sc.symptom_id = sym.id
JOIN conditions cond ON cond.id = sc.condition_id
JOIN condition_causes cc ON cc.condition_id = cond.id
JOIN causes c ON c.id = cc.cause_id
JOIN cause_repairs cr ON cr.cause_id = c.id
JOIN repairs r ON r.id = cr.repair_id
LEFT JOIN cause_components cac ON cac.cause_id = c.id
LEFT JOIN components comp ON comp.id = cac.component_id
WHERE sys.slug = 'hvac'
LIMIT 10;

-- 2. PENDING PAGE TARGETS
SELECT generation_status, COUNT(*) AS cnt
FROM page_targets
GROUP BY generation_status
ORDER BY cnt DESC;

-- 3. PAGE GENERATION SUCCESS (last 10 runs)
SELECT
  pgr.status,
  pgr.model_name,
  pt.slug,
  pgr.created_at
FROM page_generation_runs pgr
JOIN page_targets pt ON pt.id = pgr.page_target_id
ORDER BY pgr.created_at DESC
LIMIT 10;

-- 4. LEAD ROUTING (sample)
SELECT
  l.id,
  l.status,
  l.customer_name,
  loc.slug AS location,
  sym.slug AS symptom,
  p.slug AS page
FROM leads l
LEFT JOIN locations loc ON loc.id = l.location_id
LEFT JOIN symptoms sym ON sym.id = l.symptom_id
LEFT JOIN pages p ON p.id = l.page_id
ORDER BY l.created_at DESC
LIMIT 5;

-- 5. GSC INGESTION CHECK (if any data)
SELECT COUNT(*) AS gsc_query_count FROM gsc_queries;
SELECT COUNT(*) AS gsc_page_count FROM gsc_page_metrics;

-- 6. AUTHORITY CLUSTER MEMBERSHIP
SELECT
  tc.slug AS cluster,
  tc.name,
  COUNT(cp.id) AS page_count
FROM topic_clusters tc
LEFT JOIN cluster_pages cp ON cp.cluster_id = tc.id
GROUP BY tc.id, tc.slug, tc.name;

-- 7. KNOWLEDGE GRAPH COUNTS
SELECT 'systems' AS tbl, COUNT(*) AS cnt FROM systems
UNION ALL SELECT 'symptoms', COUNT(*) FROM symptoms
UNION ALL SELECT 'conditions', COUNT(*) FROM conditions
UNION ALL SELECT 'causes', COUNT(*) FROM causes
UNION ALL SELECT 'repairs', COUNT(*) FROM repairs
UNION ALL SELECT 'components', COUNT(*) FROM components;

-- 8. CONTENT ENGINE COUNTS
SELECT 'page_targets' AS tbl, COUNT(*) AS cnt FROM page_targets
UNION ALL SELECT 'pages', COUNT(*) FROM pages
UNION ALL SELECT 'page_generation_runs', COUNT(*) FROM page_generation_runs;

-- 9. LEAD MARKETPLACE COUNTS
SELECT 'locations' AS tbl, COUNT(*) AS cnt FROM locations
UNION ALL SELECT 'contractors', COUNT(*) FROM contractors
UNION ALL SELECT 'leads', COUNT(*) FROM leads;
