/**
 * Image lookup for symptom pages — deterministic, no Mermaid.
 * Frontend handles images; AI does not generate diagrams.
 */

export function getImageForPage(slug: string): string {
  const s = (slug || "").toLowerCase();
  if (s.includes("rv")) return "/images/hvac-rv-system.svg";
  if (s.includes("mini-split")) return "/images/hvac-mini-split.svg";
  if (s.includes("heat-pump")) return "/images/hvac-heat-pump.svg";
  if (s.includes("airflow") || s.includes("room-hot") || s.includes("uneven")) return "/images/hvac-airflow-duct.svg";
  if (s.includes("cooling") || s.includes("not-cold") || s.includes("warm-air") || s.includes("ice-on")) return "/images/hvac-ac-cycle.svg";
  return "/images/hvac-system-main.svg";
}
