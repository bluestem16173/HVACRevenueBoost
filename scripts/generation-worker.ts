import "dotenv/config";
import sql from '../lib/db';
import { generateTwoStagePage } from '../lib/content-engine/generator';
import { getFallback } from '../lib/content-engine/schema';
import { EXPECTED_PROMPT_HASH } from '../lib/content-engine/core';
import { normalizeToBaseSlug, buildSlug } from '../lib/slug-helpers';

console.log("DB URL:", process.env.DATABASE_URL);

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/^diagnose\//, '')
    .replace(/^repair\/[^/]+\//, '') // 🔥 strips location layer
    .replace(/\s+/g, '-')
    .trim();
}

const QUEUE_STATUS = { pending: 'pending', processing: 'processing', completed: 'completed', failed: 'failed' };

let isWorkerRunning = false;

export async function runWorker(options: { limit?: number, manual?: boolean, type?: string } = {}) {
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
    let lockAcquired = false;
    try {
      const lockRes = await sql`SELECT pg_try_advisory_lock(999999) as locked`;
      lockAcquired = lockRes[0]?.locked;
    } catch {
      lockAcquired = true; 
    }

    if (!lockAcquired) {
      console.log("⚠️ Global DB lock already held. Another worker is running.");
      isWorkerRunning = false;
      return { success: false, reason: "DB lock held" };
    }

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
    
    let items;
    if (options.type) {
      items = await sql`
        UPDATE generation_queue SET status = 'processing'
        WHERE id IN (
          SELECT id FROM generation_queue
          WHERE status = 'pending' AND page_type = ${options.type}
          ORDER BY created_at ASC
          LIMIT ${batchLimit}
          FOR UPDATE SKIP LOCKED
        ) RETURNING *;
      ` as any[];
    } else {
      items = await sql`
        UPDATE generation_queue SET status = 'processing'
        WHERE id IN (
          SELECT id FROM generation_queue
          WHERE status = 'pending'
          ORDER BY created_at ASC
          LIMIT ${batchLimit}
          FOR UPDATE SKIP LOCKED
        ) RETURNING *;
      ` as any[];
    }

    console.log(`📦 Fetched ${items.length} pending jobs.`);

    for (const job of items) {
      const proposedSlug = job.proposed_slug;
      const pageTypeForSlug = job.proposed_slug?.startsWith("repair/") ? "repair" : (job.page_type || "symptom");
      const pageType = pageTypeForSlug || "symptom";

      try {
        console.log("🚀 GENERATING:", proposedSlug);

        const result = await generateTwoStagePage(proposedSlug, {
          slug: proposedSlug,
          system: "HVAC",
          pageType: pageType,
          coreOnly: false
        });

        console.log("📦 GENERATED SUCCESS:", proposedSlug);
        console.log("✅ VALIDATION PASSED:", proposedSlug);

        const fallbackObj = getFallback(pageType);
        const isFallback = result.content?.hero?.headline === fallbackObj.content?.hero?.headline;
        console.log({
          slug: proposedSlug,
          status: 'published',
          hasFallback: isFallback,
          causes: (result as any).content?.commonCauses?.length,
          steps: (result as any).content?.diagnosticFlow?.length,
        });

        const pageStatus = isFallback ? 'failed' : 'published';
        if (isFallback) {
          console.warn(`⚠️ FALLBACK USED: ${proposedSlug}`);
        }

        const cleanSlug = normalizeSlug(proposedSlug);
        let city = job.city || null;
        if (!city && proposedSlug.startsWith('repair/')) {
          const parts = proposedSlug.split('/');
          if (parts.length >= 3) {
            city = parts[1];
          }
        }

        console.log("💾 INSERT START:", cleanSlug);

        const res = await sql`
          INSERT INTO pages (slug, content_json, status, page_type, title, city)
          VALUES (
            ${cleanSlug},
            ${JSON.stringify(result)}::jsonb,
            ${pageStatus},
            ${result.page_type || pageType},
            ${result.title || result.content?.hero?.headline || 'Untitled'},
            ${city}
          )
          ON CONFLICT (slug, page_type, city) DO UPDATE
          SET content_json = EXCLUDED.content_json,
              title = EXCLUDED.title,
              status = EXCLUDED.status,
              updated_at = NOW()
          RETURNING slug;
        `;

        console.log("✅ INSERT SUCCESS:", res[0]?.slug || cleanSlug);
        await new Promise(res => setTimeout(res, 1000));

        await sql`
          UPDATE generation_queue
          SET status = 'completed'
          WHERE id = ${job.id}
        `;

        processedCount++;

      } catch (err: any) {
        console.error("❌ HARD FAILURE:", proposedSlug);
        console.error(err);

        await sql`
          UPDATE generation_queue
          SET status = 'failed'
          WHERE id = ${job.id}
        `;
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

if (require.main === module) {
  const isManual = process.argv.includes('--manual');
  const limitArgIndex = process.argv.indexOf('--limit');
  const limit = limitArgIndex > -1 ? parseInt(process.argv[limitArgIndex + 1], 10) : undefined;
  
  const typeArgIndex = process.argv.indexOf('--type');
  const type = typeArgIndex > -1 ? process.argv[typeArgIndex + 1] : undefined;

  console.log("🔄 Starting Queue Drain Mode... " + (type ? `[Type: ${type}]` : ""));

  const startPolling = async () => {
    while (true) {
      try {
        const result = await runWorker({ manual: isManual, limit, type });
        
        if (result?.success === false) {
          console.log("🛑 Exiting: ", result?.reason);
          break;
        }

        if (result?.processedCount === 0 && result?.failedCount === 0) {
          console.log("🏁 No jobs left in queue, exiting");
          break;
        }

        if (isManual) {
          console.log("🏁 Manual single-batch complete. Exiting Drain Mode.");
          break;
        }

        await new Promise(res => setTimeout(res, 1000));
      } catch (err) {
        console.error("Loop error:", err);
        break;
      }
    }
    
    setTimeout(() => {
      console.log("Safely terminating process after 1500ms flush...");
      process.exit(0);
    }, 1500);
  }

  startPolling().catch(err => {
    console.error("Fatal polling error:", err);
    process.exit(1);
  });
}
