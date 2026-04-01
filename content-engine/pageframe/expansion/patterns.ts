/** URL / slug expansion patterns (city × symptom, etc.) */
export const EXPANSION_PATTERNS = {
  city_symptom: "repair/{city}/{symptom}",
  diagnose: "diagnose/{symptom}",
} as const;
