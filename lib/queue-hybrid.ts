import sql from "./db";

async function queueHybridPages() {
  const routes = [
    { slug: 'hvac-repair-st-pete', city: 'St. Pete' },
    { slug: 'furnace-repair-near-me', city: 'Local' },
    { slug: 'emergency-ac-repair-tampa', city: 'Tampa' }
  ];

  console.log(`Queueing ${routes.length} Hybrid Route Pages...`);

  for (const r of routes) {
    try {
      await sql`
        INSERT INTO generation_queue (proposed_slug, page_type, status, city, created_at, updated_at)
        VALUES (${r.slug}, 'hybrid', 'pending', ${r.city}, NOW(), NOW())
      `;
      console.log(`QUEUED: ${r.slug}`);
    } catch (e: any) {
      console.log(`FAILED TO QUEUE ${r.slug}:`, e.message);
    }
  }
  
  process.exit();
}

queueHybridPages();
