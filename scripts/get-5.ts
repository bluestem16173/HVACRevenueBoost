import sql from '../lib/db';
import fs from 'fs';
async function run() {
  const result = await sql`SELECT slug FROM pages WHERE page_type = 'cause' ORDER BY updated_at DESC LIMIT 5`;
  const urls = result.map((r: any) => 'http://localhost:3000/' + r.slug).join('\n');
  fs.writeFileSync('urls.txt', urls);
  console.log('Saved to urls.txt');
  process.exit(0);
}
run();
