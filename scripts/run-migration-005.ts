/**
 * Run migration 005 on Neon.
 * Usage: npm run db:migrate-005
 *
 * If connection fails locally, run the SQL in Neon Console:
 * https://console.neon.tech → Project → SQL Editor → paste from scripts/migrations/005-schema-improvements.sql
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Client } from 'pg';

const statements = [
  'ALTER TABLE causes ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES systems(id) ON DELETE SET NULL',
  'CREATE INDEX IF NOT EXISTS idx_causes_system ON causes(system_id)',
  'ALTER TABLE symptom_causes ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 1',
  'CREATE INDEX IF NOT EXISTS idx_symptom_causes_confidence ON symptom_causes(confidence_score)',
  'ALTER TABLE condition_causes ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 1',
  'CREATE INDEX IF NOT EXISTS idx_condition_causes_confidence ON condition_causes(confidence_score)',
  'ALTER TABLE diagnostic_causes ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 1',
  'CREATE INDEX IF NOT EXISTS idx_diagnostic_causes_confidence ON diagnostic_causes(confidence_score)',
];

async function run() {
  let url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set. Check .env.local');
    process.exit(1);
  }
  url = url.trim().replace(/^['"]|['"]$/g, '');

  const client = new Client({ connectionString: url });
  await client.connect();

  for (const stmt of statements) {
    try {
      await client.query(stmt);
      console.log('✓', stmt.substring(0, 65) + (stmt.length > 65 ? '...' : ''));
    } catch (e: any) {
      if (e?.message?.includes('already exists')) {
        console.log('○ (exists)', stmt.substring(0, 50) + '...');
      } else if (e?.message?.includes('does not exist')) {
        console.log('○ (table missing, skipped)', stmt.substring(0, 45) + '...');
      } else {
        await client.end();
        throw e;
      }
    }
  }

  await client.end();
  console.log('\n✅ Migration 005 complete.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
