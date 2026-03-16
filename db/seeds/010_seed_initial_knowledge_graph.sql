-- Seed 010: Initial Knowledge Graph for Programmatic SEO
-- DecisionGrid + HVAC Revenue Boost
-- Run AFTER migration 010. Idempotent: INSERT ... ON CONFLICT DO NOTHING
-- Usage: npx tsx scripts/run-seed-010.ts

BEGIN;

-- =============================================================================
-- PHASE 1: SYSTEMS
-- =============================================================================
INSERT INTO systems (name, slug)
VALUES
  ('RV HVAC', 'rv-hvac'),
  ('Residential HVAC', 'residential-hvac'),
  ('RV Electrical', 'rv-electrical'),
  ('Residential Electrical', 'residential-electrical'),
  ('RV Plumbing', 'rv-plumbing'),
  ('Residential Plumbing', 'residential-plumbing'),
  ('Marine HVAC', 'marine-hvac'),
  ('Marine Electrical', 'marine-electrical'),
  ('Generators', 'generators'),
  ('Battery Systems', 'battery-systems')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- PHASE 2: SYMPTOMS (40+)
-- =============================================================================
INSERT INTO symptoms (system_id, name, slug, description)
SELECT s.id, v.name, v.slug, v.desc_text
FROM (VALUES
  ('residential-hvac', 'AC Not Cooling', 'ac-not-cooling', 'AC runs but air is not cold'),
  ('residential-hvac', 'AC Blowing Warm Air', 'ac-blowing-warm-air', 'AC blowing warm or room-temp air'),
  ('residential-hvac', 'AC Short Cycling', 'ac-short-cycling', 'AC turns on and off rapidly'),
  ('residential-hvac', 'AC Not Turning On', 'ac-not-turning-on', 'AC does not start'),
  ('residential-hvac', 'AC Freezing Up', 'ac-freezing-up', 'Ice on coils or lines'),
  ('residential-hvac', 'AC Not Blowing Air', 'ac-not-blowing-air', 'No airflow from vents'),
  ('residential-hvac', 'AC Fan Not Running', 'ac-fan-not-running', 'Indoor or outdoor fan not spinning'),
  ('residential-hvac', 'AC Compressor Not Starting', 'ac-compressor-not-starting', 'Outdoor unit hums but compressor does not start'),
  ('residential-hvac', 'AC Making Loud Noise', 'ac-making-loud-noise', 'Grinding, squealing, or banging'),
  ('residential-hvac', 'AC Leaking Water', 'ac-leaking-water', 'Water pooling or dripping'),
  ('residential-hvac', 'AC Not Cooling While Driving', 'ac-not-cooling-while-driving', 'RV AC fails when engine running'),
  ('residential-hvac', 'AC Not Cooling In Hot Weather', 'ac-not-cooling-in-hot-weather', 'AC struggles in extreme heat'),
  ('residential-hvac', 'AC Not Cooling After Cleaning Filter', 'ac-not-cooling-after-cleaning-filter', 'Still no cooling after filter change'),
  ('residential-hvac', 'AC Airflow Weak', 'ac-airflow-weak', 'Reduced airflow from vents'),
  ('residential-hvac', 'AC Running Constantly', 'ac-running-constantly', 'AC never cycles off'),
  ('residential-hvac', 'AC Turning On And Off Rapidly', 'ac-turning-on-and-off-rapidly', 'Short cycling'),
  ('residential-hvac', 'AC Smells Burning', 'ac-smells-burning', 'Burning odor from vents'),
  ('residential-hvac', 'AC Smells Musty', 'ac-smells-musty', 'Mold or mildew odor'),
  ('residential-hvac', 'Thermostat Not Responding', 'thermostat-not-responding', 'Thermostat does not control system'),
  ('residential-hvac', 'Thermostat Blank Screen', 'thermostat-blank-screen', 'Thermostat display is blank'),
  ('residential-hvac', 'Thermostat Not Turning AC On', 'thermostat-not-turning-ac-on', 'Call for cool not working'),
  ('residential-hvac', 'Outdoor Fan Not Spinning', 'outdoor-fan-not-spinning', 'Condenser fan not running'),
  ('residential-hvac', 'Outdoor Unit Humming', 'outdoor-unit-humming', 'Unit hums but does not start'),
  ('residential-hvac', 'Outdoor Unit Not Starting', 'outdoor-unit-not-starting', 'No response from outdoor unit'),
  ('rv-hvac', 'RV AC Not Cooling', 'rv-ac-not-cooling', 'RV AC blows warm air'),
  ('rv-hvac', 'RV AC Fan Running But No Cooling', 'rv-ac-fan-running-but-no-cooling', 'Fan works, no cold air'),
  ('rv-hvac', 'RV AC Not Starting On Generator', 'rv-ac-not-starting-on-generator', 'AC fails on generator power'),
  ('rv-hvac', 'RV AC Trips Breaker', 'rv-ac-trips-breaker', 'AC trips circuit breaker'),
  ('rv-hvac', 'RV Furnace Not Working', 'rv-furnace-not-working', 'RV furnace does not heat'),
  ('rv-hvac', 'RV Furnace Blowing Cold Air', 'rv-furnace-blowing-cold-air', 'Furnace blows room-temp air'),
  ('rv-hvac', 'RV Furnace Won''t Ignite', 'rv-furnace-wont-ignite', 'Burner does not light'),
  ('rv-hvac', 'RV Furnace Fan Running But No Heat', 'rv-furnace-fan-running-but-no-heat', 'Fan runs, no heat output'),
  ('residential-hvac', 'Furnace Not Heating', 'furnace-not-heating', 'Furnace does not produce heat'),
  ('residential-hvac', 'Furnace Blowing Cold Air', 'furnace-blowing-cold-air', 'Heat mode blows cold'),
  ('residential-hvac', 'Furnace Not Turning On', 'furnace-not-turning-on', 'Furnace does not start'),
  ('residential-hvac', 'Heat Pump Not Cooling', 'heat-pump-not-cooling', 'Heat pump in cool mode not cooling'),
  ('residential-hvac', 'Heat Pump Not Heating', 'heat-pump-not-heating', 'Heat pump in heat mode not heating'),
  ('residential-hvac', 'Humidity Too High', 'humidity-too-high-home', 'Excess indoor humidity'),
  ('residential-hvac', 'Ice On Outdoor Unit', 'ice-on-outdoor-unit', 'Ice buildup on condenser'),
  ('residential-hvac', 'HVAC Leaking Water', 'hvac-leaking-water', 'Water from unit or vents'),
  ('residential-hvac', 'HVAC Unit Short Cycling', 'hvac-unit-short-cycling', 'System cycles too frequently')
) AS v(sys_slug, name, slug, desc_text)
JOIN systems s ON s.slug = v.sys_slug
WHERE NOT EXISTS (SELECT 1 FROM symptoms sx WHERE sx.slug = v.slug);

-- =============================================================================
-- PHASE 3: CAUSES (60+)
-- =============================================================================
INSERT INTO causes (system_id, name, slug, description)
SELECT s.id, v.name, v.slug, v.desc_text
FROM (VALUES
  ('residential-hvac', 'Clogged Air Filter', 'clogged-air-filter', 'Restricted airflow'),
  ('residential-hvac', 'Bad Capacitor', 'bad-capacitor', 'Failed start/run capacitor'),
  ('residential-hvac', 'Low Refrigerant', 'low-refrigerant', 'Refrigerant leak or undercharge'),
  ('residential-hvac', 'Dirty Condenser Coils', 'dirty-condenser-coils', 'Outdoor coil blocked'),
  ('residential-hvac', 'Faulty Thermostat', 'faulty-thermostat', 'Thermostat malfunction'),
  ('residential-hvac', 'Loose Wiring', 'loose-wiring', 'Electrical connection issue'),
  ('residential-hvac', 'Tripped Breaker', 'tripped-breaker', 'Circuit breaker tripped'),
  ('residential-hvac', 'Blown Fuse', 'blown-fuse', 'Fuse blown'),
  ('residential-hvac', 'Failed Compressor', 'failed-compressor', 'Compressor motor failure'),
  ('residential-hvac', 'Bad Contactor', 'bad-contactor', 'Contactor welded or failed'),
  ('residential-hvac', 'Frozen Evaporator Coil', 'frozen-evaporator-coil', 'Ice on indoor coil'),
  ('residential-hvac', 'Blocked Return Vent', 'blocked-return-vent', 'Return airflow restricted'),
  ('residential-hvac', 'Failed Control Board', 'failed-control-board', 'PCB or control module failure'),
  ('residential-hvac', 'Bad Fan Motor', 'bad-fan-motor', 'Blower or condenser fan motor'),
  ('residential-hvac', 'Shorted Thermostat Wire', 'shorted-thermostat-wire', 'Low voltage short'),
  ('residential-hvac', 'Refrigerant Leak', 'refrigerant-leak', 'Leak in refrigerant circuit'),
  ('residential-hvac', 'Dirty Evaporator Coil', 'dirty-evaporator-coil', 'Indoor coil blocked'),
  ('residential-hvac', 'Restricted Ductwork', 'restricted-ductwork', 'Duct blockage or leak'),
  ('residential-hvac', 'Wrong Thermostat Setting', 'wrong-thermostat-setting', 'User error'),
  ('residential-hvac', 'Oversized Unit', 'oversized-unit', 'Unit too large for space'),
  ('residential-hvac', 'Undersized Unit', 'undersized-unit', 'Unit too small for load'),
  ('residential-hvac', 'Dirty Condenser', 'dirty-condenser', 'Outdoor debris'),
  ('residential-hvac', 'Failed Run Capacitor', 'failed-run-capacitor', 'Run cap failure'),
  ('residential-hvac', 'Failed Start Capacitor', 'failed-start-capacitor', 'Start cap failure'),
  ('residential-hvac', 'Welded Contactor', 'welded-contactor', 'Contactor stuck closed'),
  ('residential-hvac', 'Bad Reversing Valve', 'bad-reversing-valve', 'Heat pump valve stuck'),
  ('residential-hvac', 'Dirty Flame Sensor', 'dirty-flame-sensor', 'Furnace flame sensor dirty'),
  ('residential-hvac', 'Worn Igniter', 'worn-igniter', 'Hot surface igniter failed'),
  ('residential-hvac', 'Clogged Drain Line', 'clogged-drain-line', 'Condensate drain blocked'),
  ('residential-hvac', 'Low Gas Pressure', 'low-gas-pressure', 'Gas supply issue'),
  ('residential-hvac', 'Pilot Light Out', 'pilot-light-out', 'Pilot not lit'),
  ('rv-hvac', 'RV Low Refrigerant', 'rv-low-refrigerant', 'RV AC refrigerant low'),
  ('rv-hvac', 'RV Bad Capacitor', 'rv-bad-capacitor', 'RV AC capacitor failed'),
  ('rv-hvac', 'RV Dirty Filter', 'rv-dirty-filter', 'RV filter clogged'),
  ('rv-hvac', 'RV Generator Undersized', 'rv-generator-undersized', 'Generator cannot run AC'),
  ('rv-hvac', 'RV Shore Power Issue', 'rv-shore-power-issue', 'Shore power connection'),
  ('rv-hvac', 'RV Thermostat Fault', 'rv-thermostat-fault', 'RV thermostat bad'),
  ('rv-hvac', 'RV Duct Leak', 'rv-duct-leak', 'RV ductwork leaking'),
  ('residential-hvac', 'Bad Defrost Board', 'bad-defrost-board', 'Heat pump defrost failure'),
  ('residential-hvac', 'Restricted Refrigerant Line', 'restricted-refrigerant-line', 'Line restriction'),
  ('residential-hvac', 'Bad TXV', 'bad-txv', 'Expansion valve failure'),
  ('residential-hvac', 'Reversing Valve Stuck', 'reversing-valve-stuck', 'Valve stuck in position'),
  ('residential-hvac', 'Dirty Condenser Coil', 'dirty-condenser-coil', 'Outdoor coil dirty'),
  ('residential-hvac', 'Evaporator Coil Dirty', 'evaporator-coil-dirty', 'Indoor coil dirty'),
  ('residential-hvac', 'Capacitor Failure', 'capacitor-failure', 'Capacitor failed'),
  ('residential-hvac', 'Compressor Failure', 'compressor-failure', 'Compressor dead'),
  ('residential-hvac', 'Contactor Failure', 'contactor-failure', 'Contactor failed'),
  ('residential-hvac', 'Blower Motor Failure', 'blower-motor-failure', 'Blower motor bad'),
  ('residential-hvac', 'Condenser Fan Failure', 'condenser-fan-failure', 'Outdoor fan motor bad'),
  ('residential-hvac', 'Control Board Failure', 'control-board-failure', 'Control board bad'),
  ('residential-hvac', 'Thermostat Failure', 'thermostat-failure', 'Thermostat bad'),
  ('residential-hvac', 'Duct Leak', 'duct-leak', 'Ductwork leaking'),
  ('residential-hvac', 'Filter Dirty', 'filter-dirty', 'Air filter dirty'),
  ('residential-hvac', 'Breaker Tripped', 'breaker-tripped', 'Breaker tripped'),
  ('residential-hvac', 'Fuse Blown', 'fuse-blown', 'Fuse blown'),
  ('residential-hvac', 'Wiring Fault', 'wiring-fault', 'Electrical wiring issue'),
  ('residential-hvac', 'Low Refrigerant Charge', 'low-refrigerant-charge', 'System undercharged'),
  ('residential-hvac', 'Overcharged System', 'overcharged-system', 'Too much refrigerant'),
  ('residential-hvac', 'Restricted Filter', 'restricted-filter', 'Filter blocked'),
  ('residential-hvac', 'Blocked Return', 'blocked-return', 'Return blocked'),
  ('residential-hvac', 'Blocked Supply', 'blocked-supply', 'Supply blocked'),
  ('residential-hvac', 'Frozen Coil', 'frozen-coil', 'Coil frozen'),
  ('residential-hvac', 'Drain Line Clogged', 'drain-line-clogged', 'Drain blocked'),
  ('residential-hvac', 'Igniter Failed', 'igniter-failed', 'Igniter failed'),
  ('residential-hvac', 'Flame Sensor Dirty', 'flame-sensor-dirty', 'Flame sensor dirty'),
  ('residential-hvac', 'Gas Valve Fault', 'gas-valve-fault', 'Gas valve bad'),
  ('residential-hvac', 'Limit Switch Tripped', 'limit-switch-tripped', 'High limit tripped'),
  ('residential-hvac', 'Pressure Switch Fault', 'pressure-switch-fault', 'Pressure switch bad'),
  ('residential-hvac', 'Inducer Motor Failure', 'inducer-motor-failure', 'Inducer motor bad'),
  ('residential-hvac', 'Heat Exchanger Cracked', 'heat-exchanger-cracked', 'Crack in heat exchanger'),
  ('residential-hvac', 'Reversing Valve Fault', 'reversing-valve-fault', 'Reversing valve bad'),
  ('residential-hvac', 'Defrost Board Fault', 'defrost-board-fault', 'Defrost board bad'),
  ('residential-hvac', 'Thermostat Miswired', 'thermostat-miswired', 'Thermostat wiring wrong'),
  ('residential-hvac', 'Low Voltage', 'low-voltage', 'Low voltage supply'),
  ('residential-hvac', 'High Voltage', 'high-voltage', 'High voltage supply'),
  ('residential-hvac', 'Condenser Fan Bad', 'condenser-fan-bad', 'Outdoor fan bad'),
  ('residential-hvac', 'Evaporator Fan Bad', 'evaporator-fan-bad', 'Indoor fan bad')
) AS v(sys_slug, name, slug, desc_text)
JOIN systems s ON s.slug = v.sys_slug
WHERE NOT EXISTS (SELECT 1 FROM causes cx WHERE cx.slug = v.slug);

-- =============================================================================
-- PHASE 4: REPAIRS (80+)
-- Use public.repairs: (name, slug, skill_level) - description may not exist in public schema
-- =============================================================================
INSERT INTO public.repairs (name, slug, skill_level)
SELECT DISTINCT ON (v.slug) v.name, v.slug, v.skill FROM (VALUES
  ('Replace Air Filter', 'replace-air-filter', 'Install new clean filter', 'easy'),
  ('Recharge Refrigerant', 'recharge-refrigerant', 'Add refrigerant to system', 'advanced'),
  ('Replace Capacitor', 'replace-capacitor', 'Install new start/run capacitor', 'moderate'),
  ('Clean Condenser Coil', 'clean-condenser-coil', 'Clean outdoor coil', 'moderate'),
  ('Replace Thermostat', 'replace-thermostat', 'Install new thermostat', 'moderate'),
  ('Reset Breaker', 'reset-breaker', 'Reset tripped circuit breaker', 'easy'),
  ('Replace Fan Motor', 'replace-fan-motor', 'Install new blower or condenser fan', 'advanced'),
  ('Replace Contactor', 'replace-contactor', 'Install new contactor', 'moderate'),
  ('Defrost Evaporator Coil', 'defrost-evaporator-coil', 'Thaw frozen coil', 'moderate'),
  ('Repair Wiring', 'repair-wiring', 'Fix electrical connections', 'advanced'),
  ('Replace Control Board', 'replace-control-board', 'Install new control board', 'advanced'),
  ('Replace Compressor', 'replace-compressor', 'Install new compressor', 'advanced'),
  ('Replace Fuse', 'replace-fuse', 'Install new fuse', 'easy'),
  ('Replace Blower Motor', 'replace-blower-motor', 'Install new blower motor', 'advanced'),
  ('Replace Condenser Fan Motor', 'replace-condenser-fan-motor', 'Install new outdoor fan motor', 'advanced'),
  ('Clean Evaporator Coil', 'clean-evaporator-coil', 'Clean indoor coil', 'advanced'),
  ('Clear Drain Line', 'clear-drain-line', 'Unclog condensate drain', 'moderate'),
  ('Clean Flame Sensor', 'clean-flame-sensor', 'Clean furnace flame sensor', 'moderate'),
  ('Replace Igniter', 'replace-igniter', 'Install new hot surface igniter', 'advanced'),
  ('Replace Reversing Valve', 'replace-reversing-valve', 'Install new heat pump valve', 'advanced'),
  ('Replace Defrost Board', 'replace-defrost-board', 'Install new defrost board', 'advanced'),
  ('Seal Ductwork', 'seal-ductwork', 'Seal duct leaks', 'moderate'),
  ('Replace Gas Valve', 'replace-gas-valve', 'Install new gas valve', 'advanced'),
  ('Replace Limit Switch', 'replace-limit-switch', 'Install new high limit', 'moderate'),
  ('Replace Pressure Switch', 'replace-pressure-switch', 'Install new pressure switch', 'advanced'),
  ('Replace Inducer Motor', 'replace-inducer-motor', 'Install new inducer motor', 'advanced'),
  ('Replace Heat Exchanger', 'replace-heat-exchanger', 'Install new heat exchanger', 'advanced'),
  ('Replace TXV', 'replace-txv', 'Install new expansion valve', 'advanced'),
  ('Repair Refrigerant Line', 'repair-refrigerant-line', 'Repair refrigerant leak', 'advanced'),
  ('Replace Run Capacitor', 'replace-run-capacitor', 'Install new run capacitor', 'moderate'),
  ('Replace Start Capacitor', 'replace-start-capacitor', 'Install new start capacitor', 'moderate'),
  ('Clean Condenser', 'clean-condenser', 'Clean outdoor unit', 'moderate'),
  ('Clean Evaporator', 'clean-evaporator', 'Clean indoor coil', 'advanced'),
  ('Clear Drain', 'clear-drain', 'Unclog drain', 'moderate'),
  ('Replace Filter', 'replace-filter', 'Install new filter', 'easy'),
  ('Reset Breaker', 'reset-breaker', 'Reset breaker', 'easy'),
  ('Replace Fuse', 'replace-fuse', 'Install new fuse', 'easy'),
  ('Repair Thermostat Wiring', 'repair-thermostat-wiring', 'Fix thermostat wires', 'moderate'),
  ('Replace Thermostat Battery', 'replace-thermostat-battery', 'Install new battery', 'easy'),
  ('Clean Filter', 'clean-filter', 'Clean reusable filter', 'easy'),
  ('Unblock Return', 'unblock-return', 'Clear return vent', 'easy'),
  ('Unblock Supply', 'unblock-supply', 'Clear supply vent', 'easy'),
  ('Thaw Coil', 'thaw-coil', 'Thaw frozen coil', 'moderate'),
  ('Replace Capacitor', 'replace-capacitor', 'Install new capacitor', 'moderate'),
  ('Replace Contactor', 'replace-contactor', 'Install new contactor', 'moderate'),
  ('Replace Compressor', 'replace-compressor', 'Install new compressor', 'advanced'),
  ('Replace Blower', 'replace-blower', 'Install new blower', 'advanced'),
  ('Replace Condenser Fan', 'replace-condenser-fan', 'Install new condenser fan', 'advanced'),
  ('Replace Control Board', 'replace-control-board', 'Install new control', 'advanced'),
  ('Replace Thermostat', 'replace-thermostat', 'Install new thermostat', 'moderate'),
  ('Seal Ducts', 'seal-ducts', 'Seal duct leaks', 'moderate'),
  ('Add Refrigerant', 'add-refrigerant', 'Recharge system', 'advanced'),
  ('Replace Igniter', 'replace-igniter', 'Install new igniter', 'advanced'),
  ('Replace Flame Sensor', 'replace-flame-sensor', 'Install new flame sensor', 'moderate'),
  ('Replace Gas Valve', 'replace-gas-valve', 'Install new gas valve', 'advanced'),
  ('Replace Limit', 'replace-limit', 'Install new limit switch', 'moderate'),
  ('Replace Pressure Switch', 'replace-pressure-switch', 'Install new pressure switch', 'advanced'),
  ('Replace Inducer', 'replace-inducer', 'Install new inducer', 'advanced'),
  ('Replace Heat Exchanger', 'replace-heat-exchanger', 'Install new heat exchanger', 'advanced'),
  ('Replace Reversing Valve', 'replace-reversing-valve', 'Install new reversing valve', 'advanced'),
  ('Replace Defrost Board', 'replace-defrost-board', 'Install new defrost board', 'advanced'),
  ('Replace TXV', 'replace-txv', 'Install new expansion valve', 'advanced'),
  ('Repair Refrigerant Leak', 'repair-refrigerant-leak', 'Find and repair leak', 'advanced'),
  ('Replace Run Cap', 'replace-run-cap', 'Install new run capacitor', 'moderate'),
  ('Replace Start Cap', 'replace-start-cap', 'Install new start capacitor', 'moderate'),
  ('Clean Condenser Coil', 'clean-condenser-coil', 'Clean outdoor coil', 'moderate'),
  ('Clean Evaporator Coil', 'clean-evaporator-coil', 'Clean indoor coil', 'advanced'),
  ('Clear Drain Line', 'clear-drain-line', 'Unclog condensate drain', 'moderate'),
  ('Replace Air Filter', 'replace-air-filter', 'Install new filter', 'easy'),
  ('Reset Circuit Breaker', 'reset-circuit-breaker', 'Reset breaker', 'easy'),
  ('Replace Fuse', 'replace-fuse', 'Install new fuse', 'easy'),
  ('Fix Thermostat Wiring', 'fix-thermostat-wiring', 'Repair thermostat wires', 'moderate'),
  ('Replace Thermostat Batteries', 'replace-thermostat-batteries', 'Install new batteries', 'easy'),
  ('Clean Reusable Filter', 'clean-reusable-filter', 'Clean filter', 'easy'),
  ('Clear Return Vent', 'clear-return-vent', 'Unblock return', 'easy'),
  ('Clear Supply Vent', 'clear-supply-vent', 'Unblock supply', 'easy'),
  ('Defrost Evaporator', 'defrost-evaporator', 'Thaw frozen coil', 'moderate'),
  ('Repair Duct Leak', 'repair-duct-leak', 'Seal duct leak', 'moderate'),
  ('Replace Blower Motor', 'replace-blower-motor', 'Install new blower motor', 'advanced'),
  ('Replace Condenser Fan Motor', 'replace-condenser-fan-motor', 'Install new condenser fan', 'advanced'),
  ('Replace Control Module', 'replace-control-module', 'Install new control board', 'advanced'),
  ('Replace Wall Thermostat', 'replace-wall-thermostat', 'Install new thermostat', 'moderate'),
  ('Duct Sealing', 'duct-sealing', 'Seal ductwork', 'moderate'),
  ('Refrigerant Recharge', 'refrigerant-recharge', 'Add refrigerant', 'advanced'),
  ('Hot Surface Igniter', 'hot-surface-igniter', 'Replace igniter', 'advanced'),
  ('Flame Sensor Clean', 'flame-sensor-clean', 'Clean flame sensor', 'moderate'),
  ('Gas Valve Replacement', 'gas-valve-replacement', 'Replace gas valve', 'advanced'),
  ('Limit Switch Replacement', 'limit-switch-replacement', 'Replace limit switch', 'moderate'),
  ('Pressure Switch Replacement', 'pressure-switch-replacement', 'Replace pressure switch', 'advanced'),
  ('Inducer Motor Replacement', 'inducer-motor-replacement', 'Replace inducer motor', 'advanced'),
  ('Heat Exchanger Replacement', 'heat-exchanger-replacement', 'Replace heat exchanger', 'advanced'),
  ('Reversing Valve Replacement', 'reversing-valve-replacement', 'Replace reversing valve', 'advanced'),
  ('Defrost Control Replacement', 'defrost-control-replacement', 'Replace defrost board', 'advanced'),
  ('Expansion Valve Replacement', 'expansion-valve-replacement', 'Replace TXV', 'advanced'),
  ('Leak Repair', 'leak-repair', 'Repair refrigerant leak', 'advanced'),
  ('Run Capacitor Replacement', 'run-capacitor-replacement', 'Replace run capacitor', 'moderate'),
  ('Start Capacitor Replacement', 'start-capacitor-replacement', 'Replace start capacitor', 'moderate'),
  ('Condenser Coil Cleaning', 'condenser-coil-cleaning', 'Clean condenser coil', 'moderate'),
  ('Evaporator Coil Cleaning', 'evaporator-coil-cleaning', 'Clean evaporator coil', 'advanced'),
  ('Drain Line Clearing', 'drain-line-clearing', 'Clear drain line', 'moderate'),
  ('Filter Replacement', 'filter-replacement', 'Replace filter', 'easy'),
  ('Breaker Reset', 'breaker-reset', 'Reset breaker', 'easy'),
  ('Fuse Replacement', 'fuse-replacement', 'Replace fuse', 'easy'),
  ('Thermostat Wire Repair', 'thermostat-wire-repair', 'Repair thermostat wiring', 'moderate'),
  ('Battery Replacement', 'battery-replacement', 'Replace thermostat battery', 'easy'),
  ('Filter Cleaning', 'filter-cleaning', 'Clean filter', 'easy'),
  ('Return Vent Clearing', 'return-vent-clearing', 'Clear return vent', 'easy'),
  ('Supply Vent Clearing', 'supply-vent-clearing', 'Clear supply vent', 'easy'),
  ('Coil Defrost', 'coil-defrost', 'Defrost frozen coil', 'moderate'),
  ('Duct Repair', 'duct-repair', 'Repair duct leak', 'moderate')
) AS v(name, slug, desc_text, skill)
WHERE NOT EXISTS (SELECT 1 FROM public.repairs rx WHERE rx.slug = v.slug)
ORDER BY v.slug, v.name;

-- =============================================================================
-- PHASE 5: COMPONENTS
-- =============================================================================
INSERT INTO components (system_id, name, slug, description)
SELECT s.id, v.name, v.slug, v.desc_text
FROM (VALUES
  ('residential-hvac', 'Compressor', 'compressor', 'Main pump in outdoor unit'),
  ('residential-hvac', 'Condenser Fan Motor', 'condenser-fan-motor', 'Outdoor fan motor'),
  ('residential-hvac', 'Evaporator Coil', 'evaporator-coil', 'Indoor coil'),
  ('residential-hvac', 'Capacitor', 'capacitor', 'Start/run capacitor'),
  ('residential-hvac', 'Contactor', 'contactor', 'Power relay'),
  ('residential-hvac', 'Control Board', 'control-board', 'PCB control module'),
  ('residential-hvac', 'Thermostat', 'thermostat', 'Wall thermostat'),
  ('residential-hvac', 'Blower Motor', 'blower-motor', 'Indoor blower'),
  ('residential-hvac', 'Fan Relay', 'fan-relay', 'Fan relay'),
  ('residential-hvac', 'Refrigerant Line', 'refrigerant-line', 'Copper lines'),
  ('residential-hvac', 'Air Filter', 'air-filter', 'Filter'),
  ('residential-hvac', 'Breaker', 'breaker', 'Circuit breaker'),
  ('residential-hvac', 'Fuse', 'fuse', 'Fuse'),
  ('residential-hvac', 'Run Capacitor', 'run-capacitor', 'Run cap'),
  ('residential-hvac', 'Start Capacitor', 'start-capacitor', 'Start cap'),
  ('residential-hvac', 'Condenser Coil', 'condenser-coil', 'Outdoor coil'),
  ('residential-hvac', 'Heat Exchanger', 'heat-exchanger', 'Furnace heat exchanger'),
  ('residential-hvac', 'Inducer Motor', 'inducer-motor', 'Furnace inducer'),
  ('residential-hvac', 'Flame Sensor', 'flame-sensor', 'Flame sensor'),
  ('residential-hvac', 'Igniter', 'igniter', 'Hot surface igniter'),
  ('residential-hvac', 'Reversing Valve', 'reversing-valve', 'Heat pump valve'),
  ('residential-hvac', 'Defrost Board', 'defrost-board', 'Defrost control'),
  ('residential-hvac', 'Drain Line', 'drain-line', 'Condensate drain'),
  ('residential-hvac', 'Ductwork', 'ductwork', 'Air ducts'),
  ('residential-hvac', 'TXV', 'txv', 'Expansion valve')
) AS v(sys_slug, name, slug, desc_text)
JOIN systems s ON s.slug = v.sys_slug
WHERE NOT EXISTS (SELECT 1 FROM components cx WHERE cx.slug = v.slug);

-- =============================================================================
-- PHASE 6: TOOLS
-- =============================================================================
INSERT INTO tools (name, slug, description)
VALUES
  ('Multimeter', 'multimeter', 'Voltage and continuity testing'),
  ('Screwdriver Set', 'screwdriver-set', 'Phillips and flathead'),
  ('Nut Driver', 'nut-driver', 'HVAC nut driver set'),
  ('Refrigerant Gauge Set', 'refrigerant-gauge-set', 'Manifold gauges'),
  ('Capacitor Tester', 'capacitor-tester', 'Test capacitors'),
  ('Wire Stripper', 'wire-stripper', 'Strip wire insulation'),
  ('Clamp Meter', 'clamp-meter', 'AC amp clamp'),
  ('Fin Comb', 'fin-comb', 'Straighten condenser fins'),
  ('Coil Cleaner', 'coil-cleaner', 'Evaporator/condenser cleaner'),
  ('Vacuum Pump', 'vacuum-pump', 'Evacuation pump'),
  ('Manifold Gauge Set', 'manifold-gauge-set', 'Refrigerant gauges')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- PHASE 7: ENVIRONMENTS
-- =============================================================================
INSERT INTO environments (name, slug, description)
VALUES
  ('While Driving', 'while-driving', 'RV in motion'),
  ('In Hot Weather', 'in-hot-weather', 'Extreme heat'),
  ('In Cold Weather', 'in-cold-weather', 'Extreme cold'),
  ('After Cleaning Filter', 'after-cleaning-filter', 'Post filter change'),
  ('After Recent Service', 'after-recent-service', 'Post maintenance'),
  ('On Generator Power', 'on-generator-power', 'Generator running'),
  ('On Shore Power', 'on-shore-power', 'Shore power connected'),
  ('During High Humidity', 'during-high-humidity', 'High humidity'),
  ('After Power Outage', 'after-power-outage', 'Post power loss'),
  ('After Long Storage', 'after-long-storage', 'Post storage')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- PHASE 8: VEHICLE MODELS
-- =============================================================================
INSERT INTO vehicle_models (make, model, year_range, slug)
VALUES
  ('Winnebago', 'Minnie', '2015-2024', 'winnebago-minnie'),
  ('Forest River', 'Rockwood', '2010-2024', 'forest-river-rockwood'),
  ('Jayco', 'Eagle', '2012-2024', 'jayco-eagle'),
  ('Keystone', 'Montana', '2010-2024', 'keystone-montana'),
  ('Grand Design', 'Reflection', '2015-2024', 'grand-design-reflection'),
  ('Airstream', 'Classic', '2010-2024', 'airstream-classic'),
  ('Thor', 'Four Winds', '2010-2024', 'thor-four-winds'),
  ('Coachmen', 'Freelander', '2012-2024', 'coachmen-freelander'),
  ('Fleetwood', 'Bounder', '2010-2024', 'fleetwood-bounder'),
  ('Tiffin', 'Allegro', '2010-2024', 'tiffin-allegro')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
