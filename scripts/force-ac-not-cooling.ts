import "dotenv/config";
import sql from "../lib/db";
import { generateDiagnosticEngineJson } from "../lib/content-engine/generator";
import { validatePage } from "../lib/validators/page-validator";

async function run() {
  console.log("🚀 Generating ac-not-cooling via Master Prompt...");
  try {
    const rawDg = await generateDiagnosticEngineJson("ac-not-cooling", {
      slug: "ac-not-cooling",
      system: "HVAC",
      pageType: "symptom",
      coreOnly: false,
      schemaVersion: "v2_goldstandard",
      bypassAutoMode: true,
    });

    console.log("💎 Validator check:");
    const valRes = validatePage(rawDg);
    
    if (!valRes.valid) {
      console.error("❌ Failed structural validation:", valRes.errors);
      process.exit(1);
    }
    console.log("✅ Validation passed. Forcing 'published' status into the Neon DB so the frontend router picks it up...");

    await sql`
      INSERT INTO pages (slug, title, page_type, status, content_json, schema_version)
      VALUES (
        'ac-not-cooling',
        'AC Not Cooling',
        'symptom',
        'published',
        ${JSON.stringify(rawDg)}::jsonb,
        'v2_goldstandard'
      )
      ON CONFLICT (slug) DO UPDATE
      SET content_json = EXCLUDED.content_json,
          status = 'published',
          schema_version = 'v2_goldstandard',
          updated_at = NOW();
    `;

    console.log("✅ Successfully injected! You can now render the page.");
    process.exit(0);
  } catch (err: any) {
    console.error("CRITICAL ERROR:", err.message || err);
    process.exit(1);
  }
}
run();
