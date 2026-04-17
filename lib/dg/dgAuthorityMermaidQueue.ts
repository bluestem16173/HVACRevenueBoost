import type { Trade } from "@/lib/dg/resolveCTA";
import type { DiagnosticFlowTemplateKey } from "@/lib/dg/dgMermaidTemplates";
import dgAuthorityGenQueue from "@/prompts/DG_Authority_Generation_Queue.json";

type SupportingRow = { trade: string; slug: string; cluster: string };

/** `hvac/ac-not-cooling/tampa-fl` → `ac-not-cooling` */
export function dgSymptomTailFromSlugOrPath(slugOrPath: string): string | null {
  const s = slugOrPath.replace(/^\/+/, "").toLowerCase();
  const m = s.match(/^(?:hvac|plumbing|electrical)\/([a-z0-9-]+)(?:\/|$)/i);
  return m ? m[1].toLowerCase() : null;
}

function buildSymptomClusterByTrade(): Record<Trade, Record<string, string>> {
  const rows = (dgAuthorityGenQueue as { supporting_pages: SupportingRow[] }).supporting_pages;
  const acc: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    const tail = dgSymptomTailFromSlugOrPath(row.slug);
    if (!tail) continue;
    const trade = row.trade as Trade;
    if (!acc[trade]) acc[trade] = {};
    acc[trade][tail] = row.cluster;
  }
  return acc as Record<Trade, Record<string, string>>;
}

/** Symptom tail (e.g. `ac-not-cooling`) → DG generation queue `cluster` string. */
export const DG_AUTHORITY_SYMPTOM_CLUSTER_BY_TRADE = buildSymptomClusterByTrade();

/**
 * Maps queue `cluster` to a {@link HIGHLIGHT_BY_TEMPLATE} token for the active Mermaid template.
 * Keeps diagrams visually aligned with the same cluster model as sibling linking / generation queue.
 */
export function mermaidHighlightTokenForQueueCluster(
  templateKey: DiagnosticFlowTemplateKey,
  cluster: string
): string | undefined {
  const c = cluster.trim().toLowerCase();
  if (!c) return undefined;
  if (templateKey === "hvac_v1") {
    const m: Record<string, string> = {
      airflow: "airflow",
      compressor: "outdoor",
      refrigerant: "refrigerant",
      decision: "repair",
    };
    return m[c];
  }
  if (templateKey === "plumbing_v1") {
    const m: Record<string, string> = {
      heater: "heating",
      tank: "tank",
      distribution: "distribution",
      drain: "distribution",
      decision: "repair",
    };
    return m[c];
  }
  const m: Record<string, string> = {
    load: "load",
    fault: "trip",
    wiring: "termination",
    panel: "breaker",
    decision: "repair",
  };
  return m[c];
}

export function mermaidHighlightTokenFromAuthoritySlug(
  trade: Trade,
  templateKey: DiagnosticFlowTemplateKey,
  slugOrPath: string | null | undefined
): string | undefined {
  if (!slugOrPath?.trim()) return undefined;
  const tail = dgSymptomTailFromSlugOrPath(slugOrPath.trim());
  if (!tail) return undefined;
  const cluster = DG_AUTHORITY_SYMPTOM_CLUSTER_BY_TRADE[trade]?.[tail];
  if (!cluster) return undefined;
  return mermaidHighlightTokenForQueueCluster(templateKey, cluster);
}
