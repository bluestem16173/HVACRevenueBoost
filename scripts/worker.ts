/**
 * Process `public.page_queue` rows: claim → `generateHsdPage` (Zod + retries + content rules) → `upsertPage` → done | failed.
 *
 *   npm run worker:hsd
 *   npx tsx scripts/worker.ts
 *
 * Do not use `node scripts/worker.ts` — this file is TypeScript and uses path aliases (`@/`).
 *
 * Requires: DATABASE_URL, GENERATION_ENABLED=true, OPENAI_API_KEY
 */
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  claimPageQueueJobs,
  markPageQueueDone,
  markPageQueueFailed,
} from "../lib/homeservice/hsdPageQueueWorker";
import { ensurePageQueueSchema } from "../lib/homeservice/ensurePageQueueSchema";
import {
  formatCityPathSegmentForDisplay,
  parseLocalizedStorageSlug,
} from "../lib/localized-city-path";
import { parseCityStateForPrompt } from "../lib/prompt-schema-router";
import { enforceStoredSlug } from "../lib/slug-utils";
import { generateHsdPage } from "../src/lib/ai/generateHsdPage";
import { upsertPage } from "../src/lib/db/upsertPage";

const BATCH = 5;
const IDLE_MS = 5000;
const BETWEEN_BATCH_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function cityStateFromStorageSlug(storageSlug: string): { city: string; state: string } {
  const parsed = parseLocalizedStorageSlug(enforceStoredSlug(storageSlug));
  if (!parsed) {
    throw new Error(`Unrecognized localized slug: ${storageSlug}`);
  }
  const display = formatCityPathSegmentForDisplay(parsed.citySlug);
  const { city, state } = parseCityStateForPrompt(display, null);
  if (!city.trim() || !state.trim()) {
    throw new Error(`Could not derive city/state from city slug "${parsed.citySlug}" (${storageSlug})`);
  }
  return { city: city.trim(), state: state.trim() };
}

let shuttingDown = false;
process.on("SIGINT", () => {
  shuttingDown = true;
  console.log("SIGINT — finishing current batch then exit.");
});

async function main() {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.error("Set GENERATION_ENABLED=true to run the HSD worker.");
    process.exit(1);
  }

  await ensurePageQueueSchema();
  console.log("HSD page_queue worker started (batch=%s). Ctrl+C to stop.", BATCH);

  while (!shuttingDown) {
    const jobs = await claimPageQueueJobs(BATCH);

    if (jobs.length === 0) {
      await sleep(IDLE_MS);
      continue;
    }

    for (const job of jobs) {
      const slug = enforceStoredSlug(job.slug);
      try {
        const parsed = parseLocalizedStorageSlug(slug);
        if (!parsed) {
          throw new Error(`Invalid queue slug: ${slug}`);
        }
        const { city, state } = cityStateFromStorageSlug(slug);

        const page = await generateHsdPage({
          symptom: parsed.pillarCore,
          city,
          state,
          vertical: parsed.vertical,
        });

        await upsertPage(page);
        await markPageQueueDone(job.id);
        console.log("done:", slug);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("failed:", slug, msg);
        await markPageQueueFailed(job.id, msg);
      }
    }

    await sleep(BETWEEN_BATCH_MS);
  }

  console.log("Worker stopped.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
