const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const sql = neon(process.env.DATABASE_URL);

async function extractSpecific() {
  try {
    const pages = await sql`
      SELECT slug, page_type, content_json 
      FROM pages 
      WHERE slug = 'why-does-capacitor-fail'
      LIMIT 1
    `;
    
    if (pages.length === 0) {
      console.log('Page not found.');
      return;
    }
    
    const page = pages[0];
    const obj = typeof page.content_json === 'string' ? JSON.parse(page.content_json) : page.content_json;
    
    // Save JSON for inspection
    fs.writeFileSync('payload-out.json', JSON.stringify(obj, null, 2));
    console.log('Wrote payload-out.json');

  } catch (err) {
    console.error('Error:', err);
  }
}

extractSpecific();
