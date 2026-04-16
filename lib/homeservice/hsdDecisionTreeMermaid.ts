/**
 * Optional Mermaid source on HSD city JSON (`decision_tree_mermaid`).
 * Strip fenced blocks if the model wrapped the chart.
 */
export function sanitizeHsdMermaid(src: string): string {
  return src
    .replace(/^\s*```mermaid\s*/i, "")
    .replace(/^\s*```\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

/** Short, readable default when JSON omits the field (HVAC “not cooling” path). */
export const DEFAULT_AC_NOT_COOLING_MERMAID = `flowchart TD
  A[Not cooling enough?] --> B{Strong airflow at vents?}
  B -->|No| C[Airflow path: filter, coil, blower, ducts]
  B -->|Yes| D{Outdoor unit running & fan spinning?}
  D -->|No| E[Electrical path: disconnect, cap, contactor, 24V]
  D -->|Yes| F[Refrigerant / metering: charge, restriction, TXV]`;

export function getHsdDecisionTreeMermaid(data: Record<string, unknown>, storageSlug: string): string {
  const raw =
    typeof data.decision_tree_mermaid === "string"
      ? data.decision_tree_mermaid
      : typeof data.decision_tree_mermaid_chart === "string"
        ? data.decision_tree_mermaid_chart
        : "";
  const cleaned = sanitizeHsdMermaid(raw);
  if (cleaned) return cleaned;
  if (storageSlug.includes("ac-not-cooling")) return DEFAULT_AC_NOT_COOLING_MERMAID;
  return "";
}
