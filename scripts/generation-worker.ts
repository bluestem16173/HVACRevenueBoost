/**
 * DecisionGrid Generation Worker (Neon Edition)
 * -------------------------------------------
 * Processes the 'generation_queue' and upserts into 'pages'.
 * Run this script to generate content for the SEO flywheel.
 */

import sql from '../lib/db';

async function runWorker() {
  console.log('🚀 Starting DecisionGrid Worker (Neon)...');

  try {
    // 1. Fetch pending items from queue
    const queueItems = await sql`
      SELECT * FROM generation_queue 
      WHERE status = 'queued' 
      LIMIT 100
    `;

    console.log(`📦 Processing ${queueItems.length || 0} items...`);

    for (const item of queueItems) {
      try {
        console.log(`🛠️ Generating: ${item.proposed_slug}`);

        // 2. Mock content generation 
        const pageTitle = item.proposed_title || `HVAC Repair in ${item.city}`;
        const pageSlug = item.proposed_slug;

        let contentJson: any = { generated_at: new Date().toISOString() };
        
        switch(item.page_type) {
          case 'topic':
            contentJson.engine_version = '3.0.0-TopicHub-5Tier';
            contentJson.mermaid_graph = `graph TD\nA[${pageTitle}] --> B[Causes]`;
            break;
          case 'cause':
            contentJson.engine_version = '3.0.0-CauseAnalysis-5Tier';
            contentJson.root_cause_analysis = true;
            break;
          case 'repair':
            contentJson.engine_version = '3.0.0-RepairManual-5Tier';
            contentJson.safety_warnings = ["LOTO", "Capacitor Discharge"];
            break;
          case 'component':
            contentJson.engine_version = '3.0.0-ComponentSpec-5Tier';
            contentJson.multimeter_tests = true;
            break;
          case 'tool':
            contentJson.engine_version = '3.0.0-ToolGuide-5Tier';
            contentJson.affiliate_ready = true;
            break;
          default:
            contentJson.engine_version = '2.0.0-DecisionGrid-Neon';
        }

        // 3. Upsert into Pages table using Neon raw SQL
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
            ${JSON.stringify(contentJson)}
          )
          ON CONFLICT (slug) DO UPDATE SET
            title = EXCLUDED.title,
            page_type = EXCLUDED.page_type,
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
        console.error(`❌ Failed to generate ${item.proposed_slug}:`, err);
        await sql`
          UPDATE generation_queue 
          SET status = 'failed' 
          WHERE id = ${item.id}
        `;
      }
    }

  } catch (error) {
    console.error('Worker Fatal Error:', error);
  }

  console.log('🏁 Worker batch complete.');
}

runWorker();
