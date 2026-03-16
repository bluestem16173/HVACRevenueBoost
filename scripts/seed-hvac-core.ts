/**
 * Seed HVAC Revenue Boost Core Knowledge Graph
 * Populates systems, symptoms, conditions, causes, repairs + junction tables.
 *
 * Compatible with: 004-decisiongrid-alignment schema (UUID, cause_repairs junction).
 * For 001 greenfield schema (SERIAL, repairs.cause_id), adjust repairs insert.
 *
 * Usage: npx tsx scripts/seed-hvac-core.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from '../lib/db';

async function seed() {
  console.log('🌱 Seeding HVAC Revenue Boost core graph...');

  const systems = [
    { slug: 'hvac', name: 'HVAC' },
    { slug: 'heat-pump', name: 'Heat Pump' },
    { slug: 'mini-split', name: 'Mini Split' },
    { slug: 'furnace', name: 'Furnace' },
    { slug: 'thermostat', name: 'Thermostat' },
  ];

  for (const s of systems) {
    await sql`
      INSERT INTO systems (slug, name) VALUES (${s.slug}, ${s.name})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `;
  }
  console.log(`  ✓ ${systems.length} systems`);

  const systemRow = await sql`SELECT id FROM systems WHERE slug = 'hvac' LIMIT 1`;
  const systemId = (systemRow as any[])[0]?.id;

  const symptoms = [
    { slug: 'ac-not-cooling', name: 'AC Not Cooling' },
    { slug: 'ac-blowing-warm-air', name: 'AC Blowing Warm Air' },
    { slug: 'ac-not-turning-on', name: 'AC Not Turning On' },
    { slug: 'ac-freezing-up', name: 'AC Freezing Up' },
    { slug: 'ac-running-constantly', name: 'AC Running Constantly' },
  ];

  for (const s of symptoms) {
    await sql`
      INSERT INTO symptoms (slug, name, system_id) VALUES (${s.slug}, ${s.name}, ${systemId})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, system_id = EXCLUDED.system_id
    `;
  }
  console.log(`  ✓ ${symptoms.length} symptoms`);

  const conditions = [
    { slug: 'outdoor-unit-running', name: 'Outdoor Unit Running' },
    { slug: 'compressor-not-starting', name: 'Compressor Not Starting' },
    { slug: 'fan-running-but-no-cooling', name: 'Fan Running But No Cooling' },
    { slug: 'breaker-tripped', name: 'Breaker Tripped' },
    { slug: 'after-recent-service', name: 'After Recent Service' },
  ];

  for (const c of conditions) {
    await sql`
      INSERT INTO conditions (slug, name, system_id) VALUES (${c.slug}, ${c.name}, ${systemId})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, system_id = EXCLUDED.system_id
    `;
  }
  console.log(`  ✓ ${conditions.length} conditions`);

  const causes = [
    { slug: 'low-refrigerant', name: 'Low Refrigerant' },
    { slug: 'bad-capacitor', name: 'Bad Capacitor' },
    { slug: 'failed-compressor', name: 'Failed Compressor' },
    { slug: 'dirty-coil', name: 'Dirty Coil' },
    { slug: 'clogged-filter', name: 'Clogged Filter' },
  ];

  for (const c of causes) {
    await sql`
      INSERT INTO causes (slug, name) VALUES (${c.slug}, ${c.name})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `;
  }
  console.log(`  ✓ ${causes.length} causes`);

  const causeIds: Record<string, any> = {};
  for (const c of causes) {
    const r = await sql`SELECT id FROM causes WHERE slug = ${c.slug} LIMIT 1`;
    causeIds[c.slug] = (r as any[])[0]?.id;
  }

  const repairs = [
    { slug: 'replace-capacitor', name: 'Replace Capacitor', cause_slug: 'bad-capacitor', difficulty: 'easy', cost: '$150-$350' },
    { slug: 'recharge-refrigerant', name: 'Recharge Refrigerant', cause_slug: 'low-refrigerant', difficulty: 'moderate', cost: '$300-$900' },
    { slug: 'replace-compressor', name: 'Replace Compressor', cause_slug: 'failed-compressor', difficulty: 'advanced', cost: '$2000-$4000' },
    { slug: 'clean-condenser-coil', name: 'Clean Condenser Coil', cause_slug: 'dirty-coil', difficulty: 'easy', cost: '$100-$250' },
    { slug: 'replace-filter', name: 'Replace Filter', cause_slug: 'clogged-filter', difficulty: 'easy', cost: '$20-$50' },
  ];

  for (const r of repairs) {
    await sql`
      INSERT INTO repairs (slug, name, description, estimated_cost, skill_level)
      VALUES (${r.slug}, ${r.name}, ${r.name}, ${r.cost}, ${r.difficulty})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, estimated_cost = EXCLUDED.estimated_cost
    `;
  }
  console.log(`  ✓ ${repairs.length} repairs`);

  const symIds: Record<string, any> = {};
  const condIds: Record<string, any> = {};
  const repIds: Record<string, any> = {};
  for (const s of symptoms) {
    const r = await sql`SELECT id FROM symptoms WHERE slug = ${s.slug} LIMIT 1`;
    symIds[s.slug] = (r as any[])[0]?.id;
  }
  for (const c of conditions) {
    const r = await sql`SELECT id FROM conditions WHERE slug = ${c.slug} LIMIT 1`;
    condIds[c.slug] = (r as any[])[0]?.id;
  }
  for (const r of repairs) {
    const res = await sql`SELECT id FROM repairs WHERE slug = ${r.slug} LIMIT 1`;
    repIds[r.slug] = (res as any[])[0]?.id;
  }

  const symptomConditions = [
    ['ac-not-cooling', 'outdoor-unit-running'],
    ['ac-not-cooling', 'compressor-not-starting'],
    ['ac-blowing-warm-air', 'compressor-not-starting'],
    ['ac-blowing-warm-air', 'fan-running-but-no-cooling'],
    ['ac-not-turning-on', 'breaker-tripped'],
    ['ac-running-constantly', 'after-recent-service'],
  ];

  for (const [symSlug, condSlug] of symptomConditions) {
    const sid = symIds[symSlug];
    const cid = condIds[condSlug];
    if (sid && cid) {
      await sql`
        INSERT INTO symptom_conditions (symptom_id, condition_id) VALUES (${sid}, ${cid})
        ON CONFLICT (symptom_id, condition_id) DO NOTHING
      `;
    }
  }
  console.log(`  ✓ ${symptomConditions.length} symptom_conditions`);

  const symptomCauses = [
    ['ac-not-cooling', 'low-refrigerant'],
    ['ac-not-cooling', 'bad-capacitor'],
    ['ac-not-cooling', 'clogged-filter'],
    ['ac-blowing-warm-air', 'bad-capacitor'],
    ['ac-blowing-warm-air', 'low-refrigerant'],
    ['ac-blowing-warm-air', 'failed-compressor'],
    ['ac-not-turning-on', 'bad-capacitor'],
    ['ac-freezing-up', 'clogged-filter'],
    ['ac-freezing-up', 'dirty-coil'],
  ];

  for (const [symSlug, causeSlug] of symptomCauses) {
    const sid = symIds[symSlug];
    const cid = causeIds[causeSlug];
    if (sid && cid) {
      await sql`
        INSERT INTO symptom_causes (symptom_id, cause_id) VALUES (${sid}, ${cid})
        ON CONFLICT (symptom_id, cause_id) DO NOTHING
      `;
    }
  }
  console.log(`  ✓ ${symptomCauses.length} symptom_causes`);

  const conditionCauses = [
    ['compressor-not-starting', 'bad-capacitor'],
    ['compressor-not-starting', 'failed-compressor'],
    ['fan-running-but-no-cooling', 'low-refrigerant'],
    ['fan-running-but-no-cooling', 'dirty-coil'],
    ['outdoor-unit-running', 'bad-capacitor'],
  ];

  for (const [condSlug, causeSlug] of conditionCauses) {
    const cid = condIds[condSlug];
    const causeId = causeIds[causeSlug];
    if (cid && causeId) {
      await sql`
        INSERT INTO condition_causes (condition_id, cause_id) VALUES (${cid}, ${causeId})
        ON CONFLICT (condition_id, cause_id) DO NOTHING
      `;
    }
  }
  console.log(`  ✓ ${conditionCauses.length} condition_causes`);

  for (const r of repairs) {
    const cid = causeIds[r.cause_slug];
    const rid = repIds[r.slug];
    if (cid && rid) {
      await sql`
        INSERT INTO cause_repairs (cause_id, repair_id) VALUES (${cid}, ${rid})
        ON CONFLICT (cause_id, repair_id) DO NOTHING
      `;
    }
  }
  console.log(`  ✓ ${repairs.length} cause_repairs`);

  // ---------------------------------------------------------
  // CITIES / LOCATIONS (for location_hub page targets)
  // ---------------------------------------------------------
  if (await tableExists('cities')) {
    const cities = [
      { slug: 'tampa', city: 'Tampa', state: 'FL' },
      { slug: 'phoenix', city: 'Phoenix', state: 'AZ' },
      { slug: 'dallas', city: 'Dallas', state: 'TX' },
    ];
    for (const c of cities) {
      await sql`
        INSERT INTO cities (slug, city, state) VALUES (${c.slug}, ${c.city}, ${c.state})
        ON CONFLICT (slug) DO UPDATE SET city = EXCLUDED.city, state = EXCLUDED.state
      `;
    }
    if (await tableExists('locations')) {
      await sql`
        INSERT INTO locations (id, city, state, slug, population)
        SELECT id, city, state, slug, population FROM cities
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`  ✓ ${cities.length} cities`);
  }

  // ---------------------------------------------------------
  // PAGE_TARGETS (expansion queue - run after 007 migration)
  // system, symptom, symptom_condition, cause, repair, location_hub
  // ---------------------------------------------------------
  if (await tableExists('page_targets')) {
    let locationId = null;
    if (await tableExists('locations')) {
      const loc = await sql`SELECT id FROM locations WHERE slug = 'tampa' LIMIT 1`;
      locationId = (loc as any[])[0]?.id;
    }
    if (!locationId && await tableExists('cities')) {
      const city = await sql`SELECT id FROM cities WHERE slug = 'tampa' LIMIT 1`;
      locationId = (city as any[])[0]?.id;
    }
    const targets: Array<{ slug: string; page_type: string; system_id?: any; symptom_id?: any; condition_id?: any; cause_id?: any; repair_id?: any; location_id?: any }> = [
      { slug: 'hvac', page_type: 'system', system_id: systemId },
      { slug: 'ac-not-cooling', page_type: 'symptom', system_id: systemId, symptom_id: symIds['ac-not-cooling'] },
      { slug: 'ac-not-cooling-outdoor-unit-running', page_type: 'symptom_condition', system_id: systemId, symptom_id: symIds['ac-not-cooling'], condition_id: condIds['outdoor-unit-running'] },
      { slug: 'low-refrigerant', page_type: 'cause', system_id: systemId, symptom_id: symIds['ac-not-cooling'], cause_id: causeIds['low-refrigerant'] },
      { slug: 'replace-capacitor', page_type: 'repair', repair_id: repIds['replace-capacitor'] },
      { slug: 'tampa-hvac', page_type: 'location_hub', location_id: locationId },
    ];
    for (const t of targets) {
      await sql`
        INSERT INTO page_targets (slug, page_type, system_id, symptom_id, condition_id, cause_id, repair_id, location_id, priority_score)
        VALUES (${t.slug}, ${t.page_type}, ${t.system_id ?? null}, ${t.symptom_id ?? null}, ${t.condition_id ?? null}, ${t.cause_id ?? null}, ${t.repair_id ?? null}, ${t.location_id ?? null}, 1)
        ON CONFLICT (slug) DO UPDATE SET page_type = EXCLUDED.page_type
      `;
    }
    console.log(`  ✓ ${targets.length} page_targets`);
  }

  console.log('\n✅ Core graph seeded.');
}

async function tableExists(name: string): Promise<boolean> {
  try {
    const r = await sql`SELECT 1 FROM information_schema.tables WHERE table_name = ${name} LIMIT 1`;
    return (r as any[]).length > 0;
  } catch {
    return false;
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
