require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function check() {
  try {
    const slug = 'conditions/ac-not-cooling';
    const results = await sql`
      SELECT 
        p.*,
        s.name as system_name,
        sym.name as symptom_name
      FROM pages p
      LEFT JOIN systems s ON p.system_id = s.id
      LEFT JOIN symptoms sym ON p.symptom_id = sym.id
      WHERE p.slug = ${slug}
      LIMIT 1
    `;
    console.log("SUCCESS length:", results.length);
    if(results.length) console.log("Has content_json:", !!results[0].content_json);
  } catch (e) {
    console.error("SQL throws:", e);
  }
}

check().catch(console.error);
