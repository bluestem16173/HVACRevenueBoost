import sql from '../lib/db';
import fs from 'fs';
async function run() {
  const result = await sql`SELECT proposed_slug, status FROM generation_queue WHERE page_type = 'cause' LIMIT 15`;
  fs.writeFileSync('q.txt', JSON.stringify(result, null, 2));
  process.exit(0);
}
run();
