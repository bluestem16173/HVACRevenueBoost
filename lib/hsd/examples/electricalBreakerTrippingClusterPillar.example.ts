/**
 * Reference national **electrical** pillar outline for `/electrical/breaker-keeps-tripping`.
 * Semantic **cluster** shape — not persisted `HSDV25Schema` without mapping (see HVAC cluster example).
 */
export const ELECTRICAL_BREAKER_TRIPPING_CLUSTER_PILLAR_EXAMPLE = {
  page_type: "cluster",
  system: "electrical",
  symptom: "breaker-keeps-tripping",

  title: "Breaker Keeps Tripping — Diagnose Overload, Short, and Ground Faults Correctly",

  summary_30s: {
    whats_happening: "A circuit breaker is shutting off power to prevent wiring damage or fire risk.",
    likely_cause: "Most trips come from overload, short circuit, or ground fault conditions.",
    severity: "high",
    flow_lines: [
      "Trips under load → overload path",
      "Trips instantly → short circuit path",
      "Trips intermittently → loose connection or ground fault",
      "Multiple circuits affected → panel or supply issue",
    ],
  },

  field_triage: [
    "Trips only when devices run → overload condition",
    "Trips immediately on reset → short circuit",
    "Intermittent trips → loose wiring or ground fault",
    "Heat or buzzing → resistance fault at connection or breaker",
  ],

  system_explanation: {
    title: "Why Breakers Trip",
    body: "Breakers are designed to interrupt current when it exceeds safe limits. Overloads generate heat over time, short circuits create instant high current, and ground faults leak current to unintended paths. Each failure behaves differently and must be diagnosed separately.",
  },

  diagnostic_flow: {
    mermaid:
      "flowchart TD A[Breaker Trips] --> B{Trips instantly?} B -->|Yes| C[Short circuit] B -->|No| D{Only under load?} D -->|Yes| E[Overload] D -->|No| F[Ground fault or loose wire]",
  },

  top_causes: [
    {
      cause: "Circuit overload",
      probability: "high",
      why: "Too many devices exceed the breaker's rated capacity over time.",
      fix: "Reduce load or add circuit",
      cost: "$150–$800",
      diy_risk: "Users often ignore load limits and repeatedly reset breaker",
    },
    {
      cause: "Short circuit (hot-to-neutral contact)",
      probability: "medium",
      why: "Damaged wiring or device failure causes direct current spike.",
      fix: "Locate fault and repair wiring or replace device",
      cost: "$300–$1,500+",
      diy_risk: "High risk due to energized circuits",
    },
    {
      cause: "Ground fault",
      probability: "medium",
      why: "Current leaks to ground due to insulation breakdown or moisture.",
      fix: "Trace and isolate ground fault",
      cost: "$200–$1,200",
      diy_risk: "Difficult to isolate without proper tools",
    },
  ],

  repair_matrix: [
    {
      symptom: "Trips when appliances run",
      likely_issue: "Overload",
      fix: "Redistribute load or add circuit",
      cost: "$150–$800",
    },
    {
      symptom: "Trips instantly",
      likely_issue: "Short circuit",
      fix: "Repair wiring or replace device",
      cost: "$300–$1,500+",
    },
    {
      symptom: "Random trips",
      likely_issue: "Ground fault",
      fix: "Inspect wiring and outlets",
      cost: "$200–$1,200",
    },
  ],

  when_to_stop_diy:
    "If the breaker trips immediately, feels hot, or shows signs of burning or buzzing, stop. This is energized work and incorrect diagnosis can cause fire risk.",

  cta: {
    primary: {
      title: "Stop Resetting the Breaker",
      body: "Repeated resets under fault conditions increase heat and damage. At this point, the issue requires proper circuit testing.",
      button: "Call Electrician",
    },
  },
} as const;
