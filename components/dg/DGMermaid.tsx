import { diagnosticFlowToMermaidSource } from "@/lib/dg/diagnosticFlowToMermaid";
import { DgStructuredPreviewMermaid } from "@/components/dg/DgStructuredPreviewMermaid";

/**
 * Renders diagnostic flow from Mermaid source string or structured `{ nodes, edges }`.
 */
export function DGMermaid({ source }: { source: unknown }) {
  const chart = diagnosticFlowToMermaidSource(source);
  if (!chart) return null;
  return <DgStructuredPreviewMermaid chart={chart} />;
}
