/**
 * Seed the 10 Tampa FL HSD city rows into `page_queue` as pending (idempotent).
 */
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import sql from "@/lib/db";
import { ensurePageQueueSchema } from "@/lib/homeservice/ensurePageQueueSchema";
import { canonicalLocalizedStorageSlug } from "@/lib/localized-city-path";

const SLUGS: { slug: string; priority: string }[] = [
  { slug: "hvac/ac-not-cooling/tampa-fl", priority: "high" },
  { slug: "hvac/ac-not-turning-on/tampa-fl", priority: "high" },
  { slug: "hvac/ac-freezing-up/tampa-fl", priority: "medium" },
  { slug: "hvac/ac-blowing-warm-air/tampa-fl", priority: "medium" },
  { slug: "hvac/thermostat-not-working/tampa-fl", priority: "medium" },
  { slug: "plumbing/water-heater-not-working/tampa-fl", priority: "medium" },
  { slug: "plumbing/no-hot-water/tampa-fl", priority: "medium" },
  { slug: "plumbing/water-heater-leaking/tampa-fl", priority: "medium" },
  { slug: "plumbing/toilet-keeps-running/tampa-fl", priority: "low" },
  { slug: "plumbing/shower-drain-clogged/tampa-fl", priority: "low" },
];

async function main() {
  await ensurePageQueueSchema();
  for (const row of SLUGS) {
    const slug = canonicalLocalizedStorageSlug(row.slug);
    await sql`
      INSERT INTO public.page_queue (slug, page_type, status, priority)
      VALUES (${slug}, ${"hsd"}, ${"pending"}, ${row.priority})
      ON CONFLICT (slug) DO UPDATE SET
        status = 'pending',
        priority = EXCLUDED.priority,
        updated_at = NOW(),
        last_error = NULL,
        completed_at = NULL
    `;
    console.log("queued:", row.slug, row.priority);
  }
  console.log("✅ Seeded", SLUGS.length, "page_queue rows (pending).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
