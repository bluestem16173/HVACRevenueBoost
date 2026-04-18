import type { SystemBlockKey } from "@/lib/systemBlocks";

/** Second path segment for `hvac/{symptom}/...` slugs, e.g. `ac-not-cooling`. */
export function getHvacSymptomKeyFromSlug(slug: string): string | null {
  const trimmed = slug.trim().replace(/^\/+/, "");
  if (!trimmed.toLowerCase().startsWith("hvac/")) return null;
  const parts = trimmed.split("/").filter(Boolean);
  return parts[1] ?? null;
}

/**
 * Which curated system blocks to show for this HVAC issue (symptom segment only).
 * Most issues: 1–2 blocks. High-intent cooling: homeowner thermostat first, then physics.
 */
export function getSystemBlocksForIssue(issue: string): SystemBlockKey[] {
  const map: Record<string, SystemBlockKey[]> = {
    "ac-not-turning-on": ["ac_start_sequence", "electrical_control"],
    "ac-not-cooling": [
      "cooling_stop_damage_risk",
      "thermostat_cooling_check",
      "airflow_dynamics",
      "refrigerant_levels_test",
      "refrigerant_cycle",
      "cooling_repair_cost_bands",
    ],
    "ac-freezing-up": ["cooling_stop_damage_risk", "airflow_dynamics", "refrigerant_cycle"],
    "weak-airflow": ["airflow_dynamics"],
    "ac-making-noise": ["ac_start_sequence", "electrical_control"],
  };

  const keys = map[issue];
  if (keys?.length) return keys;
  return ["ac_start_sequence"];
}

/** Resolve keys from a full page slug; non-HVAC → no blocks. */
export function getSystemBlocksForPageSlug(slug: string): SystemBlockKey[] {
  const symptom = getHvacSymptomKeyFromSlug(slug);
  if (!symptom) return [];
  const keys = [...getSystemBlocksForIssue(symptom)];
  if (symptom === "ac-not-cooling" && /tampa/i.test(slug)) {
    keys.push("cooling_tampa_technician_cta");
  }
  return keys;
}
