/**
 * Maps Mermaid `classDef` / `:::class` names on HVAC flowchart nodes → `renderHSDPage` section keys (scroll targets).
 */
export const MERMAID_CLICK_MAP: Record<string, string> = {
  airflow: "top_causes",
  refrigerant: "top_causes",
  load: "top_causes",
};

/**
 * DOM id for a locked HSD body section — same string as the content key
 * (e.g. `top_causes`, `how_system_works`, `cost_matrix`). `renderHSDPage` must match.
 */
export function hsdSectionDomId(sectionKey: string): string {
  return sectionKey;
}
