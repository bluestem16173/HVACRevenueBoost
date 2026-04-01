import "dotenv/config";
import sql from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function seedV2Test() {
  const payloadPath = path.join(process.cwd(), 'data', 'v2-diagnose-hvac-blowing-warm-air.json');
  const payloadRaw = fs.readFileSync(payloadPath, 'utf8');
  let payload: any = {};
  try {
    payload = JSON.parse(payloadRaw);
  } catch (e) {
    console.error("Parse failed");
    return;
  }

  const slug = "diagnose/hvac-blowing-warm-air";

  // Check if exists
  const existing = await sql`SELECT slug FROM pages WHERE slug = ${slug}`;
  
  if (existing.length > 0) {
    console.log("Updating existing page...");
    await sql`
      UPDATE pages 
      SET content_json = ${payload}, 
          schema_version = 'decisiongrid_v2' 
      WHERE slug = ${slug}
    `;
  } else {
    console.log("Inserting new page...");
    await sql`
      INSERT INTO pages (slug, title, page_type, content_json, schema_version)
      VALUES (${slug}, ${payload.title}, 'diagnose', ${payload}, 'decisiongrid_v2')
    `;
  }

  console.log("Done seeding to Neon DB. URL should be /diagnose/hvac-blowing-warm-air");
  process.exit(0);
}

seedV2Test().catch(console.error);
