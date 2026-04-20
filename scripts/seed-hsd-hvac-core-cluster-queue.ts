/**
 * Scale mode: seed the **HVAC high-intent core cluster** (10 symptoms) into `page_queue` as pending.
 *
 * Order matches `HVAC_CORE_CLUSTER_SYMPTOM_ORDER` in `lib/homeservice/hsdHvacCoreCluster.ts`.
 *
 * Usage:
 *   npx tsx scripts/seed-hsd-hvac-core-cluster-queue.ts
 *   HSD_CLUSTER_CITY=austin-tx npx tsx scripts/seed-hsd-hvac-core-cluster-queue.ts
 *
 * Prereq: DATABASE_URL, migrations through 015+ (`page_queue`), `ensurePageQueueSchema`.
 */
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import sql from "@/lib/db";
import { ensurePageQueueSchema } from "@/lib/homeservice/ensurePageQueueSchema";
import { HVAC_CORE_CLUSTER_SYMPTOM_ORDER } from "@/lib/homeservice/hsdHvacCoreCluster";
import { canonicalLocalizedStorageSlug } from "@/lib/localized-city-path";

function priorityForIndex(i: number): string {
  if (i < 4) return "high";
  if (i < 7) return "medium";
  return "low";
}

async function main() {
  await ensurePageQueueSchema();
  const city = (process.env.HSD_CLUSTER_CITY || "tampa-fl").trim().toLowerCase();
  let n = 0;
  for (let i = 0; i < HVAC_CORE_CLUSTER_SYMPTOM_ORDER.length; i++) {
    const sym = HVAC_CORE_CLUSTER_SYMPTOM_ORDER[i];
    const slug = canonicalLocalizedStorageSlug(`hvac/${sym}/${city}`);
    const priority = priorityForIndex(i);
    await sql`
      INSERT INTO public.page_queue (slug, page_type, status, priority)
      VALUES (${slug}, ${"hsd"}, ${"pending"}, ${priority})
      ON CONFLICT (slug) DO UPDATE SET
        status = 'pending',
        priority = EXCLUDED.priority,
        updated_at = NOW(),
        last_error = NULL,
        completed_at = NULL
    `;
    console.log("queued:", slug, priority);
    n++;
  }
  console.log("✅ Seeded", n, "HVAC core-cluster page_queue rows (city=" + city + ").");
  console.log("   Run: npx tsx scripts/hsd-page-queue-worker.ts --limit 10");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
