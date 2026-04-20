/**
 * Master problem-pillar slugs + failure-type clusters for automatic “related symptom” links
 * (`/{vertical}/{slug}` and city pages). See {@link getRelatedSlugs}.
 */
import type { ServiceVertical } from "@/lib/localized-city-path";
import { ELECTRICAL, HVAC, PLUMBING } from "@/lib/trade-symptom-slugs";

export const HVAC_PROBLEMS = HVAC;
export const ELECTRICAL_PROBLEMS = ELECTRICAL;
export const PLUMBING_PROBLEMS = PLUMBING;

export type ProblemClusterMap = Readonly<Record<string, readonly string[]>>;

/** Grouped by failure type — HVAC money pillars. */
export const HVAC_CLUSTERS: ProblemClusterMap = {
  airflow: ["weak-airflow", "uneven-cooling"],
  cooling: [
    "ac-not-cooling",
    "no-cold-air",
    "refrigerant-leak-signs",
    "ac-blowing-warm-air",
    "ac-running-but-not-cooling",
  ],
  electrical: ["ac-not-turning-on", "capacitor-failure", "thermostat-not-working"],
  performance: ["high-energy-bills", "system-short-cycling", "ac-making-noise"],
  mechanical: ["ac-freezing-up"],
};

export const ELECTRICAL_CLUSTERS: ProblemClusterMap = {
  power: ["whole-house-power-out", "partial-power-loss", "power-out-in-one-room"],
  circuit: [
    "breaker-keeps-tripping",
    "breaker-wont-reset",
    "circuit-overloaded",
    "panel-overheating",
  ],
  outlets: ["outlet-not-working", "dead-outlet", "outlet-sparking", "light-switch-not-working"],
  wiring: ["faulty-wiring", "exposed-wiring", "burning-smell-from-electrical"],
  signals: ["lights-flickering", "buzzing-sound-in-walls"],
};

/**
 * Grouped by failure type. Extra groups cover every slug in {@link PLUMBING}
 * (authoritative list lives in `lib/trade-symptom-slugs.ts`).
 */
export const PLUMBING_CLUSTERS: ProblemClusterMap = {
  water_heater: ["no-hot-water", "water-heater-leaking", "not-enough-hot-water", "strange-noises-from-tank"],
  leaks: ["pipe-leaking-under-sink", "water-leak-in-wall", "ceiling-water-leak"],
  drainage: [
    "drain-clogged",
    "slow-draining-sink",
    "gurgling-drains",
    "shower-drain-backing-up",
    "main-sewer-line-clogged",
  ],
  pressure: [
    "low-water-pressure",
    "uneven-water-pressure",
    "water-pressure-drops-suddenly",
    "no-water-in-house",
  ],
  fixtures: ["toilet-keeps-running", "toilet-leaking-at-base", "faucet-dripping"],
  kitchen_and_appliance_drains: [
    "garbage-disposal-not-working",
    "dishwasher-not-draining",
    "sink-not-draining",
  ],
};

export const PROBLEM_CLUSTERS_BY_VERTICAL: Record<ServiceVertical, ProblemClusterMap> = {
  hvac: HVAC_CLUSTERS,
  electrical: ELECTRICAL_CLUSTERS,
  plumbing: PLUMBING_CLUSTERS,
};

/**
 * Other slugs in the same failure-type group as `slug`, excluding `slug`.
 * Unknown slugs → `[]`.
 */
export function getRelatedSlugs(slug: string, clusters: ProblemClusterMap): string[] {
  const key = String(slug ?? "")
    .trim()
    .toLowerCase();
  if (!key) return [];
  for (const group of Object.values(clusters)) {
    if (group.includes(key)) {
      return group.filter((s) => s !== key);
    }
  }
  return [];
}

export function getRelatedSlugsForVertical(vertical: ServiceVertical, slug: string): string[] {
  return getRelatedSlugs(slug, PROBLEM_CLUSTERS_BY_VERTICAL[vertical]);
}