import "dotenv/config";
import sql from '../lib/db';
import { generateTwoStagePage, EXPECTED_PROMPT_HASH } from '../lib/two-stage-generator';
import { normalizeToBaseSlug, buildSlug } from '../lib/slug-helpers';
import { normalizeAuthorityJson, finalizeAuthorityJson } from '../lib/finalizeAuthoritySymptomJson';

const QUEUE_STATUS = { pending: 'pending', processing: 'processing', completed: 'completed', failed: 'failed' };

let isWorkerRunning = false;

export async function runWorker(options: { limit?: number, manual?: boolean } = {}) {
  // Prevent overlapping runs in the same process
  if (isWorkerRunning) {
    console.log("⚠️ Worker is already running. Skipping execution.");
    return { success: false, reason: "Already running" };
  }
  isWorkerRunning = true;

  console.log('🚀 Starting Authority HVAC Worker...');
  try {
    await sql`INSERT INTO system_logs (event_type, message) VALUES ('worker_start', 'Worker started')`;
  } catch(e) {}

  let processedCount = 0;
  let failedCount = 0;

  try {
    // Basic DB-based lock (Advisory Lock) to prevent overlapping cron runs
    let lockAcquired = false;
    try {
      const lockRes = await sql`SELECT pg_try_advisory_lock(999999) as locked`;
      lockAcquired = lockRes[0]?.locked;
    } catch {
      // Ignore if unsupported
      lockAcquired = true; 
    }

    if (!lockAcquired) {
      console.log("⚠️ Global DB lock already held. Another worker is running.");
      isWorkerRunning = false;
      return { success: false, reason: "DB lock held" };
    }

    // Enforce Auto Mode unless manual trigger
    if (!options.manual) {
      const autoModeState = await sql`SELECT value FROM system_state WHERE key = 'auto_mode' LIMIT 1` as any[];
      if (autoModeState[0]?.value === 'OFF') {
        console.log("🛑 Auto Mode is OFF. Cron execution blocked. Use manual run.");
        isWorkerRunning = false;
        try { await sql`SELECT pg_advisory_unlock(999999)`; } catch {}
        return { success: false, reason: "Auto Mode OFF" };
      }
    }

    const batchLimit = options.limit || parseInt(process.env.CANARY_BATCH_SIZE || "50", 10) || 50;
    const items = await sql`
      SELECT * FROM generation_queue
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT ${batchLimit}
    ` as any[];

    console.log(`📦 Fetched ${items.length} pending jobs.`);

    for (const job of items) {
      try {
        const proposedSlug = job.proposed_slug;
        const pageTypeForSlug = job.proposed_slug?.startsWith("repair/") ? "repair" : (job.page_type || "symptom");
        const baseSlug = normalizeToBaseSlug(proposedSlug || "");
        const fullSlugRaw = buildSlug(baseSlug, pageTypeForSlug);
        const fullSlug = fullSlugRaw.replace(/\/+/g, '/');

        // Claim
        const claimed = await sql`
          UPDATE generation_queue SET status = ${QUEUE_STATUS.processing}, started_at = NOW()
          WHERE id = ${job.id} AND status = ${QUEUE_STATUS.pending}
          RETURNING id
        `;
        if (claimed.length === 0) continue;

        try { await sql`INSERT INTO system_logs (event_type, message) VALUES ('job_claimed', ${'Claimed ' + fullSlug})`; } catch(e) {}
        console.log(`🚀 Generating: ${fullSlug}`);

        const result = await generateTwoStagePage(proposedSlug, {
          slug: proposedSlug,
          system: "HVAC",
          pageType: pageTypeForSlug,
          coreOnly: false
        }) as any;

        // Prompt lock validation (to prevent silent drift)
        if (result._prompt_hash !== EXPECTED_PROMPT_HASH) {
          throw new Error(`❌ WRONG PROMPT USED (Expected ${EXPECTED_PROMPT_HASH}, got ${result._prompt_hash})`);
        }

        result.slug = fullSlug;

        const normalized = normalizeAuthorityJson(result);
        const final = finalizeAuthorityJson(normalized, pageTypeForSlug);

        const existingPage = await sql`SELECT id FROM pages WHERE slug = ${fullSlug}`;
        if (existingPage.length > 0) {
          await sql`
            UPDATE pages
            SET 
              content_json = ${JSON.stringify(final) as any},
              status = 'generated',
              updated_at = NOW(),
              system_id = COALESCE(${job.system_id || null}, system_id, 'HVAC')
            WHERE slug = ${fullSlug}
          `;
        } else {
          await sql`
            INSERT INTO pages (slug, status, content_json, updated_at, page_type, system_id)
            VALUES (${fullSlug}, 'generated', ${JSON.stringify(final) as any}, NOW(), ${pageTypeForSlug}, COALESCE(${job.system_id || null}, 'HVAC'))
          `;
        }

        await sql`
          UPDATE generation_queue
          SET status = ${QUEUE_STATUS.completed}, finished_at = NOW()
          WHERE id = ${job.id}
        `;

        console.log(`✅ Success: ${fullSlug}`);
        
        // Log telemetry
        try {
          await sql`
            INSERT INTO system_logs (event_type, message, metadata) 
            VALUES ('worker_success', ${'Generated ' + fullSlug}, ${JSON.stringify({ slug: fullSlug }) as any})
          `;
        } catch(e) {}

        processedCount++;

      } catch (err: any) {
        console.error(`❌ FAILED: ${job.proposed_slug}`, err);
        const errorMsg = err.message || String(err);
        await sql`
          UPDATE generation_queue 
          SET status = ${QUEUE_STATUS.failed}, error_log = ${errorMsg}, attempts = COALESCE(attempts, 0) + 1
          WHERE id = ${job.id}
        `;

        try {
          await sql`
            INSERT INTO system_logs (event_type, message, metadata) 
            VALUES ('worker_failed', ${'Failed ' + job.proposed_slug}, ${JSON.stringify({ slug: job.proposed_slug, error: errorMsg }) as any})
          `;
        } catch(e) {}

        failedCount++;
      }
    }

    try {
      await sql`SELECT pg_advisory_unlock(999999)`;
    } catch {}

  } catch (error: any) {
    console.error('Worker Fatal Error:', error);
    try { await sql`SELECT pg_advisory_unlock(999999)`; } catch {}
  }

  console.log('🏁 Worker batch complete.');
  try { await sql`INSERT INTO system_logs (event_type, message) VALUES ('worker_end', 'Worker completed batch')`; } catch(e) {}
  isWorkerRunning = false;

  return { success: true, processedCount, failedCount };
}

// Allow direct execution if called from command line
if (require.main === module) {
  console.log("🔄 Starting Queue Drain Mode...");

  const startPolling = async () => {
    while (true) {
      try {
        const result = await runWorker();
        
        if (result?.success === false) {
          console.log("🛑 Exiting: ", result?.reason);
          break;
        }

        // If no jobs were processed or failed, the queue is empty
        if (result?.processedCount === 0 && result?.failedCount === 0) {
          console.log("🏁 No jobs left in queue, exiting");
          break;
        }

        // Wait 1 second between batches to avoid flooding DB
        await new Promise(res => setTimeout(res, 1000));
      } catch (err) {
        console.error("Loop error:", err);
        break;
      }
    }
  }

  startPolling().catch(err => {
    console.error("Fatal polling error:", err);
    process.exit(1);
  });
}
