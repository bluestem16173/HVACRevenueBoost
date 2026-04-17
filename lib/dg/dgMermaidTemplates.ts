import type { Trade } from "@/lib/dg/resolveCTA";
import { mermaidHighlightTokenFromAuthoritySlug } from "@/lib/dg/dgAuthorityMermaidQueue";

/** Escape text for use inside Mermaid `["..."]` node labels. */
export function escapeMermaidQuotedLabel(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, "'").replace(/\|/g, "/").trim();
}

const HIGHLIGHT_CLASS = `classDef highlight fill:#d4a017,stroke:#1e293b,color:#0f172a,font-weight:600;`;

export const DIAGNOSTIC_FLOW_TEMPLATE_KEYS = ["hvac_v1", "plumbing_v1", "electrical_v1"] as const;
export type DiagnosticFlowTemplateKey = (typeof DIAGNOSTIC_FLOW_TEMPLATE_KEYS)[number];

export function isDiagnosticFlowTemplateKey(v: unknown): v is DiagnosticFlowTemplateKey {
  return typeof v === "string" && (DIAGNOSTIC_FLOW_TEMPLATE_KEYS as readonly string[]).includes(v);
}

function quoteLabel(label: string): string {
  const inner = escapeMermaidQuotedLabel(label) || "Diagnostic";
  return `"${inner}"`;
}

/** Issue + optional market line for the Mermaid root node. */
export type DgMermaidIssueContext = {
  issue: string;
  location?: string;
};

function dgRootDisplayLine(ctx: DgMermaidIssueContext): string {
  const issue = ctx.issue.trim() || "Diagnostic";
  const loc = ctx.location?.trim();
  return loc ? `${issue} · ${loc}` : issue;
}

/** Trade template: `issue` / `location` inject into the root node label. */
export type DgMermaidTemplateFn = (ctx: DgMermaidIssueContext) => string;

/** Step 1 — pick the locked flowchart skeleton for a template key. */
export function getDgMermaidTemplate(templateKey: DiagnosticFlowTemplateKey): DgMermaidTemplateFn {
  if (templateKey === "plumbing_v1") return plumbingV1Flow;
  if (templateKey === "electrical_v1") return electricalV1Flow;
  return hvacV1Flow;
}

/** Step 1 (trade-shaped) — same as {@link getDgMermaidTemplate}({@link tradeToDefaultTemplateKey}(trade)). */
export function getMermaidTemplateForTrade(trade: Trade): DgMermaidTemplateFn {
  return getDgMermaidTemplate(tradeToDefaultTemplateKey(trade));
}

/** Locked HVAC v1 skeleton — root from {@link DgMermaidIssueContext}. */
export function hvacV1Flow(ctx: DgMermaidIssueContext): string {
  const t = quoteLabel(dgRootDisplayLine(ctx));
  return [
    "flowchart TD",
    `  A[${t}] --> B[Airflow / filter / blower]`,
    "  B --> C[Outdoor unit operation]",
    "  C --> D[Refrigerant-side behavior]",
    "  D --> E[Controls / sensors / staging]",
    "  E --> F[Measured diagnosis]",
    "  F --> G[Repair or replace decision]",
  ].join("\n");
}

/** Locked plumbing v1 skeleton. */
export function plumbingV1Flow(ctx: DgMermaidIssueContext): string {
  const t = quoteLabel(dgRootDisplayLine(ctx));
  return [
    "flowchart TD",
    `  A[${t}] --> B[Power or gas supply]`,
    "  B --> C[Distribution-only vs heater-side]",
    "  C --> D[Controls / thermostat / ECO]",
    "  D --> E[Electric or gas heating path]",
    "  E --> F[Sediment / vessel / T&P behavior]",
    "  F --> G[Measured diagnosis]",
    "  G --> H[Repair or replace decision]",
  ].join("\n");
}

/** Locked electrical v1 skeleton. */
export function electricalV1Flow(ctx: DgMermaidIssueContext): string {
  const t = quoteLabel(dgRootDisplayLine(ctx));
  return [
    "flowchart TD",
    `  A[${t}] --> B[Classify trip / symptom]`,
    "  B --> C[Load measurement]",
    "  C --> D[Compare to breaker or circuit rating]",
    "  D --> E[Connection / neutral / termination checks]",
    "  E --> F[Breaker / device validation]",
    "  F --> G[Measured diagnosis]",
    "  G --> H[Repair or replace decision]",
  ].join("\n");
}

const HIGHLIGHT_BY_TEMPLATE: Record<DiagnosticFlowTemplateKey, Record<string, string>> = {
  hvac_v1: {
    airflow: "B[Airflow / filter / blower]",
    filter: "B[Airflow / filter / blower]",
    blower: "B[Airflow / filter / blower]",
    outdoor: "C[Outdoor unit operation]",
    condenser: "C[Outdoor unit operation]",
    compressor: "C[Outdoor unit operation]",
    refrigerant: "D[Refrigerant-side behavior]",
    charge: "D[Refrigerant-side behavior]",
    controls: "E[Controls / sensors / staging]",
    staging: "E[Controls / sensors / staging]",
    measured: "F[Measured diagnosis]",
    diagnosis: "F[Measured diagnosis]",
    repair: "G[Repair or replace decision]",
    replace: "G[Repair or replace decision]",
  },
  plumbing_v1: {
    power: "B[Power or gas supply]",
    gas: "B[Power or gas supply]",
    distribution: "C[Distribution-only vs heater-side]",
    controls: "D[Controls / thermostat / ECO]",
    thermostat: "D[Controls / thermostat / ECO]",
    heating: "E[Electric or gas heating path]",
    element: "E[Electric or gas heating path]",
    tank: "F[Sediment / vessel / T&P behavior]",
    sediment: "F[Sediment / vessel / T&P behavior]",
    tp: "F[Sediment / vessel / T&P behavior]",
    measured: "G[Measured diagnosis]",
    diagnosis: "G[Measured diagnosis]",
    repair: "H[Repair or replace decision]",
    replace: "H[Repair or replace decision]",
  },
  electrical_v1: {
    trip: "B[Classify trip / symptom]",
    classify: "B[Classify trip / symptom]",
    load: "C[Load measurement]",
    measure: "C[Load measurement]",
    rating: "D[Compare to breaker or circuit rating]",
    termination: "E[Connection / neutral / termination checks]",
    neutral: "E[Connection / neutral / termination checks]",
    wiring: "E[Connection / neutral / termination checks]",
    breaker: "F[Breaker / device validation]",
    device: "F[Breaker / device validation]",
    measured: "G[Measured diagnosis]",
    diagnosis: "G[Measured diagnosis]",
    repair: "H[Repair or replace decision]",
    replace: "H[Repair or replace decision]",
  },
};

/** Step 4 — emphasize one node by appending `:::highlight` + shared `classDef`. */
export function attachMermaidNodeHighlight(flow: string, nodeSnippet: string): string {
  if (!nodeSnippet || !flow.includes(nodeSnippet)) return `${flow}\n${HIGHLIGHT_CLASS}`;
  const highlighted = flow.replace(nodeSnippet, `${nodeSnippet}:::highlight`);
  return `${highlighted}\n${HIGHLIGHT_CLASS}`;
}

/** @deprecated Prefer {@link attachMermaidNodeHighlight} with the full node snippet from {@link highlightSnippetForTemplateKey}. */
export function highlightFlowByNodeSnippet(flow: string, nodeSnippet: string): string {
  return attachMermaidNodeHighlight(flow, nodeSnippet);
}

function haystackForHighlight(title: string, summary: string, logicPro: string, logicHome: string): string {
  return `${title} ${summary} ${logicPro} ${logicHome}`.toLowerCase();
}

export function tradeToDefaultTemplateKey(trade: Trade): DiagnosticFlowTemplateKey {
  if (trade === "plumbing") return "plumbing_v1";
  if (trade === "electrical") return "electrical_v1";
  return "hvac_v1";
}

/**
 * Picks a single highlight token from explicit JSON or keyword inference (first match wins).
 * Tokens map to {@link HIGHLIGHT_BY_TEMPLATE} for the active template key.
 */
export function resolveDgMermaidHighlightToken(
  templateKey: DiagnosticFlowTemplateKey,
  explicit: string | undefined,
  title: string,
  summary: string,
  logicPro: string,
  logicHome: string,
  opts?: { trade?: Trade; slugSource?: string | null }
): string | undefined {
  const map = HIGHLIGHT_BY_TEMPLATE[templateKey];
  const ex = explicit?.trim().toLowerCase();
  if (ex && map[ex]) return ex;

  if (opts?.trade && opts.slugSource?.trim()) {
    const fromQueue = mermaidHighlightTokenFromAuthoritySlug(
      opts.trade,
      templateKey,
      opts.slugSource.trim()
    );
    if (fromQueue && map[fromQueue]) return fromQueue;
  }

  const h = haystackForHighlight(title, summary, logicPro, logicHome);

  if (templateKey === "hvac_v1") {
    const order: [RegExp, string][] = [
      [/\b(airflow|filter|static|duct|return|blower)\b/i, "airflow"],
      [/\b(condenser|outdoor|compressor|capacitor|contactor)\b/i, "outdoor"],
      [/\b(refrigerant|charge|leak|superheat|subcool|txv|metering)\b/i, "refrigerant"],
      [/\b(control|thermostat|stat|board|sensor|staging)\b/i, "controls"],
      [/\b(measure|gauge|clamp|delta|subcool|superheat)\b/i, "measured"],
    ];
    for (const [re, key] of order) if (re.test(h)) return key;
    if (/\b(repair|replace)\b/i.test(h)) return "repair";
  }

  if (templateKey === "plumbing_v1") {
    const order: [RegExp, string][] = [
      [/\b(gas|pilot|ignition|manifold)\b/i, "gas"],
      [/\b(electric|element|breaker|240)\b/i, "power"],
      [/\b(tap|fixture|distribution|crossover|recirc|whole.house)\b/i, "distribution"],
      [/\b(thermostat|hi-limit|eco|control)\b/i, "controls"],
      [/\b(sediment|tank|drain|t&p|t\s*&\s*p|flush|vessel)\b/i, "tank"],
      [/\b(heat exchanger|burner|combustion)\b/i, "heating"],
      [/\b(measure|pressure|temp|clamp)\b/i, "measured"],
      [/\b(repair|replace)\b/i, "repair"],
    ];
    for (const [re, k] of order) if (re.test(h)) return k;
  }

  if (templateKey === "electrical_v1") {
    const order: [RegExp, string][] = [
      [/\b(trip|breaker|reset|afci|gfci|nuisance)\b/i, "trip"],
      [/\b(amp|load|clamp|measure)\b/i, "load"],
      [/\b(rating|80%|continuous|curve)\b/i, "rating"],
      [/\b(wiring|neutral|lug|termination|mwbc|connection)\b/i, "termination"],
      [/\b(breaker test|replace breaker|device|afci)\b/i, "breaker"],
      [/\b(measure|megger|insulation|voltage drop)\b/i, "measured"],
      [/\b(repair|replace|upgrade)\b/i, "repair"],
    ];
    for (const [re, k] of order) if (re.test(h)) return k;
  }

  return undefined;
}

export function highlightSnippetForTemplateKey(
  templateKey: DiagnosticFlowTemplateKey,
  token: string | undefined
): string | undefined {
  if (!token) return undefined;
  return HIGHLIGHT_BY_TEMPLATE[templateKey][token.toLowerCase()];
}

/** @deprecated Prefer {@link highlightSnippetForTemplateKey} with explicit template key. */
export function highlightSnippetForToken(trade: Trade, token: string | undefined): string | undefined {
  return highlightSnippetForTemplateKey(tradeToDefaultTemplateKey(trade), token);
}

/**
 * Step 2–3 — build contextual Mermaid from template + issue/location, then optional cluster highlight.
 */
export function buildDgAuthorityMermaidFromTemplateKey(opts: {
  templateKey: DiagnosticFlowTemplateKey;
  issueLabel: string;
  location?: string;
  highlightToken?: string;
}): string {
  const label = opts.issueLabel.trim() || "Diagnostic";
  const loc = opts.location?.trim();
  const base = getDgMermaidTemplate(opts.templateKey)({
    issue: label,
    ...(loc ? { location: loc } : {}),
  });

  const snippet = highlightSnippetForTemplateKey(opts.templateKey, opts.highlightToken);
  if (!snippet) return base;
  return attachMermaidNodeHighlight(base, snippet);
}

/**
 * Trade-default v1 chart (issue label = page title).
 * @deprecated Prefer {@link buildDgAuthorityMermaidFromTemplateKey} when JSON supplies `diagnostic_flow_template_key`.
 */
export function buildDgAuthorityMermaidChart(opts: {
  trade: Trade;
  title: string;
  highlightToken?: string;
}): string {
  return buildDgAuthorityMermaidFromTemplateKey({
    templateKey: tradeToDefaultTemplateKey(opts.trade),
    issueLabel: opts.title,
    highlightToken: opts.highlightToken,
  });
}
