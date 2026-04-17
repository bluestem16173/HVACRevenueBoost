import type { HsdLockedBodyKey } from "./constants";
import type { HsdDiagnosticFlowGraph } from "./diagnosticFlowGraph";

/** Model string sections + server `diagnostic_flow` graph (no raw Mermaid in JSON). */
export type HsdLockedContentV1 = Record<HsdLockedBodyKey, string> & {
  diagnostic_flow: HsdDiagnosticFlowGraph;
};

export type HsdPageBuildRow = {
  slug: string;
  issue: string;
  category: string;
  city: string;
  state: string;
};
