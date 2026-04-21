/**
 * **Locked** initial monetization cluster — electrical + plumbing × Lee County, FL (core grid).
 *
 * Do not add or remove symptoms or cities without an explicit product decision. Queue seeds,
 * national indexability for these trades, Lee enrichment, tier-one discovery, and on-page cluster
 * footers assume this exact shape.
 *
 * | Trade       | Problems (10 electrical × Lee grid) |
 * |------------|-------------------|
 * | Electrical | breaker-keeps-tripping, outlet-not-working, lights-flickering, power-out-in-one-room, circuit-overloaded, panel-hot-or-buzzing, gfi-keeps-tripping, partial-power-in-home, sparks-from-outlet, burning-smell-electrical |
 * | Plumbing   | water-heater-leaking, no-hot-water, low-water-pressure, pipe-leaking, clogged-drain, toilet-overflowing, sewer-smell, faucet-leaking |
 *
 * Cities (10): Fort Myers, Cape Coral, Lehigh Acres, Bonita Springs, Estero, North Fort Myers, Fort Myers Beach,
 * San Carlos Park, Gateway, Alva — storage tails in {@link LEE_COUNTY_CITIES} (`lib/vertical-hub-shared.ts`).
 */
import { LEE_COUNTY_CITIES } from "@/lib/vertical-hub-shared";
import { enforceStoredSlug } from "@/lib/slug-utils";

/** Electrical high-ROI cluster — URL segment after `/electrical/` (10 × 10 Lee city grid). */
export const LEE_MONETIZATION_ELECTRICAL_SYMPTOMS = [
  "breaker-keeps-tripping",
  "outlet-not-working",
  "lights-flickering",
  "power-out-in-one-room",
  "circuit-overloaded",
  "panel-hot-or-buzzing",
  "gfi-keeps-tripping",
  "partial-power-in-home",
  "sparks-from-outlet",
  "burning-smell-electrical",
] as const;

/**
 * Lee County core cities for localized electrical + plumbing rollout (all ten grid cities).
 * @deprecated Historical name — use {@link LEE_COUNTY_CORE_CITY_SLUGS}.
 */
export const LEE_ELECTRICAL_PRIORITY_CITY_SLUGS = LEE_COUNTY_CITIES;

/** Alias for queue scripts — same as {@link LEE_COUNTY_CITIES} storage tails. */
export const LEE_COUNTY_CORE_CITY_SLUGS: readonly string[] = [...LEE_COUNTY_CITIES];

/** Plumbing money cluster — URL segment after `/plumbing/`. */
export const LEE_MONETIZATION_PLUMBING_SYMPTOMS = [
  "water-heater-leaking",
  "no-hot-water",
  "low-water-pressure",
  "pipe-leaking",
  "clogged-drain",
  "toilet-overflowing",
  "sewer-smell",
  "faucet-leaking",
] as const;

/** City path bases (`{base}-fl` in storage slugs / URLs), aligned with {@link LEE_COUNTY_CITIES}. */
export const LEE_MONETIZATION_CITY_BASE_SLUGS: readonly string[] = LEE_COUNTY_CITIES.map((tail) =>
  tail.replace(/-fl$/i, ""),
);

const LEE_MONETIZATION_CITY_SET = new Set<string>(LEE_COUNTY_CITIES.map((c) => c.toLowerCase()));
const ELEC_SYM_SET = new Set<string>(LEE_MONETIZATION_ELECTRICAL_SYMPTOMS);
const PLUMB_SYM_SET = new Set<string>(LEE_MONETIZATION_PLUMBING_SYMPTOMS);

export type LeeMonetizationVertical = "electrical" | "plumbing";

export type LeeMonetizationPageQueueJob = { vertical: LeeMonetizationVertical; slug: string };

/** `hvac|plumbing|electrical/{symptom}/{city}-fl` within the locked Lee monetization grid. */
export function isLeeCountyMonetizationLocalizedSlug(storageSlug: string): boolean {
  const parts = enforceStoredSlug(storageSlug).split("/").filter(Boolean);
  if (parts.length !== 3) return false;
  const v = parts[0].toLowerCase();
  const sym = parts[1].toLowerCase();
  const city = parts[2].toLowerCase();
  if (!LEE_MONETIZATION_CITY_SET.has(city)) return false;
  if (v === "electrical") return ELEC_SYM_SET.has(sym);
  if (v === "plumbing") return PLUMB_SYM_SET.has(sym);
  return false;
}

/** Rows for `page_queue` / `generation_queue` Lee seeds (`{vertical}/{symptom}` pillar keys). */
export function getLeeMonetizationPageQueueJobs(): LeeMonetizationPageQueueJob[] {
  return [
    ...LEE_MONETIZATION_ELECTRICAL_SYMPTOMS.map((slug) => ({ vertical: "electrical" as const, slug })),
    ...LEE_MONETIZATION_PLUMBING_SYMPTOMS.map((slug) => ({ vertical: "plumbing" as const, slug })),
  ];
}
