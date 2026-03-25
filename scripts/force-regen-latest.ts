import * as dotenv from 'dotenv'; dotenv.config({ path: '.env.local' });
import sql from '../lib/db';
import { generateDiagnosticEngineJson } from '../lib/content-engine/generator';

async function main() {
  const rows = await sql`
    SELECT slug, page_type 
    FROM pages 
    WHERE schema_version = 'v2_goldstandard' 
    ORDER BY updated_at DESC 
    LIMIT 1
  `;
  
  let targetSlug = "ac-not-cooling";
  let targetType = "symptom";

  if (rows.length > 0) {
    targetSlug = rows[0].slug;
    targetType = rows[0].page_type || "symptom";
  }

  console.log(`🚀 Force regenerating active test page: ${targetSlug} (${targetType})`);

  try {
    const result = await generateDiagnosticEngineJson(targetSlug, {
      slug: targetSlug,
      system: "HVAC",
      pageType: targetType,
      coreOnly: false,
      schemaVersion: "v2_goldstandard"
    });

    console.log("✅ AI Generation complete. Updating database...");

    await sql`
      UPDATE pages 
      SET content_json = ${JSON.stringify(result)}::jsonb, schema_version = 'v2_goldstandard'
      WHERE slug = ${targetSlug}
    `;
    console.log(`🎉 Successfully regenerated and saved to DB: ${targetSlug}`);
  } catch (err) {
    console.error("❌ Generation failed:", err);
  }
  process.exit(0);
}

main();
