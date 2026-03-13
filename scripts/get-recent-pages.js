const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function getLinks() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const results = await sql`
      SELECT slug 
      FROM pages 
      WHERE status = 'published' 
      ORDER BY id DESC 
      LIMIT 3
    `;
    
    console.log("Here are 3 generated URLs:");
    results.forEach(row => {
      console.log(`https://www.hvacrevenueboost.com/${row.slug}`);
    });
  } catch(e) {
    console.error(e);
  }
}

getLinks();
