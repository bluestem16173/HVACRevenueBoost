import "dotenv/config";

/**
 * Canary Batch — Run 25 pages for schema/stabilization validation.
 *
 * Uses MASTER-PROMPT-CANARY (layout + sections).
 *
 * Usage: npx tsx scripts/canary-batch.ts
 */

import sql from '../lib/db';
import { getSymptomWithCausesFromDB, getCauseDetails } from '../lib/diagnostic-engine';
import { generatePageContent, renderToHtml } from '../lib/ai-generator';
import { generateCanaryPage, canaryToContentJson } from '../lib/canary-generator';
import { generateCoreOnlyPage, generateTwoStagePage } from '../lib/two-stage-generator';
import { SYMPTOMS } from '../data/knowledge-graph';

const CANARY_SLUGS = [
  'ac-blowing-warm-air',
  'ac-not-turning-on',
  'furnace-not-heating',
  'hvac-leaking-water',
  'ac-running-constantly',
  'strange-noises-hvac',
  'high-electric-bills-hvac',
  'uneven-cooling-heating',
  'hvac-unit-short-cycling',
  'bad-odors-from-vents',
  'heat-pump-not-switching',
  'ice-on-outdoor-unit',
  'humidity-too-high-home',
  'furnace-blowing-cold-air',
  'noisy-outdoor-condenser',
  'hvac-tripping-breaker',
  'thermostat-display-blank',
  'weak-airflow-vents',
  'furnace-clicking-no-ignition',
  'ac-smells-musty',
  'burning-smell-hvac',
  'hvac-clunking-sound',
  'constant-fan-running',
  'blower-fan-not-working',
  'low-refrigerant-ac',
];

async function run() {
  const useTwoStage = process.env.USE_TWO_STAGE === 'true';
  const useCoreOnly = process.env.USE_CORE_ONLY !== 'false'; // default: core only (enrichment disabled)
  console.log(`🐤 Canary batch: ${CANARY_SLUGS.length} pages (${useCoreOnly ? 'Stage 1 CORE only' : useTwoStage ? 'Two-Stage' : 'MASTER-PROMPT-CANARY'})`);
  const results: { slug: string; ok: boolean; layout?: string; error?: string }[] = [];

  for (const slug of CANARY_SLUGS) {
    try {
      console.log(`\n▶ ${slug}`);
      const symptomSlug = slug.replace(/^diagnose\//, '');
      let graphSymptom = await getSymptomWithCausesFromDB(symptomSlug);
      if (!graphSymptom) {
        const staticSymptom = SYMPTOMS.find((s) => s.id === symptomSlug);
        if (staticSymptom?.causes?.length) {
          graphSymptom = {
            id: staticSymptom.id,
            name: staticSymptom.name,
            slug: staticSymptom.id,
            description: staticSymptom.description,
            causes: staticSymptom.causes.map((cId) => getCauseDetails(cId)).filter(Boolean),
          } as any;
        }
      }
      const pageTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const pageSlug = `diagnose/${symptomSlug}`;

      let contentJson: any;
      if (graphSymptom) {
        const graphCauses = (graphSymptom.causes || []).map((c: any) => ({ name: c.name }));
        const graphRepairs = (graphSymptom.causes || []).flatMap((c: any) =>
          (c.repairDetails || c.repairs || []).map((r: any) => ({ name: r?.name || r }))
        );

        if (useCoreOnly || useTwoStage) {
          // Stage 1 CORE only — enrichment disabled for canary
          // queueEnrichment(slug) ← commented out
          contentJson = await generateCoreOnlyPage(graphSymptom.name, {
            slug: pageSlug,
            system: 'HVAC',
            graphCauses,
            graphRepairs,
          });
          results.push({ slug, ok: true });
          console.log(`  ✓ core only (${Object.keys(contentJson).length} keys)`);
        } else {
          const canary = await generateCanaryPage(graphSymptom.name, {
            pageType: 'symptom',
            slug: pageSlug,
            system: 'HVAC',
            keyword: pageTitle,
            graphCauses,
          });
          contentJson = {
            layout: canary.layout,
            sections: canary.sections,
            ...canaryToContentJson(canary),
            engine_version: canary.engine_version,
            generated_at: new Date().toISOString(),
          };
          results.push({ slug, ok: true, layout: canary.layout });
          console.log(`  ✓ layout=${canary.layout} sections=${Object.keys(canary.sections || {}).length}`);
        }
      } else {
        const aiData = await generatePageContent(pageSlug, 'symptom', pageTitle, {});
        const html = renderToHtml(aiData);
        if (!html || html.length < 100) {
          throw new Error('Generated HTML too short');
        }
        contentJson = { ...aiData, html_content: html, generated_at: new Date().toISOString() };
        results.push({ slug, ok: true });
        console.log(`  ✓ ${html.length} chars (fallback)`);
      }

      await sql`
        INSERT INTO pages (slug, title, page_type, status, content_json)
        VALUES (${symptomSlug}, ${pageTitle}, 'symptom', 'published', ${JSON.stringify(contentJson)})
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          status = EXCLUDED.status,
          content_json = EXCLUDED.content_json
      `;
    } catch (err: any) {
      results.push({ slug, ok: false, error: err?.message });
      console.log(`  ✗ ${err?.message}`);
    }
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n📊 ${passed}/${results.length} passed`);
  if (passed < results.length) {
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.slug}: ${r.error}`));
  }
}

run().catch(console.error);
