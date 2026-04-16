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
 * 1–2 keys max per product spec; expand the map as new symptom slugs ship.
 */
export function getSystemBlocksForIssue(issue: string): SystemBlockKey[] {
  const map: Record<string, SystemBlockKey[]> = {
    "ac-not-turning-on": ["ac_start_sequence", "electrical_control"],
    "ac-not-cooling": ["refrigerant_cycle", "airflow_dynamics"],
    "ac-freezing-up": ["airflow_dynamics", "refrigerant_cycle"],
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
  return getSystemBlocksForIssue(symptom);
}
