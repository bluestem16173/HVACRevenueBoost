import * as dotenv from 'dotenv'; dotenv.config({ path: '.env.local' });
import sql from './lib/db';

async function main() {
  console.log("Checking ac-not-cooling rows in .env.local DB...");
  const rows = await sql`SELECT id, slug, page_type, schema_version, city FROM pages WHERE slug = 'ac-not-cooling'`;
  console.log(rows);
  process.exit();
}
main();
