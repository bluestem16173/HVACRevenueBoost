const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function inspectLatestOutput() {
  try {
    const pages = await sql`
      SELECT slug, page_type, content_json
      FROM pages 
      WHERE content_json IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    if (pages.length === 0) {
      console.log('No pages found');
      return;
    }
    
    const page = pages[0];
    console.log(`\n📄 Inspecting: ${page.slug} (${page.page_type})`);
    
    console.log(JSON.stringify(page.content_json, null, 2));

  } catch (err) {
    console.error(err);
  }
}

inspectLatestOutput();
