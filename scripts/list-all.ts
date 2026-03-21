import fs from 'fs';
import sql from '../lib/db';
async function run() {
  const result = await sql`SELECT slug FROM pages WHERE slug LIKE 'diagnose/%' AND status != 'failed' LIMIT 500`;
  const urls = result.map(row => `https://hvacrevenueboost.com/${row.slug}`);
  fs.writeFileSync('generated_urls.txt', urls.join('\n'));
  console.log('Successfully wrote ' + urls.length + ' URLs to generated_urls.txt!');
  process.exit(0);
}
run();
