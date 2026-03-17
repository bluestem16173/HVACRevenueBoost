import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Client } from "pg";

const url = (process.env.DATABASE_URL || "").trim().replace(/^['"]|['"]$/g, "");
const c = new Client({ connectionString: url });

(async () => {
  await c.connect();

  const tables = [
    "systems",
    "symptoms",
    "causes",
    "repairs",
    "components",
    "tools",
    "environments",
    "vehicle_models",
    "cities",
  ];

  console.log("=== SEEDED CATEGORIES ===\n");

  for (const t of tables) {
    const r = await c.query(`SELECT COUNT(*) as cnt FROM public.${t}`);
    const count = r.rows[0].cnt;
    const sample = await c.query(`SELECT * FROM public.${t} LIMIT 5`);
    const cols = sample.rows[0]
      ? Object.keys(sample.rows[0]).filter((k) => !k.includes("created") && !k.includes("updated")).slice(0, 5)
      : [];
    console.log(`${t.toUpperCase()}: ${count} rows`);
    if (sample.rows.length) {
      sample.rows.forEach((row) => {
        const vals = cols.map((col) => (row[col] != null ? String(row[col]).slice(0, 40) : ""));
        console.log(`  • ${vals.join(" | ")}`);
      });
    }
    console.log("");
  }

  console.log("=== RELATIONSHIPS ===\n");
  const rel = await c.query(`
    SELECT 'symptom_causes' AS t, COUNT(*) AS c FROM symptom_causes
    UNION ALL SELECT 'cause_repairs', COUNT(*) FROM cause_repairs
    UNION ALL SELECT 'generation_queue', COUNT(*) FROM generation_queue
    UNION ALL SELECT 'related_nodes', COUNT(*) FROM related_nodes
  `);
  rel.rows.forEach((r) => console.log(`  ${r.t}: ${r.c}`));

  await c.end();
})();
