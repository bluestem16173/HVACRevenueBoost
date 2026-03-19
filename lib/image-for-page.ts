/**
 * Image lookup for symptom pages — deterministic, no Mermaid.
 * Frontend handles images; AI does not generate diagrams.
 */

export function getImageForPage(slug: string): string {
  const s = (slug || "").toLowerCase();
  if (s.includes("rv")) return "/images/hvac_rv_system.svg.svg";
  if (s.includes("mini-split")) return "/images/hvac_mini_split.svg.svg";
  if (s.includes("heat-pump")) return "/images/hvac_heat_pump.svg.svg";
  if (s.includes("airflow") || s.includes("room-hot") || s.includes("uneven")) return "/images/hvac_airflow_duct.svg.svg";
  if (s.includes("cooling") || s.includes("not-cold") || s.includes("warm-air") || s.includes("ice-on")) return "/images/hvac_ac_cycle.svg.svg";
  return "/images/hvac_system_main.svg.svg";
}
