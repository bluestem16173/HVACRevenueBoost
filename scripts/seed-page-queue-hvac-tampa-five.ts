/**
 * Idempotent seed: five Tampa HVAC slugs into `public.page_queue`.
 * Run: npx tsx scripts/seed-page-queue-hvac-tampa-five.ts
 *
 * Note: `lib/db` exports the Neon client as default (`import sql from "@/lib/db"`).
 * `page_queue.priority` must be 'high' | 'medium' | 'low' (not a number).
 */
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import sql from "@/lib/db";
import { ensurePageQueueSchema } from "@/lib/homeservice/ensurePageQueueSchema";
import { canonicalLocalizedStorageSlug } from "@/lib/localized-city-path";

const seeds = [
  "hvac/ac-not-cooling/tampa-fl",
  "hvac/ac-not-turning-on/tampa-fl",
  "hvac/weak-airflow/tampa-fl",
  "hvac/ac-freezing-up/tampa-fl",
  "hvac/ac-making-noise/tampa-fl",
];

async function main() {
  await ensurePageQueueSchema();

  await Promise.all(
    seeds.map((raw) => {
      const slug = canonicalLocalizedStorageSlug(raw);
      return sql`
        INSERT INTO public.page_queue (slug, page_type, status, priority)
        VALUES (${slug}, ${"hsd"}, ${"pending"}, ${"high"})
        ON CONFLICT (slug) DO NOTHING
      `;
    })
  );

  console.log("Seeded 5 pages (skipped rows that already existed on slug).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
