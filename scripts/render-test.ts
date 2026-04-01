import sql from "../lib/db";
import { generateDiagnosticEngineJson } from "../lib/content-engine/generator";

async function render() {
  const cleanSlug = "ac-leaking-water";
  const city = "Florida";
  const pageType = "diagnostic";

  try {
    console.log(`🚀 Rendering ${cleanSlug} with new DG constraints...`);
    const result = await generateDiagnosticEngineJson({ symptom: cleanSlug, city, pageType });
    
    // Attempt validation
    const { validatePage } = await import("../lib/validators/page-validator");
    const val = validatePage(result);
    if (!val.valid) {
      console.error("❌ Validation Failed", val.errors);
      process.exit(1);
    }
    
    console.log(`✅ Validation Passed:`, val.valid);

    console.log(`Writing ${cleanSlug} to DB...`);
    await sql`DELETE FROM pages WHERE slug = ${cleanSlug}`;
    await sql`
      INSERT INTO pages (slug, content_json, status, page_type, title, city, schema_version)
      VALUES (
        ${cleanSlug},
        ${sql.json(result)},
        'validated',
        ${pageType},
        ${result.title || 'AC Leaking Water'},
        ${city},
        'v12.dg'
      )
    `;

    console.log(`✅ Fully committed ${cleanSlug} to Postgres`);
  } catch (err) {
    console.error("❌ RENDER FAILED:", err);
  } finally {
    process.exit(0);
  }
}

render();
