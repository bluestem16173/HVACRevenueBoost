import sql from "../lib/db";

async function fixStatus() {
  await sql`UPDATE generation_queue SET status = 'draft' WHERE status = 'queued'`;
  console.log("Status fixed!");
  process.exit(0);
}

fixStatus();
