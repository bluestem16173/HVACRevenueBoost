require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function check() {
  const rows = await sql`SELECT content_json FROM pages WHERE slug = 'conditions/ac-not-cooling' LIMIT 1`;
  if (!rows.length) {
    console.log("No row found!");
    return;
  }
  const keys = Object.keys(rows[0].content_json || {});
  console.log('Keys in content_json:', keys);
  console.log('Top level objects summary:', JSON.stringify({
    mechanical_field_note: rows[0].content_json.mechanical_field_note,
    environments: rows[0].content_json.environments,
    conditions: rows[0].content_json.conditions,
  }, null, 2));
}

check().catch(console.error);
