/**
 * ## Seed → Generate → Publish (this repo)
 *
 * **Seed** does *not* write finished HTML or call the LLM. It only declares **what should exist**:
 * a row in `generation_queue` with `status = draft` (a blueprint the worker can claim).
 *
 * **Generate** is `scripts/generation-worker.ts`: claims jobs, builds `content_json`, validates schema,
 * dual-writes `pages`, updates queue status (`generated` → `validated` → `published` or `failed`).
 *
 * **Publish** is the terminal success path: `pages.status` / `quality_status` reflect a live page
 * (see `lib/page-status.ts`). Localized HVAC URLs such as `/hvac/{slug}/{city}` read from `pages`.
 *
 * ### `page_queue` vs `generation_queue`
 *
 * **Default / HVAC graph worker:** `generation_queue` (`lib/generation-queue.ts`, migration 010).
 *
 * **HSD city diagnostic batch (Tampa presets + publish gate):** real table **`page_queue`**
 * (`db/migrations/015_page_queue.sql`, `016_page_queue_attempts.sql`, `017_page_queue_completed_at.sql`, worker `lib/homeservice/hsdPageQueueWorker.ts`,
 * `scripts/hsd-page-queue-worker.ts`). Status flow: `pending` → `generating` → `done` | `failed`.
 * Each claim increments **`attempts`** (`UPDATE … SET status = 'generating', attempts = attempts + 1`).
 *
 * ### Column mapping (conceptual → actual)
 *
 * | Concept (doc) | Typical DB column |
 * |---------------|-------------------|
 * | slug          | `proposed_slug`   |
 * | page_type     | `page_type` (`diagnostic` / `symptom` / … — aliases normalize via `config/page-types.ts`) |
 * | city          | `city` (e.g. `tampa-fl`) |
 * | status        | `status` (`lib/queue-status.ts`) |
 * | vertical      | Not a first-class queue column everywhere; implied `hvac` for this seed batch + `pages.site` where set downstream |
 * | priority      | `priority` when present (optional; worker currently orders primarily by `created_at`) |
 */

import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";

/** Canonical queue table for seeded build targets. */
export const SEED_QUEUE_TABLE = "generation_queue" as const;

export type HvacFlDiagnosticSeedTarget = {
  /** Symptom / pillar slug (no `diagnose/` prefix). */
  proposedSlug: string;
  /** City segment, e.g. `tampa-fl` — matches `/hvac/{slug}/{city}`. */
  citySlug: string;
  /** 1 = ship first … 10 = later batch (worker may still FIFO on `created_at`). */
  priority: number;
};

function titleFor(slug: string, citySlug: string): string {
  const label = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const place = formatCityPathSegmentForDisplay(citySlug);
  return `${label} — ${place}`;
}

/**
 * First controlled batch: **50** localized HVAC diagnostic seeds (10 high-intent slugs × 5 FL metros).
 * Idempotent when used with `scripts/seed-first-50-hvac-fl-diagnostics.ts` (skips existing slug+city+type).
 */
export const FIRST_50_HVAC_FL_DIAGNOSTIC_SEEDS: HvacFlDiagnosticSeedTarget[] = (() => {
  const slugs = [
    "ac-not-cooling",
    "ac-not-turning-on",
    "ac-blowing-warm-air",
    "ac-freezing-up",
    "weak-airflow",
    "uneven-cooling",
    "furnace-not-heating",
    "hvac-short-cycling",
    "hvac-not-responding-to-thermostat",
    "hvac-leaking-water",
  ];
  const cities = ["tampa-fl", "orlando-fl", "miami-fl", "jacksonville-fl", "fort-myers-fl"];
  const out: HvacFlDiagnosticSeedTarget[] = [];
  let p = 1;
  for (const proposedSlug of slugs) {
    for (const citySlug of cities) {
      out.push({ proposedSlug, citySlug, priority: p++ });
    }
  }
  return out;
})();

export function proposedTitleForSeed(row: HvacFlDiagnosticSeedTarget): string {
  return titleFor(row.proposedSlug, row.citySlug);
}
