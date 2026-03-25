import "dotenv/config";
import sql from '../lib/db';

const coreNodes = [
  "ac-not-cooling",
  "ac-blowing-warm-air",
  "ac-not-turning-on",
  "ac-weak-airflow",
  "ac-freezing-up",
  "ac-short-cycling",
  "ac-making-noise",
  "ac-leaking-water"
];

async function run() {
  console.log("🔥 Seeding core 8 nodes into generation_queue...");
  for (const slug of coreNodes) {
    const title = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    
    // Check if it already exists to avoid conflict syntax errors if indexes differ
    const existing = await sql`SELECT id FROM generation_queue WHERE proposed_slug = ${slug} LIMIT 1`;
    if (existing && existing.length > 0) {
      await sql`UPDATE generation_queue SET status = 'pending' WHERE proposed_slug = ${slug}`;
    } else {
      await sql`
        INSERT INTO generation_queue (proposed_slug, proposed_title, page_type, status)
        VALUES (${slug}, ${title}, 'symptom', 'pending')
      `;
    }
    console.log(`✅ Queued: ${slug}`);
  }
  console.log("✅ Core 8 nodes firmly anchored. Ready for worker.");
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Fatal Error:", err);
  process.exit(1);
});
