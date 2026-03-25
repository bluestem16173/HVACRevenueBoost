import "dotenv/config";
import sql from "../lib/db";
import fs from "fs";

async function run() {
  const rows = await sql`
    SELECT slug, status, quality_score, content_json
    FROM pages 
    WHERE page_type = 'system'
    ORDER BY updated_at DESC 
    LIMIT 10
  `;
  
  const formatted = (rows as any[]).map(r => ({
    slug: r.slug,
    raw_snippet: JSON.stringify(r.content_json).slice(0, 500)
  }));
  
  fs.writeFileSync('db-results-systems.txt', JSON.stringify(formatted, null, 2));
  console.log("Wrote " + rows.length + " rows to db-results-systems.txt");
  process.exit(0);
}

run().catch(console.error);
