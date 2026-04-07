import { generateDiagnosticEngineJson } from "./lib/content-engine/generator";
import { migrateOnePage } from "./lib/content-engine/relational-upsert";
import sql from "./lib/db";
import { EXPECTED_PROMPT_HASH } from "./lib/content-engine/core";

async function main() {
  const slug = "ac-short-cycling";
  console.log(`Force regenerating: ${slug}`);

  try {
    const rawDg = await generateDiagnosticEngineJson(
      { symptom: slug, city: "Florida", pageType: "diagnostic" }
    );

    const result = rawDg;
    if (result && typeof result === "object") {
        (result as any)._prompt_hash = EXPECTED_PROMPT_HASH;
        (result as any).engineVersion = "v5.0";
    }

    console.log("Writing to V2 relational engine...");
    await migrateOnePage(sql, null, slug, result);

    console.log("Writing to legacy pages table fallback (hvac_authority_v3 layout)...");
    await sql`
      INSERT INTO pages (slug, content_json, status, page_type, title, schema_version)
      VALUES (
        ${slug},
        ${JSON.stringify(result)}::jsonb,
        'published',
        'diagnostic',
        ${result.title || "Ac Short Cycling"},
        'v3'
      )
      ON CONFLICT (slug) DO UPDATE
      SET content_json = EXCLUDED.content_json,
          schema_version = EXCLUDED.schema_version,
          updated_at = NOW();
    `;
    console.log("✅ Success! Page regenerated with new v3 schema layout.");
  } catch (err) {
    console.error("Failed:", err);
  } finally {
    process.exit(0);
  }
}

main();
