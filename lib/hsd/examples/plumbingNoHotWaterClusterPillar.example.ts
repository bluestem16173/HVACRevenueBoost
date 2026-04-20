/**
 * Reference national **plumbing** pillar outline for `/plumbing/no-hot-water`.
 * Semantic **cluster** shape — not persisted `HSDV25Schema` without mapping.
 */
export const PLUMBING_NO_HOT_WATER_CLUSTER_PILLAR_EXAMPLE = {
  page_type: "cluster",
  system: "plumbing",
  symptom: "no-hot-water",

  title: "No Hot Water — Diagnose Heater Failure vs Supply and Fixture Issues",

  summary_30s: {
    whats_happening: "Your system is not delivering heated water to fixtures.",
    likely_cause: "Most cases are water heater failure, supply issue, or fixture limitation.",
    severity: "medium",
    flow_lines: [
      "No hot water at all? → Power loss or failed element (hard failure)",
      "Water warm but not hot? → Partial element failure or thermostat drift",
      "Hot water runs out fast? → Sediment limiting recovery",
      "Rusty water? → Tank corrosion (replacement path)",
    ],
  },

  field_triage: [
    "No hot water at all? → Power loss or failed element (hard failure)",
    "Water warm but not hot? → Partial element failure or thermostat drift",
    "Hot water runs out fast? → Sediment limiting recovery",
    "Rusty water? → Tank corrosion (replacement path)",
  ],

  system_explanation: {
    title: "How Hot Water Systems Fail",
    body: "Hot water systems depend on heating elements or burners, stored capacity, and proper water flow. Failure occurs when heat is not generated, stored, or delivered correctly. Each failure mode produces a different symptom pattern.",
  },

  diagnostic_flow: {
    mermaid:
      "flowchart TD A[No Hot Water] --> B{All fixtures affected?} B -->|Yes| C[Water heater issue] B -->|No| D[Fixture issue] C --> E{Water warm at all?} E -->|No| F[Heating failure] E -->|Yes| G[Capacity issue]",
  },

  top_causes: [
    {
      cause: "Water heater heating failure",
      probability: "high",
      why: "Element or burner failure prevents heat generation.",
      fix: "Replace heating element or repair burner",
      cost: "$200–$800",
      diy_risk: "Electrical or gas hazard",
    },
    {
      cause: "Tank capacity or recovery issue",
      probability: "medium",
      why: "Heater cannot keep up with demand.",
      fix: "Adjust usage or upgrade unit",
      cost: "$300–$1,200",
      diy_risk: "Misdiagnosed as total failure",
    },
    {
      cause: "Fixture-specific restriction",
      probability: "medium",
      why: "Mixing valve or fixture blockage limits hot water.",
      fix: "Repair or replace fixture",
      cost: "$150–$400",
      diy_risk: "Often mistaken for system failure",
    },
  ],

  repair_matrix: [
    {
      symptom: "No hot water anywhere",
      likely_issue: "Heater failure",
      fix: "Repair heating element or burner",
      cost: "$200–$800",
    },
    {
      symptom: "Hot water runs out quickly",
      likely_issue: "Capacity issue",
      fix: "Upgrade or reduce load",
      cost: "$300–$1,200",
    },
    {
      symptom: "One fixture cold",
      likely_issue: "Fixture problem",
      fix: "Replace valve or fixture",
      cost: "$150–$400",
    },
  ],

  when_to_stop_diy:
    "If the issue involves electrical components, gas burners, or persistent pressure loss, stop. Improper handling can cause damage or safety hazards.",

  cta: {
    primary: {
      title: "Don't Guess at the Heater",
      body: "Once the issue goes beyond simple fixture checks, incorrect repairs can lead to leaks or heater damage.",
      button: "Call Plumber",
    },
  },
} as const;
