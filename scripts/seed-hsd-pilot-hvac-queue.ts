/**
 * Pilot batch: queue exactly 3 HVAC + Tampa FL city_symptom pages for quality review before scaling (~100).
 *
 * Prereq: Neon + `page_queue` (see `scripts/run-migration-015.ts` / `ensurePageQueueSchema`).
 *
 * 1. Add to `.env.local`: `DATABASE_URL=...` and `GENERATION_ENABLED=true` when you are ready to generate.
 * 2. `npm run db:seed-hsd-pilot-3-hvac`
 * 3. `npm run worker:hsd-pilot-3`
 * 4. Inspect `pages` rows for the three slugs (content_json + publish gate already enforced in worker).
 *
 * Slugs are chosen for variety: cooling complaint, no-start / electrical-adjacent, coil/ice symptom.
 */
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import sql from "@/lib/db";
import { ensurePageQueueSchema } from "@/lib/homeservice/ensurePageQueueSchema";
import { canonicalLocalizedStorageSlug } from "@/lib/localized-city-path";

const PILOT: { slug: string; priority: string }[] = [
  { slug: "hvac/ac-not-cooling/tampa-fl", priority: "high" },
  { slug: "hvac/ac-not-turning-on/tampa-fl", priority: "high" },
  { slug: "hvac/ac-freezing-up/tampa-fl", priority: "high" },
];

async function main() {
  await ensurePageQueueSchema();
  for (const row of PILOT) {
    const slug = canonicalLocalizedStorageSlug(row.slug);
    await sql`
      INSERT INTO public.page_queue (slug, page_type, status, priority)
      VALUES (${slug}, ${"city_symptom"}, ${"pending"}, ${row.priority})
      ON CONFLICT (slug) DO UPDATE SET
        status = 'pending',
        priority = EXCLUDED.priority,
        updated_at = NOW(),
        last_error = NULL,
        completed_at = NULL
    `;
    console.log("queued (pilot):", row.slug, row.priority);
  }
  console.log("✅ Pilot: seeded", PILOT.length, "page_queue rows. Run worker with --limit 3.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
