const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function listPages() {
  const pages = await sql`
    SELECT slug, page_type 
    FROM pages 
    WHERE content_json IS NOT NULL 
    ORDER BY created_at DESC 
    LIMIT 10
  `;
  console.log("Generated AI Pages:");
  pages.forEach(p => console.log(`- ${p.page_type}: ${p.slug}`));
}

listPages();
