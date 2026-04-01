import "dotenv/config";
import {
  BATCH_SIZE,
  getQueuedJobs,
  markFailedPermanent,
  queueAttemptCount,
} from "../lib/generation-queue";
import sql from '../lib/db';
import { generateDiagnosticEngineJson, transformDGToUnified, assertCriticalDiagnosticFields } from '../lib/content-engine/generator';
import { getFallback, Schema } from '../lib/content-engine/schema';
import { EXPECTED_PROMPT_HASH } from '../lib/content-engine/core';
import { normalizeToBaseSlug, buildSlug } from '../lib/slug-helpers';
import { buildRetryPromptFragment } from '../lib/prompt-schema-router';
import { scoreGoldStandardPage, type PageType, PUBLISH_THRESHOLDS } from '../lib/quality-scorer';
import { shouldUseAiForQueueJob } from "../lib/content-strategy";
import {
  checkSpendSpikeAndShutdown,
  isEmergencyGenerationShutdown,
} from "../lib/emergency-generation-shutdown";
import { validateV2 } from "../lib/validators/validate-v2";
import { migrateOnePage } from "../lib/content-engine/relational-upsert";
import { QueueStatus } from "../lib/queue-status";
import { pagesStatusAfterSuccessfulGeneration } from "../lib/page-status";
import { describeQueueJobForLogs } from "../lib/content-system/registry";

console.log("DB URL:", process.env.DATABASE_URL);
if (process.env.DRY_RUN === "true") {
  console.log("🧪 DRY_RUN=true — no AI calls; jobs will be released back to draft.");
}

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/^diagnose\//, '')
    .replace(/^repair\/[^/]+\//, '') // 🔥 strips location layer
    .replace(/\s+/g, '-')
    .trim();
}

let isWorkerRunning = false;

export async function runWorker(options: { limit?: number, manual?: boolean, type?: string } = {}) {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.log("🚫 Generation globally disabled");
    return { success: false, reason: "GENERATION_DISABLED" };
  }

  if (await isEmergencyGenerationShutdown()) {
    console.log(
      "🚨 Emergency generation shutdown is ON (system_state). Clear: UPDATE system_state SET value = 'false' WHERE key = 'generation_emergency_shutdown';"
    );
    return { success: false, reason: "EMERGENCY_SHUTDOWN" };
  }

  if (await checkSpendSpikeAndShutdown()) {
    return { success: false, reason: "SPEND_SPIKE_SHUTDOWN" };
  }

  try {
    const spendRes = await sql`
      SELECT COUNT(*) as generated_today
      FROM pages
      WHERE DATE(updated_at) = CURRENT_DATE
        AND status = 'published'
    `;
    const todaySpend = parseInt((spendRes as any[])[0]?.generated_today || "0", 10);
    // Hard $5 Daily Budget Cap
    const DAILY_BUDGET = 5; // dollars
    const estimatedCost = todaySpend * 0.01; // ~1 cent per generation

    if (estimatedCost >= DAILY_BUDGET) {
      console.log(`💸 Daily budget reached ($${estimatedCost.toFixed(2)} / $${DAILY_BUDGET}). Stopping.`);
      process.exit(0);
    }
  } catch (e) {
    console.log("⚠️ Could not verify daily spend guard, proceeding with caution.");
  }

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

    let batchSize =
      typeof options.limit === "number" && options.limit > 0
        ? options.limit
        : parseInt(process.env.CANARY_BATCH_SIZE || String(BATCH_SIZE), 10) || BATCH_SIZE;

    const MAX_JOBS_PER_RUN = 50;
    if (batchSize > MAX_JOBS_PER_RUN) {
      console.log(`⚠️ Requested batch size (${batchSize}) exceeds hard limit. Capping to ${MAX_JOBS_PER_RUN}.`);
      batchSize = MAX_JOBS_PER_RUN;
    }

    const items = (await getQueuedJobs(batchSize, options.type)) as any[];

    console.log(`📦 Fetched ${items.length} draft/queued jobs (batch up to ${batchSize}).`);

    for (const job of items) {
      if (process.env.GENERATION_ENABLED !== "true") {
        console.log("🛑 Mid-batch stop — GENERATION_ENABLED off (e.g. emergency spend spike)");
        for (const j of items) {
          await sql`
            UPDATE generation_queue
            SET status = ${QueueStatus.DRAFT}
            WHERE id = ${j.id} AND status IN ('generated', 'processing')
          `;
        }
        break;
      }

      const attemptCount = queueAttemptCount(job as Record<string, unknown>);
      if (attemptCount > 1) {
        console.log("🔒 attempt_count > 1 — permanent fail:", job.id, job.proposed_slug);
        await markFailedPermanent(job.id as number);
        failedCount++;
        continue;
      }

      const proposedSlug = job.proposed_slug;
      const pageTypeForSlug = job.proposed_slug?.startsWith("repair/") ? "repair" : (job.page_type || "symptom");
      const pageType = pageTypeForSlug || "symptom";

      console.log("📖 Content OS registry:", describeQueueJobForLogs(String(job.page_type), String(proposedSlug)));

      if (process.env.DRY_RUN === "true") {
        console.log("Would generate:", proposedSlug, { page_type: job.page_type, id: job.id });
        await sql`
          UPDATE generation_queue
          SET status = ${QueueStatus.DRAFT}
          WHERE id = ${job.id}
        `;
        continue;
      }

      if (!shouldUseAiForQueueJob(String(job.page_type || pageType), String(proposedSlug))) {
        console.log(
          "📍 Layer 8 — skipping AI for location/template page (expand from canonical symptom in code):",
          proposedSlug
        );
        await sql`
          UPDATE generation_queue
          SET
            status = ${QueueStatus.PUBLISHED},
            last_error = 'layer8_template_expansion'
          WHERE id = ${job.id}
        `;
        processedCount++;
        continue;
      }

      try {
        console.log("🚀 GENERATING:", proposedSlug);

        let attempts = 0;
        let lastError = "";
        let finalResult: any = null;
        /** Never `generation_queue.status` — only `pages.status` lifecycle (see lib/page-status.ts). */
        let pagesInsertStatus: ReturnType<typeof pagesStatusAfterSuccessfulGeneration> | null = null;
        let schemaVersion = "v5_master";

        while (attempts < 3) {
          const rawDg = await generateDiagnosticEngineJson(
            { symptom: proposedSlug, city: job.city || "Florida", pageType },
            lastError,
            job.orchestrator_options
          );

          console.log(`📦 JSON GENERATED (Attempt ${attempts + 1}/3):`, proposedSlug);

          let validation = { valid: false, error: "" };
          try {
            validateV2(rawDg);
            validation = { valid: true, error: "" };
          } catch(ve: any) {
            validation = { valid: false, error: ve.message };
          }

          if (validation.valid) {
            console.log(`✅ Validation passed for ${proposedSlug}`);
            finalResult = rawDg;
            pagesInsertStatus = pagesStatusAfterSuccessfulGeneration();
            break;
          }

          console.log(`⚠️ Validation failed: ${validation.error}. Retrying ${proposedSlug}...`);
          lastError = validation.error || "Unknown validation failure";
          attempts++;
        }

        if (!pagesInsertStatus || !finalResult) {
          console.error(`❌ Rejected weak page ${proposedSlug}. Failed on: ${lastError}`);
          throw new Error(lastError || "Failed all 3 attempts to generate valid schema");
        }

        const result = finalResult;

        await sql`
          UPDATE generation_queue
          SET status = ${QueueStatus.VALIDATED}
          WHERE id = ${job.id}
        `;

        // Add required properties
        (result as any)._prompt_hash = EXPECTED_PROMPT_HASH;
        (result as any).engineVersion = "v5.0";

        console.log({
          slug: proposedSlug,
          pages_status: pagesInsertStatus,
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

        console.log("💾 DUAL-WRITE V2 START:", cleanSlug);

        // V2 Relational Engine Native Upsert
        // (This validates, drops junctions, and transactionally layers Causes, Repais, Flowcharts into PG)
        await migrateOnePage(sql, null, cleanSlug, result);

        // V1 Legacy Fallback Upsert (True Dual-Write)
        // pages.status is NOT derived from generation_queue.status.
        const res = await sql`
          INSERT INTO pages (slug, content_json, status, page_type, title, city, schema_version)
          VALUES (
            ${cleanSlug},
            ${JSON.stringify(result)}::jsonb,
            ${pagesInsertStatus},
            ${result.page_type || pageType},
            ${result.title || 'Untitled'},
            ${city},
            ${schemaVersion}
          )
          ON CONFLICT (slug) DO UPDATE
          SET content_json = EXCLUDED.content_json,
              title = EXCLUDED.title,
              status = EXCLUDED.status,
              page_type = EXCLUDED.page_type,
              schema_version = EXCLUDED.schema_version,
              updated_at = NOW()
          RETURNING slug;
        `;

        console.log("✅ DUAL-WRITE SUCCESS:", cleanSlug);
        console.log(`ORCH::PAGE_CREATED=${JSON.stringify({ slug: cleanSlug, url: "/diagnose/" + cleanSlug })}`);
        await new Promise(res => setTimeout(res, 1000));

        await sql`
          UPDATE generation_queue
          SET status = ${QueueStatus.PUBLISHED}
          WHERE id = ${job.id}
        `;

        processedCount++;

      } catch (err: any) {
        console.error("❌ HARD FAILURE:", proposedSlug);
        if (err.issues) console.error("ZOD ISSUES:", JSON.stringify(err.issues, null, 2));
        else console.error(err.message || err);

        const msg = String(err?.message || err);
        console.log(`ORCH::ERROR=${JSON.stringify({ slug: proposedSlug, error: msg.slice(0, 500) })}`);
        const isDailyLimit = msg.includes("DAILY_SPEND_LIMIT_REACHED");
        const isRateLimit = err?.code === '429' || err?.status === 429 || msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota");
        const PAGE_QUEUE_FAIL_AFTER_ATTEMPTS = parseInt(process.env.PAGE_QUEUE_FAIL_AFTER_ATTEMPTS || "3", 10);

        if (isDailyLimit) {
          await sql`
            UPDATE generation_queue
            SET status = ${QueueStatus.DRAFT}
            WHERE id = ${job.id}
          `;
        } else if (isRateLimit) {
          console.log("🛑 429 Rate Limit hit. Failing job permanently to prevent burn loop.");
          await sql`
            UPDATE generation_queue
            SET attempts = ${PAGE_QUEUE_FAIL_AFTER_ATTEMPTS}, status = ${QueueStatus.FAILED}, last_error = ${msg.slice(0, 2000)}
            WHERE id = ${job.id}
          `;
        } else {
          const prev = queueAttemptCount(job as Record<string, unknown>);
          const next = prev + 1;
          if (next >= PAGE_QUEUE_FAIL_AFTER_ATTEMPTS) {
            await sql`
              UPDATE generation_queue
              SET
                attempts = ${next},
                status = ${QueueStatus.FAILED},
                last_error = ${msg.slice(0, 2000)}
              WHERE id = ${job.id}
            `;
          } else {
            await sql`
              UPDATE generation_queue
              SET
                attempts = ${next},
                status = ${QueueStatus.DRAFT},
                last_error = ${msg.slice(0, 2000)}
              WHERE id = ${job.id}
            `;
          }
        }
        if (isDailyLimit) {
          console.log("💸 Stopping batch — daily budget; job re-queued for later.");
          const otherIds = items.map((j: { id: number }) => j.id).filter((id: number) => id !== job.id);
          for (const oid of otherIds) {
            await sql`
              UPDATE generation_queue
              SET status = ${QueueStatus.DRAFT}
              WHERE id = ${oid} AND status IN ('generated', 'processing')
            `;
          }
          break;
        }
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
  console.log(`ORCH::COMPLETE=${JSON.stringify({ processedCount, failedCount })}`);
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
