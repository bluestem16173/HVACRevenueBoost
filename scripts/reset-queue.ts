import sql from '../lib/db';
async function run() {
  const result = await sql`UPDATE generation_queue SET status = 'draft', attempts = 0 WHERE status = 'failed'`;
  console.log(`Reset ${(result as any).count ?? result.length} failed pages to pending!`);
  process.exit(0);
}
run();
