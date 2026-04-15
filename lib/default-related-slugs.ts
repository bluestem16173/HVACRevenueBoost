import type { ServiceVertical } from "@/lib/localized-city-path";
import { siblingSlugsFor } from "@/lib/vertical-diagnostic-links";

/** Related pillar slugs shown under diagnostic content (vertical-aware). */
export function getDefaultRelatedSlugs(vertical: ServiceVertical | null | undefined, slug: string): string[] {
  const s = (slug || "").toLowerCase();
  if (vertical === "plumbing") {
    return siblingSlugsFor("plumbing", s, 5);
  }
  if (vertical === "electrical") {
    return siblingSlugsFor("electrical", s, 5);
  }
  if (vertical === "hvac") {
    const sib = siblingSlugsFor("hvac", s, 5);
    if (sib.length) return sib;
  }
  if (s.includes("ac-not") || s.includes("cooling")) {
    return ["ac-not-cooling", "ac-running-but-not-cooling", "ac-weak-airflow", "one-room-not-cooling"];
  }
  return ["ac-not-cooling", "furnace-not-heating", "hvac-short-cycling", "weak-airflow-vents"];
}
