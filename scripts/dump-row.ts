import sql from '../lib/db';
import fs from 'fs';
async function run() {
  const pages = await sql`SELECT slug, content_json FROM pages ORDER BY updated_at DESC LIMIT 1`;
  fs.writeFileSync('full-payload-dump.json', JSON.stringify(pages[0], null, 2));
  process.exit(0);
}
run();
