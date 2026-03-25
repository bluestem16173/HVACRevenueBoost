import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
async function run() {
  const rows = await sql`SELECT slug FROM pages WHERE schema_version='v2_goldstandard'`;
  console.log(rows);
}
run();
