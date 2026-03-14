const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('🚀 Running Schema Migration 002 (Phase 2 Refinements)');
  try {
    // 1. Environments Layer (Separating from Conditions)
    await sql`
      CREATE TABLE IF NOT EXISTS environments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    console.log('✅ Created environments table');

    // 2. Components Table (Required for component_causes)
    await sql`
      CREATE TABLE IF NOT EXISTS components (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    console.log('✅ Created components table');

    // 3. Component-Cause join table
    await sql`
      CREATE TABLE IF NOT EXISTS component_causes (
        component_id UUID REFERENCES components(id) ON DELETE CASCADE,
        cause_id UUID REFERENCES causes(id) ON DELETE CASCADE,
        PRIMARY KEY (component_id, cause_id)
      )
    `;
    console.log('✅ Created component_causes table');

    await sql`CREATE INDEX IF NOT EXISTS idx_component_causes_component ON component_causes(component_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_component_causes_cause ON component_causes(cause_id)`;
    console.log('✅ Created indexes');

    console.log('🏁 Migration complete.');
  } catch (e) {
    console.error('❌ Migration failed:', e);
  }
}

runMigration();
