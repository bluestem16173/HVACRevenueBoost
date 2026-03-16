/**
 * Run migration 003 (Related nodes graph) on Neon.
 * Creates related_nodes table for dense internal linking.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

async function run() {
  const url = (process.env.DATABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
  if (!url) {
    console.error('DATABASE_URL not set. Check .env.local');
    process.exit(1);
  }
  const sqlPath = join(process.cwd(), 'scripts', 'migrations', '003-related-nodes.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(sql);
    console.log('✅ Migration 003 complete.');
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
