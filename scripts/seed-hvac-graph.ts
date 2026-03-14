/**
 * Seed HVAC diagnostic graph schema from static knowledge.
 * Run after: psql $DATABASE_URL -f scripts/migrations/002-hvac-diagnostic-graph-schema.sql
 *
 * Usage: npx tsx scripts/seed-hvac-graph.ts
 *
 * Populates: pillars, clusters, symptoms, condition_patterns, conditions,
 *            causes, repairs, components, condition_causes, repair_components
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });
import { CLUSTERS } from "../lib/clusters";
import { CONDITIONS } from "../lib/conditions";
import { CONDITION_PATTERNS } from "../lib/condition-patterns";
import { SYMPTOMS, CAUSES, REPAIRS } from "../data/knowledge-graph";

const sql = neon(process.env.DATABASE_URL!);

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  console.log("🌱 Seeding HVAC diagnostic graph...\n");

  // 1. Pillars
  const pillarSlugs = Array.from(new Set(CLUSTERS.map((c) => c.pillarSlug)));
  const pillarMap: Record<string, string> = {};
  for (const slug of pillarSlugs) {
    const name = slug
      .replace("hvac-", "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    const [row] = await sql`
      INSERT INTO hvac.pillars (name, slug, description)
      VALUES (${name}, ${slug}, ${`HVAC ${name} diagnostics and repair guides.`})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    pillarMap[slug] = (row as any).id;
  }
  console.log(`  ✓ Pillars: ${pillarSlugs.length}`);

  // 2. Clusters
  const clusterMap: Record<string, string> = {};
  for (const c of CLUSTERS) {
    const pillarId = pillarMap[c.pillarSlug];
    if (!pillarId) continue;
    const [row] = await sql`
      INSERT INTO hvac.clusters (pillar_id, name, slug, description)
      VALUES (${pillarId}, ${c.name}, ${c.slug}, ${c.description})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING id
    `;
    clusterMap[c.slug] = (row as any).id;
  }
  console.log(`  ✓ Clusters: ${CLUSTERS.length}`);

  // 3. Symptoms (from knowledge-graph, map to cluster via first cluster containing them)
  const symptomMap: Record<string, string> = {};
  for (const s of SYMPTOMS) {
    const cluster = CLUSTERS.find((c) => c.symptomIds.includes(s.id));
    const clusterId = cluster ? clusterMap[cluster.slug] : null;
    if (!clusterId) {
      console.warn(`  ⚠ Symptom ${s.id} has no cluster, skipping`);
      continue;
    }
    const [row] = await sql`
      INSERT INTO hvac.symptoms (cluster_id, name, slug, description)
      VALUES (${clusterId}, ${s.name}, ${s.id}, ${s.description})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING id
    `;
    symptomMap[s.id] = (row as any).id;
  }
  console.log(`  ✓ Symptoms: ${Object.keys(symptomMap).length}`);

  // 4. Condition patterns
  const patternMap: Record<string, string> = {};
  const patterns = await sql`SELECT id, slug_suffix FROM hvac.condition_patterns`;
  for (const p of patterns as any[]) {
    patternMap[p.slug_suffix] = p.id;
  }
  if (Object.keys(patternMap).length === 0) {
    for (let i = 0; i < CONDITION_PATTERNS.length; i++) {
      const p = CONDITION_PATTERNS[i];
      const [row] = await sql`
        INSERT INTO hvac.condition_patterns (pattern, slug_suffix, category, priority)
        VALUES (${p.suffix}, ${p.slugSuffix}, ${"context"}, ${i + 1})
        RETURNING id
      `;
      if (row) patternMap[p.slugSuffix] = (row as any).id;
    }
  }
  console.log(`  ✓ Condition patterns: ${Object.keys(patternMap).length}`);

  // 5. Conditions
  const conditionMap: Record<string, string> = {};
  for (const c of CONDITIONS) {
    const symptomId = symptomMap[c.symptomId];
    if (!symptomId) continue;
    const [row] = await sql`
      INSERT INTO hvac.conditions (symptom_id, name, slug, description)
      VALUES (${symptomId}, ${c.name}, ${c.slug}, ${c.description})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING id
    `;
    conditionMap[c.slug] = (row as any).id;
  }
  console.log(`  ✓ Conditions: ${Object.keys(conditionMap).length}`);

  // 6. Causes
  const causeMap: Record<string, string> = {};
  for (const [slug, ca] of Object.entries(CAUSES)) {
    const [row] = await sql`
      INSERT INTO hvac.causes (name, slug, description)
      VALUES (${ca.name}, ${slug}, ${ca.explanation})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING id
    `;
    causeMap[slug] = (row as any).id;
  }
  console.log(`  ✓ Causes: ${Object.keys(causeMap).length}`);

  // 7. Repairs (each repair links to cause that lists it in repairs[])
  const repairMap: Record<string, string> = {};
  for (const [slug, r] of Object.entries(REPAIRS)) {
    const primaryCause = Object.entries(CAUSES).find(([, c]) => (c.repairs || []).includes(slug));
    const causeIdFinal = primaryCause ? causeMap[primaryCause[0]] : null;
    if (!causeIdFinal) continue;
    const [row] = await sql`
      INSERT INTO hvac.repairs (cause_id, name, slug, description, estimated_cost)
      VALUES (${causeIdFinal}, ${r.name}, ${slug}, ${r.description}, ${r.estimatedCost})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING id
    `;
    repairMap[slug] = (row as any).id;
  }
  console.log(`  ✓ Repairs: ${Object.keys(repairMap).length}`);

  // 8. Components (from repair components)
  const componentSlugs = Array.from(new Set(Object.values(REPAIRS).map((r) => r.component?.replace(/\s+/g, "-")).filter(Boolean) as string[]));
  const componentMap: Record<string, string> = {};
  for (const slug of componentSlugs) {
    const name = (slug || "").replace(/-/g, " ");
    const [row] = await sql`
      INSERT INTO hvac.components (name, slug, description)
      VALUES (${name}, ${slug}, ${`HVAC ${name} component.`})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    componentMap[slug!] = (row as any).id;
  }
  console.log(`  ✓ Components: ${Object.keys(componentMap).length}`);

  // 9. Condition ↔ Cause
  let ccCount = 0;
  for (const c of CONDITIONS) {
    const condId = conditionMap[c.slug];
    if (!condId) continue;
    for (const causeSlug of c.causeIds) {
      const causeId = causeMap[causeSlug];
      if (!causeId) continue;
      await sql`
        INSERT INTO hvac.condition_causes (condition_id, cause_id)
        VALUES (${condId}, ${causeId})
        ON CONFLICT DO NOTHING
      `;
      ccCount++;
    }
  }
  console.log(`  ✓ Condition-Cause links: ${ccCount}`);

  // 10. Repair ↔ Component
  let rcCount = 0;
  for (const [repairSlug, r] of Object.entries(REPAIRS)) {
    const repairId = repairMap[repairSlug];
    if (!repairId || !r.component) continue;
    const compSlug = r.component.replace(/\s+/g, "-");
    const compId = componentMap[compSlug];
    if (!compId) continue;
    await sql`
      INSERT INTO hvac.repair_components (repair_id, component_id)
      VALUES (${repairId}, ${compId})
      ON CONFLICT DO NOTHING
    `;
    rcCount++;
  }
  console.log(`  ✓ Repair-Component links: ${rcCount}`);

  console.log("\n✅ HVAC graph seeded successfully.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
