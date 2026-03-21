import fs from 'fs';
import sql from '../lib/db';
async function run() {
  const result = await sql`SELECT content_json FROM pages WHERE slug = 'diagnose/ac-blowing-warm-air'`;
  fs.writeFileSync('debug_ac.json', JSON.stringify(result[0]?.content_json, null, 2));
  process.exit();
}
run();
