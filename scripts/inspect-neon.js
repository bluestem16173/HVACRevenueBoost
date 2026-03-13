const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function inspect() {
  console.log('🧐 Inspecting Neon Constraints...');
  try {
    const results = await sql`
      SELECT 
        conname AS constraint_name, 
        contype AS constraint_type,
        relname AS table_name
      FROM pg_constraint c
      JOIN pg_class r ON c.conrelid = r.oid
      JOIN pg_namespace n ON n.oid = r.relnamespace
      WHERE n.nspname = 'public'
    `;
    console.table(results);
    
    const uniqueIndexes = await sql`
      SELECT
          t.relname as table_name,
          i.relname as index_name,
          a.attname as column_name
      FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a
      WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
          AND t.relname IN ('symptoms', 'causes')
      ORDER BY
          t.relname,
          i.relname;
    `;
    console.table(uniqueIndexes);

  } catch (error) {
    console.error('❌ Inspection failed:', error);
  }
}

inspect();
