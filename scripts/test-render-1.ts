import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import sql from '../lib/db';
import { runWorker } from './generation-worker';

async function testOne() {
  await sql`UPDATE generation_queue SET status = 'pending', attempts = 0 WHERE id = (SELECT id FROM generation_queue WHERE status = 'failed' LIMIT 1)`;
  console.log("Reset 1 failed job to pending.");
  const res = await runWorker({ limit: 1, manual: true });
  console.log("Worker result:", res);
  process.exit(0);
}

testOne().catch(console.error);
