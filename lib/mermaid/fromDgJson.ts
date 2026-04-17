/**
 * Maps `dg_authority_v3` / `dg_pillar_v1` `content_json` into {@link MermaidLockedPage}
 * and builds the locked chart via {@link buildMermaid}.
 */
import { diagnosticFlowToMermaidSource } from "@/lib/dg/diagnosticFlowToMermaid";
import { inferTradeFromSlug } from "@/lib/dg/dgAuthoritySeoRegistry";
import type { Trade } from "@/lib/dg/resolveCTA";
import { DG_AUTHORITY_SYMPTOM_CLUSTER_BY_TRADE, dgSymptomTailFromSlugOrPath } from "@/lib/dg/dgAuthorityMermaidQueue";
import { buildMermaid, isLockedMermaidClusterKey } from "@/lib/mermaid/buildMermaid";

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Optional JSON override for cluster (same vocabulary as generation queue). */
function explicitCluster(data: Record<string, unknown>): string | undefined {
  const a = asString(data.diagnostic_mermaid_cluster);
  const b = asString(data.diagnostic_flow_cluster);
  const raw = a || b;
  return raw ? raw.toLowerCase() : undefined;
}

/**
 * Queue cluster strings → keys accepted by {@link CLUSTER_NODE_SNIPPET} for the locked engine.
 */
function normalizeClusterForLockedEngine(trade: Trade, queueCluster: string): string | undefined {
  const q = queueCluster.trim().toLowerCase();
  if (!q) return undefined;
  if (trade === "hvac") {
    if (q === "airflow") return "airflow";
    if (q === "compressor") return "compressor";
    if (q === "refrigerant") return "refrigerant";
    if (q === "decision") return undefined;
    return undefined;
  }
  if (trade === "plumbing") {
    if (q === "heater") return "heater";
    if (q === "tank") return "tank";
    if (q === "distribution" || q === "drain") return "distribution";
    if (q === "decision") return undefined;
    return undefined;
  }
  if (trade === "electrical") {
    if (q === "load") return "load";
    if (q === "fault" || q === "wiring") return "fault";
    if (q === "panel") return "panel";
    if (q === "decision") return undefined;
    return undefined;
  }
  return undefined;
}

/** Maps legacy `diagnostic_flow_highlight` tokens (dgMermaidTemplates) → locked cluster keys. */
function clusterFromLegacyHighlightToken(trade: Trade, token: string): string | undefined {
  const t = token.trim().toLowerCase();
  if (!t) return undefined;
  if (trade === "hvac") {
    if (["airflow", "filter", "blower"].includes(t)) return "airflow";
    if (["outdoor", "condenser", "compressor"].includes(t)) return "compressor";
    if (["refrigerant", "charge"].includes(t)) return "refrigerant";
    if (["controls", "staging"].includes(t)) return "controls";
    return undefined;
  }
  if (trade === "plumbing") {
    if (["heating", "element", "gas"].includes(t)) return "heater";
    if (["tank", "sediment", "tp"].includes(t)) return "tank";
    if (["distribution"].includes(t)) return "distribution";
    return undefined;
  }
  if (trade === "electrical") {
    if (["trip", "classify"].includes(t)) return "fault";
    if (["load", "measure"].includes(t)) return "load";
    if (["termination", "neutral", "wiring"].includes(t)) return "fault";
    if (["breaker", "device"].includes(t)) return "panel";
    return undefined;
  }
  return undefined;
}

function inferCluster(data: Record<string, unknown>, trade: Trade, pagePath: string | null): string | undefined {
  const ex = explicitCluster(data);
  if (ex) {
    const normalized = normalizeClusterForLockedEngine(trade, ex);
    if (normalized) return normalized;
    if (isLockedMermaidClusterKey(trade, ex)) return ex.trim().toLowerCase();
    return undefined;
  }
  const legacyHl = asString(data.diagnostic_flow_highlight);
  if (legacyHl) {
    const fromLegacy = clusterFromLegacyHighlightToken(trade, legacyHl);
    if (fromLegacy) return fromLegacy;
  }
  const slugPath = asString(data.slug) || (pagePath?.trim() ?? "");
  const tail = dgSymptomTailFromSlugOrPath(slugPath);
  if (!tail) return undefined;
  const qc = DG_AUTHORITY_SYMPTOM_CLUSTER_BY_TRADE[trade]?.[tail];
  if (!qc) return undefined;
  return normalizeClusterForLockedEngine(trade, qc);
}

export type BuildMermaidFromDgJsonContext = {
  trade: Trade;
  title: string;
  pagePath?: string | null;
};

export type BuildMermaidFromDgJsonResult = {
  chart: string;
  hasChart: boolean;
  /** Set when a cluster highlight was applied (for optional UX copy). */
  highlightedCluster?: string;
};

function tradeFromJson(data: Record<string, unknown>, pathHint: string): Trade {
  const t = data.trade;
  if (t === "hvac" || t === "plumbing" || t === "electrical") return t;
  return inferTradeFromSlug(pathHint || "");
}

/**
 * Prefer locked {@link buildMermaid}; fall back to legacy `diagnostic_flow` when mode is legacy
 * or flow is a non-empty custom graph.
 */
export function buildMermaidFromDgJson(
  data: Record<string, unknown>,
  ctx: BuildMermaidFromDgJsonContext
): BuildMermaidFromDgJsonResult {
  const mode = asString(data.diagnostic_mermaid_mode);
  const slug = asString(data.slug);
  const pagePath = (ctx.pagePath != null && String(ctx.pagePath).trim()) || slug || null;
  const trade = ctx.trade ?? tradeFromJson(data, pagePath || "");
  const title = (ctx.title != null && String(ctx.title).trim() ? String(ctx.title).trim() : "") || asString(data.title);
  const location = asString(data.location);

  if (mode === "legacy") {
    const legacy = diagnosticFlowToMermaidSource(data.diagnostic_flow);
    const legacyStr = typeof legacy === "string" ? legacy.trim() : "";
    if (legacyStr.length > 0) {
      return { chart: legacyStr, hasChart: true };
    }
  }

  if (!title) {
    return { chart: "", hasChart: false };
  }

  const cluster = inferCluster(data, trade, pagePath);
  const chart = buildMermaid({
    title,
    trade,
    ...(cluster ? { cluster } : {}),
    ...(location ? { location } : {}),
  });

  const highlighted = chart.includes(":::highlight");
  return {
    chart,
    hasChart: chart.length > 0,
    ...(highlighted && cluster ? { highlightedCluster: cluster } : {}),
  };
}
