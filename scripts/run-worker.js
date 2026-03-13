const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runWorker() {
  console.log('🚀 Starting DecisionGrid Worker (Neon-JS)...');

  try {
    // 1. Fetch pending items from queue
    const queueItems = await sql`
      SELECT * FROM generation_queue 
      WHERE status = 'queued' 
      LIMIT 1000
    `;

    console.log(`📦 Processing ${queueItems.length || 0} items...`);

    if (queueItems.length === 0) {
      console.log('🛌 No pending items in queue.');
      return;
    }

    for (const item of queueItems) {
      try {
        console.log(`🛠️ Generating: ${item.proposed_slug}`);

        const pageTitle = item.proposed_title || `HVAC Repair in ${item.city}`;
        const pageSlug = item.proposed_slug;

        // 3. Upsert into Pages table
        const result = await sql`
          INSERT INTO pages (
            slug, 
            title, 
            page_type, 
            system_id, 
            symptom_id, 
            city, 
            status, 
            content_json
          ) VALUES (
            ${pageSlug}, 
            ${pageTitle}, 
            ${item.page_type}, 
            ${item.system_id || null}, 
            ${item.symptom_id || null}, 
            ${item.city || null}, 
            'published', 
            ${JSON.stringify({
              generated_at: new Date().toISOString(),
              engine_version: '2.1.0-DecisionGrid-Neon-Standalone'
            })}
          )
          ON CONFLICT (slug) DO UPDATE SET
            title = EXCLUDED.title,
            status = EXCLUDED.status,
            content_json = EXCLUDED.content_json
          RETURNING id
        `;

        const newPageId = result[0]?.id;

        // 4. Update queue status
        await sql`
          UPDATE generation_queue 
          SET status = 'completed', page_id = ${newPageId} 
          WHERE id = ${item.id}
        `;

        console.log(`✅ Success: ${pageSlug}`);

      } catch (err) {
        console.error(`❌ Failed to generate ${item.proposed_slug}:`, err.message);
        await sql`
          UPDATE generation_queue 
          SET status = 'failed' 
          WHERE id = ${item.id}
        `;
      }
    }

  } catch (error) {
    console.error('Worker Fatal Error:', error.message);
  }

  console.log('🏁 Worker batch complete.');
}

runWorker();
