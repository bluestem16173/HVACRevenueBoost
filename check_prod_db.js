
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
async function run() {
  const rows = await sql\SELECT slug, length(content_json::text) as len FROM pages WHERE slug LIKE '%ac-not-cooling%'\;
  console.log('Prod rows:', rows);
}
run().catch(console.error);

