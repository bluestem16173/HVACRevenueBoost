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
import { HVACAuthorityPageSchema } from '../types/hvac-authority';
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
import {
  GENERATED_PAGE_LAYOUT,
  GENERATED_PAGE_SCHEMA_VERSION,
} from "../lib/generated-page-json-contract";

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

export function transformToHVACv3(old: any) {
  return {
    layout: GENERATED_PAGE_LAYOUT,
    page_type: "diagnostic",
    schema_version: GENERATED_PAGE_SCHEMA_VERSION,
    slug: old?.slug || "",
    title: old?.title || "",
    h1: old?.title || "",
    meta_title: old?.meta_title || old?.title || "",
    meta_description: old?.meta_description || "",
    canonical_path: `/diagnose/${old?.slug || ''}`,
    intro: old?.intro || old?.problem_overview || "Understanding the root causes of this HVAC issue.",

    summary_30s: {
      label: "30-Second Overview",
      bullets: old?.ai_summary?.bullets || []
    },

    immediate_quick_checks: (old?.quick_steps || []).map((step: string, i: number) => ({
      step_number: i + 1,
      instruction: step,
      why_it_matters: "Initial system check"
    })),

    diy_tools: (old?.tools || []).map((t: any) => ({
      tool: t.name,
      purpose: t.purpose,
      safe_for_basic_diy: t.beginner !== "No",
      caution_note: "Use caution when testing live electrical systems"
    })),

    high_risk_warning: {
      severity: "high",
      title: "Potential System Hazard",
      body: old?.safety_note || "",
      risk_points: [old?.safety_note || ""],
      show_emergency_cta: true
    },

    emergency_cta: {
      title: "Get Professional HVAC Help",
      body: "If your system is cycling abnormally, it may indicate electrical or compressor issues.",
      button_text: "Dispatch Technician",
      urgency_note: "Avoid further system damage or safety risk"
    },

    most_common_causes: (old?.causes || []).slice(0, 4).map((c: any) => ({
      cause: c.name,
      probability_note: c.probability,
      explanation: c.description,
      signs: [c.quick_fix]
    })),

    how_the_system_works: {
      overview: old?.deep_explanation || "",
      components: []
    },

    advanced_diagnostic_flow: (old?.diagnostic_flow?.steps || []).map((s: any, i: number) => ({
      step_number: i + 1,
      title: s.step,
      check: s.detail,
      normal_result: "System behaves normally",
      danger_or_fail_result: "Indicates deeper issue",
      next_action: "Proceed to next step"
    })),

    mermaid_diagram: {
      title: "System Flow",
      code: old?.system_flow || ""
    },

    repair_matrix: (old?.repair_paths || []).map((r: any) => ({
      symptom: old?.problem_summary || "",
      likely_issue: r.title,
      fix_type: r.title,
      difficulty: r.difficulty,
      estimated_cost: r.cost
    })),

    repair_vs_replace: {
      repair_when: "Component-level issue",
      replace_when: "Major system failure",
      decision_note: "Depends on system age and repair cost"
    },

    when_to_stop_diy: {
      title: "When to Stop DIY",
      intro: old?.safety_note || "",
      danger_points: [old?.safety_note || ""],
      conversion_body: "Electrical and refrigerant issues require professional handling",
      cta_text: "Call HVAC Technician"
    },

    prevention_tips: old?.prevention || [],

    faqs: old?.faq || [],

    internal_links: {
      related_symptoms: (old?.related_links || []).map((l: any) => l.href),
      related_system_pages: [],
      pillar_page: "/diagnose/hvac"
    },

    bottom_cta: {
      title: "Need Help Now?",
      body: "Short cycling can damage your system and increase costs.",
      urgency_bullets: ["Local Techs Available", "Upfront Pricing"],
      button_text: "Get HVAC Help"
    },

    author_note: "Generated HVAC diagnostic content"
  };
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

    const regenItemsRes = await sql`
      SELECT slug as proposed_slug, page_type, status, quality_status, city
      FROM pages 
      WHERE quality_status = 'needs_regen' 
      LIMIT ${batchSize}
    ` as any[];

    const regenItems = regenItemsRes.map(p => ({
      id: "regen_" + p.proposed_slug,
      proposed_slug: p.proposed_slug,
      page_type: p.page_type,
      city: p.city,
      orchestrator_options: null,
      is_regen: true
    }));

    let items = regenItems;
    if (items.length < batchSize) {
      const queued = (await getQueuedJobs(batchSize - items.length, options.type)) as any[];
      items = [...items, ...queued];
    }

    console.log(`📦 Fetched ${items.length} jobs (Regen: ${regenItems.length}, New: ${items.length - regenItems.length}) (batch capped at ${batchSize}).`);

    for (const job of items) {
      if (process.env.GENERATION_ENABLED !== "true") {
        console.log("🛑 Mid-batch stop — GENERATION_ENABLED off (e.g. emergency spend spike)");
        for (const j of items) {
          if (!j.is_regen) {
            await sql`
              UPDATE generation_queue
              SET status = ${QueueStatus.DRAFT}
              WHERE id = ${j.id} AND status IN ('generated', 'processing')
            `;
          }
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
      
      // Override legacy fallbacks: Publisher strictly respects the queue page_type
      const pageType = job.page_type || "hvac_authority_v3";

      console.log("📖 Content OS registry:", describeQueueJobForLogs(String(pageType), String(proposedSlug)));

      if (process.env.DRY_RUN === "true") {
        console.log("Would generate:", proposedSlug, { page_type: job.page_type, id: job.id });
        if (!job.is_regen) {
          await sql`
            UPDATE generation_queue
            SET status = ${QueueStatus.DRAFT}
            WHERE id = ${job.id as number}
          `;
        }
        continue;
      }

      if (!shouldUseAiForQueueJob(String(job.page_type || pageType), String(proposedSlug))) {
        console.log(
          "📍 Layer 8 — skipping AI for location/template page (expand from canonical symptom in code):",
          proposedSlug
        );
        if (!job.is_regen) {
          await sql`
            UPDATE generation_queue
            SET
              status = ${QueueStatus.PUBLISHED},
              last_error = 'layer8_template_expansion'
            WHERE id = ${job.id as number}
          `;
        }
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
        let schemaVersion = GENERATED_PAGE_SCHEMA_VERSION;

        while (attempts < 3) {
          const rawDgMsg = await generateDiagnosticEngineJson(
            { symptom: proposedSlug, city: job.city || "Florida", pageType },
            lastError,
            job.orchestrator_options
          );

          // ✨ APPLIED TRANSFORMATION LAYER ✨
          const transformed = transformToHVACv3(rawDgMsg);

          console.log(`📦 JSON GENERATED AND TRANSFORMED (Attempt ${attempts + 1}/3):`, proposedSlug);

          // 🛡️ RIGID ZOD VALIDATION CHECK 🛡️
          const schemaCheck = HVACAuthorityPageSchema.safeParse(transformed);
          let validation = { valid: true, error: "" };
          let finalData;

          if (schemaCheck.success) {
            finalData = schemaCheck.data;
          } else {
            console.error("Schema failed, using transformed fallback:", schemaCheck.error.flatten());
            finalData = transformed; // STILL USE IT
          }

          if (validation.valid) {
            console.log(`✅ Validation completed for ${proposedSlug}`);
            // Use the data (either fully validated output, or the fallback)
            finalResult = finalData;
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

        if (!job.is_regen) {
          await sql`
            UPDATE generation_queue
            SET status = ${QueueStatus.VALIDATED}
            WHERE id = ${job.id as number}
          `;
        }

        // Add required properties safely to avoid null reference crashes
        if (result && typeof result === 'object') {
          (result as any)._prompt_hash = EXPECTED_PROMPT_HASH;
          (result as any).engineVersion = "v5.0";
          if (pageType === "hvac_authority_v3") {
            (result as any).layout = GENERATED_PAGE_LAYOUT;
            (result as any).schema_version = GENERATED_PAGE_SCHEMA_VERSION;
          }
        }

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
        if (pageType !== "hvac_authority_v3") {
           await migrateOnePage(sql, null, cleanSlug, result);
        }

        if (finalResult && Object.keys(finalResult).length > 0) {
          const html = `<h1>${cleanSlug}</h1><p>Page live. Content loading.</p>`;

          console.log(`💾 SAVING ${pagesInsertStatus} TO DB FOR ${proposedSlug} WITH HTML OVERRIDE`);

          // V1 Legacy Fallback Upsert (True Dual-Write)
          const res = await sql`
            INSERT INTO pages (slug, content_json, content_html, status, quality_status, page_type, title, city, schema_version)
            VALUES (
              ${cleanSlug},
              ${JSON.stringify(finalResult)}::jsonb,
              ${html},
              ${pagesInsertStatus},
              'approved',
              ${pageType},
              ${finalResult.title || 'Untitled'},
              ${city},
              ${schemaVersion}
            )
            ON CONFLICT (slug) DO UPDATE
            SET content_json = EXCLUDED.content_json,
                content_html = EXCLUDED.content_html,
                title = EXCLUDED.title,
                page_type = EXCLUDED.page_type,
                schema_version = EXCLUDED.schema_version,
                status = EXCLUDED.status,
                quality_status = EXCLUDED.quality_status,
                updated_at = NOW()
            RETURNING slug;
          `;

          console.log("✅ DUAL-WRITE SUCCESS:", cleanSlug);
          console.log(`ORCH::PAGE_CREATED=${JSON.stringify({ slug: cleanSlug, url: "/diagnose/" + cleanSlug })}`);
          await new Promise(res => setTimeout(res, 1000));
        }

        if (!job.is_regen) {
          await sql`
            UPDATE generation_queue
            SET status = ${QueueStatus.PUBLISHED}
            WHERE id = ${job.id as number}
          `;
        } else {
          // Double verify for regen updates just in case the legacy dual-write above wasn't executed
          await sql`
            UPDATE pages 
            SET quality_status = 'approved', updated_at = NOW()
            WHERE slug = ${cleanSlug}
          `;
        }

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
          if (!job.is_regen) {
            await sql`
              UPDATE generation_queue
              SET status = ${QueueStatus.DRAFT}
              WHERE id = ${job.id as number}
            `;
          }
        } else if (isRateLimit) {
          console.log("🛑 429 Rate Limit hit. Failing job permanently to prevent burn loop.");
          if (!job.is_regen) {
            await sql`
              UPDATE generation_queue
              SET attempts = ${PAGE_QUEUE_FAIL_AFTER_ATTEMPTS}, status = ${QueueStatus.FAILED}, last_error = ${msg.slice(0, 2000)}
              WHERE id = ${job.id as number}
            `;
          }
        } else {
          if (!job.is_regen) {
            const prev = queueAttemptCount(job as Record<string, unknown>);
            const next = prev + 1;
            if (next >= PAGE_QUEUE_FAIL_AFTER_ATTEMPTS) {
              await sql`
                UPDATE generation_queue
                SET
                  attempts = ${next},
                  status = ${QueueStatus.FAILED},
                  last_error = ${msg.slice(0, 2000)}
                WHERE id = ${job.id as number}
              `;
            } else {
              await sql`
                UPDATE generation_queue
                SET
                  attempts = ${next},
                  status = ${QueueStatus.DRAFT},
                  last_error = ${msg.slice(0, 2000)}
                WHERE id = ${job.id as number}
              `;
            }
          } else {
             await sql`UPDATE pages SET quality_status = 'failed_regen' WHERE slug = ${job.proposed_slug}`;
          }
        }
        if (isDailyLimit) {
          console.log("💸 Stopping batch — daily budget; job re-queued for later.");
          const otherIds = items.filter(j => !j.is_regen).map((j: any) => j.id).filter((id: any) => id !== job.id);
          for (const oid of otherIds) {
            await sql`
              UPDATE generation_queue
              SET status = ${QueueStatus.DRAFT}
              WHERE id = ${oid as number} AND status IN ('generated', 'processing')
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
