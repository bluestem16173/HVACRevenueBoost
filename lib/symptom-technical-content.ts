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

/**
 * System context for each symptom category (for System Context Panel).
 */
export function getSystemContext(symptomSlug: string): {
  system: string;
  componentPath: string;
  symptomType: string;
} {
  const slug = symptomSlug || "";
  if (slug.includes("airflow") || slug.includes("vent")) {
    return {
      system: "Central Air Conditioning",
      componentPath: "Return Air → Blower → Supply Duct",
      symptomType: "Airflow Restriction",
    };
  }
  if (slug.includes("warm") || slug.includes("cooling") || slug.includes("cool")) {
    return {
      system: "Central Air Conditioning",
      componentPath: "Refrigerant Circuit → Evaporator → Condenser",
      symptomType: "Cooling Loss",
    };
  }
  if (slug.includes("heat") || slug.includes("furnace") || slug.includes("ignition")) {
    return {
      system: "Gas Furnace",
      componentPath: "Gas Valve → Igniter → Heat Exchanger",
      symptomType: "Heating Failure",
    };
  }
  if (slug.includes("water") || slug.includes("leak") || slug.includes("drain")) {
    return {
      system: "Central Air Conditioning",
      componentPath: "Evaporator → Drain Pan → Condensate Line",
      symptomType: "Water/Leak Issue",
    };
  }
  if (slug.includes("breaker") || slug.includes("electrical")) {
    return {
      system: "HVAC Electrical",
      componentPath: "Breaker → Contactor → Compressor",
      symptomType: "Electrical Fault",
    };
  }
  return {
    system: "Central Air Conditioning",
    componentPath: "Return Air → Blower → Supply Duct",
    symptomType: "System Malfunction",
  };
}

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
  },
  "ac-blowing-warm-air": {
    "refrigerant-leak": {
      technicalCause: "Refrigerant charge loss prevents heat absorption at the evaporator coil.",
      verificationTest: ["Check subcooling/superheat", "Leak test with nitrogen", "Pressure test"],
      repair: "Locate leak, repair, evacuate and recharge per manufacturer spec."
    },
    "dirty-coils": {
      technicalCause: "Dust buildup on evaporator fins blocks heat transfer and reduces cooling capacity.",
      verificationTest: ["Inspect coil surface", "Measure temperature delta", "Check airflow"],
      repair: "Coil cleaning with approved no-rinse cleaner."
    },
    "failed-capacitor": {
      technicalCause: "Capacitor provides start/run boost; failure prevents compressor or fan from reaching operating speed.",
      verificationTest: ["Measure microfarads", "Check for bulging", "Test under load"],
      repair: "Replace with OEM-spec capacitor."
    },
    "dirty-filter": {
      technicalCause: "Restricted return airflow reduces evaporator heat exchange and can cause coil icing.",
      verificationTest: ["Remove filter and test", "Check static pressure", "Inspect for light pass-through"],
      repair: "Replace with correct MERV rating."
    },
    "welded-contactor": {
      technicalCause: "Contactor points weld shut, causing continuous run and potential compressor damage.",
      verificationTest: ["Visual inspection", "Ohm test across contacts", "Check for pitting"],
      repair: "Replace contactor; verify correct voltage rating."
    },
    "leaky-ducts": {
      technicalCause: "Conditioned air escapes into unconditioned space, reducing delivered cooling.",
      verificationTest: ["Static pressure test", "Duct blaster test", "Visual attic inspection"],
      repair: "Duct sealing or replacement of damaged sections."
    }
  },
  "ac-not-turning-on": {
    "faulty-thermostat": {
      technicalCause: "Thermostat fails to close the 24V circuit to the contactor.",
      verificationTest: ["Check 24V at thermostat", "Jump R to Y/G", "Verify battery"],
      repair: "Replace thermostat or recalibrate."
    },
    "failed-capacitor": {
      technicalCause: "Compressor or fan motor cannot start without capacitor boost.",
      verificationTest: ["Measure microfarads", "Inspect for physical damage"],
      repair: "Replace start/run capacitor."
    },
    "welded-contactor": {
      technicalCause: "Contactor may be stuck open or closed; prevents proper cycling.",
      verificationTest: ["Ohm test", "Visual inspection", "Check coil voltage"],
      repair: "Replace contactor."
    },
    "bad-defrost-board": {
      technicalCause: "Defrost board controls heat pump mode; failure can lock out compressor.",
      verificationTest: ["Check board LEDs", "Verify defrost sensor", "Test mode switching"],
      repair: "Replace defrost control board."
    }
  },
  "furnace-not-heating": {
    "worn-igniter": {
      technicalCause: "Hot surface igniter cracks with age and fails to glow.",
      verificationTest: ["Visual inspection for cracks", "Ohm test", "Check for glow"],
      repair: "Replace hot surface igniter."
    },
    "dirty-flame-sensor": {
      technicalCause: "Oxidation on flame sensor prevents flame rectification signal.",
      verificationTest: ["Inspect for oxidation", "Clean with steel wool", "Check microamp reading"],
      repair: "Clean or replace flame sensor."
    },
    "faulty-thermostat": {
      technicalCause: "Thermostat not calling for heat or W terminal not closing.",
      verificationTest: ["Jump R to W", "Check 24V", "Verify heat mode selected"],
      repair: "Replace or recalibrate thermostat."
    },
    "dirty-filter": {
      technicalCause: "Severe restriction can trip limit switches or reduce heat exchanger airflow.",
      verificationTest: ["Remove filter and test", "Check limit switch status"],
      repair: "Replace air filter."
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
