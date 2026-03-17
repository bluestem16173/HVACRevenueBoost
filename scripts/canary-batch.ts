import "dotenv/config";

/**
 * Canary Batch — Run pages for schema/stabilization validation.
 *
 * Targets from page_targets (random selection). Uses unified generateCoreData (same as production).
 *
 * Usage: npx tsx scripts/canary-batch.ts
 *        CANARY_BATCH_SIZE=5 npx tsx scripts/canary-batch.ts  # run 5 only
 *
 * Requires: page_targets table populated (e.g. seed-hvac-core, seed-decisiongrid-graph).
 */

import sql from '../lib/db';
import { generateCoreData, renderToHtml } from '../lib/ai-generator';

const DEFAULT_LIMIT = 5;

async function run() {
  const limit = parseInt(process.env.CANARY_BATCH_SIZE || '0', 10) || DEFAULT_LIMIT;
  const targetSlug = process.env.CANARY_SLUG?.trim();
  let targets: { slug: string; page_type: string }[];
  if (targetSlug) {
    const fromTargets = await sql`SELECT slug, page_type FROM page_targets WHERE slug = ${targetSlug} LIMIT 1`;
    targets = (fromTargets as any[]).length > 0 ? (fromTargets as any[]) : [{ slug: targetSlug, page_type: 'symptom' }];
  } else {
    targets = await sql`
      SELECT slug, page_type FROM page_targets ORDER BY RANDOM() LIMIT ${limit}
    ` as { slug: string; page_type: string }[];
  }
  const rows = targets as { slug: string; page_type: string }[];
  console.log(`🐤 Canary batch: ${rows.length} pages (unified generateCoreData)`);
  const results: { slug: string; ok: boolean; error?: string }[] = [];

  for (const target of rows) {
    const slug = target.slug;
    const pageType = target.page_type || 'symptom';
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    try {
      console.log(`\n▶ ${slug} (${pageType})`);
      const core = await generateCoreData({
        slug,
        pageType,
        title,
      });
      const html = renderToHtml(core);
      const contentJson = {
        ...core,
        title,
        slug,
        html_content: html || '',
        generated_at: new Date().toISOString(),
      };
      results.push({ slug, ok: true });
      console.log(`  ✓ ${Object.keys(core).length} keys (${pageType})`);

      await sql`
        INSERT INTO pages (slug, title, page_type, status, content_json)
        VALUES (${slug}, ${title}, ${pageType}, 'published', ${JSON.stringify(contentJson)})
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
