import sql from '../lib/db';
import fs from 'fs';
async function run() {
  const result = await sql`SELECT slug, updated_at, page_type FROM pages ORDER BY updated_at DESC LIMIT 15`;
  const lines = result.map((r: any) => `${r.page_type} | ${r.slug} | ${r.updated_at}`).join('\n');
  fs.writeFileSync('recent.txt', lines);
  console.log('Saved to recent.txt');
  process.exit(0);
}
run();
