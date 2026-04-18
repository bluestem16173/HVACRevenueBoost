import type { Trade } from "@/lib/dg/resolveCTA";
import {
  buildDgAuthorityMermaidFromTemplateKey,
  isDiagnosticFlowTemplateKey,
  resolveDgMermaidHighlightToken,
  type DiagnosticFlowTemplateKey,
} from "@/lib/dg/dgMermaidTemplates";
import { diagnosticFlowToMermaidSource } from "@/lib/dg/diagnosticFlowToMermaid";

function isTrade(v: unknown): v is Trade {
  return v === "hvac" || v === "plumbing" || v === "electrical";
}

/**
 * Single path for **dg_authority_v3** Mermaid: when `diagnostic_flow_template_key` is set, the locked
 * template (+ issue label + optional highlight) is the source of truth. Otherwise `diagnostic_flow`
 * is converted from a Mermaid string or `{ nodes, edges }`.
 */
export function resolveDgAuthorityMermaidChart(data: Record<string, unknown>): string | null {
  const tkRaw = data.diagnostic_flow_template_key;
  if (isDiagnosticFlowTemplateKey(tkRaw)) {
    const tk: DiagnosticFlowTemplateKey = tkRaw;
    const issue =
      (typeof data.diagnostic_flow_issue_label === "string" && data.diagnostic_flow_issue_label.trim()) ||
      (typeof data.title === "string" && data.title.trim()) ||
      "Diagnostic";
    const loc =
      typeof data.location === "string" && data.location.trim() ? String(data.location).trim() : undefined;

    const title = typeof data.title === "string" ? data.title : "";
    const summary = typeof data.summary_30s === "string" ? data.summary_30s : "";
    const logicPro = typeof data.diagnostic_logic_pro === "string" ? data.diagnostic_logic_pro : "";
    const logicHome = typeof data.diagnostic_logic_home === "string" ? data.diagnostic_logic_home : "";
    const slug = typeof data.slug === "string" ? data.slug.trim() : undefined;
    const explicitCluster =
      (typeof data.diagnostic_mermaid_cluster === "string" && data.diagnostic_mermaid_cluster.trim()) ||
      (typeof data.cluster === "string" && data.cluster.trim()) ||
      undefined;
    const trade = isTrade(data.trade) ? data.trade : undefined;

    const highlightToken = resolveDgMermaidHighlightToken(
      tk,
      explicitCluster,
      title,
      summary,
      logicPro,
      logicHome,
      { trade, slugSource: slug }
    );

    return buildDgAuthorityMermaidFromTemplateKey({
      templateKey: tk,
      issueLabel: issue,
      location: loc,
      highlightToken,
    });
  }

  return diagnosticFlowToMermaidSource(data.diagnostic_flow);
}
