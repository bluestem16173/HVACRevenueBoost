import sql from '../lib/db';
import fs from 'fs';
async function run() {
  const pages = await sql`SELECT slug FROM pages ORDER BY updated_at DESC LIMIT 6`;
  const urls = pages.map(p => `http://localhost:3000/${p.slug}`).join('\n');
  fs.writeFileSync('urls.txt', urls);
  process.exit(0);
}
run();
