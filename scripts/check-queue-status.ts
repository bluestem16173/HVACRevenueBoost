import "dotenv/config";
import sql from '../lib/db';

async function check() {
  const targetCount = await sql`SELECT count(*) FROM page_targets WHERE page_type = 'symptom'`;
  console.log("Symptom Targets in DB:", targetCount);
  const queueCount = await sql`SELECT status, count(*) FROM generation_queue GROUP BY status`;
  console.log("Queue counts:", queueCount);
  
  process.exit(0);
}
check();
