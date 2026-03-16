-- Verify HVAC Revenue Boost Knowledge Graph Traversal
-- Run: psql $DATABASE_URL -f scripts/verify-graph.sql
-- Confirms: symptom → condition → cause → repair
-- Queries 7–9 require migration 007 (page_targets).

-- 1. Symptom → Conditions (via symptom_conditions)
SELECT 'Symptom → Conditions' AS traversal;
SELECT s.name AS symptom, c.name AS condition
FROM symptoms s
JOIN symptom_conditions sc ON sc.symptom_id = s.id
JOIN conditions c ON c.id = sc.condition_id
ORDER BY s.slug, c.slug
LIMIT 10;

-- 2. Symptom → Causes (via symptom_causes)
SELECT 'Symptom → Causes' AS traversal;
SELECT s.name AS symptom, c.name AS cause
FROM symptoms s
JOIN symptom_causes sc ON sc.symptom_id = s.id
JOIN causes c ON c.id = sc.cause_id
ORDER BY s.slug, c.slug
LIMIT 10;

-- 3. Condition → Causes (via condition_causes)
SELECT 'Condition → Causes' AS traversal;
SELECT cond.name AS condition, c.name AS cause
FROM conditions cond
JOIN condition_causes cc ON cc.condition_id = cond.id
JOIN causes c ON c.id = cc.cause_id
ORDER BY cond.slug, c.slug
LIMIT 10;

-- 4. Cause → Repairs (via cause_repairs)
SELECT 'Cause → Repairs' AS traversal;
SELECT c.name AS cause, r.name AS repair
FROM causes c
JOIN cause_repairs cr ON cr.cause_id = c.id
JOIN repairs r ON r.id = cr.repair_id
ORDER BY c.slug, r.slug
LIMIT 10;

-- 5. Full path: Symptom → Condition → Cause → Repair
SELECT 'Full path: Symptom → Condition → Cause → Repair' AS traversal;
SELECT s.name AS symptom, cond.name AS condition, c.name AS cause, r.name AS repair
FROM symptoms s
JOIN symptom_conditions sc ON sc.symptom_id = s.id
JOIN conditions cond ON cond.id = sc.condition_id
JOIN condition_causes cc ON cc.condition_id = cond.id
JOIN causes c ON c.id = cc.cause_id
JOIN cause_repairs cr ON cr.cause_id = c.id
JOIN repairs r ON r.id = cr.repair_id
ORDER BY s.slug, cond.slug, c.slug, r.slug
LIMIT 10;

-- 6. Row counts
SELECT 'Row counts' AS check;
SELECT 'systems' AS tbl, COUNT(*) AS cnt FROM systems
UNION ALL SELECT 'symptoms', COUNT(*) FROM symptoms
UNION ALL SELECT 'conditions', COUNT(*) FROM conditions
UNION ALL SELECT 'causes', COUNT(*) FROM causes
UNION ALL SELECT 'repairs', COUNT(*) FROM repairs
UNION ALL SELECT 'symptom_conditions', COUNT(*) FROM symptom_conditions
UNION ALL SELECT 'symptom_causes', COUNT(*) FROM symptom_causes
UNION ALL SELECT 'condition_causes', COUNT(*) FROM condition_causes
UNION ALL SELECT 'cause_repairs', COUNT(*) FROM cause_repairs;

-- 7. Pending page targets (queue selection by priority)
SELECT 'Pending page targets (top 10 by priority)' AS check;
SELECT slug, page_type, priority_score, generation_status
FROM page_targets
WHERE generation_status IN ('pending', 'failed')
   OR (next_refresh_at IS NOT NULL AND next_refresh_at <= NOW())
ORDER BY priority_score DESC, created_at ASC
LIMIT 10;

-- 8. Generated pages linked to page_targets
SELECT 'Pages linked to targets' AS check;
SELECT p.slug, p.page_type, pt.slug AS target_slug, pt.generation_status
FROM pages p
JOIN page_targets pt ON pt.id = p.page_target_id
LIMIT 10;

-- 9. Lead routing (contractors by city)
SELECT 'Lead routing: contractors per city' AS check;
SELECT c.slug AS city_slug, COUNT(co.id) AS contractor_count
FROM cities c
LEFT JOIN contractors co ON co.city_slug = c.slug
GROUP BY c.slug
LIMIT 10;

-- 10. Lead routing by contractor_locations (many-to-many)
SELECT 'Lead routing: contractor_locations' AS check;
SELECT loc.slug AS location_slug, COUNT(DISTINCT cl.contractor_id) AS contractor_count
FROM locations loc
LEFT JOIN contractor_locations cl ON cl.location_id = loc.id OR cl.city_id = loc.id
GROUP BY loc.slug
LIMIT 10;
