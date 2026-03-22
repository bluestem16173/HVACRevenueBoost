import "dotenv/config";
import sql from '../lib/db';

async function reset() {
  const result = await sql`UPDATE generation_queue SET status = 'pending' WHERE status = 'processing'`;
  console.log(`Reset ${(result as any).count ?? result.length} processing pages back to pending.`);
  process.exit(0);
}
reset();
