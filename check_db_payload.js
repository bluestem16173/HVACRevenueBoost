require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function check() {
  const rows = await sql`SELECT content_json->>'mechanical_field_note' as note FROM pages WHERE slug = 'conditions/ac-not-cooling' LIMIT 1`;
  console.log('mechanical_field_note in DB:', rows[0]?.note);
}

check().catch(console.error);
