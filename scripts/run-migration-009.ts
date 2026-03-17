import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

/**
 * Run migration 009 (Align locations for 008) on Neon.
 * Adds locations table + location_id to contractor_locations/page_targets.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

async function run() {
  const url = (process.env.DATABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
  if (!url) {
    console.error('DATABASE_URL not set. Check .env.local');
    process.exit(1);
  }
  const sqlPath = join(process.cwd(), 'db', 'migrations', '009_align_locations_for_008.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(sql);
    console.log('✅ Migration 009 complete.');
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
