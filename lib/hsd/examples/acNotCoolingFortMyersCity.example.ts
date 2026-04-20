/**
 * Reference **localized** outline for `/hvac/ac-not-cooling/fort-myers-fl`.
 *
 * Persisted **HSD v2** uses {@link HSDV25Schema}: `page_type: "city_symptom"`, `schema_version: "hsd_v2"`,
 * camelCase **`cityContext`** (not `city_context`), a different **`summary_30s`** shape (`headline`,
 * `top_causes[]` with `label`/`probability`/`deep_dive`, `core_truth`, `risk_warning`, `flow_lines`), plus
 * `slug`, `quick_table`, `diagnostic_flow` nodes/edges, etc. Map this example **semantically** when
 * authoring prompts or future mappers — do not POST this object verbatim as `content_json` without coercion.
 */
export const AC_NOT_COOLING_FORT_MYERS_CITY_EXAMPLE = {
  page_type: "city_symptom",
  system: "hvac",
  symptom: "ac-not-cooling",
  city: "fort-myers-fl",

  title: "AC Not Cooling in Fort Myers — Diagnose Before Costs Escalate",

  city_context: [
    "High humidity increases coil load and airflow sensitivity",
    "Long runtime cycles expose marginal refrigerant performance",
    "Coastal conditions accelerate outdoor unit wear",
  ],

  summary_30s: {
    whats_happening: "Your AC is running but struggling to remove heat under Florida load conditions.",
    likely_cause: "Airflow restriction or refrigerant performance loss under extended runtime.",
    severity: "medium",
    flow_lines: [
      "Weak airflow → airflow restriction",
      "Strong airflow but warm air → refrigerant path",
      "Worsens midday → load stress failure",
      "Intermittent → control issue",
    ],
  },

  diagnostic_focus: [
    "Check airflow first due to humidity-driven restriction",
    "Confirm supply temperature drop before assuming refrigerant issue",
    "Observe performance during peak heat load",
  ],

  top_causes: [
    {
      cause: "Airflow restriction under humidity load",
      probability: "high",
      why: "High humidity increases coil resistance and airflow sensitivity.",
      fix: "Filter replacement and coil cleaning",
      cost: "$150–$800",
    },
    {
      cause: "Refrigerant performance loss",
      probability: "medium",
      why: "Long runtime exposes low charge or inefficiency.",
      fix: "Leak repair and recharge",
      cost: "$300–$1,500+",
    },
  ],

  cta: {
    primary: {
      title: "AC Issues Escalate Quickly in This Climate",
      body: "Running the system under fault conditions can push repairs into compressor-level costs.",
      button: "Call HVAC Technician",
    },
  },
} as const;
