/**
 * Step 5 worker: pull pending rows from `page_queue`, generate HSD city JSON, validate, upsert `pages`.
 *
 * Per-job logic (including **catch** logging + failed-row `UPDATE`) lives in
 * `processOnePageQueueJob` / `runHsdPipeline` in `lib/homeservice/hsdPageQueueWorker.ts` — not in this file.
 *
 * Usage:
 *   GENERATION_ENABLED=true npx tsx scripts/hsd-page-queue-worker.ts
 *   npx tsx scripts/hsd-page-queue-worker.ts --limit 5
 *   (--limit is matched case-insensitively, e.g. --LIMIT 2)
 *
 * Prereq: `npx tsx scripts/run-migration-015.ts` and optional seed:
 *   `npx tsx scripts/seed-hsd-tampa-page-queue.ts`
 */
import path from "node:path";

import "dotenv/config";
import dotenv from "dotenv";
import { formatDatabaseUrlRuntimeForLog } from "../lib/db/databaseUrlFingerprint";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { runHsdPageQueueBatch } from "@/lib/homeservice/hsdPageQueueWorker";

function argLimit(): number {
  const idx = process.argv.findIndex((a) => a.toLowerCase() === "--limit");
  if (idx >= 0 && process.argv[idx + 1]) {
    const n = parseInt(process.argv[idx + 1], 10);
    if (!Number.isNaN(n) && n > 0) return Math.min(50, n);
  }
  return 10;
}

async function main() {
  const limit = argLimit();
  console.log(formatDatabaseUrlRuntimeForLog());
  console.log(`page_queue batch: limit=${limit}`);
  const out = await runHsdPageQueueBatch(limit);
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
