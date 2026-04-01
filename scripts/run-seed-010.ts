import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

/**
 * Run seed 010: Initial Knowledge Graph
 * DecisionGrid + HVAC Revenue Boost
 * Run AFTER migration 010. Idempotent.
 * Usage: npx tsx scripts/run-seed-010.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";
import { CITIES } from "../data/knowledge-graph";

const url = (process.env.DATABASE_URL || "").trim().replace(/^['"]|['"]$/g, "");
if (!url) {
  console.error("DATABASE_URL not set. Check .env.local");
  process.exit(1);
}

function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inBlock = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (!inBlock) {
      if (c === "$" && sql[i + 1] === "$") {
        inBlock = true;
        buf += c;
        i++;
        continue;
      }
      if (c === ";" && !buf.trim().endsWith("$$")) {
        const s = buf.trim();
        if (s && !s.startsWith("--")) out.push(s + ";");
        buf = "";
        continue;
      }
    } else {
      if (c === "$" && sql.slice(i, i + 2) === "$$") {
        buf += "$$";
        i++;
        inBlock = false;
        continue;
      }
    }
    buf += c;
  }
  const s = buf.trim();
  if (s && !s.startsWith("--")) out.push(s + (s.endsWith(";") ? "" : ";"));
  return out;
}

async function runSqlFile(client: Client, path: string) {
  let sql = readFileSync(path, "utf-8");
  sql = sql.replace(/^\s*BEGIN;\s*/i, "").replace(/\s*COMMIT;\s*$/i, "");
  sql = sql.replace(/^--[^\n]*\n/gm, ""); // strip comment lines so they don't get merged with statements
  const stmts = splitStatements(sql);
  if (stmts.length === 0) {
    console.warn("   No statements parsed from SQL file");
    return 0;
  }
  let ok = 0;
  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[i];
    try {
      await client.query(stmt);
      ok++;
    } catch (e: any) {
      await client.query("ROLLBACK").catch(() => {}); // clear aborted tx so next query can run
      if (e?.code === "23505" || e?.message?.includes("already exists")) ok++;
      else if (e?.code === "42P01") {
        console.warn("Skip (table missing):", stmt.slice(0, 50) + "...", "→", e?.message?.slice(0, 50));
      } else {
        const preview = stmt.slice(0, 80).replace(/\s+/g, " ");
        console.warn("Skip [#" + i + "]:", preview + "...", "→", e?.message?.slice(0, 80));
      }
    }
  }
  return ok;
}

async function runMigration012(client: Client) {
  const path = join(process.cwd(), "db", "migrations", "012_fix_seed_failures.sql");
  try {
    const sql = readFileSync(path, "utf-8")
      .replace(/^\s*BEGIN;\s*/i, "")
      .replace(/\s*COMMIT;\s*$/i, "")
      .replace(/^--[^\n]*\n/gm, "");
    const stmts = splitStatements(sql);
    for (const stmt of stmts) {
      if (!stmt.trim()) continue;
      try {
        await client.query(stmt);
      } catch (e: any) {
        await client.query("ROLLBACK").catch(() => {});
        if (e?.code !== "42701" && e?.code !== "42P07" && !e?.message?.includes("already exists")) {
          console.warn("   Migration 012 skip:", e?.message?.slice(0, 60));
        }
      }
    }
  } catch {
    /* migration file missing is ok */
  }
}

async function runMigration011(client: Client) {
  const path = join(process.cwd(), "db", "migrations", "011_seed_schema_compatibility.sql");
  try {
    const sql = readFileSync(path, "utf-8")
      .replace(/^\s*BEGIN;\s*/i, "")
      .replace(/\s*COMMIT;\s*$/i, "")
      .replace(/^--[^\n]*\n/gm, "");
    const stmts = splitStatements(sql);
    for (const stmt of stmts) {
      if (!stmt.trim()) continue;
      try {
        await client.query(stmt);
      } catch (e: any) {
        await client.query("ROLLBACK").catch(() => {});
        if (e?.code !== "42701" && e?.code !== "42P07" && !e?.message?.includes("already exists")) {
          console.warn("   Migration 011 skip:", e?.message?.slice(0, 60));
        }
      }
    }
  } catch {
    /* migration file missing is ok */
  }
}

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    console.log("📦 Running migration 011 (seed schema compatibility)...");
    await runMigration011(client);
    console.log("📦 Running migration 012 (fix seed failures)...");
    await runMigration012(client);

    // Phase 1-8: Run SQL seed file
    console.log("📦 Running phases 1-8 (systems, symptoms, causes, repairs, components, tools, environments, vehicle_models)...");
    const sqlPath = join(process.cwd(), "db", "seeds", "010_seed_initial_knowledge_graph.sql");
    const applied = await runSqlFile(client, sqlPath);
    console.log(`   ${applied} statements applied.`);

    // Phase 9: Parts (needs component_id) - skip if parts table missing
    console.log("📦 Phase 9: Parts...");
    const partsExists = await client.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'parts' LIMIT 1");
    if (partsExists.rows.length > 0) {
      const comps = await client.query("SELECT id, slug FROM components WHERE slug IN ('capacitor','contactor','blower-motor','thermostat','control-board')");
      for (const comp of comps.rows) {
        await client.query(
          `INSERT INTO parts (component_id, name, slug, affiliate_url) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING`,
          [comp.id, `AC ${comp.slug.replace(/-/g, " ")}`, `ac-${comp.slug}`, "https://amazon.com/dp/placeholder"]
        );
      }
      await client.query(`INSERT INTO parts (name, slug, affiliate_url) VALUES ('RV AC Fan Motor', 'rv-ac-fan-motor', 'https://amazon.com/dp/placeholder') ON CONFLICT (slug) DO NOTHING`);
      await client.query(`INSERT INTO parts (name, slug, affiliate_url) VALUES ('RV Furnace Ignitor', 'rv-furnace-ignitor', 'https://amazon.com/dp/placeholder') ON CONFLICT (slug) DO NOTHING`);
    } else {
      console.log("   (parts table not found, skipping)");
    }

    // Phase 10: Cities (200 from knowledge-graph)
    console.log("📦 Phase 10: Cities...");
    const citiesCols = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'cities' AND column_name IN ('state_code','country')
    `);
    const hasStateCode = citiesCols.rows.some((r) => r.column_name === "state_code");
    const hasCountry = citiesCols.rows.some((r) => r.column_name === "country");
    const cityCols = hasStateCode && hasCountry
      ? "(city, state, state_code, slug, country)"
      : "(city, state, slug)";
    const cityVals = hasStateCode && hasCountry
      ? "($1, $2, $2, $3, 'US')"
      : "($1, $2, $3)";
    let citiesInserted = 0;
    for (const c of CITIES) {
      try {
        const res = await client.query(
          `INSERT INTO cities ${cityCols} VALUES ${cityVals} ON CONFLICT (slug) DO NOTHING RETURNING id`,
          [c.name, c.state, c.slug]
        );
        if (res.rowCount && res.rowCount > 0) citiesInserted++;
      } catch (e: any) {
        if (e?.code !== "23505") console.warn("City insert skip:", c.slug, e?.message?.slice(0, 50));
      }
    }
    console.log(`   ${citiesInserted} new cities inserted (${CITIES.length} total).`);

    // Phase 11: Symptom-Cause relationships
    console.log("📦 Phase 11: Symptom-Cause relationships...");
    const symptomPairs: [string, string[]][] = [
      ["ac-not-cooling", ["low-refrigerant", "bad-capacitor", "dirty-condenser-coils", "clogged-air-filter", "faulty-thermostat"]],
      ["ac-blowing-warm-air", ["low-refrigerant", "bad-capacitor", "dirty-condenser-coils", "clogged-air-filter", "bad-contactor"]],
      ["ac-short-cycling", ["clogged-air-filter", "low-refrigerant", "faulty-thermostat", "dirty-condenser-coils"]],
      ["ac-not-turning-on", ["tripped-breaker", "blown-fuse", "faulty-thermostat", "loose-wiring"]],
      ["ac-freezing-up", ["clogged-air-filter", "low-refrigerant", "frozen-evaporator-coil", "blocked-return-vent"]],
      ["ac-fan-not-running", ["bad-capacitor", "bad-fan-motor", "failed-control-board"]],
      ["ac-compressor-not-starting", ["bad-capacitor", "bad-contactor", "failed-compressor"]],
      ["ac-leaking-water", ["clogged-drain-line", "frozen-evaporator-coil"]],
      ["furnace-not-heating", ["worn-igniter", "dirty-flame-sensor", "faulty-thermostat", "clogged-air-filter"]],
      ["furnace-blowing-cold-air", ["worn-igniter", "dirty-flame-sensor", "faulty-thermostat"]],
    ];
    for (const [symSlug, causeSlugs] of symptomPairs) {
      for (const causeSlug of causeSlugs) {
        await client.query(
          `INSERT INTO symptom_causes (symptom_id, cause_id) SELECT s.id, c.id FROM symptoms s, causes c WHERE s.slug = $1 AND c.slug = $2 ON CONFLICT (symptom_id, cause_id) DO NOTHING`,
          [symSlug, causeSlug]
        );
      }
    }

    // Phase 12: Cause-Repair relationships
    console.log("📦 Phase 12: Cause-Repair relationships...");
    const causeRepairPairs: [string, string[]][] = [
      ["bad-capacitor", ["replace-capacitor"]],
      ["low-refrigerant", ["recharge-refrigerant"]],
      ["clogged-air-filter", ["replace-air-filter"]],
      ["dirty-condenser-coils", ["clean-condenser-coil"]],
      ["faulty-thermostat", ["replace-thermostat"]],
      ["tripped-breaker", ["reset-breaker"]],
      ["blown-fuse", ["replace-fuse"]],
      ["failed-compressor", ["replace-compressor"]],
      ["bad-contactor", ["replace-contactor"]],
      ["frozen-evaporator-coil", ["defrost-evaporator-coil"]],
      ["blocked-return-vent", ["unblock-return"]],
      ["failed-control-board", ["replace-control-board"]],
      ["bad-fan-motor", ["replace-fan-motor"]],
      ["clogged-drain-line", ["clear-drain-line"]],
      ["worn-igniter", ["replace-igniter"]],
      ["dirty-flame-sensor", ["clean-flame-sensor"]],
    ];
    for (const [causeSlug, repairSlugs] of causeRepairPairs) {
      for (const repairSlug of repairSlugs) {
        await client.query(
          `INSERT INTO cause_repairs (cause_id, repair_id) SELECT c.id, r.id FROM public.causes c, public.repairs r WHERE c.slug = $1 AND r.slug = $2 ON CONFLICT (cause_id, repair_id) DO NOTHING`,
          [causeSlug, repairSlug]
        );
      }
    }

    // Phase 13: Generation queue (500 pages)
    console.log("📦 Phase 13: Generation queue...");
    const symptoms = await client.query("SELECT id, slug, name FROM symptoms WHERE system_id IN (SELECT id FROM systems WHERE slug IN ('residential-hvac','rv-hvac'))");
    const cities = await client.query("SELECT slug, city, state FROM cities LIMIT 50");
    let queueCount = 0;

    // Symptom pages (diagnose/slug)
    for (const sym of symptoms.rows) {
      const slug = `diagnose/${sym.slug}`;
      const exists = await client.query("SELECT 1 FROM generation_queue WHERE proposed_slug = $1 LIMIT 1", [slug]);
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO generation_queue (page_type, proposed_slug, proposed_title, symptom_id, status) VALUES ('symptom', $1, $2, $3, 'draft')`,
          [slug, `${sym.name} | Causes, Diagnosis, Repair`, sym.id]
        );
        queueCount++;
      }
    }

    // City x symptom pages (repair/city/symptom) — page_type=repair, city=geo
    for (const city of cities.rows) {
      for (const sym of symptoms.rows.slice(0, 10)) {
        const slug = `repair/${city.slug}/${sym.slug}`;
        const exists = await client.query("SELECT 1 FROM generation_queue WHERE proposed_slug = $1 LIMIT 1", [slug]);
        if (exists.rows.length === 0) {
          await client.query(
            `INSERT INTO generation_queue (page_type, proposed_slug, proposed_title, symptom_id, city, status) VALUES ('repair', $1, $2, $3, $4, 'draft')`,
            [slug, `${sym.name} Repair in ${city.city}, ${city.state}`, sym.id, city.city]
          );
          queueCount++;
        }
      }
    }

    // Repair pages
    const repairs = await client.query("SELECT id, slug, name FROM repairs LIMIT 30");
    for (const rep of repairs.rows) {
      const slug = `fix/${rep.slug}`;
      const exists = await client.query("SELECT 1 FROM generation_queue WHERE proposed_slug = $1 LIMIT 1", [slug]);
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO generation_queue (page_type, proposed_slug, proposed_title, repair_id, status) VALUES ('repair', $1, $2, $3, 'draft')`,
          [slug, `${rep.name} | HVAC Repair Guide`, rep.id]
        );
        queueCount++;
      }
    }
    console.log(`   ${queueCount} new queue items added.`);

    // Phase 14: Related nodes (sample)
    console.log("📦 Phase 14: Related nodes...");
    const symSlugs = symptoms.rows.slice(0, 5).map((r) => r.slug);
    for (const src of symSlugs) {
      for (const tgt of symSlugs) {
        if (src === tgt) continue;
        try {
          await client.query(
            `INSERT INTO related_nodes (source_type, source_id, source_slug, target_type, target_id, target_slug, relation_type, score, is_bidirectional) VALUES ('symptom', $1, $2, 'symptom', $3, $4, 'related-problem', 0.8, true) ON CONFLICT (source_slug, target_slug, relation_type) DO NOTHING`,
            [`diagnose/${src}`, `diagnose/${src}`, `diagnose/${tgt}`, `diagnose/${tgt}`]
          );
        } catch (e: any) {
          if (e?.code !== "23505") console.warn("   related_nodes skip:", e?.message?.slice(0, 50));
        }
      }
    }

    // Summary (skip vehicle_models if table missing)
    const countQueries = [
      "SELECT 'systems' AS tbl, COUNT(*)::int AS cnt FROM systems",
      "SELECT 'symptoms' AS tbl, COUNT(*)::int AS cnt FROM symptoms",
      "SELECT 'causes' AS tbl, COUNT(*)::int AS cnt FROM causes",
      "SELECT 'repairs' AS tbl, COUNT(*)::int AS cnt FROM repairs",
      "SELECT 'components' AS tbl, COUNT(*)::int AS cnt FROM components",
      "SELECT 'tools' AS tbl, COUNT(*)::int AS cnt FROM tools",
      "SELECT 'environments' AS tbl, COUNT(*)::int AS cnt FROM environments",
      "SELECT 'cities' AS tbl, COUNT(*)::int AS cnt FROM cities",
      "SELECT 'generation_queue' AS tbl, COUNT(*)::int AS cnt FROM generation_queue",
      "SELECT 'symptom_causes' AS tbl, COUNT(*)::int AS cnt FROM symptom_causes",
      "SELECT 'cause_repairs' AS tbl, COUNT(*)::int AS cnt FROM cause_repairs",
      "SELECT 'related_nodes' AS tbl, COUNT(*)::int AS cnt FROM related_nodes",
    ];
    const vmExists = await client.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_models' LIMIT 1");
    if (vmExists.rows.length > 0) countQueries.splice(7, 0, "SELECT 'vehicle_models' AS tbl, COUNT(*)::int AS cnt FROM vehicle_models");
    const counts = await client.query(countQueries.join(" UNION ALL "));

    console.log("\n✅ Seed 010 complete. Row counts:");
    for (const r of counts.rows) {
      console.log(`   ${r.tbl}: ${r.cnt}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
