import "dotenv/config";
import sql from '../lib/db';

async function seedCanaries() {
  console.log("Seeding 5 canary pages for generation testing...");
  const ts = Date.now();
  const canaries = [
    { slug: "test-symptom-canary-" + ts, type: "symptom", title: "Test Symptom Canary" },
    { slug: "test-cause-canary-" + ts, type: "cause", title: "Test Cause Canary" },
    { slug: "repair/test-repair-canary-" + ts, type: "repair", title: "Test Repair Canary" },
    { slug: "test-component-canary-" + ts, type: "component", title: "Test Component Canary" },
    { slug: "test-system-canary-" + ts, type: "system", title: "Test System Canary" },
  ];

  for (const c of canaries) {
    await sql`
      INSERT INTO generation_queue (proposed_slug, proposed_title, page_type, status)
      VALUES (${c.slug}, ${c.title}, ${c.type}, 'draft')
    `;
    console.log(`Inserted: ${c.slug}`);
  }
  
  console.log("Done.");
  process.exit(0);
}

seedCanaries().catch(console.error);
