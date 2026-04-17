import { buildDiagnosticFlowGraph, graphToMermaid } from "./diagnosticFlowGraph";

/**
 * @deprecated Prefer {@link buildDiagnosticFlowGraph} + {@link graphToMermaid} at render time.
 * Kept for callers that still expect a Mermaid **string** (e.g. tests); do not persist in `pages.content_json`.
 */
export function generateMermaid(category: string, issue: string): string {
  return graphToMermaid(buildDiagnosticFlowGraph(category, issue));
}
