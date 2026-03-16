/**
 * Canary Batch — Run 5–10 pages first after schema/stabilization changes.
 *
 * Uses MASTER-PROMPT-CANARY when USE_CANARY=true (layout + sections).
 * Otherwise uses legacy generatePageContent.
 *
 * Usage:
 *   npx tsx scripts/canary-batch.ts           # legacy
 *   USE_CANARY=true npx tsx scripts/canary-batch.ts  # master prompt
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from '../lib/db';
import { getSymptomWithCausesFromDB, getCauseDetails } from '../lib/diagnostic-engine';
import { generatePageContent, renderToHtml } from '../lib/ai-generator';
import { generateCanaryPage, canaryToContentJson } from '../lib/canary-generator';
import { SYMPTOMS } from '../data/knowledge-graph';

const CANARY_SLUGS = [
  'ac-blowing-warm-air',
  'ac-not-turning-on',
  'ac-running-constantly',
  'ice-on-outdoor-unit',
  'furnace-not-heating',
  'hvac-leaking-water',
  'hvac-unit-short-cycling',
];

async function run() {
  const useCanary = process.env.USE_CANARY === 'true';
  console.log(`🐤 Canary batch: ${CANARY_SLUGS.length} pages (${useCanary ? 'MASTER-PROMPT-CANARY' : 'legacy'})`);
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
      if (useCanary && graphSymptom) {
        const canary = await generateCanaryPage(graphSymptom.name, {
          pageType: 'symptom',
          slug: pageSlug,
          system: 'HVAC',
          keyword: pageTitle,
          graphCauses: (graphSymptom.causes || []).map((c: any) => ({ name: c.name })),
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
      } else {
        const aiData = await generatePageContent(pageSlug, 'symptom', pageTitle, {
          graphSymptom: graphSymptom || undefined,
        });
        const html = renderToHtml(aiData);
        if (!html || html.length < 100) {
          throw new Error('Generated HTML too short');
        }
        contentJson = { ...aiData, html_content: html, generated_at: new Date().toISOString() };
        results.push({ slug, ok: true });
        console.log(`  ✓ ${html.length} chars`);
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
