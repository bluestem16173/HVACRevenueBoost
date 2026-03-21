import sql from '../lib/db';
async function run() {
  const result = await sql`SELECT status, COUNT(*) FROM generation_queue GROUP BY status`;
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
run();
