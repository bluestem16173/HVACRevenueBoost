import sql from '../lib/db';
async function run() {
  const pending = await sql`SELECT page_type, COUNT(*) FROM generation_queue WHERE status = 'pending' GROUP BY page_type` as any[];
  console.log(pending);
  process.exit(0);
}
run();
