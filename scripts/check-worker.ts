import sql from '../lib/db';
async function run() {
  const result = await sql`SELECT proposed_slug, status, created_at FROM generation_queue ORDER BY created_at DESC LIMIT 10`;
  console.log(result);
  process.exit(0);
}
run();
