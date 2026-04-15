import type { City } from "@/lib/locations";
import { FLORIDA_CITIES } from "@/lib/locations";

/**
 * Week-1 HVAC supply lock: core symptom slugs × Florida priority metros.
 * Use for queue seeding, batch scripts, and vendor pitch volume (“we’re indexing X intent surfaces in FL”).
 *
 * Demand side (buyers) and geo-routing live in ops + future `lead_routing` — not wired here yet.
 */

/** Page / pillar slugs aligned with search intent and your graph (extend as pages exist in DB). */
export const HVAC_FL_CORE_SYMPTOM_SLUGS = [
  "ac-not-cooling",
  "ac-blowing-warm-air",
  "ac-not-turning-on",
  "furnace-not-heating",
  "furnace-blowing-cold-air",
  "furnace-clicking-no-ignition",
  "thermostat-display-blank",
  "weak-airflow-vents",
  "hvac-unit-short-cycling",
  "strange-noises-hvac",
  "hvac-leaking-water",
  "ice-on-outdoor-unit",
  "ac-running-constantly",
  "heat-pump-not-switching",
  "uneven-cooling-heating",
  "bad-odors-from-vents",
  "humidity-too-high-home",
  "hvac-tripping-breaker",
  "noisy-outdoor-condenser",
  "blower-fan-not-working",
] as const;

/** Ten Florida metros from `CITIES` (see `data/knowledge-graph.ts`). */
export const HVAC_FL_PRIORITY_CITY_SLUGS = [
  "miami",
  "tampa",
  "orlando",
  "jacksonville",
  "fort-lauderdale",
  "tallahassee",
  "clearwater",
  "west-palm-beach",
  "boca-raton",
  "gainesville",
] as const;

export type HvacFlCoreSymptomSlug = (typeof HVAC_FL_CORE_SYMPTOM_SLUGS)[number];
export type HvacFlPriorityCitySlug = (typeof HVAC_FL_PRIORITY_CITY_SLUGS)[number];

export function getHvacFlPriorityCities(): City[] {
  const want = new Set<string>(HVAC_FL_PRIORITY_CITY_SLUGS);
  return FLORIDA_CITIES.filter((c) => want.has(c.slug));
}

/** Symptom × city pairs for localized URLs or queue rows (200 at full cross-product). */
export function getHvacFlSymptomCityPairs(): { symptom: string; citySlug: string; state: string }[] {
  const cities = getHvacFlPriorityCities();
  const out: { symptom: string; citySlug: string; state: string }[] = [];
  for (const symptom of HVAC_FL_CORE_SYMPTOM_SLUGS) {
    for (const c of cities) {
      out.push({ symptom, citySlug: c.slug, state: c.state });
    }
  }
  return out;
}

/** 20 × 10 = 200 programmatic local surfaces at one page per pair. */
export function hvacFlLocalizedSurfaceCount(): number {
  return HVAC_FL_CORE_SYMPTOM_SLUGS.length * HVAC_FL_PRIORITY_CITY_SLUGS.length;
}
