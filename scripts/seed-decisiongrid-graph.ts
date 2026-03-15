/**
 * Seed HVAC Revenue Boost Knowledge Graph
 * Run after migrations 004 and 005. Seeds initial nodes for generation pipeline.
 * Schema aligned with DecisionGrid for compatibility.
 *
 * Usage: npx tsx scripts/seed-decisiongrid-graph.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import sql from "@/lib/db";

async function seed() {
  console.log("🌱 Seeding HVAC Revenue Boost graph...");

  // Systems
  const systems = [
    { slug: "residential-ac", name: "Residential AC" },
    { slug: "rv-ac", name: "RV AC" },
    { slug: "mini-split", name: "Mini Split" },
    { slug: "rooftop-hvac", name: "Rooftop HVAC" },
  ];

  for (const s of systems) {
    await sql`
      INSERT INTO systems (slug, name) VALUES (${s.slug}, ${s.name})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `;
  }
  console.log(`  ✓ ${systems.length} systems`);

  // Environment contexts
  const envContexts = [
    { slug: "hot-weather", name: "Hot Weather" },
    { slug: "cold-weather", name: "Cold Weather" },
    { slug: "while-driving", name: "While Driving" },
    { slug: "generator-power", name: "Generator Power" },
    { slug: "high-humidity", name: "High Humidity" },
  ];

  for (const e of envContexts) {
    await sql`
      INSERT INTO environment_contexts (slug, name) VALUES (${e.slug}, ${e.name})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `;
  }
  console.log(`  ✓ ${envContexts.length} environment contexts`);

  // Symptoms
  const symptoms = [
    { slug: "ac-not-cooling", name: "AC Not Cooling" },
    { slug: "ac-blowing-warm-air", name: "AC Blowing Warm Air" },
    { slug: "ac-not-turning-on", name: "AC Not Turning On" },
    { slug: "ac-freezing-up", name: "AC Freezing Up" },
    { slug: "ac-short-cycling", name: "AC Short Cycling" },
  ];

  const sysRes = await sql`SELECT id FROM systems WHERE slug = 'residential-ac' LIMIT 1`;
  const systemId = (sysRes as any[])[0]?.id;

  for (const s of symptoms) {
    await sql`
      INSERT INTO symptoms (slug, name, system_id) VALUES (${s.slug}, ${s.name}, ${systemId})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `;
  }
  console.log(`  ✓ ${symptoms.length} symptoms`);

  // Conditions
  const conditions = [
    { slug: "compressor-running", name: "Compressor Running" },
    { slug: "compressor-not-running", name: "Compressor Not Running" },
    { slug: "unit-freezing", name: "Unit Freezing" },
    { slug: "breaker-tripped", name: "Breaker Tripped" },
  ];

  for (const c of conditions) {
    await sql`
      INSERT INTO conditions (slug, name, system_id) VALUES (${c.slug}, ${c.name}, ${systemId})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `;
  }
  console.log(`  ✓ ${conditions.length} conditions`);

  // Diagnostics
  const diagnostics = [
    { slug: "check-refrigerant-pressure", name: "Check Refrigerant Pressure" },
    { slug: "test-ac-capacitor", name: "Test AC Capacitor" },
    { slug: "test-compressor-relay", name: "Test Compressor Relay" },
  ];

  for (const d of diagnostics) {
    await sql`
      INSERT INTO diagnostics (slug, name, system_id) VALUES (${d.slug}, ${d.name}, ${systemId})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `;
  }
  console.log(`  ✓ ${diagnostics.length} diagnostics`);

  // Causes (with system_id for system-specific causes)
  const causes = [
    { slug: "low-refrigerant", name: "Low Refrigerant" },
    { slug: "dirty-condenser-coil", name: "Dirty Condenser Coil" },
    { slug: "bad-capacitor", name: "Bad Capacitor" },
  ];

  for (const c of causes) {
    await sql`
      INSERT INTO causes (slug, name, system_id) VALUES (${c.slug}, ${c.name}, ${systemId})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, system_id = EXCLUDED.system_id
    `;
  }
  console.log(`  ✓ ${causes.length} causes`);

  // Repairs
  const repairs = [
    { slug: "recharge-refrigerant", name: "Recharge Refrigerant" },
    { slug: "replace-capacitor", name: "Replace Capacitor" },
    { slug: "clean-condenser-coil", name: "Clean Condenser Coil" },
  ];

  for (const r of repairs) {
    await sql`
      INSERT INTO repairs (slug, name) VALUES (${r.slug}, ${r.name})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `;
  }
  console.log(`  ✓ ${repairs.length} repairs`);

  // Components
  const components = [
    { slug: "ac-capacitor", name: "AC Capacitor" },
    { slug: "ac-compressor", name: "AC Compressor" },
    { slug: "ac-contactor", name: "AC Contactor" },
  ];

  for (const c of components) {
    await sql`
      INSERT INTO components (slug, name) VALUES (${c.slug}, ${c.name})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `;
  }
  console.log(`  ✓ ${components.length} components`);

  // Junction: symptom_conditions
  const symCond = [
    ["ac-not-cooling", "compressor-running"],
    ["ac-not-cooling", "compressor-not-running"],
    ["ac-blowing-warm-air", "compressor-running"],
    ["ac-not-turning-on", "breaker-tripped"],
    ["ac-freezing-up", "unit-freezing"],
  ];

  for (const [symSlug, condSlug] of symCond) {
    const sym = await sql`SELECT id FROM symptoms WHERE slug = ${symSlug} LIMIT 1`;
    const cond = await sql`SELECT id FROM conditions WHERE slug = ${condSlug} LIMIT 1`;
    if ((sym as any[]).length && (cond as any[]).length) {
      await sql`
        INSERT INTO symptom_conditions (symptom_id, condition_id)
        VALUES (${(sym as any[])[0].id}, ${(cond as any[])[0].id})
        ON CONFLICT (symptom_id, condition_id) DO NOTHING
      `;
    }
  }
  console.log(`  ✓ symptom_conditions`);

  // Junction: symptom_causes (with confidence_score: 1.0 = most likely)
  const symCause: [string, string, number][] = [
    ["ac-not-cooling", "low-refrigerant", 1.0],
    ["ac-not-cooling", "dirty-condenser-coil", 0.8],
    ["ac-blowing-warm-air", "low-refrigerant", 1.0],
    ["ac-not-turning-on", "bad-capacitor", 1.0],
  ];

  for (const [symSlug, causeSlug, score] of symCause) {
    const sym = await sql`SELECT id FROM symptoms WHERE slug = ${symSlug} LIMIT 1`;
    const cause = await sql`SELECT id FROM causes WHERE slug = ${causeSlug} LIMIT 1`;
    if ((sym as any[]).length && (cause as any[]).length) {
      await sql`
        INSERT INTO symptom_causes (symptom_id, cause_id, confidence_score)
        VALUES (${(sym as any[])[0].id}, ${(cause as any[])[0].id}, ${score})
        ON CONFLICT (symptom_id, cause_id) DO UPDATE SET confidence_score = EXCLUDED.confidence_score
      `;
    }
  }
  console.log(`  ✓ symptom_causes`);

  // Junction: condition_causes (with confidence_score)
  const condCause: [string, string, number][] = [
    ["compressor-running", "low-refrigerant", 1.0],
    ["compressor-not-running", "bad-capacitor", 1.0],
    ["unit-freezing", "low-refrigerant", 1.0],
  ];

  for (const [condSlug, causeSlug, score] of condCause) {
    const cond = await sql`SELECT id FROM conditions WHERE slug = ${condSlug} LIMIT 1`;
    const cause = await sql`SELECT id FROM causes WHERE slug = ${causeSlug} LIMIT 1`;
    if ((cond as any[]).length && (cause as any[]).length) {
      await sql`
        INSERT INTO condition_causes (condition_id, cause_id, confidence_score)
        VALUES (${(cond as any[])[0].id}, ${(cause as any[])[0].id}, ${score})
        ON CONFLICT (condition_id, cause_id) DO UPDATE SET confidence_score = EXCLUDED.confidence_score
      `;
    }
  }
  console.log(`  ✓ condition_causes`);

  // Junction: condition_diagnostics
  const condDiag = [
    ["compressor-running", "check-refrigerant-pressure"],
    ["compressor-not-running", "test-ac-capacitor"],
    ["unit-freezing", "check-refrigerant-pressure"],
  ];

  for (const [condSlug, diagSlug] of condDiag) {
    const cond = await sql`SELECT id FROM conditions WHERE slug = ${condSlug} LIMIT 1`;
    const diag = await sql`SELECT id FROM diagnostics WHERE slug = ${diagSlug} LIMIT 1`;
    if ((cond as any[]).length && (diag as any[]).length) {
      await sql`
        INSERT INTO condition_diagnostics (condition_id, diagnostic_id)
        VALUES (${(cond as any[])[0].id}, ${(diag as any[])[0].id})
        ON CONFLICT (condition_id, diagnostic_id) DO NOTHING
      `;
    }
  }
  console.log(`  ✓ condition_diagnostics`);

  // Junction: diagnostic_causes (with confidence_score)
  const diagCause: [string, string, number][] = [
    ["check-refrigerant-pressure", "low-refrigerant", 1.0],
    ["test-ac-capacitor", "bad-capacitor", 1.0],
  ];

  for (const [diagSlug, causeSlug, score] of diagCause) {
    const diag = await sql`SELECT id FROM diagnostics WHERE slug = ${diagSlug} LIMIT 1`;
    const cause = await sql`SELECT id FROM causes WHERE slug = ${causeSlug} LIMIT 1`;
    if ((diag as any[]).length && (cause as any[]).length) {
      await sql`
        INSERT INTO diagnostic_causes (diagnostic_id, cause_id, confidence_score)
        VALUES (${(diag as any[])[0].id}, ${(cause as any[])[0].id}, ${score})
        ON CONFLICT (diagnostic_id, cause_id) DO UPDATE SET confidence_score = EXCLUDED.confidence_score
      `;
    }
  }
  console.log(`  ✓ diagnostic_causes`);

  // Junction: cause_repairs
  const causeRepair = [
    ["low-refrigerant", "recharge-refrigerant"],
    ["dirty-condenser-coil", "clean-condenser-coil"],
    ["bad-capacitor", "replace-capacitor"],
  ];

  for (const [causeSlug, repairSlug] of causeRepair) {
    const cause = await sql`SELECT id FROM causes WHERE slug = ${causeSlug} LIMIT 1`;
    const repair = await sql`SELECT id FROM repairs WHERE slug = ${repairSlug} LIMIT 1`;
    if ((cause as any[]).length && (repair as any[]).length) {
      await sql`
        INSERT INTO cause_repairs (cause_id, repair_id)
        VALUES (${(cause as any[])[0].id}, ${(repair as any[])[0].id})
        ON CONFLICT (cause_id, repair_id) DO NOTHING
      `;
    }
  }
  console.log(`  ✓ cause_repairs`);

  // Junction: repair_components
  const repairComp = [
    ["recharge-refrigerant", "ac-compressor"],
    ["replace-capacitor", "ac-capacitor"],
    ["clean-condenser-coil", "ac-compressor"],
  ];

  for (const [repairSlug, compSlug] of repairComp) {
    const repair = await sql`SELECT id FROM repairs WHERE slug = ${repairSlug} LIMIT 1`;
    const comp = await sql`SELECT id FROM components WHERE slug = ${compSlug} LIMIT 1`;
    if ((repair as any[]).length && (comp as any[]).length) {
      await sql`
        INSERT INTO repair_components (repair_id, component_id)
        VALUES (${(repair as any[])[0].id}, ${(comp as any[])[0].id})
        ON CONFLICT (repair_id, component_id) DO NOTHING
      `;
    }
  }
  console.log(`  ✓ repair_components`);

  // Diagnostic steps for wizard
  const diagSteps = await sql`SELECT id FROM diagnostics WHERE slug = 'test-ac-capacitor' LIMIT 1`;
  const diagId = (diagSteps as any[])[0]?.id;
  if (diagId) {
    await sql`DELETE FROM diagnostic_steps WHERE diagnostic_id = ${diagId}`;
    await sql`
      INSERT INTO diagnostic_steps (diagnostic_id, step_order, question, yes_cause_slug, no_cause_slug)
      VALUES 
        (${diagId}, 1, 'Does the outdoor fan spin when you turn on the AC?', NULL, NULL),
        (${diagId}, 2, 'Do you hear a humming sound from the outdoor unit?', 'bad-capacitor', NULL)
    `;
  }
  console.log(`  ✓ diagnostic_steps`);

  // Sample cities
  const cities = [
    { slug: "phoenix", city: "Phoenix", state: "AZ" },
    { slug: "las-vegas", city: "Las Vegas", state: "NV" },
  ];

  for (const c of cities) {
    await sql`
      INSERT INTO cities (slug, city, state) VALUES (${c.slug}, ${c.city}, ${c.state})
      ON CONFLICT (slug) DO UPDATE SET city = EXCLUDED.city, state = EXCLUDED.state
    `;
  }
  console.log(`  ✓ ${cities.length} cities`);

  console.log("\n✅ HVAC Revenue Boost graph seeded successfully.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
