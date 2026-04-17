/**
 * Locked DecisionGrid Mermaid v1 — **do not edit node text or topology** without updating
 * {@link CLUSTER_NODE_SNIPPET} and publisher QA. Issue line only is contextual.
 * @module
 */

import type { Trade } from "@/lib/dg/resolveCTA";

/** Minimal page shape for the locked template engine (DG maps into this). */
export type MermaidLockedPage = {
  title: string;
  trade: Trade;
  /** Queue / editorial cluster key — drives {@link applyHighlight}; omit for no emphasis. */
  cluster?: string;
  location?: string;
};

const HIGHLIGHT_CLASSDEF = `classDef highlight fill:#d4a017,stroke:#000,color:#000;`;

/** Escape text inside `["…"]` Mermaid node labels. */
function escapeIssueLabel(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, "'").replace(/\|/g, "/").trim();
}

function rootLabel(page: MermaidLockedPage): string {
  const issue = escapeIssueLabel(page.title.trim()) || "Diagnostic";
  const loc = page.location?.trim();
  if (!loc) return issue;
  return `${issue} · ${escapeIssueLabel(loc)}`;
}

/** Inner text for root node `A[…]` — unquoted when safe (like `A[${page.title}]`), else quoted. */
function rootInnerForFlowchart(page: MermaidLockedPage): string {
  const line = rootLabel(page);
  if (/[\[\]\n#"|]/.test(line)) return `"${escapeIssueLabel(line)}"`;
  return line;
}

/** Step 1 — trade → locked skeleton (fallback HVAC if unknown). */
export function getTemplate(trade: Trade): (ctx: { inner: string }) => string {
  if (trade === "plumbing") return plumbingFlow;
  if (trade === "electrical") return electricalFlow;
  return hvacFlow;
}

/** ❄️ HVAC — LOCKED */
function hvacFlow({ inner }: { inner: string }): string {
  return `flowchart TD
  A[${inner}] --> B[Airflow Check]
  B --> C[Outdoor Unit]
  C --> D[Refrigerant System]
  D --> E[Controls]
  E --> F[Diagnosis]`;
}

/** 💧 Plumbing — LOCKED */
function plumbingFlow({ inner }: { inner: string }): string {
  return `flowchart TD
  A[${inner}] --> B[Power/Gas]
  B --> C[Distribution]
  C --> D[Controls]
  D --> E[Heating]
  E --> F[Diagnosis]`;
}

/** ⚡ Electrical — LOCKED */
function electricalFlow({ inner }: { inner: string }): string {
  return `flowchart TD
  A[${inner}] --> B[Trip Type]
  B --> C[Load]
  C --> D[Wiring]
  D --> E[Breaker]
  E --> F[Diagnosis]`;
}

/**
 * cluster key → exact node substring in the generated flow (first match is highlighted).
 * Keys align with DG generation queue clusters where possible.
 */
const CLUSTER_NODE_SNIPPET: Record<Trade, Record<string, string>> = {
  hvac: {
    airflow: "B[Airflow Check]",
    refrigerant: "D[Refrigerant System]",
    compressor: "C[Outdoor Unit]",
    controls: "E[Controls]",
    decision: "F[Diagnosis]",
  },
  plumbing: {
    heater: "E[Heating]",
    tank: "E[Heating]",
    distribution: "C[Distribution]",
    drain: "C[Distribution]",
    decision: "F[Diagnosis]",
  },
  electrical: {
    load: "C[Load]",
    fault: "D[Wiring]",
    wiring: "D[Wiring]",
    panel: "E[Breaker]",
    decision: "F[Diagnosis]",
  },
};

/** Step 4 — append `:::highlight` + classDef to the mapped node (production-safe: full node match). */
export function applyHighlight(flow: string, page: MermaidLockedPage): string {
  const key = page.cluster?.trim().toLowerCase();
  if (!key) return flow.trimEnd();
  const snippet = CLUSTER_NODE_SNIPPET[page.trade]?.[key];
  if (!snippet || !flow.includes(snippet)) return flow.trimEnd();
  const highlighted = flow.replace(snippet, `${snippet}:::highlight`);
  return `${highlighted.trim()}\n\n${HIGHLIGHT_CLASSDEF}`;
}

/** True when `cluster` is a known highlight key for `trade`. */
export function isLockedMermaidClusterKey(trade: Trade, cluster: string): boolean {
  const k = cluster.trim().toLowerCase();
  return Boolean(k && CLUSTER_NODE_SNIPPET[trade]?.[k]);
}

/** Minimal HVAC skeleton from a display title (no trade, cluster, or location). */
function buildMermaidFromTitleOnly(title: string): string {
  const raw = title.trim() || "Diagnostic";
  const inner =
    /[\[\]\n#"|]/.test(raw) ? `"${escapeIssueLabel(raw)}"` : raw;
  return `flowchart TD
  A[${inner}] --> B[Airflow Check]
  B --> C[Outdoor Unit]
  C --> D[Refrigerant System]
  D --> E[Controls]
  E --> F[Diagnosis]`;
}

/**
 * Locked diagram from {@link MermaidLockedPage}, or a **string** title for a minimal fixed HVAC flowchart.
 */
export function buildMermaid(page: MermaidLockedPage): string;
export function buildMermaid(title: string): string;
export function buildMermaid(titleOrPage: string | MermaidLockedPage): string {
  if (typeof titleOrPage === "string") {
    return buildMermaidFromTitleOnly(titleOrPage);
  }
  const page = titleOrPage;
  const template = getTemplate(page.trade);
  const inner = rootInnerForFlowchart(page);
  let flow = template({ inner });
  flow = applyHighlight(flow, page);
  return flow.trim();
}
