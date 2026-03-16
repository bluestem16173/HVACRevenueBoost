/**
 * Canary Batch — Run 5–10 pages first after schema/stabilization changes.
 *
 * Best canary set:
 * - 3 condition pages
 * - 2 symptom pages
 * - 2 diagnostic pages
 *
 * Track: raw output length, validation pass/fail, retry count, tokens used, save success.
 * Success target: 90%+ first-pass validation, 100% saved after retries.
 *
 * Usage: npx tsx scripts/canary-batch.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from '../lib/db';
import { getSymptomWithCausesFromDB } from '../lib/diagnostic-engine';
import { generatePageContent, renderToHtml } from '../lib/ai-generator';

const CANARY_SLUGS = [
  'diagnose-ac-blowing-warm-air',
  'diagnose-ac-not-cooling',
  'ac-running-but-not-cooling-house',
  'outdoor-unit-running-compressor-not-starting',
  'ac-short-cycling',
  'why-does-capacitor-fail',
  'test-ac-capacitor',
];

async function run() {
  console.log('🐤 Canary batch: 7 pages');
  const results: { slug: string; ok: boolean; error?: string }[] = [];

  for (const slug of CANARY_SLUGS) {
    try {
      console.log(`\n▶ ${slug}`);
      const graphSymptom = await getSymptomWithCausesFromDB(slug.replace(/^diagnose\//, ''));
      const pageTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const aiData = await generatePageContent(slug, 'symptom', pageTitle, {
        graphSymptom: graphSymptom || undefined,
      });
      const html = renderToHtml(aiData);
      if (!html || html.length < 100) {
        throw new Error('Generated HTML too short');
      }
      results.push({ slug, ok: true });
      console.log(`  ✓ ${html.length} chars`);
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
