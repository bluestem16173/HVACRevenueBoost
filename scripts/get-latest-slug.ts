import 'dotenv/config';
import sql from '../lib/db';
import fs from 'fs';

async function run() {
  const res = await sql`SELECT slug FROM pages ORDER BY updated_at DESC LIMIT 1`;
  fs.writeFileSync('slug.txt', res[0]?.slug || '');
  process.exit(0);
}
run();
