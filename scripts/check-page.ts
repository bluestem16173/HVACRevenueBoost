import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from '../lib/db';
import * as fs from 'fs';

async function run() {
  const res = await sql`SELECT slug, content_json FROM pages WHERE content_json IS NOT NULL ORDER BY updated_at DESC LIMIT 1`;
  if (res.length > 0) {
    console.log('Found latest generated page:', res[0].slug);
    fs.writeFileSync('tmp-page.json', JSON.stringify(res[0].content_json, null, 2));
    console.log('Saved to tmp-page.json');
  } else {
    console.log('No generated pages found.');
  }
  process.exit(0);
}
run();
