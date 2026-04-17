"use client";

import { diagnosticFlowToMermaidSource } from "@/lib/dg/diagnosticFlowToMermaid";
import { DgStructuredPreviewMermaid } from "@/components/dg/DgStructuredPreviewMermaid";

export type DGMermaidProps = {
  /** Pre-built Mermaid source (e.g. `buildMermaid(page.title)`). Wins over `source`. */
  chart?: string;
  /** Mermaid string or structured `{ nodes, edges }` when `chart` is omitted. */
  source?: unknown;
};

/**
 * Renders a diagnostic flowchart from `chart` and/or `source`.
 */
export function DGMermaid({ source, chart: chartProp }: DGMermaidProps) {
  const explicit =
    typeof chartProp === "string" && chartProp.trim() ? chartProp.trim() : "";
  const chart = explicit || diagnosticFlowToMermaidSource(source);
  if (!chart?.trim()) return null;
  return <DgStructuredPreviewMermaid chart={chart.trim()} />;
}
