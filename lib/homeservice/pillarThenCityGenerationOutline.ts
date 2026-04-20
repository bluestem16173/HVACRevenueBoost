/**
 * **Pillar → city** generation outline for Lee County, FL (and the same pattern elsewhere).
 *
 * Worker / batch shape:
 *
 * ```ts
 * for (const problem of problems) {
 *   await generatePillar(problem); // national `{vertical}/{symptom}`
 *   for (const city of LEE_COUNTY_CITIES) {
 *     await generateCity(problem, city); // `{vertical}/{symptom}/{city}`
 *   }
 * }
 * ```
 *
 * Concrete queue seeds for electrical/plumbing × Lee County live in
 * {@link getLeeMonetizationPageQueueJobs} (`lib/homeservice/leeCountyInitialMonetizationCluster.ts`).
 * City tails are {@link LEE_COUNTY_CITIES} (`lib/vertical-hub-shared.ts`).
 */
import { LEE_COUNTY_CITIES } from "@/lib/vertical-hub-shared";

/** HVAC pillar cores to pair with every Lee County city (extend deliberately). */
export const LEE_COUNTY_HVAC_PILLAR_SYMPTOMS = ["ac-not-cooling"] as const;

export type PillarJob = { vertical: "hvac"; symptom: string; kind: "national" };
export type CityJob = { vertical: "hvac"; symptom: string; cityTail: string; kind: "city" };

/** Yields national pillar jobs then one city job per Lee County tail for each HVAC symptom. */
export function* iterateHvacLeeCountyPillarThenCity(): Generator<PillarJob | CityJob> {
  for (const symptom of LEE_COUNTY_HVAC_PILLAR_SYMPTOMS) {
    yield { vertical: "hvac", symptom, kind: "national" };
    for (const cityTail of LEE_COUNTY_CITIES) {
      yield { vertical: "hvac", symptom, cityTail, kind: "city" };
    }
  }
}

/** Storage slugs for generator / queue (`hvac/ac-not-cooling`, `hvac/ac-not-cooling/fort-myers-fl`, …). */
export function storageSlugForPillarOrCityJob(job: PillarJob | CityJob): string {
  if (job.kind === "national") {
    return `${job.vertical}/${job.symptom}`;
  }
  return `${job.vertical}/${job.symptom}/${job.cityTail}`;
}
