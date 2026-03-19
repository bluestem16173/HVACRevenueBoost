import "dotenv/config";
import sql from "../lib/db";

async function run() {
  const rows = await sql`
    SELECT slug, title, quality_score, status, updated_at
    FROM pages
    WHERE page_type = 'symptom'
      AND slug LIKE 'diagnose/%'
    ORDER BY updated_at DESC
    LIMIT 20
  ` as any[];

  console.log(`\n📋 ${rows.length} recently generated symptom pages:\n`);
  rows.forEach(r => {
    const localUrl = `http://localhost:3002/${r.slug}`;
    console.log(`  [${r.quality_score}] ${String(r.status).padEnd(12)} ${localUrl}`);
  });

  process.exit(0);
}

run().catch(console.error);
