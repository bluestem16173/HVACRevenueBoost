import "dotenv/config";
import sql from "../lib/db";
import { generateDiagnosticEngineJson } from "../lib/content-engine/generator";

const slugs = [
  "ac-not-cooling",
  "ac-running-but-not-cooling",
  "ac-blowing-warm-air",
  "ac-not-turning-on",
  "ac-short-cycling",
  "ac-not-reaching-set-temperature",
  "ac-losing-cooling-power",
  "ac-cooling-slowly",
  "ac-not-cooling-evenly",
  "ac-turns-on-then-off",
  "tampa-ac-not-cooling",
  "tampa-ac-running-but-not-cooling",
  "tampa-ac-leaking-water",
  "tampa-ac-not-turning-on",
  "orlando-ac-not-cooling",
  "orlando-ac-short-cycling",
  "orlando-ac-blowing-warm-air",
  "cape-coral-ac-not-cooling",
  "cape-coral-ac-leaking-water",
  "cape-coral-ac-drain-line-clogged",
  "fort-myers-ac-not-cooling",
  "fort-myers-ac-breaker-tripping",
  "fort-myers-ac-leaking-water",
  "naples-ac-not-cooling",
  "naples-ac-running-but-not-cooling",
  "naples-ac-not-turning-on"
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
    
    // Slight delay to respect rate limits
    await new Promise(res => setTimeout(res, 800));
  }

  console.log("🏁 Batch Generation Complete.");
  process.exit(0);
}

run();
