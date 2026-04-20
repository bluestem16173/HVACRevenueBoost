/**
 * Failure-class triage anchors for **national pillar** copy and prompts (HVAC / electrical / plumbing).
 * Aligns with cluster + city examples under `lib/hsd/examples/`.
 */
/** Matches national pillar triage: airflow vs thermodynamics vs control. */
export const HVAC_FAILURE_CLASSES = ["airflow", "refrigerant", "electrical/control"] as const;

/** Example: `/electrical/breaker-keeps-tripping` pillar logic. */
export const ELECTRICAL_BREAKER_FAILURE_CLASSES = ["overload", "short circuit", "ground fault"] as const;

/** Example: `/plumbing/no-hot-water` pillar logic. */
export const PLUMBING_NO_HOT_WATER_FAILURE_CLASSES = [
  "water heater failure",
  "supply issue",
  "fixture limitation",
] as const;
