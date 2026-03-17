import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env.local');
}

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('Running migration...');
  try {
    const res = await sql`ALTER TABLE symptoms ADD COLUMN IF NOT EXISTS query_variations JSONB;`;
    console.log('Migration successful', res);
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrate();
