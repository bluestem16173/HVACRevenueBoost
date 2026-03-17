import "dotenv/config";

/**
 * HVAC Revenue Boost Generation Worker (Neon Edition)
 * ---------------------------------------------------
 * Processes the 'generation_queue' and upserts into 'pages'.
 * Run this script to generate content for the SEO flywheel.
 */

import sql from '../lib/db';
import { getSymptomWithCausesFromDB } from '../lib/diagnostic-engine';
import { generatePageContent, renderToHtml } from '../lib/ai-generator';
import { generateCanaryPage, canaryToContentJson } from '../lib/canary-generator';
import { generateCoreOnlyPage } from '../lib/two-stage-generator';
import { shouldGeneratePage } from '../lib/thin-content-guards';

async function runWorker() {
  console.log('🚀 Starting HVAC Revenue Boost Worker (Neon)...');

  try {
    // 1. Fetch pending items from queue
    // SCALABLE: Only generate knowledge pages. City/location pages render dynamically.
    // Processes ALL page types (symptom, cause, repair, component, system, diagnostic).
    const queueItems = await sql`
      SELECT * FROM generation_queue 
      WHERE status = 'queued' 
      AND page_type IN ('symptom', 'condition', 'cause', 'repair', 'diagnostic', 'system', 'diagnose', 'component')
      ORDER BY id ASC
      LIMIT 50
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

    let generatedCount = 0;
    const MAX_PAGES = 50;

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
      if (generatedCount >= MAX_PAGES) {
        console.log(`🛑 Reached limit of ${MAX_PAGES} pages. Stopping worker.`);
        break;
      }
      try {
        console.log(`🛠️ Generating: ${item.proposed_slug}`);

        // 2. Mock content generation 
        const pageTitle = item.proposed_title || `HVAC Repair in ${item.city}`;
        const pageSlug = item.proposed_slug;

        let additionalContext: any = {};

        // Graph-first: fetch symptom + causes + repairs from DB when applicable
        const symptomSlug = (pageSlug || '').replace(/^diagnose\//, '').replace(/^diagnose-/, '');
        let graphNode: Record<string, unknown> | null = null;
        if (['symptom', 'diagnose'].includes(item.page_type) || pageSlug?.startsWith('diagnose')) {
          const graphSymptom = await getSymptomWithCausesFromDB(symptomSlug);
          if (graphSymptom) {
            additionalContext.graphSymptom = graphSymptom;
            graphNode = graphSymptom as unknown as Record<string, unknown>;
          }
        }

        // Thin-content guard: skip if insufficient graph data for this page type
        if (!shouldGeneratePage(item.page_type, graphNode)) {
          console.log(`⏭️ Skipping ${pageSlug}: thin-content guard (insufficient data)`);
          await sql`UPDATE generation_queue SET status = 'skipped' WHERE id = ${item.id}`;
          continue;
        }

        // SCALABLE: City pages are never queued. They render dynamically from knowledge pages.
        // Only the lead module changes per location. No city-specific content generation.

        let contentJson: any;

        // Two-stage (graph-aware) or Canary — for symptom/diagnose with graph data
        // USE_CANARY=false → legacy AI generator (turn off canary)
        const canaryOff = process.env.USE_CANARY === 'false';
        if (
          !canaryOff &&
          (['symptom', 'diagnose'].includes(item.page_type) || pageSlug?.startsWith('diagnose')) &&
          additionalContext.graphSymptom
        ) {
          const problem = additionalContext.graphSymptom.name || pageTitle;
          const graphCauses = (additionalContext.graphSymptom.causes || []).map((c: any) => ({ name: c.name }));
          const graphRepairs = (additionalContext.graphSymptom.causes || [])
            .flatMap((c: any) => (c.repairDetails || c.repairs || []).map((r: any) => ({ name: r.name || r })));

          const useCoreOnly = process.env.USE_CORE_ONLY !== 'false'; // default: core only
          if (process.env.USE_TWO_STAGE === 'true' || useCoreOnly) {
            // Stage 1 CORE only — queueEnrichment(slug) commented out
            console.log(`📦 Stage 1 CORE only for ${pageSlug}...`);
            contentJson = await generateCoreOnlyPage(problem, {
              slug: pageSlug,
              system: 'HVAC',
              graphCauses,
              graphRepairs,
            });
          } else {
            console.log(`🔥 Canary Generator (MASTER-PROMPT-CANARY) for ${pageSlug}...`);
            const canary = await generateCanaryPage(problem, {
              pageType: item.page_type,
              slug: pageSlug,
              system: 'HVAC',
              keyword: problem,
              graphCauses,
            });
            contentJson = {
              layout: canary.layout,
              sections: canary.sections,
              ...canaryToContentJson(canary),
              engine_version: canary.engine_version,
              generated_at: new Date().toISOString(),
            };
          }
        } else {
          console.log(`🧠 Calling AI Generator for ${pageSlug}...`);
          const aiData = await generatePageContent(pageSlug, item.page_type, pageTitle, additionalContext);
          const generatedHtml = renderToHtml(aiData);
          contentJson = {
            ...aiData,
            html_content: autoLinkContent(generatedHtml, entities),
            engine_version: '4.0.0-HVACRevenueBoost-AI',
            generated_at: new Date().toISOString(),
          };
        }

        // Use symptom slug for diagnose pages so /diagnose/[slug] can find it
        const pagesSlug =
          (['symptom', 'diagnose'].includes(item.page_type) || pageSlug?.startsWith('diagnose'))
            ? symptomSlug || pageSlug
            : pageSlug;

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
            ${pagesSlug}, 
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
        generatedCount++;

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
