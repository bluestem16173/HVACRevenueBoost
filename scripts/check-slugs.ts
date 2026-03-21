import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from '../lib/db';

async function run() {
  const pages = await sql`SELECT slug FROM pages LIMIT 5`;
  console.log('Pages slugs:', pages.map(p => p.slug));
  const queue = await sql`SELECT slug FROM generation_queue LIMIT 5`;
  console.log('Queue slugs:', queue.map(q => q.slug));
  process.exit(0);
}
run();
