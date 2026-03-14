/**
 * Symptom-specific technical content for authority-format pages.
 * Maps symptom slug + cause slug to extended diagnostic content.
 * Used when the knowledge graph has causes but we want richer technical structure.
 */

export interface CauseTechnicalContent {
  technicalCause: string;
  verificationTest: string[];
  repair: string;
}

type SymptomCauseKey = string; // "symptom-slug|cause-slug"

const TECHNICAL_CONTENT: Record<string, Record<string, CauseTechnicalContent>> = {
  "weak-airflow-vents": {
    "dirty-filter": {
      technicalCause: "Air filters restrict airflow when particulate accumulation exceeds airflow design tolerance.",
      verificationTest: [
        "Remove return filter",
        "Measure airflow velocity at supply register",
        "If airflow increases → filter restriction confirmed"
      ],
      repair: "Replace filter with correct MERV rating."
    },
    "leaky-ducts": {
      technicalCause: "Flexible duct collapse or disconnected supply ducts reduce airflow delivery.",
      verificationTest: [
        "Visual attic inspection",
        "Static pressure measurement",
        "Smoke leak test"
      ],
      repair: "Duct replacement or sealing."
    },
    "dirty-coils": {
      technicalCause: "Dust accumulation or coil icing reduces airflow through the coil fins.",
      verificationTest: [
        "Remove evaporator access panel",
        "Inspect coil surface",
        "Check temperature delta across coil"
      ],
      repair: "Coil cleaning or refrigerant system service."
    },
    "blower-motor": {
      technicalCause: "PSC motors degrade with capacitor failure or winding wear, reducing CFM output.",
      verificationTest: [
        "Measure blower amperage",
        "Check capacitor microfarads",
        "Verify fan RPM"
      ],
      repair: "Capacitor replacement or blower motor replacement."
    }
  }
};

/**
 * Get technical content for a cause within a symptom context.
 * Returns null if no specific content exists (template will use generic explanation).
 */
export function getCauseTechnicalContent(
  symptomSlug: string,
  causeSlug: string
): CauseTechnicalContent | null {
  const symptomContent = TECHNICAL_CONTENT[symptomSlug];
  if (!symptomContent) return null;
  return symptomContent[causeSlug] || null;
}

/**
 * Common causes for weak airflow (used in technical summary).
 */
export const WEAK_AIRFLOW_CAUSES = [
  "Restricted return airflow",
  "Blower motor performance issues",
  "Evaporator coil blockage",
  "Collapsed or leaking ductwork",
  "Incorrect system static pressure"
];

/**
 * Climate factors for high-heat desert cities (Tempe, Phoenix, etc.)
 */
export const HIGH_DESERT_CLIMATE_FACTORS = [
  "Dust accumulation in return systems",
  "High runtime during summer months",
  "Increased evaporator coil contamination"
];

/**
 * When to call HVAC for weak airflow
 */
export const WEAK_AIRFLOW_CALL_CRITERIA = [
  "Airflow remains weak after filter replacement",
  "Ice forms on the evaporator coil",
  "Blower motor is not reaching full speed",
  "System static pressure exceeds manufacturer limits"
];

/**
 * Parts/Components for affiliate linking (by symptom category).
 * Each item can link to /tools/[slug] or Amazon affiliate.
 */
export const AIRFLOW_PARTS = [
  { name: "Air Filters", slug: "air-filters", description: "MERV-rated replacement filters" },
  { name: "Blower Capacitors", slug: "blower-capacitors", description: "Start/run capacitors" },
  { name: "Blower Motors", slug: "blower-motors", description: "Indoor blower assemblies" },
  { name: "Duct Repair Tape", slug: "duct-tape", description: "HVAC foil tape for duct sealing" },
  { name: "Evaporator Coil Cleaner", slug: "coil-cleaner", description: "No-rinse coil cleaning solution" },
];

/**
 * Environment variation links for climate-specific diagnostics.
 * Format: { label, slug } for internal linking.
 */
export function getEnvironmentVariations(symptomSlug: string, citySlug: string) {
  const base = symptomSlug || "weak-airflow-vents";
  const label = base.replace(/-/g, " ");
  return [
    { label: `${label} in hot climates`, slug: `repair/${citySlug}/${base}` },
    { label: `${label} during extreme humidity`, slug: `repair/${citySlug}/${base}` },
    { label: `${label} after long runtime`, slug: `repair/${citySlug}/${base}` },
  ];
}
