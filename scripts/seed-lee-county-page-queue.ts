/**
 * Seed **page_queue** with the locked Lee initial monetization cluster
 * (`lib/homeservice/leeCountyInitialMonetizationCluster.ts`):
 * `{vertical}/{symptom}/{city}-fl` for `scripts/hsd-page-queue-worker.ts`.
 *
 * Storage slugs have **no leading slash** (matches `pages.slug` / worker).
 *
 * Run:
 *   SEED_DRY_RUN=1 npx tsx scripts/seed-lee-county-page-queue.ts
 *   npx tsx scripts/seed-lee-county-page-queue.ts
 *
 * Optional — legacy **generation_queue** (uses `proposed_slug`, not `slug`):
 *   npx tsx scripts/seed-lee-county-page-queue.ts --generation-queue
 */
import path from "node:path";

import "dotenv/config";
import dotenv from "dotenv";
import sql from "../lib/db";
import {
  getLeeMonetizationPageQueueJobs,
  LEE_MONETIZATION_CITY_BASE_SLUGS,
} from "../lib/homeservice/leeCountyInitialMonetizationCluster";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function storageSlug(vertical: string, pillar: string, cityBase: string): string {
  return `${vertical}/${pillar}/${cityBase}-fl`.toLowerCase();
}

async function seedPageQueue(dry: boolean): Promise<void> {
  console.log(`\n🚀 page_queue — Lee County (${dry ? "DRY RUN" : "LIVE"})`);
  const jobs = getLeeMonetizationPageQueueJobs();
  for (const job of jobs) {
    for (const city of LEE_MONETIZATION_CITY_BASE_SLUGS) {
      const slug = storageSlug(job.vertical, job.slug, city);
      const dup = await sql`SELECT 1 FROM public.page_queue WHERE slug = ${slug} LIMIT 1`;
      if (Array.isArray(dup) && dup.length > 0) {
        console.log(`  skip (exists): ${slug}`);
        continue;
      }
      if (dry) {
        console.log(`  [dry] INSERT page_queue`, slug);
        continue;
      }
      await sql`
        INSERT INTO public.page_queue (slug, page_type, status, priority)
        VALUES (${slug}, ${"city_symptom"}, ${"pending"}, ${"high"})
      `;
      console.log(`  ✅ queued: ${slug}`);
    }
  }
}

async function seedGenerationQueue(dry: boolean): Promise<void> {
  console.log(`\n🚀 generation_queue — Lee County blueprint (${dry ? "DRY RUN" : "LIVE"})`);
  const jobs = getLeeMonetizationPageQueueJobs();
  for (const job of jobs) {
    for (const city of LEE_MONETIZATION_CITY_BASE_SLUGS) {
      const proposed_slug = storageSlug(job.vertical, job.slug, city);
      const dup = await sql`
        SELECT 1 FROM generation_queue
        WHERE proposed_slug = ${proposed_slug}
          AND page_type = ${"city_diagnostic"}
        LIMIT 1
      `;
      if (Array.isArray(dup) && dup.length > 0) {
        console.log(`  skip (exists): ${proposed_slug}`);
        continue;
      }
      if (dry) {
        console.log(`  [dry] INSERT generation_queue`, proposed_slug);
        continue;
      }
      await sql`
        INSERT INTO generation_queue (proposed_slug, page_type, status, city)
        VALUES (${proposed_slug}, ${"city_diagnostic"}, ${"pending"}, ${`${city}-fl`})
      `;
      console.log(`  ✅ queued: ${proposed_slug}`);
    }
  }
}

async function main() {
  const dry = process.env.SEED_DRY_RUN === "1" || process.env.SEED_DRY_RUN === "true";
  const genQ = process.argv.includes("--generation-queue");

  await seedPageQueue(dry);
  if (genQ) {
    await seedGenerationQueue(dry);
  } else {
    console.log("\n(Tip: pass --generation-queue to also insert legacy generation_queue rows.)");
  }
  console.log("\n🎯 Lee County seed complete. Run worker: GENERATION_ENABLED=true npx tsx scripts/hsd-page-queue-worker.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
