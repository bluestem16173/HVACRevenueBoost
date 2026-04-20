/**
 * Deterministic **HSD hub** internal_links for HVAC city pages (`hvac/{symptom}/{city}`).
 * Symptom → diagnosis → cause → repair funnel; see product HSD hub strategy.
 */

import {
  crossCityTierOneContextSlugs,
  ensureDiscoverableRelatedSymptoms,
  filterTierDiscoveryPaths,
} from "@/lib/seo/tier-one-discovery";
import { enforceStoredSlug } from "@/lib/slug-utils";
import {
  HVAC_CORE_CLUSTER_LINKS,
  HVAC_CORE_CLUSTER_SYMPTOM_ORDER,
  type HvacCoreClusterSymptom,
} from "@/lib/homeservice/hsdHvacCoreCluster";

export type HsdHubInternalLinks = {
  related_symptoms: string[];
  causes: string[];
  repair_guides: string[];
  system_pages: string[];
  context_pages: string[];
};

/** `tampa-fl` → `tampa` for `repair/{segment}/{symptom}` URLs (strip trailing `-st`). */
export function repairGuideCitySegment(cityStorageSlug: string): string {
  const s = cityStorageSlug.trim().toLowerCase().replace(/\/+$/, "");
  const m = s.match(/^(.+)-([a-z]{2})$/);
  return m ? m[1] : s;
}

function localizeHvacSymptomPath(path: string, cityStorage: string): string {
  const p = path.replace(/^\/?/, "").replace(/\/+$/, "").toLowerCase();
  const parts = p.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0] === "hvac") {
    return `hvac/${parts[1]}/${cityStorage}`;
  }
  return p;
}

const CLUSTER_SYMPTOM_SET = new Set<string>(HVAC_CORE_CLUSTER_SYMPTOM_ORDER);

const FALLBACK_CAUSES: readonly string[] = [
  "hvac/refrigerant-leak",
  "hvac/dirty-coils",
  "hvac/failed-capacitor",
  "hvac/ductwork-static-pressure-high",
  "hvac/compressor-hard-start-needed",
  "hvac/txv-or-metering-fault",
];

const CAUSES_BY_SYMPTOM: Partial<Record<string, readonly string[]>> = {
  "ac-not-cooling": [
    "hvac/refrigerant-leak",
    "hvac/dirty-coils",
    "hvac/failed-capacitor",
    "hvac/ductwork-static-pressure-high",
    "hvac/compressor-hard-start-needed",
  ],
  "ac-freezing-up": [
    "hvac/low-airflow-coil-freeze",
    "hvac/refrigerant-charge-imbalance",
    "hvac/dirty-evaporator-coil",
    "hvac/txv-or-metering-fault",
    "hvac/blower-motor-degradation",
  ],
  "weak-airflow": [
    "hvac/clogged-filter",
    "hvac/duct-leakage",
    "hvac/blower-wheel-fouling",
    "hvac/static-pressure-high",
    "hvac/dampers-closed-or-stuck",
  ],
};


function defaultRelatedFor(symptom: string, city: string): string[] {
  const pool = HVAC_CORE_CLUSTER_SYMPTOM_ORDER.filter((s) => s !== symptom).slice(0, 5);
  return pool.map((s) => `hvac/${s}/${city}`);
}

/**
 * Build hub internal_links for an HVAC **localized storage slug** (e.g. `hvac/ac-not-cooling/tampa-fl`).
 */
export function buildHvacHubInternalLinks(storageSlug: string): HsdHubInternalLinks {
  const slug = enforceStoredSlug(storageSlug).replace(/\\/g, "/").replace(/\/+/g, "/");
  const parts = slug.split("/").filter(Boolean);
  if (parts.length < 3 || parts[0].toLowerCase() !== "hvac") {
    throw new Error(`buildHvacHubInternalLinks: expected hvac/{symptom}/{city}, got "${slug}"`);
  }
  const symptom = parts[1].toLowerCase();
  const city = parts[2].toLowerCase();
  const citySeg = repairGuideCitySegment(city);

  const symCluster = CLUSTER_SYMPTOM_SET.has(symptom) ? (symptom as HvacCoreClusterSymptom) : null;
  const cluster = symCluster ? HVAC_CORE_CLUSTER_LINKS[symCluster] : null;

  const relatedSeeds = cluster
    ? cluster.related_symptoms.map((p) => localizeHvacSymptomPath(p, city)).slice(0, 5)
    : defaultRelatedFor(symptom, city).slice(0, 5);
  const related_symptoms = ensureDiscoverableRelatedSymptoms(symptom, city, relatedSeeds);

  const system_pages = filterTierDiscoveryPaths(
    (cluster ? [...cluster.system_pages] : ["hvac/how-central-air-conditioning-works", "hvac/heat-transfer-airflow-and-delta-t"]).slice(0, 2),
  );

  const causes = filterTierDiscoveryPaths([...(CAUSES_BY_SYMPTOM[symptom] ?? FALLBACK_CAUSES)].slice(0, 6));

  const repair_guides: string[] = [`repair/${citySeg}/${symptom}`];
  if (symptom === "ac-not-cooling") {
    repair_guides.push(`repair/${citySeg}/weak-airflow`);
  } else if (symptom === "ac-freezing-up") {
    repair_guides.push(`repair/${citySeg}/ac-not-cooling`);
  } else if (cluster?.repair_guides?.[0]) {
    repair_guides.push(cluster.repair_guides[0].replace(/^\/?/, ""));
  }
  if (repair_guides.length < 3 && cluster?.repair_guides?.[1]) {
    repair_guides.push(cluster.repair_guides[1].replace(/^\/?/, ""));
  }

  const context_pages = crossCityTierOneContextSlugs(symptom, city).slice(0, 4);

  return {
    related_symptoms,
    causes,
    repair_guides: filterTierDiscoveryPaths(repair_guides.slice(0, 3)),
    system_pages,
    context_pages,
  };
}
