/**
 * Minimal valid fixtures for each HSD / programmatic page-build type — preview at /hsd-page-build/[type]
 */

import type { CityServiceSchema } from "@/templates/hybrid-service-page";
import type { EmergencySchema } from "@/templates/emergency-page";

/** v5_master / v6 — passes validateV2 shape (compact demo). */
export const fixtureV5Master: Record<string, unknown> = {
  title: "Page build demo — AC not cooling",
  symptom: "AC not cooling",
  system: "Split central air",
  fast_answer: {
    technical_summary:
      "Demo preview: cooling drops when airflow is restricted or the refrigerant circuit cannot move enough heat.",
    primary_mechanism: "Capacity loss from airflow restriction or low refrigerant charge.",
  },
  failure_modes: [
    { name: "Airflow Distribution Failure", description: "Reduced air across the coil." },
    { name: "Electrical Control Failure", description: "Compressor or fan not commanded correctly." },
    { name: "Refrigerant Circuit Issue", description: "Charge or metering problem." },
  ],
  diagnostic_order: ["Thermostat & mode", "Filter & blower", "Outdoor unit", "Line temps"],
  guided_diagnosis: [
    { scenario: "Warm air at registers", likely_modes: ["Airflow Distribution Failure"], next_step: "Check filter" },
    { scenario: "Outdoor fan not spinning", likely_modes: ["Electrical Control Failure"], next_step: "Check disconnect" },
    { scenario: "Ice on suction line", likely_modes: ["Refrigerant Circuit Issue"], next_step: "Call a technician" },
  ],
  mermaid_diagram: `flowchart TD
    A[AC not cooling?] --> B{Strong airflow?}
    B -->|No| C[Airflow Distribution Failure?]
    B -->|Yes| D{Outdoor fan running?}
    D -->|No| E[Electrical Control Failure?]
    D -->|Yes| F[Refrigerant Circuit Issue?]
  `,
  causes: [
    {
      name: "Severely restricted filter",
      failure_mode: "Airflow Distribution Failure",
      mechanism: "Low airflow reduces heat transfer at the coil.",
      description: "Dirty filter drops airflow.",
      symptoms: ["Weak airflow", "Frozen coil possible"],
      diagnostic_signal: "Low delta-T across coil",
      confidence: 0.85,
      test: "Inspect filter; measure return vs supply airflow feel",
      expected_result: "Clean filter restores normal airflow",
    },
    {
      name: "Failed capacitor",
      failure_mode: "Electrical Control Failure",
      mechanism: "Motor cannot start or runs hot.",
      description: "Start/run capacitor out of spec.",
      symptoms: ["Humming", "Fan not starting"],
      diagnostic_signal: "Bulging capacitor or no start",
      confidence: 0.75,
      test: "Visual inspect; capacitance test with meter",
      expected_result: "Within ±6% of rating",
    },
    {
      name: "Low refrigerant charge",
      failure_mode: "Refrigerant Circuit Issue",
      mechanism: "Insufficient mass flow reduces capacity.",
      description: "Leak or past service issue.",
      symptoms: ["Long run times", "Warm supply air"],
      diagnostic_signal: "Abnormal line temps or pressures",
      confidence: 0.7,
      test: "Superheat/subcool per manufacturer",
      expected_result: "Values within spec",
    },
    {
      name: "Stuck reversing/contactor",
      failure_mode: "Electrical Control Failure",
      mechanism: "Compressor or outdoor fan not energized.",
      description: "Control or contactor fault.",
      symptoms: ["No cooling", "Clicking"],
      diagnostic_signal: "No voltage at load",
      confidence: 0.55,
      test: "Voltage at contactor coil and load",
      expected_result: "Proper 24V call and line voltage",
    },
  ],
  repairs: [
    {
      name: "Replace air filter",
      cause: "Severely restricted filter",
      system_effect: "Restores design airflow and sensible cooling.",
      difficulty: "easy",
      estimated_cost: "low",
      description: "Install correct MERV rating for system.",
    },
    {
      name: "Replace capacitor",
      cause: "Failed capacitor",
      system_effect: "Restores reliable motor start.",
      difficulty: "moderate",
      estimated_cost: "medium",
      description: "Match microfarad and voltage rating.",
    },
    {
      name: "Locate and repair leak",
      cause: "Low refrigerant charge",
      system_effect: "Restores refrigerant mass and capacity.",
      difficulty: "hard",
      estimated_cost: "high",
      description: "EPA-certified leak repair and recharge.",
    },
    {
      name: "Replace contactor",
      cause: "Stuck reversing/contactor",
      system_effect: "Restores control voltage to compressor/fan.",
      difficulty: "moderate",
      estimated_cost: "medium",
      description: "Match coil voltage and load rating.",
    },
  ],
  faq: [
    { question: "When should I call a technician?", answer: "If electrical tests or refrigerant work is needed." },
    { question: "Is this an emergency?", answer: "If no cooling in extreme heat or electrical burning smell, call now." },
    { question: "What does this demo prove?", answer: "That v5_master JSON maps to DiagnosticGoldPage." },
  ],
};

/** v2_goldstandard path uses GoldStandardPage with schemaVersion v1 in data. */
export const fixtureV2GoldStandard: Record<string, unknown> = {
  schemaVersion: "v1",
  slug: "demo-ac-not-cooling",
  title: "AC Not Cooling",
  problem_summary: "Demo preview: your AC runs but comfort drops — start with airflow and control checks before deeper tests.",
  ai_summary: {
    overview: "Most often this is airflow, control, or a failed start component — not a mystery failure.",
    most_likely_issue: "Clogged filter or weak capacitor",
    bullets: [{ text: "Verify thermostat mode and setpoint" }, { text: "Replace a loaded filter" }, { text: "Listen for outdoor fan start" }],
  },
  causes: [
    {
      name: "Restricted airflow",
      probability: "High",
      description: "Filter or coil fouling reduces cooling output.",
      fix_summary: "Replace filter and verify blower speed.",
      difficulty: "Easy",
      cost: "$15–$40",
      time: "15 minutes",
    },
    {
      name: "Capacitor failure",
      probability: "Medium",
      description: "Outdoor fan or compressor cannot start reliably.",
      fix_summary: "Test and replace capacitor with correct rating.",
      difficulty: "Moderate",
      cost: "$120–$300",
      time: "45 minutes",
    },
  ],
  diagnostic_flow: {
    chart: `flowchart TD
      A[AC not cooling] --> B{Thermostat OK?}
      B -->|No| B1[Fix settings]
      B -->|Yes| C{Filter clean?}
      C -->|No| C1[Replace filter]
      C -->|Yes| D[Call technician]
    `,
  },
  checklist: ["Check thermostat", "Replace filter", "Reset breaker"],
  faqs: [{ question: "Demo question?", answer: "Demo answer for preview." }],
};

export const fixtureAuthoritySymptom: Record<string, unknown> = {
  aiSummary30s: "Demo: if your AC is blowing warm air in Tampa, start with airflow and power checks before assuming the worst.",
  repairs: [
    {
      pattern: "Airflow restriction",
      fix: "Replace the filter and verify registers are open.",
      cost: "$15–$50",
      difficulty: "Easy",
    },
  ],
  tools: [
    { name: "Thermometer", purpose: "Compare supply vs return air" },
    { name: "Flashlight", purpose: "Inspect coil and drain" },
  ],
  diagnostics: [
    {
      title: "Quick checks",
      steps: ["Confirm COOL mode", "Replace filter", "Check outdoor disconnect"],
      field_insight: "Most no-cool calls are solved in the first 10 minutes.",
    },
  ],
  mermaid: `flowchart TD
    A[Warm air?] --> B{Filter ok?}
    B -->|No| C[Replace filter]
    B -->|Yes| D[Call for service]
  `,
  causes: [
    { name: "Dirty filter", first_check: "Visual inspection" },
    { name: "Tripped breaker", first_check: "Panel and disconnect" },
  ],
  faqs: [{ question: "Same-day service?", answer: "We prioritize no-cool calls during business hours." }],
  ctaAboveFold: {
    headline: "Need AC help in Tampa?",
    subtext: "Local technicians — demo CTA only.",
    href: "tel:+15555551234",
    buttonText: "Call now",
  },
};

export const fixtureDecisiongridMaster: Record<string, unknown> = {
  layout: "decisiongrid_master",
  slug: "demo-decisiongrid",
  title: "AC Blowing Warm Air — Demo",
  system: "Residential HVAC",
  symptom: "AC blowing warm air",
  fast_answer: "Often low airflow, electrical start issues, or refrigerant — demo copy.",
  summary_30_sec: "Check the filter, reset power, then call if supply air stays warm.",
  difficulty: "moderate",
  diagnosticFlowMermaid: `flowchart TD
    A[Warm air] --> B{Ducting}
    A --> C{Electrical}
    A --> D{Refrigeration}
  `,
  causeConfirmationMermaid: `flowchart TD
    A[Pick pillar] --> B[Match cause]
    B --> C[DIY vs Pro]
  `,
  diagnostic_steps: [
    { step: 1, action: "Verify thermostat", expected_result: "Cool mode" },
    { step: 2, action: "Inspect filter", expected_result: "Clean" },
  ],
  causes: [
    { name: "Low airflow", indicator: "Weak at registers", confidence: "high" },
    { name: "Capacitor weak", indicator: "Fan slow to start", confidence: "medium" },
  ],
  repairs: [
    { name: "Replace filter", difficulty: "easy", estimated_cost: "$15–$40" },
    { name: "Replace capacitor", difficulty: "moderate", estimated_cost: "$120–$300" },
  ],
  tools: [{ name: "Thermometer", purpose: "Check split" }],
  faq: [{ question: "Demo FAQ?", answer: "Preview only." }],
  prevention: ["Change filters quarterly"],
  related_conditions: [{ name: "AC not turning on" }],
  costs: { low: "$50", average: "$250", high: "$1200" },
  safety_notes: ["Turn power off before electrical checks"],
  components: [{ name: "Capacitor", role: "Motor start assist" }],
  cta_blocks: [
    {
      placement: "above_fold",
      headline: "Call for same-day AC service",
      subtext: "Demo block",
      button_text: "Call now",
      phone_prompt: "Speak to a local tech",
    },
    {
      placement: "mid_page",
      headline: "Get a free estimate",
      subtext: "Demo block",
      button_text: "Request estimate",
      phone_prompt: "We call you back",
    },
    {
      placement: "bottom",
      headline: "Ready to fix it?",
      subtext: "Demo block",
      button_text: "Book service",
      phone_prompt: "Schedule today",
    },
  ],
  meta_title: "AC Blowing Warm Air | Demo",
  meta_description: "Demo preview for DecisionGrid master layout.",
  sections: [
    { id: "hook", heading: "What’s wrong", body: "Short demo section body." },
    { id: "trust", heading: "Why choose us", body: "Licensed, local, fast response — demo." },
  ],
};

export const fixtureCityService: CityServiceSchema = {
  page_type: "hybrid",
  slug: "demo-ac-repair-tampa",
  title: "AC Repair Tampa FL — Demo",
  hero: {
    headline: "AC Repair in Tampa — Same-Day When Available",
    subheadline: "Demo preview: fast diagnosis, upfront pricing, local technicians.",
    authorityLine: "Licensed HVAC • Serving Hillsborough",
  },
  problemSection: {
    summary: "When your AC quits in Florida heat, you need a fast, honest fix — not a lecture.",
    symptoms: ["Warm air", "Weak airflow", "Strange noises", "Water leaks"],
    impact: "Heat and humidity can escalate discomfort and indoor air quality issues quickly.",
  },
  authoritySection: {
    technicalExplanation:
      "We focus on restoring airflow, electrical reliability, and refrigerant circuit health — explained simply.",
    commonCauses: ["Capacitor wear", "Dirty coils", "Refrigerant leaks", "Thermostat misconfiguration"],
    riskFactors: ["Running system low on charge", "Ignoring electrical symptoms"],
  },
  solutionSection: {
    howWeFixIt: ["Systematic diagnosis", "Clear options", "Quality parts"],
    serviceApproach: "We confirm the problem before quoting — demo copy.",
    timeToFix: "Many visits complete same day.",
  },
  trustSection: {
    experience: "Serving Tampa Bay homeowners — demo.",
    certifications: ["Licensed", "Insured"],
    guarantees: ["Upfront estimates on repairs we recommend"],
  },
  localSection: {
    primaryCity: "Tampa",
    areasServed: ["Westchase", "Brandon", "St. Petersburg"],
    localProof: "Local dispatch — demo preview only.",
  },
  cta: {
    primary: "Call Now",
    secondary: "Request Callback",
    urgency: "No-cool calls prioritized",
  },
  faq: [
    { question: "Do you offer emergency service?", answer: "Yes — availability varies; call to confirm." },
    { question: "Is this page real?", answer: "No — it is a programmatic page-build demo." },
  ],
  seo: { metaTitle: "AC Repair Tampa | Demo", metaDescription: "Demo city_service page build." },
};

export const fixtureCitySymptom: Record<string, unknown> = {
  layout: "decisiongrid_master",
  slug: "demo-ac-not-cooling-tampa",
  title: "AC Not Cooling in Tampa — Demo",
  system: "Residential HVAC",
  symptom: "AC not cooling",
  fast_answer: "Start with thermostat mode, filter, and outdoor unit — then call if supply air stays warm.",
  summary_30_sec: "Demo city_symptom: local intent + fast checks + clear CTA.",
  diagnosticFlowMermaid: `flowchart TD
    A[Not cooling] --> B{Thermostat OK?}
    B -->|No| C[Fix settings]
    B -->|Yes| D{Filter clean?}
    D -->|No| E[Replace filter]
    D -->|Yes| F[Call technician]
  `,
  causeConfirmationMermaid: `flowchart TD
    A[Cause A] --> B[Repair path]
  `,
  causes: [{ name: "Low airflow", indicator: "Weak vents", confidence: "high" }],
  repairs: [{ name: "Filter replacement", difficulty: "easy", estimated_cost: "$15–$40" }],
  tools: [{ name: "Thermometer", purpose: "Check split" }],
  faq: [{ question: "Serving Tampa?", answer: "Demo — replace with real service area." }],
  meta_title: "AC Not Cooling Tampa | Demo",
  meta_description: "Demo city_symptom programmatic page.",
  cta_blocks: [
    {
      placement: "above_fold",
      headline: "AC not cooling in Tampa?",
      subtext: "Call for same-day help",
      button_text: "Call now",
      phone_prompt: "Local tech",
    },
    {
      placement: "mid_page",
      headline: "Free estimate",
      subtext: "Upfront pricing",
      button_text: "Get estimate",
      phone_prompt: "We respond fast",
    },
    {
      placement: "bottom",
      headline: "Book service",
      subtext: "Demo CTA",
      button_text: "Schedule",
      phone_prompt: "Talk to dispatcher",
    },
  ],
  sections: [
    { id: "fast", heading: "Fast answer", body: "Demo section." },
    { id: "checks", heading: "Quick checks", body: "Demo section." },
  ],
};

export const fixtureEmergency: EmergencySchema = {
  bannerHeadline: "Emergency AC Repair — Tampa (Demo)",
  dangerLine: "If you smell burning or see sparks, shut power and call immediately — demo text.",
  immediateChecks: ["Check thermostat", "Check breaker", "Check outdoor disconnect"],
  fix60Title: "Fix in 60 seconds",
  fix60Steps: ["Power cycle", "Replace filter if dirty", "Clear debris from outdoor unit"],
  mermaidFlow: `flowchart TD
    A[Emergency?] --> B{Safe to run?}
    B -->|No| C[Shut off and call]
    B -->|Yes| D[Continue checks]
  `,
  mostLikelyTitle: "Most likely issues",
  mostLikelyFix: "Capacitor, control, or airflow — demo preview.",
  costBand: "$150–$800",
  difficulty: "Varies",
  timeEstimate: "1–3 hours",
  monetizationHeadline: "Need a tech now?",
  monetizationBullets: ["Local dispatch", "Clear pricing", "Licensed pros"],
  leadStyle: "soft",
};

/** Canonical locked build for Home Service Diagnostics city pages (HRB-shaped). */
export const HSD_PAGE_BUILD_LOCKED_TYPE = "city-symptom" as const;

export const DEMO_TYPES = [
  HSD_PAGE_BUILD_LOCKED_TYPE,
  "symptom-v5",
  "v2-goldstandard",
  "authority-symptom",
  "decisiongrid-master",
  "city-service",
  "emergency",
] as const;

export type DemoTypeId = (typeof DEMO_TYPES)[number];
