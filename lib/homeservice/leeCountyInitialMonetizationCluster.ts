/**
 * **Locked** initial monetization cluster — electrical + plumbing × Lee County, FL.
 *
 * Do not add or remove symptoms or cities without an explicit product decision. Queue seeds,
 * national indexability for these trades, and Lee enrichment assume this exact shape.
 *
 * | Trade       | Problems |
 * |------------|----------|
 * | Electrical | breaker-keeps-tripping, outlet-not-working, power-out-in-one-room |
 * | Plumbing   | no-hot-water, drain-clogged, water-heater-leaking |
 *
 * Cities (human): Fort Myers, Cape Coral, Estero, Fort Myers Beach, Sanibel, North Captiva, Gateway — storage tails
 * live in {@link LEE_COUNTY_CITIES} (`lib/vertical-hub-shared.ts`).
 */
import { LEE_COUNTY_CITIES } from "@/lib/vertical-hub-shared";

/** Electrical problem pillars in this cluster (URL segment after `/electrical/`). */
export const LEE_MONETIZATION_ELECTRICAL_SYMPTOMS = [
  "breaker-keeps-tripping",
  "outlet-not-working",
  "power-out-in-one-room",
] as const;

/** Plumbing problem pillars in this cluster (URL segment after `/plumbing/`). */
export const LEE_MONETIZATION_PLUMBING_SYMPTOMS = [
  "no-hot-water",
  "drain-clogged",
  "water-heater-leaking",
] as const;

/** City path bases (`{base}-fl` in storage slugs / URLs), aligned with {@link LEE_COUNTY_CITIES}. */
export const LEE_MONETIZATION_CITY_BASE_SLUGS: readonly string[] = LEE_COUNTY_CITIES.map((tail) =>
  tail.replace(/-fl$/i, "")
);

export type LeeMonetizationVertical = "electrical" | "plumbing";

export type LeeMonetizationPageQueueJob = { vertical: LeeMonetizationVertical; slug: string };

/** Rows for `page_queue` / `generation_queue` Lee seeds (`{vertical}/{symptom}/{city}-fl`). */
export function getLeeMonetizationPageQueueJobs(): LeeMonetizationPageQueueJob[] {
  return [
    ...LEE_MONETIZATION_ELECTRICAL_SYMPTOMS.map((slug) => ({ vertical: "electrical" as const, slug })),
    ...LEE_MONETIZATION_PLUMBING_SYMPTOMS.map((slug) => ({ vertical: "plumbing" as const, slug })),
  ];
}
