/**
 * Seed `public.page_queue` with Tampa HVAC localized slugs (idempotent).
 *
 *   npx tsx scripts/seedQueue.ts
 *
 * Requires: DATABASE_URL (via `.env.local`)
 */
import "dotenv/config";
import sql from "../lib/db";
import { ensurePageQueueSchema } from "../lib/homeservice/ensurePageQueueSchema";
import { enforceStoredSlug } from "../lib/slug-utils";

const symptoms = [
  "ac-not-cooling",
  "ac-not-turning-on",
  "weak-airflow",
  "ac-freezing-up",
  "ac-making-noise",
  "outside-unit-not-running",
  "ac-short-cycling",
  "no-cold-air",
  "ac-leaking-water",
] as const;

async function main() {
  await ensurePageQueueSchema();

  await Promise.all(
    symptoms.map((s) => {
      const slug = enforceStoredSlug(`hvac/${s}/tampa-fl`);
      return sql`
        INSERT INTO public.page_queue (slug)
        VALUES (${slug})
        ON CONFLICT (slug) DO NOTHING
      `;
    })
  );

  console.log(`Seeded page_queue (best-effort): ${symptoms.length} slugs → hvac/{symptom}/tampa-fl`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
