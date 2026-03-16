/**
 * Run migration 007 (Page Targets expansion) on Neon.
 * Usage: npx tsx scripts/run-migration-007.ts
 *
 * Requires: 004-decisiongrid-alignment schema.
 * If connection fails locally, run the SQL in Neon Console.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

async function run() {
  let url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set. Check .env.local');
    process.exit(1);
  }
  url = url.trim().replace(/^['"]|['"]$/g, '');

  const sqlPath = join(process.cwd(), 'db', 'migrations', '007_page_targets_expansion.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query(sql);
    console.log('✅ Migration 007 complete (page_targets, page_generation_runs, contractor_locations).');
  } catch (e: any) {
    console.error('Migration failed:', e.message);
    throw e;
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
