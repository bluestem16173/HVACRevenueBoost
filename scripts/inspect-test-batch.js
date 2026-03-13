const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function inspectTestBatch() {
  const res = await sql`
    SELECT slug, page_type, content_json->>'engine_version' as version 
    FROM pages 
    ORDER BY created_at DESC 
    LIMIT 5
  `;
  console.table(res);
}

inspectTestBatch();
