const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function inspect() {
  console.log('--- START INSPECTION ---');
  try {
    const listConstraints = await sql`
      SELECT 
        conname, 
        contype, 
        relname
      FROM pg_constraint c
      JOIN pg_class r ON c.conrelid = r.oid
      WHERE r.relname IN ('symptoms', 'causes')
    `;
    console.log('CONSTRAINTS:', JSON.stringify(listConstraints, null, 2));

    const listIndices = await sql`
      SELECT
          t.relname as table_name,
          i.relname as index_name,
          idx.indisunique as is_unique
      FROM
          pg_class t,
          pg_class i,
          pg_index idx
      WHERE
          t.oid = idx.indrelid
          AND i.oid = idx.indexrelid
          AND t.relname IN ('symptoms', 'causes')
    `;
    console.log('INDICES:', JSON.stringify(listIndices, null, 2));

  } catch (error) {
    console.error('ERROR:', error.message);
  }
  console.log('--- END INSPECTION ---');
}

inspect();
