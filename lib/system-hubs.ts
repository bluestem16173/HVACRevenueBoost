/**
 * HVAC System Hub configuration for Pillar → Diagnostic Graph.
 * Each hub maps to symptom categories and links to /diagnose/[slug].
 */

import { SYMPTOMS } from "@/data/knowledge-graph";

export interface SystemHub {
  slug: string;
  name: string;
  description: string;
  symptomIds: string[];
}

export const SYSTEM_HUBS: SystemHub[] = [
  {
    slug: "hvac-air-conditioning",
    name: "HVAC Air Conditioning",
    description: "Central air conditioning systems, heat pumps, and cooling diagnostics. Common AC problems and repair pathways.",
    symptomIds: [
      "ac-blowing-warm-air",
      "ac-not-turning-on",
      "ac-running-constantly",
      "ice-on-outdoor-unit",
      "weak-airflow-vents",
      "ac-smells-musty",
      "noisy-outdoor-condenser",
      "hvac-unit-short-cycling",
      "heat-pump-not-switching",
      "humidity-too-high-home",
    ],
  },
  {
    slug: "hvac-heating-systems",
    name: "HVAC Heating Systems",
    description: "Gas furnaces, heat pumps in heating mode, and electric heat. Heating failure diagnostics and repair guides.",
    symptomIds: [
      "furnace-not-heating",
      "furnace-blowing-cold-air",
      "furnace-clicking-no-ignition",
    ],
  },
  {
    slug: "hvac-airflow-ductwork",
    name: "HVAC Airflow & Ductwork",
    description: "Airflow restrictions, duct leaks, blower issues, and ventilation problems.",
    symptomIds: [
      "weak-airflow-vents",
      "uneven-cooling-heating",
      "strange-noises-hvac",
      "bad-odors-from-vents",
    ],
  },
  {
    slug: "hvac-electrical-controls",
    name: "HVAC Electrical & Controls",
    description: "Capacitors, contactors, circuit breakers, and electrical fault diagnostics.",
    symptomIds: [
      "ac-not-turning-on",
      "hvac-tripping-breaker",
      "burning-smell-hvac",
      "hvac-clunking-sound",
      "noisy-outdoor-condenser",
      "constant-fan-running",
    ],
  },
  {
    slug: "hvac-thermostats-controls",
    name: "HVAC Thermostats & Controls",
    description: "Thermostat calibration, display issues, and control board diagnostics.",
    symptomIds: [
      "thermostat-display-blank",
      "ac-running-constantly",
      "furnace-not-heating",
      "ac-not-turning-on",
      "heat-pump-not-switching",
    ],
  },
  {
    slug: "hvac-maintenance",
    name: "HVAC Maintenance",
    description: "Preventive maintenance, drain cleaning, filter replacement, and efficiency issues.",
    symptomIds: [
      "hvac-leaking-water",
      "high-electric-bills-hvac",
      "ac-smells-musty",
      "bad-odors-from-vents",
      "ice-on-outdoor-unit",
    ],
  },
];

// Fix heating systems - use actual symptom ids
SYSTEM_HUBS[1].symptomIds = [
  "furnace-not-heating",
  "furnace-blowing-cold-air",
  "furnace-clicking-no-ignition",
];

export function getSystemHub(slug: string): SystemHub | undefined {
  return SYSTEM_HUBS.find((h) => h.slug === slug);
}

export function getSymptomsForHub(hub: SystemHub) {
  return hub.symptomIds
    .map((id) => SYMPTOMS.find((s) => s.id === id))
    .filter(Boolean);
}
