const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function getLinks() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const results = await sql`
      SELECT slug 
      FROM pages 
      WHERE slug LIKE 'diagnose/%' OR slug LIKE 'topic/%' OR slug NOT LIKE 'repair/%'
      ORDER BY id DESC 
      LIMIT 5
    `;
    
    console.log("Here are 5 non-repair URLs:");
    console.log(results);
  } catch(e) {
    console.error(e);
  }
}

getLinks();
