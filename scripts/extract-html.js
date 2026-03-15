const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const sql = neon(process.env.DATABASE_URL);

async function extractHtml() {
  try {
    const pages = await sql`
      SELECT slug, page_type, content_html 
      FROM pages 
      WHERE content_html IS NOT NULL 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    if (pages.length === 0) {
      console.log('No pages found with HTML content.');
      return;
    }
    
    const page = pages[0];
    console.log(`Extracting HTML for: ${page.slug} (${page.page_type})`);
    
    fs.writeFileSync('tmp-test.html', page.content_html);
    console.log('Successfully wrote generated HTML to tmp-test.html');
  } catch (err) {
    console.error('Error extracting HTML:', err);
  }
}

extractHtml();
