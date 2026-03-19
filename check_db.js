require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function check() {
  const rows = await sql`SELECT slug, title, page_type FROM pages WHERE slug LIKE '%ac-not-cooling%'`;
  console.log('Pages table rows:', rows);
}

check().catch(console.error);
