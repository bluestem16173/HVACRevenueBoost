import 'dotenv/config';
import sql from './lib/db.js';

async function run() {
  const result = await sql`SELECT slug FROM pages ORDER BY updated_at DESC LIMIT 1`;
  console.log('--- LATEST RENDERED ---');
  console.log(result[0] ? result[0].slug : 'No pages found');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
