import "dotenv/config";
import sql from "../lib/db";

async function queueLeakingWater() {
  console.log("Queueing ac-leaking-water for Phase 5 generation...");
  
  await sql`
    UPDATE generation_queue 
    SET status = 'draft', attempts = 0 
    WHERE proposed_slug = 'ac-leaking-water'
  `;

  // If it didn't exist in queue
  await sql`
    INSERT INTO generation_queue (proposed_slug, proposed_title, page_type, status)
    VALUES ('ac-leaking-water', 'AC Leaking Water', 'diagnose', 'draft')
    ON CONFLICT DO NOTHING
  `;
  
  console.log("Phase 5 Test Queued! Run the worker now.");
  process.exit(0);
}

queueLeakingWater().catch(err => {
  console.error("Queue Failed:", err);
  process.exit(1);
});
