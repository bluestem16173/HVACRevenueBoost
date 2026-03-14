/**
 * Cluster layer for Pillar → Cluster → Symptom architecture.
 * 16 clusters based on HVAC homeowner search behavior.
 * Pillar distribution: AC (6) | Airflow (3) | Electrical (4) | Thermostat (1) | Maintenance (1) | Heating (1)
 */

import { SYMPTOMS } from "@/data/knowledge-graph";

export interface Cluster {
  slug: string;
  name: string;
  description: string;
  symptomIds: string[];
  pillarSlug: string;
}

export const CLUSTERS: Cluster[] = [
  // Cooling Failures (hvac-air-conditioning)
  {
    slug: "ac-not-cooling",
    name: "AC Not Cooling",
    description: "The single largest HVAC troubleshooting cluster. AC running but not producing cold air—warm air, poor cooling, cooling failure.",
    symptomIds: ["ac-blowing-warm-air", "ice-on-outdoor-unit", "humidity-too-high-home"],
    pillarSlug: "hvac-air-conditioning",
  },
  {
    slug: "ac-freezing-up",
    name: "AC Freezing Up",
    description: "Ice on outdoor unit, evaporator coil, or refrigerant lines. Common during summer humidity and airflow issues.",
    symptomIds: ["ice-on-outdoor-unit"],
    pillarSlug: "hvac-air-conditioning",
  },
  {
    slug: "ac-short-cycling",
    name: "AC Short Cycling",
    description: "AC turning on and off, runs a few minutes then stops, cycles too frequently. Often thermostat, oversized system, or refrigerant.",
    symptomIds: ["hvac-unit-short-cycling"],
    pillarSlug: "hvac-air-conditioning",
  },
  {
    slug: "ac-running-constantly",
    name: "AC Running Constantly",
    description: "AC running all day, won't shut off, never reaches temperature. Often undersized system, dirty coils, or refrigerant issues.",
    symptomIds: ["ac-running-constantly"],
    pillarSlug: "hvac-air-conditioning",
  },
  // Airflow & Distribution (hvac-airflow-ductwork)
  {
    slug: "weak-airflow",
    name: "Weak Airflow",
    description: "Huge cluster tied to ductwork and blower issues. Weak airflow from vents, air not blowing, some vents not working.",
    symptomIds: ["weak-airflow-vents", "uneven-cooling-heating"],
    pillarSlug: "hvac-airflow-ductwork",
  },
  {
    slug: "blower-motor-problems",
    name: "Blower Motor Problems",
    description: "Blower motor not working, fan not spinning, running slowly, air handler fan not working. Strong airflow-related cluster.",
    symptomIds: ["weak-airflow-vents", "uneven-cooling-heating", "constant-fan-running"],
    pillarSlug: "hvac-airflow-ductwork",
  },
  {
    slug: "ductwork-problems",
    name: "Ductwork Problems",
    description: "Uneven cooling, rooms hotter than others, air not reaching rooms, duct leaking air. Very common in multi-story homes.",
    symptomIds: ["uneven-cooling-heating", "weak-airflow-vents", "bad-odors-from-vents"],
    pillarSlug: "hvac-airflow-ductwork",
  },
  // Electrical / Controls (hvac-electrical-controls)
  {
    slug: "ac-not-turning-on",
    name: "AC Not Turning On",
    description: "AC not starting, won't start, thermostat calling but unit not responding. Usually electrical failures.",
    symptomIds: ["ac-not-turning-on", "thermostat-display-blank", "heat-pump-not-switching"],
    pillarSlug: "hvac-electrical-controls",
  },
  {
    slug: "outside-unit-not-running",
    name: "Outside Unit Not Running",
    description: "Outdoor condenser not turning on, fan not spinning, unit silent. Capacitor, contactor, or compressor issues.",
    symptomIds: ["ac-not-turning-on", "noisy-outdoor-condenser", "heat-pump-not-switching"],
    pillarSlug: "hvac-electrical-controls",
  },
  {
    slug: "ac-tripping-breaker",
    name: "AC Tripping Breaker",
    description: "Breaker trips when AC starts or runs. Usually electrical faults—capacitor, contactor, or short.",
    symptomIds: ["hvac-tripping-breaker"],
    pillarSlug: "hvac-electrical-controls",
  },
  {
    slug: "capacitor-problems",
    name: "Capacitor Problems",
    description: "AC capacitor bad, humming but not starting, fan won't start, hard start problems. Converts extremely well for repair searches.",
    symptomIds: ["ac-not-turning-on", "noisy-outdoor-condenser", "hvac-tripping-breaker", "strange-noises-hvac", "hvac-clunking-sound", "burning-smell-hvac"],
    pillarSlug: "hvac-electrical-controls",
  },
  // Thermostat (hvac-thermostats-controls)
  {
    slug: "thermostat-problems",
    name: "Thermostat Problems",
    description: "Very high homeowner search volume. Thermostat not working, not responding, blank display, wrong temperature.",
    symptomIds: ["thermostat-display-blank", "ac-running-constantly", "furnace-not-heating", "ac-not-turning-on", "heat-pump-not-switching"],
    pillarSlug: "hvac-thermostats-controls",
  },
  // Mechanical / Refrigerant (hvac-air-conditioning)
  {
    slug: "refrigerant-problems",
    name: "Refrigerant Problems",
    description: "Low refrigerant, AC refrigerant leak, losing refrigerant, low Freon. Ties directly to high-cost repairs. Distinct search intent.",
    symptomIds: ["low-refrigerant-ac", "ac-refrigerant-leak", "ac-losing-freon", "ac-pressure-low"],
    pillarSlug: "hvac-air-conditioning",
  },
  {
    slug: "ac-making-noise",
    name: "AC Making Noise",
    description: "Loud noise, buzzing, rattling, squealing, humming. Noise complaints drive a lot of service calls.",
    symptomIds: ["strange-noises-hvac", "noisy-outdoor-condenser", "hvac-clunking-sound", "burning-smell-hvac"],
    pillarSlug: "hvac-air-conditioning",
  },
  // Maintenance / Water (hvac-maintenance)
  {
    slug: "ac-water-leaks",
    name: "AC Water Leaks",
    description: "AC leaking water, water around air handler, drain clogged, water dripping from vents. Very common service issue.",
    symptomIds: ["hvac-leaking-water"],
    pillarSlug: "hvac-maintenance",
  },
  // Heating (hvac-heating-systems)
  {
    slug: "furnace-not-heating",
    name: "Furnace Not Heating",
    description: "Furnace not heating, blowing cold air, not turning on, running but no heat. Heat pump not heating. Winter traffic and leads.",
    symptomIds: ["furnace-not-heating", "furnace-blowing-cold-air", "furnace-clicking-no-ignition", "heat-pump-not-switching"],
    pillarSlug: "hvac-heating-systems",
  },
];

/** Clusters that produce highest HVAC service calls—prioritize for city page generation. */
export const PRIORITY_CLUSTERS_FOR_CITY_PAGES = ["ac-not-cooling", "ac-not-turning-on", "outside-unit-not-running"] as const;

/** Symptom IDs from priority clusters for lead-gen city pages. */
export function getPrioritySymptomsForCityPages(): string[] {
  const ids = new Set<string>();
  for (const slug of PRIORITY_CLUSTERS_FOR_CITY_PAGES) {
    const cluster = CLUSTERS.find((c) => c.slug === slug);
    if (cluster) cluster.symptomIds.forEach((id) => ids.add(id));
  }
  return Array.from(ids);
}

export function getCluster(slug: string): Cluster | undefined {
  return CLUSTERS.find((c) => c.slug === slug);
}

export function getClustersForPillar(pillarSlug: string): Cluster[] {
  return CLUSTERS.filter((c) => c.pillarSlug === pillarSlug);
}

export function getClusterForSymptom(symptomId: string): Cluster | undefined {
  return CLUSTERS.find((c) => c.symptomIds.includes(symptomId));
}

export function getSymptomsForCluster(cluster: Cluster) {
  return cluster.symptomIds
    .map((id) => SYMPTOMS.find((s) => s.id === id))
    .filter(Boolean);
}
