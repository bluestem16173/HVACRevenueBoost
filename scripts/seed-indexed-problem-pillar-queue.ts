/**
 * Queue **national** problem pillars for generation (`national_symptom` → PROBLEM_PILLAR_V1 pipeline).
 *
 * Targets (indexable money pillars):
 * - HVAC: ac-not-cooling, weak-airflow, no-cold-air
 * - Electrical: breaker-keeps-tripping, outlet-not-working
 * - Plumbing: no-hot-water, drain-clogged
 *
 * Usage:
 *   npx tsx scripts/seed-indexed-problem-pillar-queue.ts
 *
 * Then: GENERATION_ENABLED=true npx tsx scripts/hsd-page-queue-worker.ts --limit 10
 */
import path from "node:path";

import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import sql from "@/lib/db";
import { ensurePageQueueSchema } from "@/lib/homeservice/ensurePageQueueSchema";

const JOBS: { slug: string; priority: "high" | "medium" }[] = [
  { slug: "hvac/ac-not-cooling", priority: "high" },
  { slug: "hvac/weak-airflow", priority: "high" },
  { slug: "hvac/no-cold-air", priority: "high" },
  { slug: "electrical/breaker-keeps-tripping", priority: "high" },
  { slug: "electrical/outlet-not-working", priority: "high" },
  { slug: "plumbing/no-hot-water", priority: "high" },
  { slug: "plumbing/drain-clogged", priority: "high" },
];

async function main() {
  await ensurePageQueueSchema();
  for (const j of JOBS) {
    await sql`
      INSERT INTO public.page_queue (slug, page_type, status, priority)
      VALUES (${j.slug}, 'national_symptom', 'pending', ${j.priority})
      ON CONFLICT (slug) DO UPDATE SET
        page_type = EXCLUDED.page_type,
        status = 'pending',
        priority = EXCLUDED.priority,
        updated_at = NOW()
    `;
    console.log("queued:", j.slug, j.priority);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
