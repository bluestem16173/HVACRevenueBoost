import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

/**
 * Run migration 004 (DecisionGrid alignment) on Neon.
 * Creates base schema: systems, symptoms, conditions, causes, repairs, cities, contractors, pages, etc.
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
  const sqlPath = join(process.cwd(), 'scripts', 'migrations', '004-decisiongrid-alignment.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    // Pre-step: add city_slug if missing (partial migration recovery)
    for (const tbl of ['contractors', 'leads']) {
      try {
        await client.query(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS city_slug TEXT`);
      } catch {
        // Table may not exist yet; 004 will create it
      }
    }
    await client.query(sql);
    console.log('✅ Migration 004 complete.');
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
