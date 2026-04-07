import "dotenv/config";
import sql from "../lib/db";
import { generateDiagnosticEngineJson } from "../lib/content-engine/generator";

const slugs = [
  "cape-coral-ac-not-cooling",
  "cape-coral-ac-leaking-water",
  "cape-coral-ac-drain-line-clogged"
];

async function run() {
  console.log(`🚀 Starting high-conversion batch for ${slugs.length} pages...`);

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    console.log(`[${i + 1}/${slugs.length}] Generating: ${slug}`);

    try {
      const cityMatch = slug.match(/^(tampa|orlando|cape-coral|fort-myers|naples)-/);
      const city = cityMatch ? cityMatch[1].replace('-', ' ') : "Florida";
      
      const result = await generateDiagnosticEngineJson(
        { symptom: slug, city, pageType: "hvac_authority_v3" }
      );

      console.log(`✅ AI JSON Generated for ${slug}. Saving to DB...`);

      await sql`
        INSERT INTO pages (slug, content_json, status, page_type, title, city, schema_version)
        VALUES (
          ${slug},
          ${JSON.stringify(result)}::jsonb,
          'published',
          'diagnostic',
          ${result.title || slug.replace(/-/g, " ")},
          ${city},
          'v3'
        )
        ON CONFLICT (slug) DO UPDATE
        SET content_json = EXCLUDED.content_json,
            title = EXCLUDED.title,
            status = 'published',
            updated_at = NOW();
      `;

      console.log(`💾 Saved ${slug}!`);

    } catch (err: any) {
      console.error(`❌ FAILED ${slug}:`, err.message || err);
    }
  }

  console.log("🏁 Batch Generation Complete.");
  process.exit(0);
}

run();
