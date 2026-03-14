/**
 * DecisionGrid Generation Worker (Neon Edition)
 * -------------------------------------------
 * Processes the 'generation_queue' and upserts into 'pages'.
 * Run this script to generate content for the SEO flywheel.
 */

import sql from '../lib/db';
import { getCauseTechnicalContent, getSystemContext } from '../lib/symptom-technical-content';

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

    // SEMANTIC AUTO-LINKING LOGIC
    // Extract entities from the knowledge graph
    const entities = [
      { keyword: "refrigerant leak", url: "/cause/refrigerant-leak" },
      { keyword: "capacitor failure", url: "/diagnose/ac-capacitor-failure" },
      { keyword: "dirty evaporator coil", url: "/diagnose/evaporator-coil-dirty" },
      { keyword: "compressor replacement", url: "/fix/compressor-replacement" }
    ];

    const autoLinkContent = (html: string, entities: { keyword: string, url: string }[], maxLinks = 10) => {
      let linkedHtml = html;
      let linkCount = 0;
      
      for (const entity of entities) {
        if (linkCount >= maxLinks) break;
        
        // Negative lookahead to ensure we don't double-link already linked text
        const regex = new RegExp(`(?<!<a[^>]*>)\\b${entity.keyword}\\b(?![^<]*</a>)`, "ig");
        
        if (regex.test(linkedHtml)) {
          linkedHtml = linkedHtml.replace(
            regex,
            `<a href="${entity.url}" class="font-bold text-hvac-blue hover:underline">${entity.keyword}</a>`
          );
          linkCount++;
        }
      }
      return linkedHtml;
    };

    for (const item of queueItems) {
      try {
        console.log(`🛠️ Generating: ${item.proposed_slug}`);

        // 2. Mock content generation 
        const pageTitle = item.proposed_title || `HVAC Repair in ${item.city}`;
        const pageSlug = item.proposed_slug;

        let contentJson: any = { generated_at: new Date().toISOString() };
        
        switch(item.page_type) {
          case 'city': {
            // City x Symptom pages: repair/{city}/{symptom-slug}
            const slugParts = (pageSlug || '').split('/');
            const symptomSlug = slugParts[slugParts.length - 1] || '';
            const causes = item.symptom_id ? await sql`
              SELECT c.* FROM causes c
              JOIN symptom_causes sc ON sc.cause_id = c.id
              WHERE sc.symptom_id = ${item.symptom_id}
            ` : [];
            const systemContext = getSystemContext(symptomSlug);
            const causesWithTech = (causes as any[]).map((c: any) => {
              const tech = getCauseTechnicalContent(symptomSlug, c.slug || c.id);
              return {
                name: c.name,
                slug: c.slug,
                technicalCause: tech?.technicalCause || c.explanation || c.description || '',
                verificationTest: tech?.verificationTest || [],
                repair: tech?.repair || ''
              };
            });
            contentJson.engine_version = '3.0.0-CityDiagnostic-Authority';
            contentJson.system_context = systemContext;
            contentJson.causes = causesWithTech;
            contentJson.generated_at = new Date().toISOString();
            const summaryHtml = `<p>${pageTitle} usually indicates a restriction or imbalance within the system. This guide explains technical causes, verification tests, and repair options used by HVAC technicians.</p>`;
            contentJson.html_content = autoLinkContent(summaryHtml, entities);
            break;
          }
          case 'topic':
            contentJson.engine_version = '3.0.0-TopicHub-5Tier';
            contentJson.mermaid_graph = `graph TD\nA[${pageTitle}] --> B[Causes]`;
            // Mocking the AI output and applying Auto-Linking
            let mockTopicHtml = `<p>If your AC is blowing warm air, you may have a refrigerant leak or a capacitor failure.</p>`;
            contentJson.html_content = autoLinkContent(mockTopicHtml, entities);
            break;
          case 'cause':
            contentJson.engine_version = '3.0.0-CauseAnalysis-5Tier';
            contentJson.root_cause_analysis = true;
            break;
          case 'repair':
            contentJson.engine_version = '3.0.0-RepairManual-5Tier';
            contentJson.safety_warnings = ["LOTO", "Capacitor Discharge"];
            let mockRepairHtml = `<p>To fix this, you might need a compressor replacement. Warning: doing this wrong can lead to capacitor failure.</p>`;
            contentJson.html_content = autoLinkContent(mockRepairHtml, entities);
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
