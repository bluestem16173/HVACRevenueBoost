import "dotenv/config";
import sql from "../lib/db";
import * as fs from "fs";

async function run() {
  console.log("🚀 Inserting ac-leaking-water Canary into Database...");
  try {
    const raw = fs.readFileSync("dg-test-output.json", "utf-8");
    const json = JSON.parse(raw);

    const slug = "ac-leaking-water";
    const city = "Tampa";
    const pageType = "diagnose";
    const contentStr = JSON.stringify(json);

    await sql`
      INSERT INTO pages (slug, city, page_type, status, quality_status, content_json, schema_version)
      VALUES (${slug}, ${city}, ${pageType}, 'validated', 'draft', ${contentStr}::jsonb, 'v5_master')
      ON CONFLICT (slug) 
      DO UPDATE SET 
        content_json = ${contentStr}::jsonb,
        schema_version = 'v5_master',
        status = 'validated',
        quality_status = 'draft',
        updated_at = NOW()
    `;

    console.log(\`✅ Successfully inserted \${slug}!\`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Insertion Failed:", err);
    process.exit(1);
  }
}

run();
