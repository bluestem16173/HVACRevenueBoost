-- Seed HVAC Knowledge Graph
-- Run after: psql $DATABASE_URL -f db/migrations/001_master_platform_schema.sql
-- Run: psql $DATABASE_URL -f scripts/seed_hvac_graph.sql
--
-- Uses ON CONFLICT DO NOTHING for idempotency.

BEGIN;

-- ============================================================
-- SYSTEMS
-- ============================================================
INSERT INTO systems (slug, name, description) VALUES
  ('hvac', 'HVAC', 'Heating, ventilation, and air conditioning'),
  ('heat-pump', 'Heat Pump', 'Heat pump systems'),
  ('mini-split', 'Mini Split', 'Ductless mini-split systems'),
  ('furnace', 'Furnace', 'Gas and electric furnaces'),
  ('thermostat', 'Thermostat', 'Thermostats and controls')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SYMPTOMS
-- ============================================================
INSERT INTO symptoms (system_id, slug, name, description)
SELECT s.id, v.slug, v.name, v.description
FROM (VALUES
  ('ac-not-cooling', 'AC Not Cooling', 'Air conditioner not producing cooling'),
  ('ac-blowing-warm-air', 'AC Blowing Warm Air', 'AC blowing warm or room-temperature air'),
  ('ac-not-turning-on', 'AC Not Turning On', 'AC unit not starting'),
  ('ac-freezing-up', 'AC Freezing Up', 'Ice or frost on condenser or evaporator'),
  ('ac-running-constantly', 'AC Running Constantly', 'AC runs continuously without cycling')
) AS v(slug, name, description)
CROSS JOIN systems s ON s.slug = 'hvac'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CONDITIONS
-- ============================================================
INSERT INTO conditions (system_id, slug, name, description)
SELECT s.id, v.slug, v.name, v.description
FROM (VALUES
  ('outdoor-unit-running', 'Outdoor Unit Running', 'Condenser running but no cooling'),
  ('compressor-not-starting', 'Compressor Not Starting', 'Compressor fails to start'),
  ('fan-running-but-no-cooling', 'Fan Running But No Cooling', 'Fan runs, no cold air'),
  ('breaker-tripped', 'Breaker Tripped', 'Circuit breaker trips'),
  ('after-recent-service', 'After Recent Service', 'Issue started after maintenance')
) AS v(slug, name, description)
CROSS JOIN systems s ON s.slug = 'hvac'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CAUSES
-- ============================================================
INSERT INTO causes (system_id, slug, name, description)
SELECT s.id, v.slug, v.name, v.description
FROM (VALUES
  ('low-refrigerant', 'Low Refrigerant', 'Refrigerant leak or low charge'),
  ('bad-capacitor', 'Bad Capacitor', 'Failed start or run capacitor'),
  ('failed-compressor', 'Failed Compressor', 'Compressor motor failure'),
  ('dirty-coil', 'Dirty Coil', 'Dirty evaporator or condenser coil'),
  ('clogged-filter', 'Clogged Filter', 'Dirty or restricted air filter')
) AS v(slug, name, description)
CROSS JOIN systems s ON s.slug = 'hvac'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- REPAIRS
-- ============================================================
INSERT INTO repairs (slug, name, description, difficulty, estimated_cost_low, estimated_cost_high) VALUES
  ('replace-capacitor', 'Replace Capacitor', 'Install new start/run capacitor', 'moderate', 150, 400),
  ('recharge-refrigerant', 'Recharge Refrigerant', 'Add refrigerant per EPA 608', 'professional-only', 200, 600),
  ('replace-compressor', 'Replace Compressor', 'Compressor replacement', 'professional-only', 2000, 5000),
  ('clean-condenser-coil', 'Clean Condenser Coil', 'Clean outdoor coil', 'moderate', 100, 300),
  ('replace-filter', 'Replace Filter', 'Install new air filter', 'rookie', 20, 80)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- COMPONENTS
-- ============================================================
INSERT INTO components (system_id, slug, name, description)
SELECT s.id, v.slug, v.name, v.description
FROM (VALUES
  ('capacitor', 'Capacitor', 'Start/run capacitor'),
  ('compressor', 'Compressor', 'HVAC compressor'),
  ('condenser-coil', 'Condenser Coil', 'Outdoor coil'),
  ('evaporator-coil', 'Evaporator Coil', 'Indoor coil'),
  ('blower-motor', 'Blower Motor', 'Air handler blower'),
  ('thermostat', 'Thermostat', 'Temperature control'),
  ('contactor', 'Contactor', 'Relay/contactor'),
  ('filter', 'Filter', 'Air filter'),
  ('reversing-valve', 'Reversing Valve', 'Heat pump reversing valve'),
  ('expansion-valve', 'Expansion Valve', 'Metering device')
) AS v(slug, name, description)
CROSS JOIN systems s ON s.slug = 'hvac'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- JUNCTION: symptom_causes
-- ============================================================
INSERT INTO symptom_causes (symptom_id, cause_id)
SELECT sym.id, c.id
FROM symptoms sym
JOIN systems s ON s.id = sym.system_id AND s.slug = 'hvac'
JOIN causes c ON c.system_id = s.id
WHERE sym.slug IN ('ac-not-cooling', 'ac-blowing-warm-air')
  AND c.slug IN ('low-refrigerant', 'bad-capacitor', 'clogged-filter', 'dirty-coil')
ON CONFLICT (symptom_id, cause_id) DO NOTHING;

INSERT INTO symptom_causes (symptom_id, cause_id)
SELECT sym.id, c.id
FROM symptoms sym
JOIN systems s ON s.id = sym.system_id AND s.slug = 'hvac'
JOIN causes c ON c.system_id = s.id
WHERE sym.slug = 'ac-not-turning-on'
  AND c.slug IN ('bad-capacitor', 'failed-compressor')
ON CONFLICT (symptom_id, cause_id) DO NOTHING;

INSERT INTO symptom_causes (symptom_id, cause_id)
SELECT sym.id, c.id
FROM symptoms sym
JOIN systems s ON s.id = sym.system_id AND s.slug = 'hvac'
JOIN causes c ON c.system_id = s.id
WHERE sym.slug IN ('ac-freezing-up', 'ac-running-constantly')
  AND c.slug IN ('clogged-filter', 'low-refrigerant', 'dirty-coil')
ON CONFLICT (symptom_id, cause_id) DO NOTHING;

-- ============================================================
-- JUNCTION: symptom_conditions
-- ============================================================
INSERT INTO symptom_conditions (symptom_id, condition_id)
SELECT sym.id, cond.id
FROM symptoms sym
JOIN conditions cond ON cond.system_id = sym.system_id
JOIN systems s ON s.id = sym.system_id AND s.slug = 'hvac'
WHERE sym.slug IN ('ac-not-cooling', 'ac-blowing-warm-air')
  AND cond.slug IN ('outdoor-unit-running', 'fan-running-but-no-cooling')
ON CONFLICT (symptom_id, condition_id) DO NOTHING;

-- ============================================================
-- JUNCTION: condition_causes
-- ============================================================
INSERT INTO condition_causes (condition_id, cause_id)
SELECT cond.id, c.id
FROM conditions cond
JOIN causes c ON c.system_id = cond.system_id
JOIN systems s ON s.id = cond.system_id AND s.slug = 'hvac'
WHERE cond.slug = 'outdoor-unit-running'
  AND c.slug IN ('low-refrigerant', 'bad-capacitor', 'dirty-coil')
ON CONFLICT (condition_id, cause_id) DO NOTHING;

INSERT INTO condition_causes (condition_id, cause_id)
SELECT cond.id, c.id
FROM conditions cond
JOIN causes c ON c.system_id = cond.system_id
JOIN systems s ON s.id = cond.system_id AND s.slug = 'hvac'
WHERE cond.slug = 'compressor-not-starting'
  AND c.slug IN ('bad-capacitor', 'failed-compressor')
ON CONFLICT (condition_id, cause_id) DO NOTHING;

-- ============================================================
-- JUNCTION: cause_repairs
-- ============================================================
INSERT INTO cause_repairs (cause_id, repair_id)
SELECT c.id, r.id
FROM causes c
JOIN systems s ON s.id = c.system_id AND s.slug = 'hvac'
JOIN repairs r ON r.slug IN ('replace-capacitor', 'recharge-refrigerant', 'replace-compressor', 'clean-condenser-coil', 'replace-filter')
WHERE (c.slug = 'bad-capacitor' AND r.slug = 'replace-capacitor')
   OR (c.slug = 'low-refrigerant' AND r.slug = 'recharge-refrigerant')
   OR (c.slug = 'failed-compressor' AND r.slug = 'replace-compressor')
   OR (c.slug = 'dirty-coil' AND r.slug = 'clean-condenser-coil')
   OR (c.slug = 'clogged-filter' AND r.slug = 'replace-filter')
ON CONFLICT (cause_id, repair_id) DO NOTHING;

-- ============================================================
-- JUNCTION: cause_components
-- ============================================================
INSERT INTO cause_components (cause_id, component_id)
SELECT c.id, comp.id
FROM causes c
JOIN components comp ON comp.system_id = c.system_id
JOIN systems s ON s.id = c.system_id AND s.slug = 'hvac'
WHERE (c.slug = 'bad-capacitor' AND comp.slug = 'capacitor')
   OR (c.slug = 'failed-compressor' AND comp.slug = 'compressor')
   OR (c.slug = 'dirty-coil' AND comp.slug IN ('condenser-coil', 'evaporator-coil'))
   OR (c.slug = 'clogged-filter' AND comp.slug = 'filter')
ON CONFLICT (cause_id, component_id) DO NOTHING;

COMMIT;
