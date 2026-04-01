import "dotenv/config";
import sql from "../lib/db";

async function run() {
  try {
    await sql`INSERT INTO generation_queue (proposed_slug, page_type, city, priority) VALUES ('ac-not-cooling', 'symptom', 'Florida', 99) ON CONFLICT DO NOTHING`;
    console.log('Enqueued ac-not-cooling');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
