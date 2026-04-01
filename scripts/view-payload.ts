import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from '../lib/db';

async function run() {
  const result = await sql`SELECT raw_json FROM diagnostic_pages WHERE slug = 'ac-blowing-warm-air'`;
  console.log(JSON.stringify(result[0].raw_json, null, 2));
  process.exit(0);
}
run();
