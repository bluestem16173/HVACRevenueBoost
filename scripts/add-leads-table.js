const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function addLeadsTable() {
  console.log('🏗️ Adding Leads Table to Neon...');
  try {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        zip_code TEXT,
        symptom_id UUID REFERENCES symptoms(id),
        city TEXT,
        status TEXT DEFAULT 'new',
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)`);
    console.log('✅ Leads table added.');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

addLeadsTable();
