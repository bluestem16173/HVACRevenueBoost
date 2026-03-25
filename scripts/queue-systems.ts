import "dotenv/config";
import sql from "../lib/db";

async function run() {
  const systems = await sql`SELECT slug FROM systems` as any[];
  console.log(`Found ${systems.length} systems to enqueue: ${systems.map(s => s.slug).join(', ')}`);
  
  for (const sys of systems) {
    try {
      await sql`
        INSERT INTO generation_queue (proposed_slug, page_type, status, city)
        VALUES (${sys.slug}, 'system', 'pending', NULL)
        ON CONFLICT (proposed_slug, COALESCE(city, '')) 
        DO UPDATE SET status = 'pending', page_type = 'system'
      `;
    } catch(e) {
      console.log(`Failed to enqueue ${sys.slug}`, e);
    }
  }

  console.log("✅ Successfully enqueued systems.");
  process.exit(0);
}

run().catch(console.error);
