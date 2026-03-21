import 'dotenv/config';
import sql from '../lib/db';
import fs from 'fs';

async function run() {
  const res = await sql`SELECT id, slug, status, error_message, error_log FROM generation_queue WHERE status = 'failed' LIMIT 1`;
  fs.writeFileSync('error_dump.txt', JSON.stringify(res[0], null, 2));
  process.exit(0);
}
run();
