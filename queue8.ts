import sql from './lib/db';

async function queue8() {
  try {
    const targets = await sql`
      SELECT slug, page_type 
      FROM page_targets 
      WHERE page_type = 'symptom' OR page_type = 'condition'
      LIMIT 8
    `;
    
    for (const t of targets) {
      try {
        await sql`
          INSERT INTO generation_queue (proposed_slug, page_type, status, priority) 
          VALUES (${t.slug}, ${t.page_type}, 'pending', 10) 
          ON CONFLICT DO NOTHING
        `;
      } catch (inner: any) {
        console.error("Insert error for", t.slug, inner.message);
      }
    }
    console.log(`Successfully queued ${targets.length} items to generation_queue`);
    process.exit(0);
  } catch (err: any) {
    console.error("Query error:", err.message);
    process.exit(1);
  }
}

queue8();
