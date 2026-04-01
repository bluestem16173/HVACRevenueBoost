require("dotenv/config");
const { Client } = require("pg");
const fs = require("fs");

async function run() {
  console.log("🚀 Inserting ac-leaking-water Canary into Database using raw PG...");
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    const raw = fs.readFileSync("dg-test-output.json", "utf-8");
    const json = JSON.parse(raw);

    const slug = "ac-leaking-water";
    const city = "Tampa";
    const pageType = "diagnose";

    await client.connect();

    const query = \`
      INSERT INTO pages (slug, city, page_type, status, quality_status, content_json, schema_version)
      VALUES ($1, $2, $3, 'validated', 'draft', $4::jsonb, 'v5_master')
      ON CONFLICT (slug) 
      DO UPDATE SET 
        content_json = EXCLUDED.content_json,
        schema_version = 'v5_master',
        status = 'validated',
        quality_status = 'draft',
        updated_at = NOW()
    \`;

    await client.query(query, [slug, city, pageType, JSON.stringify(json)]);

    console.log(\`✅ Successfully inserted \${slug}!\`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Insertion Failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
