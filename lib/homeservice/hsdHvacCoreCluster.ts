/**
 * High-intent HVAC **core cluster** (scale mode): first pages to generate so links compound.
 * Symptom slugs are the middle segment of storage slugs `hvac/{symptom}/{city}`.
 */

export const HVAC_CORE_CLUSTER_SYMPTOM_ORDER = [
  "ac-not-cooling",
  "ac-freezing-up",
  "weak-airflow",
  "high-energy-bills",
  "ac-not-turning-on",
  "outside-unit-not-running",
  "ac-short-cycling",
  "ac-making-noise",
  "uneven-cooling",
  "thermostat-not-responding",
] as const;

export type HvacCoreClusterSymptom = (typeof HVAC_CORE_CLUSTER_SYMPTOM_ORDER)[number];

/** Suggested `internal_links` targets (slug paths, no domain). Curated for sideways / up / down graph. */
export type HvacCoreClusterLinkSet = {
  related_symptoms: readonly string[];
  system_pages: readonly string[];
  repair_guides: readonly string[];
};

export const HVAC_CORE_CLUSTER_LINKS: Record<HvacCoreClusterSymptom, HvacCoreClusterLinkSet> = {
  "ac-not-cooling": {
    related_symptoms: ["hvac/weak-airflow", "hvac/ac-freezing-up", "hvac/high-energy-bills", "hvac/uneven-cooling"],
    system_pages: ["hvac/how-central-air-conditioning-works", "hvac/heat-transfer-airflow-and-delta-t"],
    repair_guides: ["hvac/refrigerant-leak-evaluation", "hvac/when-compressor-risk-requires-a-pro"],
  },
  "ac-freezing-up": {
    related_symptoms: ["hvac/ac-not-cooling", "hvac/weak-airflow", "hvac/ac-short-cycling", "hvac/high-energy-bills"],
    system_pages: ["hvac/how-central-air-conditioning-works", "hvac/evaporator-coil-freeze-dynamics"],
    repair_guides: ["hvac/refrigerant-charge-vs-airflow-misdiagnosis", "hvac/ac-coil-service-escalation"],
  },
  "weak-airflow": {
    related_symptoms: ["hvac/ac-not-cooling", "hvac/uneven-cooling", "hvac/high-energy-bills", "hvac/ac-making-noise"],
    system_pages: ["hvac/heat-transfer-airflow-and-delta-t", "hvac/static-pressure-and-duct-delivery"],
    repair_guides: ["hvac/duct-leakage-and-restriction-repair", "hvac/when-blower-fault-becomes-compressor-risk"],
  },
  "high-energy-bills": {
    related_symptoms: ["hvac/weak-airflow", "hvac/ac-short-cycling", "hvac/ac-not-cooling", "hvac/uneven-cooling"],
    system_pages: ["hvac/how-central-air-conditioning-works", "hvac/runtime-and-heat-rejection-basics"],
    repair_guides: ["hvac/duct-sealing-and-efficiency-escalation", "hvac/controls-and-charge-audit-pro"],
  },
  "ac-not-turning-on": {
    related_symptoms: ["hvac/outside-unit-not-running", "hvac/thermostat-not-responding", "hvac/ac-short-cycling", "hvac/ac-making-noise"],
    system_pages: ["hvac/low-voltage-control-circuit-basics", "hvac/how-central-air-conditioning-works"],
    repair_guides: ["hvac/contactor-capacitor-pro-escalation", "hvac/electrical-safety-when-ac-wont-start"],
  },
  "outside-unit-not-running": {
    related_symptoms: ["hvac/ac-not-turning-on", "hvac/ac-short-cycling", "hvac/thermostat-not-responding", "hvac/ac-not-cooling"],
    system_pages: ["hvac/condenser-section-power-and-protection", "hvac/how-central-air-conditioning-works"],
    repair_guides: ["hvac/condenser-contactor-replacement-scope", "hvac/compressor-thermal-trip-when-to-call"],
  },
  "ac-short-cycling": {
    related_symptoms: ["hvac/ac-freezing-up", "hvac/thermostat-not-responding", "hvac/high-energy-bills", "hvac/ac-not-cooling"],
    system_pages: ["hvac/controls-and-runtime-limits", "hvac/how-central-air-conditioning-works"],
    repair_guides: ["hvac/short-cycle-diagnostics-pro", "hvac/compressor-wear-from-cycling-escalation"],
  },
  "ac-making-noise": {
    related_symptoms: ["hvac/weak-airflow", "hvac/outside-unit-not-running", "hvac/ac-not-turning-on", "hvac/ac-short-cycling"],
    system_pages: ["hvac/indoor-blower-vs-outdoor-fan-mechanics", "hvac/how-central-air-conditioning-works"],
    repair_guides: ["hvac/bearing-motor-replacement-scope", "hvac/noise-to-mechanical-failure-pro"],
  },
  "uneven-cooling": {
    related_symptoms: ["hvac/weak-airflow", "hvac/ac-not-cooling", "hvac/high-energy-bills", "hvac/thermostat-not-responding"],
    system_pages: ["hvac/zoning-duct-balance-and-delta-t", "hvac/how-central-air-conditioning-works"],
    repair_guides: ["hvac/duct-balance-and-damper-evaluation", "hvac/when-uneven-load-masks-refrigerant-fault"],
  },
  "thermostat-not-responding": {
    related_symptoms: ["hvac/ac-not-turning-on", "hvac/outside-unit-not-running", "hvac/ac-short-cycling", "hvac/ac-not-cooling"],
    system_pages: ["hvac/low-voltage-control-circuit-basics", "hvac/how-central-air-conditioning-works"],
    repair_guides: ["hvac/thermostat-wiring-and-transformer-pro", "hvac/when-control-fault-masks-equipment-fault"],
  },
};

const CLUSTER_SET = new Set<string>(HVAC_CORE_CLUSTER_SYMPTOM_ORDER);

export function isHvacCoreClusterStorageSlug(storageSlug: string): boolean {
  const parts = storageSlug.replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter(Boolean);
  if (parts.length < 2 || parts[0].toLowerCase() !== "hvac") return false;
  return CLUSTER_SET.has(parts[1].toLowerCase());
}

/** Extra user-prompt lines so the model aligns links + misdiagnosis risk copy with the cluster. */
export function hvacCoreClusterPromptAppendix(storageSlug: string): string {
  const parts = storageSlug.replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter(Boolean);
  if (parts.length < 2 || parts[0].toLowerCase() !== "hvac") return "";
  const sym = parts[1].toLowerCase() as HvacCoreClusterSymptom;
  if (!CLUSTER_SET.has(sym)) return "";
  const L = HVAC_CORE_CLUSTER_LINKS[sym];
  if (!L) return "";

  return `

CLUSTER SCALE MODE (this slug is in the HVAC high-intent core cluster — obey HSD hub internal_links counts):
- **related_symptoms (3–5):** weave misdiagnosis risk (e.g. low airflow misread as low charge → compressor damage). Prefer: ${L.related_symptoms.join(", ")}
- **causes (3–6):** root failure isolation slugs under \`hvac/\` (not generic labels).
- **context_pages (2–4):** long-tail variants for the same core symptom (same city cluster when localized).
- **system_pages (1–2):** physics before parts: ${L.system_pages.join(", ")}
- **repair_guides (1–3):** conversion — \`repair/{city}/{symptom}\` plus trade escalation guides where relevant: ${L.repair_guides.join(", ")}
- **Conversion copy:** at least one explicit **wrong-branch risk** sentence (guessing wrong fault class increases compressor / floodback / electrical exposure).
`.trimStart();
}
