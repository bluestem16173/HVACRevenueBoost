import { generateTwoStagePage } from '../lib/content-engine/generator';
import sql from '../lib/db';

async function forceGenerate() {
  console.log("Generating causes/low-refrigerant directly via the new Engine...");
  try {
    const start = Date.now();
    const res = await generateTwoStagePage('low refrigerant ac', {
      slug: 'causes/low-refrigerant',
      pageType: 'cause'
    });
    
    await sql`
      INSERT INTO pages (slug, content_json, status, page_type, title) 
      VALUES (
        'causes/low-refrigerant', 
        ${JSON.stringify(res)}::jsonb, 
        'published', 
        'cause',
        ${res.content?.hero?.headline || 'Low Refrigerant'}
      ) 
      ON CONFLICT(slug) DO UPDATE 
      SET content_json=EXCLUDED.content_json, title=EXCLUDED.title, updated_at=NOW()
    `;
    console.log("FORCED GENERATION COMPLETE in", Date.now() - start, "ms");
  } catch (err) {
    console.error("Force Generation Error:", err);
  } finally {
    process.exit(0);
  }
}

forceGenerate();
