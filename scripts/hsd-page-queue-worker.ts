/**
 * Step 5 worker: pull pending rows from `page_queue`, generate HSD city JSON, validate, upsert `pages`.
 *
 * Usage:
 *   GENERATION_ENABLED=true npx tsx scripts/hsd-page-queue-worker.ts
 *   npx tsx scripts/hsd-page-queue-worker.ts --limit 5
 *
 * Prereq: `npx tsx scripts/run-migration-015.ts` and optional seed:
 *   `npx tsx scripts/seed-hsd-tampa-page-queue.ts`
 */
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runHsdPageQueueBatch } from "@/lib/homeservice/hsdPageQueueWorker";

function argLimit(): number {
  const idx = process.argv.indexOf("--limit");
  if (idx >= 0 && process.argv[idx + 1]) {
    const n = parseInt(process.argv[idx + 1], 10);
    if (!Number.isNaN(n) && n > 0) return Math.min(50, n);
  }
  return 10;
}

async function main() {
  const limit = argLimit();
  console.log(`page_queue batch: limit=${limit}`);
  const out = await runHsdPageQueueBatch(limit);
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
