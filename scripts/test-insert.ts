import 'dotenv/config';
import sql from '../lib/db';

async function test() {
  try {
    const res = await sql`
      INSERT INTO pages (slug, page_type, title, city, status, content_json)
      VALUES (
        'test-slug-123',
        'symptom',
        'Test Title',
        NULL,
        'draft',
        '{}'::jsonb
      )
      ON CONFLICT (site, page_type, slug, COALESCE(city, '')) DO UPDATE
      SET title = EXCLUDED.title
      RETURNING id, slug;
    `;
    console.log("SUCCESS:", res);
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
