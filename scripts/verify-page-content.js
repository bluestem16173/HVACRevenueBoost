const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function verify() {
  const sql = neon(process.env.DATABASE_URL);
  const results = await sql`
    SELECT slug, content_json 
    FROM pages 
    WHERE content_json->>'engine_version' = '4.0.0-DecisionGrid-AI-Generator'
    LIMIT 1
  `;
  if (results.length > 0) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('No AI generated pages found.');
  }
}
verify();
