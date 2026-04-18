/** Locked H2 for all `hvac/ac-not-cooling/{city}` city_symptom pages (authority gate, not blog intro). */
export const LOCKED_AC_NOT_COOLING_HEADLINE = "AC Not Cooling? Start Here" as const;

export function isAcNotCoolingCitySlug(slug: string): boolean {
  return /^hvac\/ac-not-cooling\//i.test(String(slug ?? "").trim());
}
