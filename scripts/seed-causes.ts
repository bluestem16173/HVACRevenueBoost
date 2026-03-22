import { generateTwoStagePage } from '../lib/content-engine/generator';
import sql from '../lib/db';

const targetSlugs = [
  "low-refrigerant-ac",
  "dirty-evaporator-coil",
  "frozen-evaporator-coil",
  "clogged-air-filter-hvac",
  "bad-run-capacitor-ac",
  "thermostat-miscalibration",
  "blocked-condenser-coil",
  "blower-motor-failure",
  "condensate-drain-line-clog",
  "refrigerant-leak-evaporator-coil"
];

async function seedCauses() {
  console.log(`Starting to seed ${targetSlugs.length} cause pages...`);
  
  for (const slug of targetSlugs) {
    console.log(`\n⏳ Generating [${slug}]...`);
    try {
      // Create a nice topic name by replacing dashes with spaces
      const topicName = slug.replace(/-/g, ' ');
      const urlSlug = `causes/${slug}`;

      const start = Date.now();
      const res = await generateTwoStagePage(topicName, {
        slug: urlSlug,
        pageType: 'cause'
      });
      
      await sql`
        INSERT INTO pages (slug, content_json, status, page_type, title) 
        VALUES (
          ${urlSlug}, 
          ${JSON.stringify(res)}::jsonb, 
          'published', 
          'cause',
          ${res.hero?.headline || topicName}
        ) 
        ON CONFLICT(slug) DO UPDATE 
        SET content_json=EXCLUDED.content_json, title=EXCLUDED.title, updated_at=NOW()
      `;
      
      console.log(`✅ Fully Generated and Saved: [${urlSlug}] in ${Date.now() - start}ms`);
    } catch (e) {
      console.error(`❌ Failed on ${slug}:`, e);
    }
  }
}

seedCauses().finally(() => process.exit(0));
