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

const QUEUE_STATUS = { pending: 'pending', processing: 'processing', completed: 'completed' };

/** Save page to DB, return page id. */
async function savePageToDB(params: {
  slug: string;
  html: string;
  data: Record<string, unknown>;
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
    INSERT INTO pages (slug, title, page_type, system_id, symptom_id, city, status, content_json)
    VALUES (
      ${params.slug},
      ${title},
      ${params.item.page_type},
      ${params.item.system_id ?? null},
      ${params.item.symptom_id ?? null},
      ${params.item.city ?? null},
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
      WHERE status = ${QUEUE_STATUS.pending}
        AND page_type IS NOT NULL AND page_type != ''
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
        const html = contentToHtml(data);
        console.log("Saving page:", fullSlug);
        const pageId = await savePageToDB({ slug: fullSlug, html, data, item });

        // 4. MARK COMPLETE
        await sql`
          UPDATE generation_queue
          SET status = ${QUEUE_STATUS.completed}, page_id = ${pageId}
          WHERE id = ${item.id}
        `;

        console.log(`✅ [${item.id}] → completed`);
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
