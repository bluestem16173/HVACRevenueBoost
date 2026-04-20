/**
 * Reference payload for a national HVAC **ac-not-cooling** pillar / cluster outline
 * (failure classes, branching, matrix, CTA). **Not** the persisted `HSDV25Schema` shape:
 * production pages use `page_type: "city_symptom"`, `schema_version: "hsd_v2"`, and fields
 * like `summary_30s.headline`, `slug`, `quick_table`, etc. — map this semantically in prompts
 * or when designing a future `cluster` page type.
 */
export const AC_NOT_COOLING_CLUSTER_PILLAR_EXAMPLE = {
  page_type: "cluster",
  system: "hvac",
  symptom: "ac-not-cooling",

  title: "AC Not Cooling — Diagnose Airflow, Refrigerant, and Control Failures",

  summary_30s: {
    whats_happening: "Your AC is running but not removing heat from the home.",
    likely_cause:
      "Most failures fall into airflow restriction, refrigerant performance loss, or control/electrical issues.",
    severity: "medium",
    flow_lines: [
      "Weak airflow → airflow restriction path",
      "Strong airflow but warm air → refrigerant path",
      "Unit not running correctly → control/electrical path",
      "Worsens under heat → load/performance issue",
    ],
  },

  field_triage: [
    "Weak airflow vs strong airflow → airflow vs thermodynamic failure",
    "Warm air with airflow → refrigerant or outdoor unit issue",
    "Worsens under load → condenser airflow or charge issue",
    "Ice buildup → airflow restriction or low refrigerant",
  ],

  system_explanation: {
    title: "How Cooling Fails in Real Systems",
    body: "Cooling depends on airflow across the evaporator coil, refrigerant absorbing heat, and the condenser rejecting it. If airflow drops, heat exchange fails. If refrigerant is low or heat rejection fails, the system runs but cannot cool. If electrical control fails, the system never completes the cooling cycle.",
  },

  diagnostic_flow: {
    mermaid:
      "flowchart TD A[AC Not Cooling] --> B{Airflow strong?} B -->|No| C[Airflow restriction] B -->|Yes| D{Supply air cold?} D -->|No| E[Refrigerant issue] D -->|Yes| F[Load or control issue]",
  },

  top_causes: [
    {
      cause: "Airflow restriction (filter, blower, coil)",
      probability: "high",
      why: "Reduced airflow prevents heat exchange at the evaporator coil.",
      fix: "Replace filter, clean coil, inspect blower",
      cost: "$150–$800",
      diy_risk: "Misdiagnosed as refrigerant issue",
    },
    {
      cause: "Refrigerant loss or low charge",
      probability: "medium",
      why: "Low refrigerant reduces cooling capacity and increases runtime.",
      fix: "Leak test and recharge",
      cost: "$300–$1,500+",
      diy_risk: "Illegal/unsafe without certification",
    },
    {
      cause: "Electrical/control failure",
      probability: "medium",
      why: "Failed capacitor or control prevents full cooling sequence.",
      fix: "Replace capacitor or contactor",
      cost: "$200–$800",
      diy_risk: "Live voltage hazard",
    },
  ],

  repair_matrix: [
    {
      symptom: "Weak airflow",
      likely_issue: "Airflow restriction",
      fix: "Filter or coil service",
      cost: "$150–$800",
    },
    {
      symptom: "Warm air with airflow",
      likely_issue: "Refrigerant problem",
      fix: "Leak repair + recharge",
      cost: "$300–$1,500+",
    },
    {
      symptom: "Unit not running",
      likely_issue: "Electrical failure",
      fix: "Capacitor/contact replacement",
      cost: "$200–$600",
    },
  ],

  when_to_stop_diy:
    "If airflow is normal and cooling does not return, or electrical/refrigerant work is suspected, stop. This is now a measurement problem, not a guess-and-replace problem.",

  cta: {
    primary: {
      title: "Stop Guessing Before Costs Escalate",
      body: "Once basic airflow checks are done, continued runtime under fault conditions can damage the compressor.",
      button: "Find HVAC Service",
    },
  },
} as const;
