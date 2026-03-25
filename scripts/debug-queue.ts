import sql from "../lib/db";

async function checkQueue() {
  const result = await sql`SELECT status, count(*) FROM generation_queue GROUP BY status`;
  console.log("Queue contents:", result);
  process.exit(0);
}

checkQueue();
