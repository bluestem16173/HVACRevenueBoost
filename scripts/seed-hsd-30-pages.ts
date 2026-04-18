/**
 * Queue 30 Tampa FL city_symptom HSD jobs (10 HVAC + 10 plumbing + 10 electrical).
 * Idempotent: upserts pending state on slug conflict (matches seed-hsd-tampa-page-queue pattern).
 *
 * Prereq: DATABASE_URL in `.env.local`, migrations through 015+ (`page_queue`).
 *
 * Run: `npm run db:seed-hsd-30-pages`
 * Then: `npx tsx scripts/hsd-page-queue-worker.ts --limit 30` (or smaller batches)
 */
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import sql from "@/lib/db";
import { ensurePageQueueSchema } from "@/lib/homeservice/ensurePageQueueSchema";
import {
  buildLocalizedStorageSlug,
  canonicalLocalizedStorageSlug,
  type ServiceVertical,
} from "@/lib/localized-city-path";

const CITY_SLUG = "tampa-fl" as const;

/** Symptom segment only (kebab); vertical + city applied below. */
const SYMPTOMS: Record<ServiceVertical, { slug: string; priority: "high" | "medium" | "low" }[]> = {
  hvac: [
    { slug: "ac-not-cooling", priority: "high" },
    { slug: "ac-not-turning-on", priority: "high" },
    { slug: "ac-freezing-up", priority: "high" },
    { slug: "weak-airflow", priority: "medium" },
    { slug: "ac-blowing-warm-air", priority: "medium" },
    { slug: "ac-making-noise", priority: "medium" },
    { slug: "ac-short-cycling", priority: "medium" },
    { slug: "ac-leaking-water", priority: "medium" },
    { slug: "outside-unit-not-running", priority: "medium" },
    { slug: "thermostat-not-working", priority: "medium" },
  ],
  plumbing: [
    { slug: "no-hot-water", priority: "medium" },
    { slug: "water-heater-not-working", priority: "medium" },
    { slug: "low-water-pressure", priority: "medium" },
    { slug: "no-water-in-house", priority: "medium" },
    { slug: "toilet-wont-flush", priority: "medium" },
    { slug: "water-leak-in-wall", priority: "medium" },
    { slug: "pipe-leak-under-sink", priority: "medium" },
    { slug: "clogged-drain", priority: "medium" },
    { slug: "sewer-smell-in-house", priority: "medium" },
    { slug: "water-heater-leaking", priority: "medium" },
  ],
  electrical: [
    { slug: "power-out-in-part-of-house", priority: "medium" },
    { slug: "breaker-keeps-tripping", priority: "medium" },
    { slug: "outlet-not-working", priority: "medium" },
    { slug: "light-switch-not-working", priority: "medium" },
    { slug: "flickering-lights", priority: "medium" },
    { slug: "burning-smell-from-outlet", priority: "medium" },
    { slug: "electrical-panel-buzzing", priority: "medium" },
    { slug: "gfci-outlet-keeps-tripping", priority: "medium" },
    { slug: "circuit-overload", priority: "medium" },
    { slug: "no-power-to-ac-unit", priority: "medium" },
  ],
};

async function main() {
  await ensurePageQueueSchema();

  let n = 0;
  for (const vertical of Object.keys(SYMPTOMS) as ServiceVertical[]) {
    for (const row of SYMPTOMS[vertical]) {
      const built = buildLocalizedStorageSlug(vertical, row.slug, CITY_SLUG);
      const slug = canonicalLocalizedStorageSlug(built);

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
      console.log("queued:", slug, row.priority);
      n += 1;
    }
  }

  console.log("✅ Seeded", n, "page_queue rows (30 expected).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
