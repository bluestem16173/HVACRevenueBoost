/**
 * National problem pillars (`/{vertical}/{symptom}`) that may be **indexed** when published.
 * City URLs under the same pillars are indexed separately via localized routes.
 *
 * Electrical + plumbing national sets match the locked Lee monetization cluster
 * (`lib/homeservice/leeCountyInitialMonetizationCluster.ts`).
 */
import type { ServiceVertical } from "@/lib/localized-city-path";
import {
  LEE_MONETIZATION_ELECTRICAL_SYMPTOMS,
  LEE_MONETIZATION_PLUMBING_SYMPTOMS,
} from "@/lib/homeservice/leeCountyInitialMonetizationCluster";

const HVAC_INDEXABLE = new Set([
  "ac-not-cooling",
  "weak-airflow",
  "no-cold-air",
  "high-energy-bills",
  "ac-blowing-warm-air",
  "ac-running-but-not-cooling",
]);

const ELECTRICAL_INDEXABLE = new Set<string>(LEE_MONETIZATION_ELECTRICAL_SYMPTOMS);

const PLUMBING_INDEXABLE = new Set<string>(LEE_MONETIZATION_PLUMBING_SYMPTOMS);

const BY_VERTICAL: Record<ServiceVertical, Set<string>> = {
  hvac: HVAC_INDEXABLE,
  electrical: ELECTRICAL_INDEXABLE,
  plumbing: PLUMBING_INDEXABLE,
};

/** Tier-1 money pillars allowed to be indexed (national + supports cluster / SERP variants). */
export function isIndexableProblemPillar(vertical: ServiceVertical, symptom: string): boolean {
  const s = String(symptom ?? "").trim().toLowerCase();
  return BY_VERTICAL[vertical]?.has(s) ?? false;
}

/** @deprecated Prefer {@link isIndexableProblemPillar} with `vertical: "hvac"`. */
export function isIndexablePillarSymptom(symptom: string): boolean {
  return isIndexableProblemPillar("hvac", symptom);
}
