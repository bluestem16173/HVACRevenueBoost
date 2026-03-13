const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function inspect() {
  try {
    const results = await sql`
      SELECT 
        conname AS constraint_name, 
        relname AS table_name
      FROM pg_constraint c
      JOIN pg_class r ON c.conrelid = r.oid
      WHERE r.relname IN ('symptoms', 'causes')
    `;
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Inspection failed:', error.message);
  }
}

inspect();
