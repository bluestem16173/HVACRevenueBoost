/**
 * Thin-Content Guards — Per-Page-Type Generation Eligibility
 * -----------------------------------------------------------
 * Call BEFORE generation to avoid thin/low-quality pages.
 * Node shape varies by page type (graph data, DB fetch, etc.).
 */

export type ThinContentNode = Record<string, unknown> | null | undefined;

/**
 * Returns true if the page should be generated (has sufficient content).
 * Returns true when node is missing (allow generation when no graph data).
 */
export function shouldGeneratePage(pageType: string, node: ThinContentNode): boolean {
  if (!node || typeof node !== "object") return true;

  const normalized = (pageType || "symptom").toLowerCase().replace(/-/g, "_");

  switch (normalized) {
    case "symptom":
    case "symptom_condition":
    case "condition":
    case "diagnostic":
    case "diagnose": {
      const causes = node.causes as unknown[] | undefined;
      return (causes?.length ?? 0) >= 2;
    }
    case "cause": {
      const symptoms = (node.symptoms ?? node.affected_symptoms) as unknown[] | undefined;
      const repairs = node.repairs as unknown[] | undefined;
      return (symptoms?.length ?? 0) >= 1 && (repairs?.length ?? 0) >= 1;
    }
    case "repair": {
      const causes = node.causes as unknown[] | undefined;
      return (causes?.length ?? 0) >= 1;
    }
    case "component": {
      const symptoms = node.symptoms as unknown[] | undefined;
      const repairs = node.repairs as unknown[] | undefined;
      return (symptoms?.length ?? 0) >= 1 || (repairs?.length ?? 0) >= 1;
    }
    case "system": {
      const components = (node.components ?? node.key_components) as unknown[] | undefined;
      return (components?.length ?? 0) >= 2;
    }
    default:
      return true;
  }
}
