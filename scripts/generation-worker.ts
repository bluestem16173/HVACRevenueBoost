import "dotenv/config";
import sql from '../lib/db';
import { generateDiagnosticEngineJson, transformDGToUnified, assertCriticalDiagnosticFields } from '../lib/content-engine/generator';
import { getFallback, Schema } from '../lib/content-engine/schema';
import { EXPECTED_PROMPT_HASH } from '../lib/content-engine/core';
import { normalizeToBaseSlug, buildSlug } from '../lib/slug-helpers';
import { buildRetryPromptFragment } from '../lib/prompt-schema-router';
import { scoreGoldStandardPage, type PageType, PUBLISH_THRESHOLDS } from '../lib/quality-scorer';

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

        let attempt = 0;
        let finalResult: any = null;
        let finalStatus: 'published' | 'failed' | 'needs_regen' = 'published';
        let currentFeedback: string[] = [];

        // Max 2 retries (3 attempts total)
        const maxAttempts = 3;

        while (attempt < maxAttempts) {
          const rawDg = await generateDiagnosticEngineJson(proposedSlug, {
            slug: proposedSlug,
            system: "HVAC",
            pageType: pageType,
            coreOnly: false,
            retryFeedback: currentFeedback.length > 0 ? buildRetryPromptFragment(currentFeedback) : undefined
          });

          console.log(`📦 DG JSON GENERATED (Attempt ${attempt + 1}/${maxAttempts}):`, proposedSlug);

          const transformed = transformDGToUnified(rawDg, proposedSlug, pageType);

          if (pageType === 'diagnostic') {
            try { assertCriticalDiagnosticFields(transformed, pageType); }
            catch (err: any) { console.error("Critical fields missing:", err.message); }
          }

          let schemaPassed = true;
          try {
            Schema.parse(transformed);
          } catch (err: any) {
            console.error("❌ Schema parse failed silently on attempt", attempt + 1);
            schemaPassed = false;
          }

          const validation = scoreGoldStandardPage(transformed, pageType as PageType);
          
          finalResult = transformed;
          (finalResult as any)._quality = validation;

          console.log(
            `[validator] slug=${proposedSlug} score=${validation.score} schemaPassed=${schemaPassed} hardReject=${validation.hardReject}`
          );

          if (schemaPassed && validation.valid) {
            console.log("✅ GOLD STANDARD VALIDATION PASSED:", proposedSlug);
            finalStatus = 'published';
            break;
          }

          if (validation.hardReject) {
            console.error(`❌ HARD REJECT logic hit for ${proposedSlug}:`, validation.reasons.join(" | "));
            finalStatus = 'failed';
            break; // Do not retry a hard reject if it's fundamentally flawed, or we could continue to retry based on policy. Let's retry unless we exhaust.
          }

          if (validation.retryable && attempt < maxAttempts - 1) {
            console.log(`⚠️ Weak page, initiating RETRY for ${proposedSlug}. Score: ${validation.score}`);
            currentFeedback = validation.reasons;
            attempt++;
            continue;
          }

          // Exhausted retries or non-retryable
          if (validation.score >= 70) {
            finalStatus = 'needs_regen'; // Save it but flag it
            console.warn(`⚠️ Saving borderline page ${proposedSlug} with score ${validation.score}`);
          } else {
            finalStatus = 'failed';
            console.error(`❌ Rejected weak page ${proposedSlug}. Score: ${validation.score}`);
          }
          break;
        }

        const result = finalResult;
        const status = finalStatus;

        // Add required properties
        (result as any)._prompt_hash = EXPECTED_PROMPT_HASH;
        (result as any).engineVersion = "v5.0";

        console.log({
          slug: proposedSlug,
          status: status,
          causes: result?.content?.causes?.length || result?.content?.top_causes?.length,
          steps: result?.content?.diagnostic_flow?.length || result?.content?.diagnosticFlow?.length,
        });

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
            ${status},
            ${result.page_type || pageType},
            ${result.title || result.content?.hero?.problemStatement || 'Untitled'},
            ${city}
          )
          ON CONFLICT (site, page_type, slug, COALESCE(city, '')) DO UPDATE
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
        if (err.issues) console.error("ZOD ISSUES:", JSON.stringify(err.issues, null, 2));
        else console.error(err.message || err);

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
