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

console.log("DB URL:", process.env.DATABASE_URL);
if (process.env.DRY_RUN === "true") {
  console.log("🧪 DRY_RUN=true — no AI calls; jobs will be released back to pending.");
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

const QUEUE_STATUS = { pending: 'pending', processing: 'processing', completed: 'completed', failed: 'failed' };

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
    const DAILY_LIMIT = process.env.DAILY_LIMIT ? parseInt(process.env.DAILY_LIMIT, 10) : 10;

    if (todaySpend >= DAILY_LIMIT) {
      console.log(`💸 Daily budget hit (${todaySpend}/${DAILY_LIMIT}) — stopping`);
      return { success: false, reason: "Daily budget hit" };
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

    const batchSize =
      typeof options.limit === "number" && options.limit > 0
        ? options.limit
        : parseInt(process.env.CANARY_BATCH_SIZE || String(BATCH_SIZE), 10) || BATCH_SIZE;

    const items = (await getQueuedJobs(batchSize, options.type)) as any[];

    console.log(`📦 Fetched ${items.length} pending jobs (batch up to ${batchSize}).`);

    for (const job of items) {
      if (process.env.GENERATION_ENABLED !== "true") {
        console.log("🛑 Mid-batch stop — GENERATION_ENABLED off (e.g. emergency spend spike)");
        for (const j of items) {
          await sql`
            UPDATE generation_queue
            SET status = 'pending'
            WHERE id = ${j.id} AND status = 'processing'
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

      if (process.env.DRY_RUN === "true") {
        console.log("Would generate:", proposedSlug, { page_type: job.page_type, id: job.id });
        await sql`
          UPDATE generation_queue
          SET status = 'pending', updated_at = NOW()
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
            status = 'completed',
            last_error = 'layer8_template_expansion',
            updated_at = NOW()
          WHERE id = ${job.id}
        `;
        processedCount++;
        continue;
      }

      try {
        console.log("🚀 GENERATING:", proposedSlug);

        let attempt = 0;
        let finalResult: any = null;
        let finalStatus: 'published' | 'failed' | 'needs_regen' = 'published';
        let currentFeedback: string[] = [];
        let schemaVersion = "v2_goldstandard";

        // Max 2 retries (3 attempts total)
        const maxAttempts = 3;

        while (attempt < maxAttempts) {
          const rawDg = await generateDiagnosticEngineJson(proposedSlug, {
            slug: proposedSlug,
            system: "HVAC",
            pageType: pageType,
            coreOnly: false,
            schemaVersion: "v2_goldstandard",
            retryFeedback: currentFeedback.length > 0 ? buildRetryPromptFragment(currentFeedback) : undefined,
            bypassAutoMode: options.manual === true,
          });

          console.log(`📦 DG JSON GENERATED (Attempt ${attempt + 1}/${maxAttempts}):`, proposedSlug);

          try {
            // STEP 5 — VALIDATE AI OUTPUT (THIS IS HUGE)
            if (!rawDg.ai_summary) throw new Error("Missing summary");
            if (!rawDg.system_flow) throw new Error("Missing system flow");
            if (!rawDg.diagnostic_flow) throw new Error("Missing diagnostic flow");
            if (!rawDg.causes || rawDg.causes.length < 4) throw new Error("Weak causes");

            console.log("✅ GOLD STANDARD VALIDATION PASSED:", proposedSlug);
            finalResult = rawDg;
            finalStatus = 'published';
            break;
            
          } catch (err: any) {
            console.log(`⚠️ Validation failed: ${err.message}. Initiating RETRY for ${proposedSlug}.`);
            currentFeedback = [err.message];
            attempt++;
            
            if (attempt >= maxAttempts) {
              finalStatus = 'failed';
              console.error(`❌ Rejected weak page ${proposedSlug}. Failed on: ${err.message}`);
              break;
            }
            continue;
          }
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
          INSERT INTO pages (slug, content_json, status, page_type, title, city, schema_version)
          VALUES (
            ${cleanSlug},
            ${JSON.stringify(result)}::jsonb,
            ${status},
            ${result.page_type || pageType},
            ${result.title || 'Untitled'},
            ${city},
            ${schemaVersion}
          )
          ON CONFLICT (slug) DO UPDATE
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

        const msg = String(err?.message || err);
        const isDailyLimit = msg.includes("DAILY_SPEND_LIMIT_REACHED");
        if (isDailyLimit) {
          await sql`
            UPDATE generation_queue
            SET status = 'pending'
            WHERE id = ${job.id}
          `;
        } else {
          const prev = queueAttemptCount(job as Record<string, unknown>);
          const next = prev + 1;
          if (next > 1) {
            await sql`
              UPDATE generation_queue
              SET
                attempts = ${next},
                regeneration_attempts = ${next},
                status = 'failed',
                last_error = ${msg.slice(0, 2000)}
              WHERE id = ${job.id}
            `;
          } else {
            await sql`
              UPDATE generation_queue
              SET
                attempts = ${next},
                regeneration_attempts = ${next},
                status = 'pending',
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
              SET status = 'pending'
              WHERE id = ${oid} AND status = 'processing'
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
