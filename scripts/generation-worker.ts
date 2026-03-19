import "dotenv/config";

/**
 * HVAC Revenue Boost Generation Worker (Neon Edition)
 * ---------------------------------------------------
 * Processes the 'generation_queue' and upserts into 'pages'.
 * Claim → Process → Complete (or requeue on failure).
 */

import sql from '../lib/db';
import { generateCoreData } from '../lib/ai-generator';
import { contentToHtml } from '../lib/contentToHtml';
import { normalizeToBaseSlug, buildSlug } from '../lib/slug-helpers';
import { generateSeoLinks } from '../lib/seo/generateSeoLinks';
import { calculateQualityScore, QualityResult } from '../lib/quality-scorer';

const QUEUE_STATUS = { pending: 'pending', processing: 'processing', completed: 'completed' };

async function savePageToDB(params: {
  slug: string;
  html: string;
  data: Record<string, unknown>;
  quality: QualityResult;
  item: { proposed_title?: string; page_type: string; system_id?: number; symptom_id?: number; city?: string };
}): Promise<number> {
  const title = params.item.proposed_title || params.slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const contentJson = {
    ...params.data,
    title,
    slug: params.slug,
    html_content: params.html,
    generated_at: new Date().toISOString(),
  };
  const result = await sql`
    INSERT INTO pages (slug, title, page_type, system_id, symptom_id, city, status, quality_status, quality_score, quality_notes, last_scored_at, content_json)
    VALUES (
      ${params.slug},
      ${title},
      ${params.item.page_type},
      ${params.item.system_id ?? null},
      ${params.item.symptom_id ?? null},
      ${params.item.city ?? null},
      ${params.quality.status},
      ${params.quality.status},
      ${params.quality.score},
      ${JSON.stringify(params.quality) as any},
      ${new Date().toISOString()},
      ${JSON.stringify(contentJson) as any}
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      page_type = EXCLUDED.page_type,
      status = EXCLUDED.status,
      quality_status = EXCLUDED.quality_status,
      quality_score = EXCLUDED.quality_score,
      quality_notes = EXCLUDED.quality_notes,
      last_scored_at = EXCLUDED.last_scored_at,
      content_json = EXCLUDED.content_json
    RETURNING id
  `;
  return result[0]?.id as number;
}

async function runWorker() {
  console.log('🚀 Starting HVAC Revenue Boost Worker (Neon)...');
  console.log('DB URL:', process.env.DATABASE_URL);

  try {
    const all = await sql`SELECT * FROM generation_queue` as any[];
    console.log('TOTAL ROWS:', all.length);

    // 1. Fetch pending items (limit: CANARY_BATCH_SIZE or 1)
    const batchLimit = parseInt(process.env.CANARY_BATCH_SIZE || "1", 10) || 1;
    console.log('🔍 Fetching queue items...');
    const items = await sql`
      SELECT * FROM generation_queue
      WHERE status = 'pending'
        AND page_type IN ('symptom', 'cause', 'repair', 'component', 'system')
      ORDER BY created_at ASC
      LIMIT ${batchLimit}
    ` as any[];
    console.log('📦 FOUND ITEMS:', items.length);
    if (process.env.GENERATION_VALIDATION_MODE === 'true') {
      console.log('🔬 Validation mode: ON (QA/test run)');
    }

    for (const item of items) {
      const proposedSlug = item.proposed_slug;
      const pageTypeForSlug = item.proposed_slug?.startsWith("repair/") ? "repair" : (item.page_type || "symptom");
      const baseSlug = normalizeToBaseSlug(proposedSlug || "");
      const fullSlug = buildSlug(baseSlug, pageTypeForSlug);

      console.log({ baseSlug, fullSlug, pageType: pageTypeForSlug });

      // 2. CLAIM — only claim if still pending (prevents race conditions)
      const claimed = await sql`
        UPDATE generation_queue SET status = ${QUEUE_STATUS.processing}
        WHERE id = ${item.id} AND status = ${QUEUE_STATUS.pending}
        RETURNING id
      `;
      if (claimed.length === 0) {
        console.log(`⏭️ [${item.id}] skipped (already claimed)`);
        continue;
      }
      console.log(`🔄 [${item.id}] → processing`);
      console.log("TYPE:", item.page_type, "SLUG:", item.proposed_slug);
      console.log('🛠️ Generating:', proposedSlug);

      try {

        // 3. PROCESS — use page_type from DB; override for repair/city/symptom slugs
        let pageType = item.page_type;
        if (item.proposed_slug?.startsWith("repair/")) {
          pageType = "repair";
        }
        const title = item.proposed_title || `HVAC Repair in ${item.city}`;
        const validationMode = process.env.GENERATION_VALIDATION_MODE === 'true';
        const data = await generateCoreData({
          slug: proposedSlug,
          pageType,
          title,
          validationMode,
        });

        console.log('🔗 Retrieving SEO links...');
        const [existing] = await sql`SELECT content_json FROM pages WHERE slug = ${fullSlug}`;
        let seoLinks = existing?.content_json?.seo_links || existing?.content_json?.seoLinks;

        if (!seoLinks || !seoLinks.link_strategy_summary) {
          console.log('🔗 Generating Mega SEO links via Gemini Mega Prompt...');
          seoLinks = await generateSeoLinks(fullSlug, pageType, data);
        } else {
          console.log('🔗 Reusing existing SEO links from previously generated page...');
        }

        data.seo_links = seoLinks;

        const html = contentToHtml(data);
        const quality = calculateQualityScore(data, html, pageType);

        // INDEXING STRATEGY: Disable component indexing until 100-200 pages build authority
        if (pageType === 'component' && quality.status === 'published') {
          console.log(`🔒 Component ${fullSlug} defaults to noindex until target index volume reached.`);
          quality.status = 'noindex';
        }

        
        console.log("Saving page:", fullSlug, "Score:", quality.score, "Status:", quality.status);
        const pageId = await savePageToDB({ slug: fullSlug, html, data, quality, item });

        // 4. MARK COMPLETE OR DELAY REGEN
        if (quality.status === 'needs_regen') {
          console.log(`⚠️ [${item.id}] Score too low (${quality.score}). Queuing delayed regen.`);
          await sql`
            UPDATE generation_queue
            SET status = 'pending', page_id = ${pageId}, regeneration_attempts = COALESCE(regeneration_attempts, 0) + 1
            WHERE id = ${item.id} AND COALESCE(regeneration_attempts, 0) < 3
          `;
        } else {
          await sql`
            UPDATE generation_queue
            SET status = ${QUEUE_STATUS.completed}, page_id = ${pageId}
            WHERE id = ${item.id}
          `;
        }

        console.log(`✅ [${item.id}] → processed`);
        console.log('✅ Success:', fullSlug);
      } catch (err) {
        console.error(`❌ [${item.id}] → failed`);
        console.error('❌ Failed:', item.proposed_slug, err);

        // 5. REQUEUE on failure
        await sql`
          UPDATE generation_queue SET status = ${QUEUE_STATUS.pending} WHERE id = ${item.id}
        `;
      }
    }

  } catch (error) {
    console.error('Worker Fatal Error:', error);
  }

  console.log('🏁 Worker batch complete.');
}

runWorker();
