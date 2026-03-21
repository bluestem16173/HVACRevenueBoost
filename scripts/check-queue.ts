import 'dotenv/config';
import sql from '../lib/db';

async function run() {
  const res = await sql`SELECT id, slug, status FROM generation_queue ORDER BY finished_at DESC NULLS LAST LIMIT 5`;
  console.log('Queue:', res);
  const res2 = await sql`SELECT slug FROM pages LIMIT 5`;
  console.log('Pages:', res2);
  process.exit(0);
}
run();
