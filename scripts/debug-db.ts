import "dotenv/config";
import sql from '../lib/db';

async function fix() {
  console.log("Analyzing DB state for ac-not-cooling...");
  const rows = await sql`
    SELECT id, slug, page_type, schema_version 
    FROM pages 
    WHERE slug = 'ac-not-cooling'
  `;
  console.log("Existing Rows:", rows);

  // Take the v2_goldstandard row's content_json
  const v2Row = rows.find(r => r.schema_version === 'v2_goldstandard');
  if (v2Row) {
     console.log("V2 Row Found. Overwriting all other rows for this slug to perfectly match V2.");
     await sql`
       UPDATE pages 
       SET content_json = (SELECT content_json FROM pages WHERE id = ${v2Row.id}), 
           schema_version = 'v2_goldstandard'
       WHERE slug = 'ac-not-cooling'
     `;
     console.log("Done syncing DB rows.");
  } else {
     console.log("CRITICAL: NO V2 ROW FOUND AT ALL!");
  }
  process.exit(0);
}
fix();
