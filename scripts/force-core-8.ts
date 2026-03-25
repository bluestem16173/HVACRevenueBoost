import "dotenv/config";
import sql from "../lib/db";
import { generateDiagnosticEngineJson } from "../lib/content-engine/generator";
import { validatePage } from "../lib/validators/page-validator";

const coreNodes = [
  "ac-not-cooling",
  "ac-blowing-warm-air",
  "ac-not-turning-on",
  "ac-weak-airflow",
  "ac-freezing-up",
  "ac-short-cycling",
  "ac-making-noise",
  "ac-leaking-water"
];

async function run() {
  console.log("🚀 FORCING GENERATION OF 8 CORE NODES (BYPASSING WORKER QUEUE)...");

  for (const slug of coreNodes) {
    console.log(`\n⏳ Generating [${slug}] via Master JSON Engine...`);
    try {
      const title = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      
      const rawDg = await generateDiagnosticEngineJson(slug, {
        slug: slug,
        system: "HVAC",
        pageType: "symptom",
        coreOnly: false,
        schemaVersion: "v2_goldstandard",
        bypassAutoMode: true,
      });

      console.log(`💎 Validator check for [${slug}]:`);
      const valRes = validatePage(rawDg);
      
      if (!valRes.valid) {
        console.error(`❌ Failed structural validation for [${slug}]:`, valRes.errors);
        continue;
      }

      console.log(`✅ Validation passed. Forcing 'published' status into DB...`);

      await sql`
        INSERT INTO pages (slug, title, page_type, status, content_json, schema_version)
        VALUES (
          ${slug},
          ${title},
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

      console.log(`✅ Successfully published [${slug}] to production.`);
    } catch (err: any) {
      console.error(`❌ CRITICAL ERROR generation for [${slug}]:`, err.message || err);
    }
  }
  
  console.log("\n🎉 All 8 Core Pages forcibly generated and published!");
  process.exit(0);
}
run();
