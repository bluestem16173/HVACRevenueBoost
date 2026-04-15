import "dotenv/config";
import sql from "../lib/db";
import { generateDiagnosticEngineJson } from "../lib/content-engine/generator";

const testNodes = [
  "ac-not-cooling",
  "ac-making-noise"
];

async function run() {
  console.log("🚀 TESTING UNIVERSAL DIAGNOSTIC ENGINE SCHEMA...");

  for (const slug of testNodes) {
    console.log(`\n⏳ Generating [${slug}] via new Master JSON Engine...`);
    try {
      const title = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      
      const payloadOptions = {
        slug: slug,
        system: "HVAC",
        pageType: "diagnostic_engine",
        coreOnly: false,
        schemaVersion: "diagnostic_engine", // Important: hits the new router condition
        bypassAutoMode: true,
      };

      const rawDg = await generateDiagnosticEngineJson(
        { symptom: slug, city: "Tampa", pageType: "diagnostic_engine" },
        "",
        payloadOptions
      );

      console.log(`\n💎 Generated Payload for [${slug}]:\n`);
      console.log(JSON.stringify(rawDg, null, 2));

      // Optional: Save to DB if you want to push them live
      /*
      await sql\`
        INSERT INTO pages (slug, title, page_type, status, content_json, schema_version)
        VALUES (\${slug}, \${title}, 'symptom', 'published', \${JSON.stringify(rawDg)}::jsonb, 'diagnostic_engine')
        ON CONFLICT (slug) DO UPDATE
        SET content_json = EXCLUDED.content_json, status = 'published', schema_version = 'diagnostic_engine', updated_at = NOW();
      \`;
      console.log(\`✅ Successfully published [\${slug}] to database.\`);
      */
      
    } catch (err: any) {
      console.error(`❌ CRITICAL ERROR generation for [${slug}]:`, err.message || err);
    }
  }
  
  console.log("\n🎉 Test generation complete.");
  process.exit(0);
}
run();
