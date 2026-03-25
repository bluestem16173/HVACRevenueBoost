import "dotenv/config";

/**
 * Canary Batch — Run pages for schema/stabilization validation.
 *
 * Option A: Bypass worker entirely. Do everything here:
 *   generateCoreData → savePageToDB → renderAndStorePage
 *
 * Usage: npx tsx scripts/canary-batch.ts
 *        CANARY_SLUG=ac-blowing-warm-air npx tsx scripts/canary-batch.ts
 *        CANARY_BATCH_SIZE=5 npx tsx scripts/canary-batch.ts
 *        USE_CANARY_5=true npx tsx scripts/canary-batch.ts   # Fixed 5 slugs (no page_targets)
 *        CANARY_SLUGS=ac-not-cooling,heat-pump-not-heating npx tsx scripts/canary-batch.ts
 *        CANARY_PAGE_TYPE=condition npx tsx scripts/canary-batch.ts   # Generate condition pages (locked schema)
 *
 * Requires: page_targets (unless USE_CANARY_5 or CANARY_SLUGS is set).
 */

import sql from '../lib/db';
import { generateTwoStagePage } from '../lib/content-engine/generator';
import { normalizeAuthorityJson, finalizeAuthorityJson } from '../lib/finalizeAuthoritySymptomJson';
import { normalizeToBaseSlug, buildSlug } from '../lib/slug-helpers';

const DEFAULT_LIMIT = 5;

/** Save generated data to pages table (includes rendered HTML in content_json). */
async function savePageToDB(
  data: Record<string, unknown>,
  opts: { slug: string; title: string; pageType: string }
): Promise<void> {
  const contentJson = {
    ...data,
    title: opts.title,
    slug: opts.slug,
    generated_at: new Date().toISOString(),
  };
  await sql`
    INSERT INTO pages (slug, title, page_type, status, content_json)
    VALUES (${opts.slug}, ${opts.title}, ${opts.pageType}, 'published', ${JSON.stringify(contentJson)})
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      status = EXCLUDED.status,
      content_json = EXCLUDED.content_json
  `;
}

/** Render page and ensure it's stored (Option A: no-op; save already done in savePageToDB). */
async function renderAndStorePage(
  _data: Record<string, unknown>,
  _opts: { slug: string; title: string; pageType: string }
): Promise<void> {
  // Option A: savePageToDB already renders + stores. Placeholder for future cache warm / ISR.
}

const CANARY_5_SLUGS = [
  "ac-not-cooling",
  "ac-running-but-not-cold",
  "one-room-hotter-than-others",
  "heat-pump-not-heating",
  "rv-ac-not-cooling",
];

async function run() {
  const limit = parseInt(process.env.CANARY_BATCH_SIZE || '0', 10) || DEFAULT_LIMIT;
  const targetSlug = process.env.CANARY_SLUG?.trim();
  const slugsEnv = process.env.CANARY_SLUGS?.trim();
  let targets: { slug: string; page_type: string }[];

  const pageTypeOverride = process.env.CANARY_PAGE_TYPE?.trim() || "";
  const defaultPageType = pageTypeOverride || "symptom";

  if (slugsEnv) {
    targets = slugsEnv.split(",").map((s) => ({ slug: s.trim(), page_type: defaultPageType })).filter((t) => t.slug);
  } else if (targetSlug) {
    const fromTargets = await sql`SELECT slug, page_type FROM page_targets WHERE slug = ${targetSlug} LIMIT 1`;
    const rows = fromTargets as { slug: string; page_type: string }[];
    const pt = rows?.[0]?.page_type;
    targets = [{ slug: targetSlug, page_type: pageTypeOverride || pt || "symptom" }];
  } else if (process.env.USE_CANARY_5 === "true") {
    targets = CANARY_5_SLUGS.map((slug) => ({ slug, page_type: defaultPageType }));
  } else {
    targets = await sql`
      SELECT slug, page_type FROM page_targets ORDER BY RANDOM() LIMIT ${limit}
    ` as { slug: string; page_type: string }[];
  }
  const rows = targets as { slug: string; page_type: string }[];
  console.log(`🐤 Canary batch: ${rows.length} pages (Option A: bypass worker)`);
  const results: { slug: string; ok: boolean; error?: string }[] = [];

  for (const target of rows) {
    const proposed_slug = target.slug;
    const page_type = target.page_type || 'symptom';
    const title = proposed_slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    try {
      console.log(`\n▶ ${proposed_slug} (${page_type})`);
      const raw = await generateTwoStagePage(title, {
        slug: proposed_slug,
        system: "HVAC",
        pageType: page_type,
        bypassAutoMode: true,
      });
      const normalized = normalizeAuthorityJson(raw);
      const data = finalizeAuthorityJson(normalized, page_type);

      const baseSlug = normalizeToBaseSlug(proposed_slug);
      const fullSlug = buildSlug(baseSlug, page_type);

      console.log({ baseSlug, fullSlug, pageType: page_type });
      console.log("Saving page:", fullSlug);
      await savePageToDB(data, { slug: fullSlug, title, pageType: page_type });
      await renderAndStorePage(data, { slug: fullSlug, title, pageType: page_type });

      results.push({ slug: fullSlug, ok: true });
      console.log(`  ✓ ${Object.keys(data).length} keys (${page_type})`);
    } catch (err: any) {
      results.push({ slug: proposed_slug, ok: false, error: err?.message });
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
