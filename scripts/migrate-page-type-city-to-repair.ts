/**
 * Migration: Fix page_type for repair/city/symptom slugs
 * -----------------------------------------------
 * repair/phoenix/ac-not-turning-on should be:
 *   page_type: 'repair', city: 'phoenix'
 * NOT page_type: 'city'
 */
import 'dotenv/config';
import sql from '../lib/db';

async function migrate() {
  const result = await sql`
    UPDATE generation_queue
    SET page_type = 'repair'
    WHERE page_type = 'city'
      AND proposed_slug LIKE 'repair/%'
    RETURNING id, proposed_slug, page_type
  `;
  console.log(`✅ Updated ${result.length} rows: page_type city → repair for repair/* slugs`);
  if (result.length > 0) {
    console.log('Sample:', result[0]);
  }
}

migrate().catch(console.error);
