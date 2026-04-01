/**
 * Template / component names by surface (informational — real imports stay in `app/`).
 */
export const TEMPLATE_REGISTRY = {
  diagnostic: [
    "DiagnosticGoldPage",
    "GoldStandardPage",
    "AuthoritySymptomPage",
    "MasterDecisionGridPage",
  ],
  system: ["system hub"],
  repair: ["emergency-page", "city-repair-expansion"],
  cause: ["cause", "causes"],
  component: ["component detail"],
  condition: ["condition"],
  city_service: ["HybridServicePageTemplate"],
  city_symptom: ["location symptom expansion"],
} as const;
