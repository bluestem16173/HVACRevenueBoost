import { applyBreakerKeepsTrippingMoneyToSummary30s } from "@/lib/hsd/breakerKeepsTrippingMoneyCopy";
import { hsdSectionDomId } from "@/lib/hsd/mermaidClickMap";
import {
  injectProgrammaticHsdCtas,
  normalizeCtasOnJson,
  type HsdCtaEntry,
  type HsdCtaType,
} from "@/lib/hsd/injectProgrammaticHsdCtas";
import { simpleDiagnosticFlowToMermaid } from "@/lib/hsd/simpleDiagnosticFlowToMermaid";
import { backfillLocalizedPlumbingAuthorityFields } from "@/lib/homeservice/backfillLocalizedTradeAuthority";
import {
  buildCityContextForLeeCountyCity,
  isLeeCountyCityStorageSlug,
} from "@/lib/homeservice/leeCountyLocalizedEnrichment";
import {
  formatCityPathSegmentForDisplay,
  isPlumbingNoHotWaterSlug,
  parseLocalizedStorageSlug,
} from "@/lib/localized-city-path";
import { filterInternalLinksInPlace, filterTierDiscoveryPaths } from "@/lib/seo/tier-one-discovery";
import { dedupeLines, stripCostBandsFromTitle } from "@/lib/utils";
import type { HsdV25Payload } from "@/src/lib/validation/hsdV25Schema";

/** Optional row/envelope fields sometimes merged onto stored `content_json`. */
export type HsdV25RenderInput = HsdV25Payload &
  Partial<{
    city: string;
    symptom: string;
    vertical: string;
    /** LLM / CMS optional — footer internal links. */
    internal_links?: { related_symptoms?: string[]; relatedSymptoms?: string[] };
    /** Legacy key — coerced into {@link HsdV25Payload.decision_tree_text} at render time. */
    decision_tree?: unknown;
  }>;

const PAD_CORE =
  "This leads to longer runtimes, higher utility draw, and mechanical stress that turns a nuisance into a major repair when ignored.";
const PAD_RISK =
  "Ignoring the pattern forces coil stress, compressor overload, and typical repair costs of $1,500–$3,500 once major parts fail.";
const DEFAULT_CAUSE_ROW = {
  label: "Something earlier in the system (airflow, thermostat, or power)",
  probability: "Needs testing with tools",
  deep_dive:
    "When basics are uncertain, a licensed technician verifies airflow, temperatures, and electrical control before sealed-system work.",
};

/** Plain-language substitutions for stored model copy (renderer-only; no LLM). */
function simplifyReaderLanguage(text: string): string {
  let s = String(text ?? "");
  s = s.replace(/\bupstream load or control issue\b/gi, "Something earlier in the system (airflow, thermostat, or power)");
  s = s.replace(/\bupstream load\b/gi, "earlier system issue");
  s = s.replace(/\bcontrol issue\b/gi, "control problem");
  s = s.replace(/\brequires measurement\b/gi, "needs testing with tools");
  return s;
}

/** Collapse repeated sentences inside one paragraph (model sometimes echoes the same clause). */
function dedupeRepeatedSentencesInParagraph(s: string): string {
  const t = String(s ?? "").trim();
  if (!t) return "";
  const pieces = t.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  if (pieces.length <= 1) return t;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const sen of pieces) {
    const key = sen.replace(/\s+/g, " ").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(sen);
  }
  return out.join(" ");
}

/** Blank-line paragraphs: dedupe lines; first paragraph also drops duplicate sentences. */
function dedupeCoreTruthParagraphs(coreTruth: string): string {
  const raw = String(coreTruth ?? "");
  const parts = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return dedupeLines(raw.trim());
  return parts
    .map((p, i) => {
      let x = dedupeLines(p);
      if (i === 0) x = dedupeRepeatedSentencesInParagraph(x);
      return x;
    })
    .join("\n\n");
}

function dedupeTopCauseDeepdives(
  causes: HsdV25Payload["summary_30s"]["top_causes"]
): HsdV25Payload["summary_30s"]["top_causes"] {
  const seen = new Set<string>();
  return causes.map((c) => {
    const div = String(c.deep_dive ?? "").trim();
    const key = div.replace(/\s+/g, " ").toLowerCase();
    if (!key) return c;
    if (seen.has(key)) return { ...c, deep_dive: "" };
    seen.add(key);
    return c;
  });
}

function polishSummary30s(s: HsdV25Payload["summary_30s"]): HsdV25Payload["summary_30s"] {
  const topCauses = dedupeTopCauseDeepdives(
    s.top_causes.map((c) => ({
      ...c,
      label: simplifyReaderLanguage(c.label),
      probability: simplifyReaderLanguage(c.probability),
      deep_dive: simplifyReaderLanguage(dedupeLines(c.deep_dive)),
    }))
  );
  return {
    ...s,
    headline: simplifyReaderLanguage(dedupeRepeatedSentencesInParagraph(dedupeLines(s.headline))),
    core_truth: simplifyReaderLanguage(dedupeCoreTruthParagraphs(s.core_truth)),
    risk_warning: simplifyReaderLanguage(dedupeLines(s.risk_warning)),
    flow_lines: s.flow_lines.map((l) => simplifyReaderLanguage(String(l ?? "").trim())),
    top_causes: topCauses,
  };
}

function polishQuickChecks(rows: HsdV25Payload["quick_checks"]): HsdV25Payload["quick_checks"] {
  return rows.map((q) => ({
    check: simplifyReaderLanguage(String(q.check ?? "")),
    homeowner: simplifyReaderLanguage(dedupeLines(String(q.homeowner ?? ""))),
    result_meaning: simplifyReaderLanguage(dedupeLines(String(q.result_meaning ?? ""))),
    next_step: simplifyReaderLanguage(dedupeLines(String(q.next_step ?? ""))),
    risk: simplifyReaderLanguage(dedupeLines(String(q.risk ?? ""))),
  }));
}

/** Dedupe trimmed strings while preserving order (scan lines, tool lists, decision columns). */
function dedupeStringArray(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const t = String(s ?? "").trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function cityContextLinesFromUnknown(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return dedupeStringArray(raw.map((x) => String(x ?? ""))).map((l) => simplifyReaderLanguage(l));
}

/** Climate / market context — first surface inside the credibility header (above 30s summary). */
export function sectionCityContext(lines: string[]): string {
  const items = dedupeStringArray(lines.map((x) => String(x ?? "").trim()));
  if (!items.length) return "";
  const lis = items
    .map((line) => `<li class="leading-relaxed">${escapeHtml(line)}</li>`)
    .join("");
  return `
<section class="${HSD_V25_SECTION_SHELL}" data-hsd-zone="city-context" aria-label="Local climate and conditions">
  <h2 id="${hsdSectionDomId("city_context")}" class="hsd-section__title hsd-section-title text-base sm:text-lg">City context</h2>
  <div class="hsd-section__body">
    <ul class="m-0 list-disc space-y-2 pl-5 text-sm text-slate-800 dark:text-slate-200 sm:text-[0.9375rem]">${lis}</ul>
  </div>
</section>`.trim();
}

/** Prefer `decision_tree_text`; accept legacy `decision_tree` array or `{ lines }`-shaped blobs. */
function decisionTreeLinesFromInput(data: HsdV25RenderInput): string[] {
  const primary = data.decision_tree_text;
  if (Array.isArray(primary) && primary.some((x) => String(x ?? "").trim())) {
    return primary.map((x) => String(x ?? "").trim()).filter(Boolean);
  }
  const legacy = (data as Record<string, unknown>).decision_tree;
  if (Array.isArray(legacy)) {
    return legacy.map((x) => String(x ?? "").trim()).filter(Boolean);
  }
  if (legacy && typeof legacy === "object") {
    const o = legacy as Record<string, unknown>;
    const lines = o.lines ?? o.branches ?? o.entries;
    if (Array.isArray(lines)) {
      return lines.map((x) => String(x ?? "").trim()).filter(Boolean);
    }
  }
  return [];
}

/**
 * Bordered card surface for HSD sections below the hero header.
 * (Tailwind classes — `./src/**` must stay in `tailwind.config` content globs.)
 */
const HSD_V25_SURFACE =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6";
const HSD_V25_SECTION_SPACING = "mb-8 last:mb-0";
const HSD_V25_SECTION_SHELL = `hsd-section hsd-block ${HSD_V25_SURFACE} ${HSD_V25_SECTION_SPACING}`;
const HSD_V25_DECISION_SHELL = `hsd-section hsd-decision hsd-block ${HSD_V25_SURFACE} ${HSD_V25_SECTION_SPACING}`;
const HSD_V25_FINAL_SHELL = `hsd-section hsd-section--stop hsd-block ${HSD_V25_SURFACE} ${HSD_V25_SECTION_SPACING}`;
const HSD_V25_FIGURE_SHELL = `hsd-figure hsd-block ${HSD_V25_SURFACE} ${HSD_V25_SECTION_SPACING}`;
const HSD_V25_HEADER_SHELL = `hsd-cred ${HSD_V25_SURFACE} ${HSD_V25_SECTION_SPACING}`;

const HSD_V25_PAGE_OUTER =
  "hsd-v25-compose mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 text-slate-900 dark:text-slate-100";
/** Typography: explicit utilities inside sections; `prose` fights custom H2/list styling, so we use a neutral article shell. */
const HSD_V25_PAGE_ARTICLE = "hsd-v25-article max-w-none space-y-8 text-base leading-relaxed";

/** Wraps full-page HSD HTML for `/diagnose/*` and other bare `dangerouslySetInnerHTML` hosts. */
export function wrapHsdV25LayoutDocument(inner: string): string {
  const body = inner.trim();
  if (!body) return "";
  return `<div class="${HSD_V25_PAGE_OUTER}"><article class="${HSD_V25_PAGE_ARTICLE}">${body}</article></div>`;
}

/** Legacy pipelines sometimes stored `summary_30s` as a plain string; v2.5 expects an object. */
function summary30sFromUnknown(raw: unknown): HsdV25Payload["summary_30s"] {
  if (typeof raw === "string" || typeof raw === "number") {
    const blob = String(raw ?? "").trim();
    let headline = blob.slice(0, 160);
    if (headline.length < 50) {
      headline = `${headline} Start with filter, thermostat, and airflow before sealed-system work.`
        .trim()
        .slice(0, 200);
    }
    const core_truth = blob.length >= 70 ? blob : `${blob} ${PAD_CORE}`.trim().slice(0, 400);
    const risk_warning = PAD_RISK;
    return {
      headline,
      top_causes: [DEFAULT_CAUSE_ROW, { ...DEFAULT_CAUSE_ROW, label: "Electrical or control fault" }, { ...DEFAULT_CAUSE_ROW, label: "Component wear under load" }],
      core_truth,
      risk_warning,
      flow_lines: [],
    };
  }
  const baseS30 =
    raw && typeof raw === "object" ? { ...(raw as Record<string, unknown>) } : ({} as Record<string, unknown>);
  const top = Array.isArray(baseS30.top_causes) ? (baseS30.top_causes as HsdV25Payload["summary_30s"]["top_causes"]) : [];
  const causes =
    top.length >= 3
      ? top
      : [
          ...top,
          ...Array.from({ length: 3 - top.length }, () => ({ ...DEFAULT_CAUSE_ROW })),
        ].slice(0, 3);
  return {
    headline: String(baseS30.headline ?? "").trim() || "Diagnostic summary",
    top_causes: causes.map((c) => ({
      label: String((c as { label?: string }).label ?? "Cause"),
      probability: String((c as { probability?: string }).probability ?? "See technician"),
      deep_dive: String((c as { deep_dive?: string }).deep_dive ?? ""),
    })),
    core_truth: String(baseS30.core_truth ?? "").trim() || PAD_CORE,
    risk_warning: String(baseS30.risk_warning ?? "").trim() || PAD_RISK,
    flow_lines: dedupeStringArray(
      Array.isArray(baseS30.flow_lines) ? (baseS30.flow_lines as string[]).map((x) => String(x ?? "")) : []
    ),
  };
}

/** `cta` is a string in {@link HSDV25Schema}; older JSON may use objects (`cta_primary`, etc.). */
function ctaStringFromUnknown(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw == null) return "";
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const pick = (v: unknown) => String(v ?? "").trim();
    const nested = (k: string) => {
      const inner = o[k];
      return inner && typeof inner === "object" ? pick((inner as Record<string, unknown>).body ?? (inner as Record<string, unknown>).text) : "";
    };
    const direct =
      pick(o.body) ||
      pick(o.text) ||
      pick(o.message) ||
      pick(o.markdown) ||
      nested("cta_primary") ||
      nested("cta_secondary") ||
      nested("primary") ||
      nested("secondary");
    if (direct) return direct;
  }
  return String(raw ?? "").trim();
}

/** `final_warning` must be string-shaped for paragraph splitters. */
function stringFieldFromUnknown(raw: unknown): string {
  if (typeof raw === "string" || typeof raw === "number") return String(raw);
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const t = String(o.text ?? o.body ?? o.message ?? "").trim();
    if (t) return t;
  }
  return String(raw ?? "").trim();
}

/** `what_this_means` is a string in v2.5. */
function whatThisMeansFromUnknown(raw: unknown): string {
  if (typeof raw === "string" || typeof raw === "number") return String(raw);
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const t = String(o.text ?? o.body ?? "").trim();
    if (t) return t;
  }
  return "";
}

function mostCommonCauseFromUnknown(raw: unknown): HsdV25Payload["most_common_cause"] | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const row = {
    cause: String(o.cause ?? "").trim(),
    why: String(o.why ?? "").trim(),
    fix: String(o.fix ?? "").trim(),
    cost: String(o.cost ?? "").trim(),
  };
  if (!row.cause && !row.why && !row.fix && !row.cost) return undefined;
  return row;
}

function systemAgeLoadFromUnknown(raw: unknown): HsdV25Payload["system_age_load"] | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const summary = String(o.summary ?? "").trim();
  const rangesRaw = Array.isArray(o.ranges) ? o.ranges : [];
  const ranges = rangesRaw
    .map((r) => {
      if (!r || typeof r !== "object") return null;
      const row = r as Record<string, unknown>;
      return {
        age_range: String(row.age_range ?? "").trim(),
        likely_failure: String(row.likely_failure ?? "").trim(),
      };
    })
    .filter((x): x is { age_range: string; likely_failure: string } => Boolean(x && (x.age_range || x.likely_failure)));
  if (!summary && !ranges.length) return undefined;
  return { summary, ranges };
}

function codeUpdatesFromUnknown(raw: unknown): HsdV25Payload["code_updates"] | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const title = String(o.title ?? "").trim();
  const items = dedupeStringArray(
    Array.isArray(o.items) ? (o.items as unknown[]).map((x) => String(x ?? "").trim()) : []
  );
  if (!title && !items.length) return undefined;
  return { title: title || "Recent code & material changes", items };
}

function repairVsReplaceFromUnknown(raw: unknown): HsdV25Payload["repair_vs_replace"] | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const title = String(o.title ?? "").trim();
  const guidance = String(o.guidance ?? "").trim();
  const rules = dedupeStringArray(
    Array.isArray(o.rules) ? (o.rules as unknown[]).map((x) => String(x ?? "").trim()) : []
  );
  if (!guidance && !rules.length) return undefined;
  const out: HsdV25Payload["repair_vs_replace"] = { guidance, rules };
  if (title) out.title = title;
  return out;
}

function safeInternalHrefForUpgrade(raw: string): string | undefined {
  const h = String(raw ?? "").trim();
  if (!h) return undefined;
  if (!/^\/(hvac|plumbing|electrical)\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/i.test(h)) return undefined;
  return h.startsWith("/") ? h : `/${h}`;
}

function upgradePathsFromUnknown(raw: unknown): HsdV25Payload["upgrade_paths"] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const paths = raw
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as Record<string, unknown>;
      const title = String(o.title ?? "").trim();
      const description = String(o.description ?? "").trim();
      if (!title && !description) return null;
      const href = safeInternalHrefForUpgrade(String(o.href ?? "").trim());
      return href ? { title, description, href } : { title, description };
    })
    .filter((x): x is { title: string; description: string; href?: string } => Boolean(x));
  if (!paths.length) return undefined;
  return paths;
}

function commonMisdiagnosisFromUnknown(raw: unknown): HsdV25Payload["common_misdiagnosis"] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const lines = dedupeStringArray(raw.map((x) => String(x ?? "").trim()));
  if (!lines.length) return undefined;
  return lines;
}

/**
 * Ensures list-shaped fields are arrays before any `.map` in section builders, and normalizes a few
 * legacy JSON shapes (string `summary_30s`, string `diagnostic_flow`, object `cta`) so SSR never throws.
 *
 * **Contract note:** {@link HSDV25Schema} defines `summary_30s` as an **object**, `diagnostic_flow` as
 * **`{ nodes, edges }`**, and `cta` as a **string**. If a checklist says “summary_30s must be a string”,
 * that applies to other generators — not this renderer.
 */
function sanitizeHsdV25RenderInput(data: HsdV25RenderInput | Record<string, unknown>): HsdV25RenderInput {
  const raw = data as Record<string, unknown>;
  injectProgrammaticHsdCtas(raw);
  const slugForBreaker = String(raw.slug ?? "").trim();
  const s30Breaker = raw.summary_30s;
  if (s30Breaker && typeof s30Breaker === "object" && !Array.isArray(s30Breaker)) {
    applyBreakerKeepsTrippingMoneyToSummary30s(s30Breaker as Record<string, unknown>, slugForBreaker);
  }
  const slugForRepair = slugForBreaker;
  const loc = parseLocalizedStorageSlug(slugForRepair);
  if (loc?.vertical === "plumbing" && isLeeCountyCityStorageSlug(slugForRepair)) {
    const cc = Array.isArray(raw.cityContext) ? (raw.cityContext as unknown[]).map((x) => String(x ?? "")) : [];
    const joined = cc.join(" ");
    if (/\b(compressor|hvac|refrigerant|capacitor|cooling runtime|outdoor hvac)\b/i.test(joined)) {
      raw.cityContext = buildCityContextForLeeCountyCity(loc.citySlug, "plumbing");
    }
  }
  backfillLocalizedPlumbingAuthorityFields(raw);
  filterInternalLinksInPlace(raw);
  const summary_30s = polishSummary30s(summary30sFromUnknown(data.summary_30s as unknown));

  let diagnostic_flow: HsdV25Payload["diagnostic_flow"];
  const rawFlow = data.diagnostic_flow as unknown;
  if (typeof rawFlow === "string") {
    diagnostic_flow = { nodes: [], edges: [] };
  } else if (rawFlow && typeof rawFlow === "object") {
    const f = rawFlow as Record<string, unknown>;
    const nodes = Array.isArray(f.nodes) ? f.nodes : [];
    const edges = Array.isArray(f.edges) ? f.edges : [];
    diagnostic_flow = { nodes, edges } as HsdV25Payload["diagnostic_flow"];
  } else {
    diagnostic_flow = { nodes: [], edges: [] };
  }

  const rawDec = data.decision as unknown;
  const decision = (
    rawDec && typeof rawDec === "object"
      ? (() => {
          const d = rawDec as Record<string, unknown>;
          const list = (k: string, alt: string) => {
            const arr = (Array.isArray(d[k]) ? d[k] : Array.isArray(d[alt]) ? d[alt] : []) as unknown[];
            return arr.map((x) => String(x ?? "").trim()).filter(Boolean);
          };
          return {
            safe: list("safe", "safe_actions"),
            call_pro: list("call_pro", "callPro"),
            stop_now: list("stop_now", "stopNow"),
          };
        })()
      : { safe: [], call_pro: [], stop_now: [] }
  ) as HsdV25Payload["decision"];

  let cta = ctaStringFromUnknown(data.cta as unknown);
  if (cta.length < 45) {
    cta = `${cta} If problems persist after basic checks, contact a licensed technician for measured diagnosis and repair.`.trim();
  }

  let final_warning = stringFieldFromUnknown(data.final_warning as unknown);
  if (final_warning.length < 60) {
    final_warning = `${final_warning} ${PAD_RISK}`.trim();
  }

  cta = simplifyReaderLanguage(dedupeLines(cta));
  final_warning = simplifyReaderLanguage(dedupeLines(final_warning));

  const decision_tree_text = dedupeStringArray(decisionTreeLinesFromInput(data as HsdV25RenderInput)).map((l) =>
    simplifyReaderLanguage(l)
  );
  const canonical_truths = dedupeStringArray(
    Array.isArray(data.canonical_truths) ? (data.canonical_truths as unknown[]).map((x) => String(x ?? "")) : []
  )
    .slice(0, 2)
    .map((l) => simplifyReaderLanguage(l));
  const tools = dedupeStringArray(
    Array.isArray(data.tools) ? (data.tools as unknown[]).map((x) => String(x ?? "")) : []
  ).map((t) => simplifyReaderLanguage(t));

  const quick_checks = polishQuickChecks(
    Array.isArray(data.quick_checks) ? (data.quick_checks as HsdV25Payload["quick_checks"]) : []
  );

  const diagnostic_steps = Array.isArray(data.diagnostic_steps)
    ? (data.diagnostic_steps as HsdV25Payload["diagnostic_steps"]).map((s) => ({
        step: simplifyReaderLanguage(String(s.step ?? "")),
        homeowner: simplifyReaderLanguage(dedupeLines(String(s.homeowner ?? ""))),
        pro: simplifyReaderLanguage(dedupeLines(String(s.pro ?? ""))),
        risk: simplifyReaderLanguage(dedupeLines(String(s.risk ?? ""))),
      }))
    : [];

  const what_this_means = simplifyReaderLanguage(dedupeLines(whatThisMeansFromUnknown(data.what_this_means as unknown)));
  const repair_matrix_intro = simplifyReaderLanguage(dedupeLines(String(data.repair_matrix_intro ?? "")));
  const decision_footer = simplifyReaderLanguage(dedupeLines(String(data.decision_footer ?? "")));

  const ctas = normalizeCtasOnJson(data as Record<string, unknown>).map((c) => ({
    type: c.type,
    text: simplifyReaderLanguage(dedupeLines(c.text)),
  }));

  const cityContext = cityContextLinesFromUnknown((data as Record<string, unknown>).cityContext);
  const rawTop = data as Record<string, unknown>;
  const most_common_cause = mostCommonCauseFromUnknown(rawTop.most_common_cause);
  const system_age_load = systemAgeLoadFromUnknown(rawTop.system_age_load);
  const code_updates = codeUpdatesFromUnknown(rawTop.code_updates);
  const repair_vs_replace = repairVsReplaceFromUnknown(rawTop.repair_vs_replace);
  const upgrade_paths = upgradePathsFromUnknown(rawTop.upgrade_paths);
  const common_misdiagnosis = commonMisdiagnosisFromUnknown(rawTop.common_misdiagnosis);

  return {
    ...data,
    title: stripCostBandsFromTitle(String(data.title ?? "")),
    cityContext,
    summary_30s,
    what_this_means,
    quick_checks,
    diagnostic_steps,
    quick_table: Array.isArray(data.quick_table) ? data.quick_table : [],
    decision_tree_text,
    canonical_truths,
    tools,
    diagnostic_flow,
    repair_matrix: Array.isArray(data.repair_matrix) ? data.repair_matrix : [],
    cost_escalation: Array.isArray(data.cost_escalation) ? data.cost_escalation : [],
    repair_matrix_intro,
    decision_footer,
    decision: {
      safe: dedupeStringArray(decision.safe).map((l) => simplifyReaderLanguage(l)),
      call_pro: dedupeStringArray(decision.call_pro).map((l) => simplifyReaderLanguage(l)),
      stop_now: dedupeStringArray(decision.stop_now).map((l) => simplifyReaderLanguage(l)),
    },
    cta,
    final_warning,
    ctas,
    most_common_cause,
    system_age_load,
    code_updates,
    repair_vs_replace,
    upgrade_paths,
    common_misdiagnosis,
  } as HsdV25RenderInput;
}

/** Lower `priority` renders earlier (after the fixed credibility header). */
export const HSD_V25_BLOCK_PRIORITY = {
  diagnostic_steps: 10,
  decision_tree_text: 12,
  quick_table: 15,
  tools: 17,
  visual_diagnostic_flow: 20,
  /** JSON `ctas` with `type: "danger"` — after visual flow, before {@link sectionRepairMatrix}. */
  cta_danger_before_repair: 25,
  top_causes: 27,
  common_misdiagnosis: 28,
  repair_matrix: 30,
  system_age_load: 34,
  code_updates: 36,
  repair_vs_replace: 38,
  upgrade_paths: 40,
  decision: 100,
  cta: 200,
  final_warning: 300,
} as const;

export type HsdV25HtmlBlock = { priority: number; html: string };

export function joinSortedHsdV25Blocks(blocks: HsdV25HtmlBlock[]): string {
  return [...blocks]
    .filter((b) => b.html.trim().length > 0)
    .sort((a, b) => a.priority - b.priority)
    .map((b) => b.html)
    .join("\n");
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hrefForInternalRelatedPath(pathRaw: string, vertical: string): string {
  const path = String(pathRaw ?? "").trim().replace(/^\/+/, "");
  if (!path) return "";
  if (/^(hvac|plumbing|electrical)\//i.test(path)) return `/${path}`;
  if (path.startsWith("repair/")) return `/${path}`;
  return `/${vertical}/${path}`;
}

/** Optional footer links when `internal_links.related_symptoms` is present on stored JSON. */
export function sectionInternalRelatedLinks(data: HsdV25RenderInput): string {
  const raw = (data as Record<string, unknown>).internal_links;
  if (!raw || typeof raw !== "object") return "";
  const il = raw as Record<string, unknown>;
  const rel = il.related_symptoms ?? il.relatedSymptoms;
  if (!Array.isArray(rel) || !rel.length) return "";
  const vertical = String(data.vertical ?? "hvac").trim().toLowerCase() || "hvac";
  const city = String(data.city ?? "").trim();
  const title =
    vertical === "hvac"
      ? `Related HVAC issues${city ? ` in ${city}` : ""}`
      : `Related ${vertical} issues${city ? ` in ${city}` : ""}`;
  const relPaths = filterTierDiscoveryPaths(rel.map((x) => String(x ?? "").trim()));
  const lis = relPaths
    .map((path) => {
      if (!path) return "";
      const href = hrefForInternalRelatedPath(path, vertical);
      if (!href) return "";
      const tail = path.replace(/^\/+/, "").split("/").filter(Boolean).pop() ?? path;
      const display = tail.replace(/-/g, " ");
      return `<li class="mb-2 last:mb-0"><a href="${escapeHtml(href)}" class="font-semibold text-hvac-blue underline decoration-hvac-blue/40 underline-offset-2 hover:text-hvac-gold dark:text-hvac-gold">${escapeHtml(display)}</a></li>`;
    })
    .filter(Boolean)
    .join("");
  if (!lis) return "";
  return `
<section class="${HSD_V25_SECTION_SHELL} hsd-internal-related" aria-labelledby="hsd-internal-related-label">
  <h2 id="hsd-internal-related-label" class="hsd-section__title hsd-section-title">${escapeHtml(title)}</h2>
  <ul class="m-0 list-none p-0">${lis}</ul>
</section>`.trim();
}

/** Strip low-value scan meta the model sometimes appends to the summary H2 or flow lines. */
function stripThirtySecondReadMeta(s: string): string {
  return String(s ?? "")
    .replace(/\s*[\u2014\u2013\-]\s*30[-\s]?second\s+read\b/gi, "")
    .replace(/\(\s*30[-\s]?second\s+read\s*\)/gi, "")
    .replace(/\b30[-\s]?second\s+read\b[.:;\s]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function hasCanonicalTruthLines(truths: HsdV25Payload["canonical_truths"] | undefined): boolean {
  return (truths ?? []).some((t) => String(t).trim().length > 0);
}

/** Multi-paragraph body fields (blank-line separated). */
function summaryCoreTruthParagraphsHtml(coreTruth: string, pClass: string): string {
  return String(coreTruth ?? "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="${pClass}">${escapeHtml(p)}</p>`)
    .join("");
}

/** Split on blank lines for `final_warning` / `cta` (JSON may use \\n\\n between paragraphs). */
function bodyParagraphsHtml(s: string, pClass: string): string {
  return String(s ?? "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="${pClass}">${escapeHtml(p)}</p>`)
    .join("");
}

const PLACEMENT_CTA_SURFACE: Record<HsdCtaType, string> = {
  top: "bg-blue-600 text-white",
  mid: "bg-yellow-500 text-slate-900",
  danger: "bg-red-600 text-white",
  final: "bg-black text-white",
};

const PLACEMENT_CTA_BTN: Record<HsdCtaType, string> = {
  top: "inline-block mt-4 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100",
  mid: "inline-block mt-4 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800",
  danger: "inline-block mt-4 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100",
  final: "inline-block mt-4 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-slate-100",
};

function hsdPageVertical(data: HsdV25RenderInput): string {
  return String(data.vertical ?? "").trim().toLowerCase() || "hvac";
}

function placementCtaButtonLabel(vertical: string): string {
  const v = vertical.toLowerCase();
  if (v === "plumbing") return "Urgent: book a licensed plumber";
  if (v === "electrical") return "Stop the risk — connect with a local electrician now";
  if (v === "hvac") return "Urgent: book HVAC service now";
  return "Urgent: book professional help now";
}

function placementCtaOpenLeadOnclickAttr(vertical: string): string {
  const v = vertical.toLowerCase();
  if (v === "plumbing" || v === "electrical") {
    return `onclick="try{window.dispatchEvent(new CustomEvent('open-leadcard',{detail:{issue:'not_sure'}}))}catch(e){}"`;
  }
  return `onclick="try{window.dispatchEvent(new CustomEvent('open-leadcard'))}catch(e){}"`;
}

function isRenderablePlacementCtaType(t: string): t is HsdCtaType {
  return t === "top" || t === "mid" || t === "danger" || t === "final";
}

/** Renders all `data.ctas` entries matching any of `types` (JSON-driven placement). */
function renderCtasByTypes(data: HsdV25RenderInput, types: readonly HsdCtaType[], domIdForFinal?: string): string {
  const set = new Set(types);
  const vertical = hsdPageVertical(data);
  const rows = (data.ctas ?? []).filter(
    (c): c is HsdCtaEntry =>
      Boolean(c?.text) && isRenderablePlacementCtaType(String(c.type)) && set.has(c.type as HsdCtaType)
  );
  return rows
    .map((c) =>
      c.type === "final" && domIdForFinal
        ? sectionPlacementCta(c.type, c.text, domIdForFinal, vertical)
        : sectionPlacementCta(c.type, c.text, undefined, vertical)
    )
    .join("\n");
}

function buildFinalCtaHtml(data: HsdV25RenderInput): string {
  const fromJson = renderCtasByTypes(data, ["final"], hsdSectionDomId("cta")).trim();
  if (fromJson) return fromJson;
  return sectionPlacementCta("final", data.cta, hsdSectionDomId("cta"), hsdPageVertical(data));
}

/**
 * Strong inline CTAs (placement variants). Mirrors product `CTA` React component styling in static HTML.
 */
export function sectionPlacementCta(
  variant: HsdCtaType,
  text: string,
  domId?: string,
  vertical: string = "hvac"
): string {
  const t = String(text ?? "").trim();
  if (!t) return "";
  const pClass =
    variant === "mid"
      ? "text-lg font-semibold leading-snug text-slate-900"
      : "text-lg font-semibold leading-snug text-white";
  const paras = bodyParagraphsHtml(t, pClass);
  const surface = PLACEMENT_CTA_SURFACE[variant];
  const btn = PLACEMENT_CTA_BTN[variant];
  const safeId = domId ? String(domId).replace(/["'<>]/g, "") : "";
  const idAttr = safeId ? ` id="${safeId}"` : "";
  const kicker =
    variant === "final"
      ? `<p class="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">Next step</p>`
      : "";
  /** Opens LeadCard in DiagnosticModal via the global `open-leadcard` event. */
  const openLeadOnclick = placementCtaOpenLeadOnclickAttr(vertical);
  const btnLabel = escapeHtml(placementCtaButtonLabel(vertical));
  return `<aside class="hsd-placement-cta not-prose hsd-block mt-6 rounded-xl p-6 shadow-md ${surface}"${idAttr} data-hsd-cta-placement="${variant}" data-hsd-vertical="${escapeHtml(vertical)}" aria-label="Call to action">
  ${kicker}
  ${paras}
  <button type="button" ${openLeadOnclick} class="${btn} cursor-pointer border-0 text-center" aria-haspopup="dialog">${btnLabel}</button>
</aside>`.trim();
}

/** Prefix → for DG flow lines when the model omitted the glyph. */
function dgArrowLine(s: string): string {
  const t = String(s ?? "").trim();
  if (!t) return "";
  if (/^(?:→|->)\s*/.test(t)) return t;
  return `→ ${t}`;
}

function decisionFailureHook(vertical: string | undefined): string {
  const v = String(vertical ?? "").trim().toLowerCase();
  if (v === "hvac") return "→ This is how compressors fail.";
  if (v === "plumbing") return "→ This is how small leaks become major damage.";
  if (v === "electrical") return "→ This is how arc faults and panel damage start.";
  return "→ This is how minor issues become major failures.";
}

/** Canonical truths: **max 2** on page — after Quick checks scan table, then before Decision. */
function canonicalTruthsEchoHtml(
  truths: HsdV25Payload["canonical_truths"] | undefined,
  variant: "quick_diagnosis" | "pre_decision"
): string {
  const lines = (truths ?? []).map((t) => String(t).trim()).filter(Boolean).slice(0, 2);
  if (!lines.length) return "";
  const lis = lines.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
  const mod =
    variant === "quick_diagnosis"
      ? "mt-4 border-t border-slate-200 pt-4 dark:border-slate-600"
      : "mb-2 border-t border-slate-200 pt-4 dark:border-slate-600";
  return `<div class="hsd-canonical-echo ${mod}" role="note" aria-label="Core truths">
  <div class="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Core truths</div>
  <ul class="mt-1.5 list-none space-y-1.5 p-0 text-sm font-semibold leading-snug text-slate-800 dark:text-slate-200">${lis}</ul>
</div>`;
}

function subhead(data: HsdV25RenderInput): string {
  const city = String(data.city ?? "").trim();
  const sym = String(data.symptom ?? "").trim();
  const v = String(data.vertical ?? "").trim().toUpperCase();
  if (city && sym) return `${v ? `${v} · ` : ""}${city} — ${sym}`;
  if (city) return `${v ? `${v} · ` : ""}${city}`;
  return v || "";
}

/** Expert bridge after the 30-second summary (diagnosis → physics → wear). Omitted when empty (legacy rows). */
export function sectionWhatThisMeans(text: string | undefined): string {
  const body = String(text ?? "").trim();
  if (!body) return "";
  const paras = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const escaped = escapeHtml(p);
      const cls =
        p.includes("\n") || p.includes("•")
          ? "hsd-what-means__body m-0 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line"
          : "hsd-what-means__body m-0 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200";
      return `<p class="${cls}">${escaped}</p>`;
    })
    .join("");
  return `
<section class="hsd-block hsd-what-means my-6 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-5 dark:border-slate-600 dark:bg-slate-900/40" aria-labelledby="hsd-what-means-label">
  <h2 id="hsd-what-means-label" class="text-base font-black uppercase tracking-wide text-slate-800 dark:text-slate-100">What this means</h2>
  <div class="mt-2 space-y-2">${paras}</div>
</section>`.trim();
}

function topCausesListMarkup(summary_30s: HsdV25Payload["summary_30s"], useDgFlow: boolean): string {
  const causesFull = summary_30s.top_causes
    .map((c) => {
      const deep = String(c.deep_dive ?? "").trim();
      const diveBlock =
        deep.length > 0
          ? `<div class="hsd-cause-deep-dive mt-2 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">${escapeHtml(deep)}</div>`
          : "";
      return `<li class="hsd-block">
  <div><span class="hsd-cause">${escapeHtml(c.label)}</span> — <span class="hsd-probability">${escapeHtml(c.probability)}</span></div>${diveBlock}
</li>`;
    })
    .join("");

  const causesCompact = summary_30s.top_causes
    .map(
      (c) => `<li class="hsd-block text-sm leading-snug text-slate-700 dark:text-slate-300">
  <span class="font-semibold text-slate-900 dark:text-white">${escapeHtml(c.label)}</span> — ${escapeHtml(c.probability)}
</li>`
    )
    .join("");

  return useDgFlow
    ? `<ul class="hsd-v2__causes mt-3 list-none space-y-1 p-0">${causesCompact}</ul>`
    : `<ul class="hsd-v2__causes">${causesFull}</ul>`;
}

/** Headline + scan lines + core truth + risk (top causes render separately in the mid stack). */
export function sectionFieldTriage(
  summary_30s: HsdV25Payload["summary_30s"],
  canonicalTruths?: HsdV25Payload["canonical_truths"],
  slug?: string
): string {
  const omitSummaryCoreTruth = hasCanonicalTruthLines(canonicalTruths);
  const pureTriageNoHotWater = Boolean(slug && isPlumbingNoHotWaterSlug(slug));
  const flow = (summary_30s.flow_lines ?? [])
    .map((s) => stripThirtySecondReadMeta(String(s).trim()))
    .filter(Boolean)
    .filter((s) => !/^30[-\s]?second\s+read$/i.test(s));
  const useDgFlow = flow.length >= 4;

  const coreTruthClass = "m-0 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200";
  const coreTruthBody =
    omitSummaryCoreTruth || pureTriageNoHotWater
      ? ""
      : summaryCoreTruthParagraphsHtml(summary_30s.core_truth, coreTruthClass);
  const dgFlowShell = `<div class="hsd-dg-flow mt-3 rounded-md border border-slate-200 bg-white/80 px-3 py-3 font-mono text-[13px] leading-relaxed text-slate-900 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100" role="group" aria-label="Scan branches">${flow.map((line) => `<div class="hsd-dg-flow-line">${escapeHtml(line)}</div>`).join("")}</div>`;
  const coreTruthShell = coreTruthBody
    ? useDgFlow
      ? `<div class="hsd-cred__summary-core mt-3 space-y-2">${coreTruthBody}</div>`
      : `<div class="hsd-cred__summary-body hsd-summary space-y-2 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">${coreTruthBody}</div>`
    : "";
  const flowBlock =
    useDgFlow && coreTruthShell
      ? `${dgFlowShell}
  ${coreTruthShell}`
      : useDgFlow
        ? dgFlowShell + coreTruthShell
        : coreTruthShell;
  const headlineDisplay = stripThirtySecondReadMeta(String(summary_30s.headline ?? ""));

  return `
<section class="hsd-cred__summary hsd-block" id="${hsdSectionDomId("summary_30s")}" aria-labelledby="hsd-30s-label">
  <p class="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Field triage</p>
  <h2 id="hsd-30s-label" class="hsd-cred__summary-head text-xl font-black leading-tight text-slate-900 dark:text-white">${escapeHtml(headlineDisplay)}</h2>
  ${flowBlock}
  <p class="hsd-v2__risk hsd-risk mt-4 text-sm font-semibold leading-relaxed text-slate-900 dark:text-slate-100" role="alert">${escapeHtml(summary_30s.risk_warning)}</p>
</section>`.trim();
}

function breakerTrippingTopCausesHeading(slug: string | undefined): string | null {
  const s = String(slug ?? "")
    .trim()
    .replace(/^\/+/, "")
    .toLowerCase();
  if (!s.includes("breaker-keeps-tripping")) return null;
  const parts = s.split("/").filter(Boolean);
  const seg = parts[2];
  const place = seg ? formatCityPathSegmentForDisplay(seg) : "Local";
  return `Top reasons breakers keep tripping in ${place} homes:`;
}

/** Ranked causes from `summary_30s.top_causes` (placed after diagnostic flow in the mid stack). */
export function sectionTopCauses(summary_30s: HsdV25Payload["summary_30s"], slug?: string): string {
  const flow = (summary_30s.flow_lines ?? [])
    .map((s) => stripThirtySecondReadMeta(String(s).trim()))
    .filter(Boolean)
    .filter((s) => !/^30[-\s]?second\s+read$/i.test(s));
  const useDgFlow = flow.length >= 4;
  const causesBlock = topCausesListMarkup(summary_30s, useDgFlow);
  if (!causesBlock.trim()) return "";
  const h2 = breakerTrippingTopCausesHeading(slug) ?? "Top causes";
  return `
<section class="${HSD_V25_SECTION_SHELL}" id="${hsdSectionDomId("top_causes")}" aria-labelledby="hsd-top-causes-label">
  <h2 id="hsd-top-causes-label" class="hsd-section__title hsd-section-title">${escapeHtml(h2)}</h2>
  <div class="hsd-section__body">${causesBlock}</div>
</section>`.trim();
}

export function sectionMostCommonCause(row: HsdV25Payload["most_common_cause"] | undefined): string {
  if (!row) return "";
  const cause = String(row.cause ?? "").trim();
  const why = String(row.why ?? "").trim();
  const fix = String(row.fix ?? "").trim();
  const cost = String(row.cost ?? "").trim();
  if (!cause && !why && !fix && !cost) return "";
  const rows = [
    ["Most likely cause", cause],
    ["Why this happens", why],
    ["Fix path", fix],
    ["Typical cost band", cost],
  ]
    .filter(([, v]) => v.length > 0)
    .map(
      ([k, v]) =>
        `<div class="border-b border-slate-200 py-3 last:border-b-0 dark:border-slate-600">
  <div class="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">${escapeHtml(String(k))}</div>
  <p class="mt-1 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">${escapeHtml(String(v))}</p>
</div>`
    )
    .join("");
  return `
<section class="${HSD_V25_SECTION_SHELL}" id="${hsdSectionDomId("most_common_cause")}" aria-labelledby="hsd-most-common-label">
  <h2 id="hsd-most-common-label" class="hsd-section__title hsd-section-title">Most common cause</h2>
  <div class="hsd-section__body">${rows}</div>
</section>`.trim();
}

export function sectionCommonMisdiagnosis(lines: HsdV25Payload["common_misdiagnosis"] | undefined): string {
  const raw = (lines ?? []).map((l) => String(l ?? "").trim()).filter(Boolean);
  if (!raw.length) return "";
  const whyIdx = raw.findIndex((l) => /^why it matters:/i.test(l));
  const bullets = whyIdx >= 0 ? raw.slice(0, whyIdx) : raw;
  const whyLine = whyIdx >= 0 ? raw[whyIdx] : "";
  const lis = bullets.map((t) => `<li class="leading-relaxed">${escapeHtml(t)}</li>`).join("");
  const whyBlock = whyLine
    ? `<p class="mt-4 text-sm font-semibold leading-relaxed text-slate-900 dark:text-slate-100">${escapeHtml(whyLine)}</p>`
    : "";
  return `
<section class="${HSD_V25_SECTION_SHELL}" id="${hsdSectionDomId("common_misdiagnosis")}" aria-labelledby="hsd-misdx-label">
  <h2 id="hsd-misdx-label" class="hsd-section__title hsd-section-title">Common misdiagnosis</h2>
  <div class="hsd-section__body">
    <ul class="m-0 list-disc space-y-2 pl-5 text-sm text-slate-800 dark:text-slate-200 sm:text-[0.9375rem]">${lis}</ul>
    ${whyBlock}
  </div>
</section>`.trim();
}

export function sectionSystemAgeLoad(block: HsdV25Payload["system_age_load"] | undefined): string {
  if (!block) return "";
  const summary = String(block.summary ?? "").trim();
  const ranges = (block.ranges ?? [])
    .map((r) => ({
      age_range: String(r.age_range ?? "").trim(),
      likely_failure: String(r.likely_failure ?? "").trim(),
    }))
    .filter((r) => r.age_range || r.likely_failure);
  if (!summary && !ranges.length) return "";
  const rangeRows = ranges
    .map(
      (r) => `<tr class="border-t border-slate-200 dark:border-slate-600">
  <td class="p-3 text-sm font-semibold text-slate-900 dark:text-white">${escapeHtml(r.age_range)}</td>
  <td class="p-3 text-sm text-slate-800 dark:text-slate-200">${escapeHtml(r.likely_failure)}</td>
</tr>`
    )
    .join("");
  const table =
    rangeRows.length > 0
      ? `<div class="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-600">
  <table class="w-full border-collapse text-left text-sm">
    <thead class="bg-slate-100 dark:bg-slate-800">
      <tr>
        <th class="p-3 font-semibold text-slate-900 dark:text-slate-100" scope="col">Age band</th>
        <th class="p-3 font-semibold text-slate-900 dark:text-slate-100" scope="col">Likely failure under load</th>
      </tr>
    </thead>
    <tbody>${rangeRows}</tbody>
  </table>
</div>`
      : "";
  const lead = summary ? `<p class="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">${escapeHtml(summary)}</p>` : "";
  return `
<section class="${HSD_V25_SECTION_SHELL}" id="${hsdSectionDomId("system_age_load")}" aria-labelledby="hsd-age-load-label">
  <h2 id="hsd-age-load-label" class="hsd-section__title hsd-section-title">System age &amp; load</h2>
  <div class="hsd-section__body">${lead}${table}</div>
</section>`.trim();
}

export function sectionCodeUpdates(block: HsdV25Payload["code_updates"] | undefined): string {
  if (!block) return "";
  const title = String(block.title ?? "").trim() || "Recent code & material changes";
  const items = dedupeStringArray((block.items ?? []).map((x) => String(x ?? "").trim()));
  if (!items.length) return "";
  const lis = items.map((t) => `<li class="leading-relaxed">${escapeHtml(t)}</li>`).join("");
  return `
<section class="${HSD_V25_SECTION_SHELL}" id="${hsdSectionDomId("code_updates")}" aria-labelledby="hsd-code-updates-label">
  <h2 id="hsd-code-updates-label" class="hsd-section__title hsd-section-title">${escapeHtml(title)}</h2>
  <div class="hsd-section__body">
    <ul class="m-0 list-disc space-y-2 pl-5 text-sm text-slate-800 dark:text-slate-200 sm:text-[0.9375rem]">${lis}</ul>
  </div>
</section>`.trim();
}

export function sectionRepairVsReplace(block: HsdV25Payload["repair_vs_replace"] | undefined): string {
  if (!block) return "";
  const heading = String(block.title ?? "").trim() || "Repair vs replace";
  const guidance = String(block.guidance ?? "").trim();
  const rules = dedupeStringArray((block.rules ?? []).map((x) => String(x ?? "").trim()));
  if (!guidance && !rules.length) return "";
  const guideParas = guidance
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const escaped = escapeHtml(p);
      const cls =
        p.includes("\n") || p.includes("•")
          ? "text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line"
          : "text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200";
      return `<p class="${cls}">${escaped}</p>`;
    })
    .join("");
  const guideBlock = guideParas ? guideParas : "";
  const ruleLis = rules.map((t) => `<li class="leading-relaxed">${escapeHtml(t)}</li>`).join("");
  const rulesBlock = ruleLis
    ? `<ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-800 dark:text-slate-200 sm:text-[0.9375rem]">${ruleLis}</ul>`
    : "";
  return `
<section class="${HSD_V25_SECTION_SHELL}" id="${hsdSectionDomId("repair_vs_replace")}" aria-labelledby="hsd-rvr-label">
  <h2 id="hsd-rvr-label" class="hsd-section__title hsd-section-title">${escapeHtml(heading)}</h2>
  <div class="hsd-section__body">${guideBlock}${rulesBlock}</div>
</section>`.trim();
}

export function sectionUpgradePaths(paths: HsdV25Payload["upgrade_paths"] | undefined): string {
  if (!paths?.length) return "";
  const cards = paths
    .map((p) => {
      const title = String(p.title ?? "").trim();
      const description = String(p.description ?? "").trim();
      if (!title && !description) return "";
      const href = safeInternalHrefForUpgrade(String((p as { href?: string }).href ?? "").trim());
      const titleHtml = href
        ? `<a href="${escapeHtml(href)}" class="text-hvac-blue underline decoration-hvac-blue/40 underline-offset-2 hover:text-hvac-gold dark:text-hvac-gold">${escapeHtml(title)}</a>`
        : escapeHtml(title);
      return `<li class="min-w-0 list-none">
  <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-950/40 sm:p-6">
    <h3 class="text-base font-bold text-slate-900 dark:text-white">${titleHtml}</h3>
    <p class="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">${escapeHtml(description)}</p>
  </div>
</li>`;
    })
    .filter(Boolean)
    .join("");
  if (!cards.trim()) return "";
  return `
<section class="${HSD_V25_SECTION_SHELL}" id="${hsdSectionDomId("upgrade_paths")}" aria-labelledby="hsd-upgrade-label">
  <h2 id="hsd-upgrade-label" class="hsd-section__title hsd-section-title">Upgrade paths</h2>
  <div class="hsd-section__body">
    <ul class="grid list-none gap-6 p-0 sm:grid-cols-2">${cards}</ul>
  </div>
</section>`.trim();
}

/** @deprecated Use {@link sectionFieldTriage}; kept for barrel compatibility. */
export const sectionSummary = sectionFieldTriage;

/** Optional callout: same lines the author weaves into summary, steps, and final_warning (repetition). */
export function sectionCanonicalTruths(truths: HsdV25Payload["canonical_truths"]): string {
  const lines = (truths ?? []).map((t) => String(t).trim()).filter(Boolean).slice(0, 2);
  if (!lines.length) return "";
  const items = lines.map((t) => `<li class="hsd-key-truth-line">${escapeHtml(t)}</li>`).join("");
  return `<div class="hsd-key-truths hsd-block my-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 dark:border-amber-900/50 dark:bg-amber-950/30" role="note" aria-label="Core truths">
  <div class="text-[11px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-200">Core truths</div>
  <ul class="mt-2 list-none space-y-2 p-0 text-sm font-semibold leading-snug text-amber-950 dark:text-amber-50">${items}</ul>
</div>`.trim();
}

function quickChecksStartHereHtml(vertical: string, slug?: string): string {
  if (slug && isPlumbingNoHotWaterSlug(slug)) {
    return "";
  }
  const v = vertical.toLowerCase();
  if (v === "plumbing") {
    return `<div class="mb-4 rounded-xl border-l-4 border-hvac-blue bg-blue-50 p-3 dark:border-hvac-gold dark:bg-slate-900/60">
  <strong class="text-slate-900 dark:text-white">Start here:</strong>
  <p class="mt-1.5 text-sm leading-snug text-slate-700 dark:text-slate-300">Main shutoff + quick leak scan at fixtures. Safe drain checks only—no chemicals. Spreading leak, pressure crash, or sewage back-up → plumber.</p>
</div>`;
  }
  if (v === "electrical") {
    return `<div class="mb-4 rounded-xl border-l-4 border-hvac-blue bg-blue-50 p-3 dark:border-hvac-gold dark:bg-slate-900/60">
  <strong class="text-slate-900 dark:text-white">Start here:</strong>
  <p class="mt-1.5 text-sm leading-snug text-slate-700 dark:text-slate-300">Whole house vs one circuit. Reset identified GFCI once; reset one breaker once—no repeat hammering. Re-trip, heat/ozone, or weird voltage → stop; electrician.</p>
</div>`;
  }
  return `<div class="mb-4 rounded-xl border-l-4 border-hvac-blue bg-blue-50 p-3 dark:border-hvac-gold dark:bg-slate-900/60">
  <strong class="text-slate-900 dark:text-white">Start here:</strong>
  <p class="mt-1.5 text-sm leading-snug text-slate-700 dark:text-slate-300">Thermostat, filter, register airflow first—most issues start on the house side. Clean there → look at controls, charge, compressor.</p>
</div>`;
}

function quickChecksRunOrderLine(vertical: string, slug?: string): string {
  if (slug && isPlumbingNoHotWaterSlug(slug)) {
    return "Run top to bottom. Tank leak, gas smell, or you cannot verify power safely → stop; call a plumber.";
  }
  const v = vertical.toLowerCase();
  if (v === "plumbing") {
    return "Run in order. Uncontrolled leak, pressure loss, or sewage backup → urgent plumber.";
  }
  if (v === "electrical") {
    return "Run in order when safe. Repeat trips, sparks, or burning smell → stop; electrician.";
  }
  return "Run in order. No comfort after this pass → beyond DIY-only.";
}

export function sectionQuickChecks(
  quick_checks: HsdV25Payload["quick_checks"],
  _canonicalTruths?: HsdV25Payload["canonical_truths"],
  vertical: string = "hvac",
  slug?: string
): string {
  const startHere = quickChecksStartHereHtml(vertical, slug);
  const runOrderLine = escapeHtml(quickChecksRunOrderLine(vertical, slug));
  const cards = quick_checks
    .map((q) => {
      const home = String(q.homeowner ?? "").trim();
      const homeLine = home
        ? `<p class="mt-1 text-xs font-medium leading-snug text-slate-500 dark:text-slate-400">${escapeHtml(dgArrowLine(home))}</p>`
        : "";
      return `<div class="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-600 dark:bg-slate-950/40" role="listitem">
  <p class="break-words font-semibold text-slate-900 dark:text-white">${escapeHtml(String(q.check ?? "").trim())}</p>
  ${homeLine}
  <p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400"><strong class="text-slate-800 dark:text-slate-200">What it means:</strong> ${escapeHtml(String(q.result_meaning ?? "").trim())}</p>
  <p class="mt-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200"><strong>Next:</strong> ${escapeHtml(String(q.next_step ?? "").trim())}</p>
  <p class="mt-3 text-sm font-medium leading-relaxed text-red-700 dark:text-red-300">${escapeHtml(String(q.risk ?? "").trim())}</p>
</div>`;
    })
    .join("\n");
  return `
<section class="hsd-cred__quick hsd-block" id="${hsdSectionDomId("quick_checks")}" aria-labelledby="hsd-quick-label">
  <h2 id="hsd-quick-label" class="hsd-cred__quick-head">Quick checks <span class="text-base font-semibold normal-case text-slate-600 dark:text-slate-400">(Do this first)</span></h2>
  ${startHere}
  <p class="mb-3 text-sm font-semibold leading-snug text-slate-800 dark:text-slate-200">${runOrderLine}</p>
  <div class="grid list-none gap-6 p-0 sm:gap-8 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3" role="list">${cards}</div>
</section>`.trim();
}

export function sectionDiagnosticSteps(
  diagnostic_steps: HsdV25Payload["diagnostic_steps"],
  _canonicalTruths?: HsdV25Payload["canonical_truths"],
  slug?: string
): string {
  const checklistIntro =
    slug && isPlumbingNoHotWaterSlug(slug)
      ? "Execution only: IF gates below—no narrative, no “technician will…” lines in pro/risk."
      : "Follow the physical branch in order. Do not treat a control problem like a refrigerant problem, and do not treat a refrigerant problem like an airflow problem.";
  const items = diagnostic_steps
    .map((s) => {
      const lines = [s.homeowner, s.pro, s.risk]
        .map((x) => dgArrowLine(String(x ?? "")))
        .filter(Boolean)
        .map((line) => `<div class="text-sm leading-relaxed text-slate-800 dark:text-slate-200">${escapeHtml(line)}</div>`)
        .join("");
      return `<li class="hsd-block">
  <div class="text-base font-bold text-slate-900 dark:text-white">${escapeHtml(s.step)}</div>
  <div class="hsd-dg-step-flow mt-2 space-y-1 border-l-2 border-hvac-blue/50 pl-3 dark:border-hvac-gold/50">${lines}</div>
</li>`;
    })
    .join("");
  return `
<section class="${HSD_V25_SECTION_SHELL}">
  <h2 id="${hsdSectionDomId("diagnostic_steps")}" class="hsd-section__title hsd-section-title">Diagnostic flow <span class="text-sm font-semibold normal-case text-slate-600 dark:text-slate-400">(Pro-level evaluation)</span></h2>
  <div class="hsd-section__body">
    <p class="mb-4 text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200">${escapeHtml(checklistIntro)}</p>
    <ol class="hsd-v2__logic space-y-6">${items}</ol>
  </div>
</section>`.trim();
}

/**
 * Text-only decision tree. Each string may use → or -> between segments; first segment is the question line.
 */
export function sectionDecisionTreeText(lines: HsdV25Payload["decision_tree_text"]): string {
  const raw = (lines ?? []).map((l) => String(l).trim()).filter(Boolean);
  if (!raw.length) return "";
  const blocks = raw
    .map((line) => {
      const parts = line.split(/\s*(?:→|->)\s*/).map((p) => p.trim()).filter(Boolean);
      if (!parts.length) return "";
      if (parts.length === 1) {
        return `<div class="hsd-dtree-block mb-4 last:mb-0"><p class="hsd-dtree-q m-0 font-semibold text-slate-900 dark:text-white">${escapeHtml(parts[0]!)}</p></div>`;
      }
      const head = parts[0]!;
      const tail = parts.slice(1).join(" → ");
      return `<div class="hsd-dtree-block mb-4 last:mb-0">
  <p class="hsd-dtree-q m-0 mb-2 font-semibold text-slate-900 dark:text-white">${escapeHtml(head)}</p>
  <div class="hsd-dtree-branches border-l-2 border-hvac-blue/40 pl-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
    <span class="font-bold text-hvac-blue dark:text-hvac-gold" aria-hidden="true">→</span> ${escapeHtml(tail)}
  </div>
</div>`;
    })
    .filter(Boolean)
    .join("\n");
  return `
<section class="${HSD_V25_SECTION_SHELL}" id="${hsdSectionDomId("decision_tree_text")}">
  <h2 class="hsd-section__title hsd-section-title">Decision tree (text)</h2>
  <div class="hsd-section__body hsd-dtree-text">${blocks}</div>
</section>`.trim();
}

function isElectricalHsdToolsSection(slug?: string, vertical?: string): boolean {
  if (String(vertical ?? "")
    .trim()
    .toLowerCase() === "electrical") {
    return true;
  }
  const s = String(slug ?? "")
    .trim()
    .replace(/^\/+/, "")
    .toLowerCase();
  return s.startsWith("electrical/");
}

/** Pro tools list — HVAC uses legacy “Tools & verification”; electrical uses circuit-level pro framing. */
export function sectionTools(
  tools: HsdV25Payload["tools"],
  slug?: string,
  vertical?: string
): string {
  const list = (tools ?? []).map((t) => String(t).trim()).filter(Boolean);
  if (!list.length) return "";
  const items = list
    .map((t) => {
      const label = t
        .split(/[\s_-]+/)
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
        .join(" ");
      return `<li>${escapeHtml(label)}</li>`;
    })
    .join("\n");

  if (isElectricalHsdToolsSection(slug, vertical)) {
    const slugLc = String(slug ?? "")
      .trim()
      .replace(/^\/+/, "")
      .toLowerCase();
    const isBreakerTripping = slugLc.includes("breaker-keeps-tripping");
    const intro = isBreakerTripping
      ? "When a breaker keeps tripping, the issue is traced at the circuit level — not guessed."
      : "Electrical problems aren't guesswork — they're traced at the circuit level.";
    const listLead = isBreakerTripping
      ? "An electrician will:"
      : "A licensed electrician will typically:";
    const isolate = isBreakerTripping
      ? "This quickly determines whether the problem is a simple device failure, a circuit overload, or a deeper wiring issue."
      : "These steps quickly isolate whether the issue is a simple outlet failure, a circuit-level problem, or a wiring issue behind the wall.";
    const resetWarn = isBreakerTripping
      ? "Resetting the breaker without isolating the cause can make the problem worse."
      : "Trying random fixes without testing can miss the real problem — and repeated breaker resets can mask a serious fault.";
    return `
<section class="${HSD_V25_SECTION_SHELL}" id="${hsdSectionDomId("tools")}">
  <h2 id="hsd-tools-label" class="hsd-section__title hsd-section-title">How electricians actually diagnose this</h2>
  <div class="hsd-section__body">
    <p class="mb-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">${escapeHtml(intro)}</p>
    <p class="mb-2 text-sm font-semibold text-slate-900 dark:text-white">${escapeHtml(listLead)}</p>
    <ul class="hsd-tools-list mb-4 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-800 dark:text-slate-200" aria-labelledby="hsd-tools-label">${items}</ul>
    <p class="mb-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">${escapeHtml(isolate)}</p>
    <p class="mb-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">${escapeHtml(resetWarn)}</p>
    <div class="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/60 dark:bg-amber-950/40" role="note">
      <p class="m-0 text-sm font-black uppercase tracking-wide text-amber-900 dark:text-amber-200">When to stop and call an electrician</p>
      <p class="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Stop immediately if you notice:</p>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        <li>Burning smell or hot outlets</li>
        <li>Breaker trips repeatedly</li>
        <li>Sparks or buzzing sounds</li>
      </ul>
      <p class="mt-3 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">These are not DIY situations — they indicate overheating or wiring failure.</p>
    </div>
  </div>
</section>`.trim();
  }

  return `
<section class="${HSD_V25_SECTION_SHELL}" id="${hsdSectionDomId("tools")}">
  <h2 id="hsd-tools-label" class="hsd-section__title hsd-section-title">Tools &amp; verification</h2>
  <div class="hsd-section__body">
    <p class="mb-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300"><strong>This is real technical work</strong> — technicians use the tools below to verify conditions you cannot see from the thermostat alone. Measurements and judgment matter as much as parts. <strong>Not all fixes are DIY-friendly</strong>: high voltage, refrigerant, and combustion work require licensing and proper equipment.</p>
    <ul class="hsd-tools-list list-disc space-y-1 pl-5 text-sm font-semibold text-slate-800 dark:text-slate-200" aria-labelledby="hsd-tools-label">${items}</ul>
  </div>
</section>`.trim();
}

/** Quick checks scan table — same data as quick_table, placed under summary (hero scan). */
export function sectionQuickDiagnosisTable(
  quick_table: HsdV25Payload["quick_table"],
  canonicalTruths?: HsdV25Payload["canonical_truths"],
  /** When set, replaces the default “Quick checks (Symptom scan)” heading (plain text only). */
  headingPlain?: string
): string {
  const rows = (quick_table ?? [])
    .map((r) => ({
      symptom: String(r.symptom ?? "").trim(),
      cause: String(r.cause ?? "").trim(),
      fix: String(r.fix ?? "").trim(),
    }))
    .filter((r) => r.symptom.length > 0 || r.cause.length > 0 || r.fix.length > 0);
  if (!rows.length) return "";
  const h2Inner = headingPlain?.trim()
    ? escapeHtml(headingPlain.trim())
    : `Quick checks <span class="text-base font-semibold normal-case text-slate-600 dark:text-slate-400">(Symptom scan)</span>`;
  const cards = rows
    .map(
      (r) => `<li class="min-w-0 list-none">
  <div class="flex h-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-600 dark:bg-slate-950/40">
    <div>
      <div class="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Symptom</div>
      <p class="mt-1 break-words text-sm font-semibold leading-relaxed text-slate-900 dark:text-white">${escapeHtml(r.symptom)}</p>
    </div>
    <div>
      <div class="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Likely cause</div>
      <p class="mt-1 break-words text-sm leading-relaxed text-slate-800 dark:text-slate-200">${escapeHtml(r.cause)}</p>
    </div>
    <div>
      <div class="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Fix</div>
      <p class="mt-1 break-words text-sm leading-relaxed text-slate-800 dark:text-slate-200">${escapeHtml(r.fix)}</p>
    </div>
  </div>
</li>`
    )
    .join("\n");
  return `
<section class="hsd-section hsd-block hsd-quick-diagnosis" id="${hsdSectionDomId("quick_diagnosis")}" aria-labelledby="hsd-quick-dx-label">
  <h2 id="hsd-quick-dx-label" class="hsd-section__title hsd-section-title">${h2Inner}</h2>
  <div class="hsd-section__body">
    <ul class="grid list-none gap-6 p-0 sm:gap-8 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3" aria-labelledby="hsd-quick-dx-label">${cards}</ul>
  </div>
  ${canonicalTruthsEchoHtml(canonicalTruths, "quick_diagnosis")}
</section>`.trim();
}

/** Real `<table>`: Symptom | Likely cause | Fix — skips rows where all three cells are empty. */
export function sectionQuickTable(
  quick_table: HsdV25Payload["quick_table"],
  canonicalTruths?: HsdV25Payload["canonical_truths"]
): string {
  const rows = (quick_table ?? [])
    .map((r) => ({
      symptom: String(r.symptom ?? "").trim(),
      cause: String(r.cause ?? "").trim(),
      fix: String(r.fix ?? "").trim(),
    }))
    .filter((r) => r.symptom.length > 0 || r.cause.length > 0 || r.fix.length > 0);
  if (!rows.length) return "";
  const body = rows
    .map(
      (r) => `<tr>
  <td>${escapeHtml(r.symptom)}</td>
  <td>${escapeHtml(r.cause)}</td>
  <td>${escapeHtml(r.fix)}</td>
</tr>`
    )
    .join("\n");
  return `
<section class="hsd-section hsd-block" id="${hsdSectionDomId("quick_table")}">
  <h2 id="hsd-quick-table-label" class="hsd-section__title hsd-section-title">Symptom → likely cause → fix</h2>
  <div class="hsd-section__body hsd-v2__table-wrap">
    <table class="hsd-v2__matrix hsd-quick-table" aria-labelledby="hsd-quick-table-label">
      <thead>
        <tr>
          <th scope="col">Symptom</th>
          <th scope="col">Likely Cause</th>
          <th scope="col">Fix</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>
  ${canonicalTruthsEchoHtml(canonicalTruths, "quick_diagnosis")}
</section>`.trim();
}

/**
 * Visual flow section from `diagnostic_flow`.
 * Does **not** emit `<div class="mermaid">` — that hook breaks hydration when Mermaid is off.
 */
export function renderMermaid(flow: HsdV25Payload["diagnostic_flow"], slug?: string): string {
  const chart = simpleDiagnosticFlowToMermaid(flow).trim();
  if (!chart) return "";
  const caption =
    slug && isPlumbingNoHotWaterSlug(slug)
      ? "Same gate order as the diagnostic steps: power, thermostat output, element, then tank condition—no skips."
      : "Use the text branches above to narrow the fault path before moving into refrigerant or compressor diagnosis.";
  return `
<section class="${HSD_V25_FIGURE_SHELL}" aria-label="Visual diagnostic flow">
  <h2 class="hsd-section__title hsd-section-title">Visual diagnostic flow</h2>
  <div class="hsd-figure__surface rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
    ${escapeHtml(caption)}
  </div>
</section>`.trim();
}

/** Shown above the repair table when `repair_matrix_intro` is empty (HVAC legacy rows only). */
const HVAC_REPAIR_MATRIX_INTRO_FALLBACK =
  "Most AC failures start as airflow or control issues. Once refrigerant or compressor problems appear, costs increase quickly.";

function formatRepairUsd(n: number): string {
  if (!Number.isFinite(n)) return "";
  return Math.round(n).toLocaleString("en-US");
}

export function sectionRepairMatrix(
  repair_matrix: HsdV25Payload["repair_matrix"],
  intro?: string,
  vertical?: string
): string {
  let introHtml = String(intro ?? "").trim();
  if (!introHtml && /^hvac$/i.test(String(vertical ?? "").trim())) {
    introHtml = HVAC_REPAIR_MATRIX_INTRO_FALLBACK;
  }
  const introBlock = introHtml
    ? `<p class="hsd-repair-matrix-intro mb-4 text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200">${escapeHtml(introHtml)}</p>`
    : "";
  const nd = "\u2013";
  const rows = repair_matrix
    .map((r) => {
      const loNum = Number(r.cost_min);
      const hiNum = Number(r.cost_max);
      const lo = Number.isFinite(loNum) ? formatRepairUsd(loNum) : "";
      const hi = Number.isFinite(hiNum) ? formatRepairUsd(hiNum) : "";
      const costCell =
        Number.isFinite(hiNum) && hiNum >= 1500
          ? `<span class="hsd-cost font-semibold text-slate-900 dark:text-slate-100">$${escapeHtml(lo)}${nd}<span class="hsd-cost-high">$${escapeHtml(hi)}</span></span>`
          : `<span class="hsd-cost font-semibold text-slate-900 dark:text-slate-100">$${escapeHtml(lo)}${nd}$${escapeHtml(hi)}</span>`;
      const issue = String(r.issue ?? "").trim();
      const fix = String(r.fix ?? "").trim();
      return `<tr class="border-t border-slate-200 dark:border-slate-600">
  <td class="p-3 text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">${escapeHtml(issue)}</td>
  <td class="p-3 text-sm text-slate-800 dark:text-slate-200">${escapeHtml(fix)}</td>
  <td class="p-3 text-sm">${costCell}</td>
  <td class="p-3 text-sm capitalize text-slate-700 dark:text-slate-300">${escapeHtml(r.difficulty)}</td>
</tr>`;
    })
    .join("");
  return `
<section class="${HSD_V25_SECTION_SHELL}" id="${hsdSectionDomId("repair_matrix")}">
  <h2 class="hsd-section__title hsd-section-title">Repair matrix</h2>
  <div class="hsd-section__body">
    ${introBlock}
    <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-600">
      <table class="w-full table-fixed border-collapse text-left text-sm">
        <thead class="bg-slate-100 text-left dark:bg-slate-800">
          <tr>
            <th class="p-3 font-semibold text-slate-900 dark:text-slate-100" scope="col">Issue</th>
            <th class="p-3 font-semibold text-slate-900 dark:text-slate-100" scope="col">Fix</th>
            <th class="p-3 font-semibold text-slate-900 dark:text-slate-100" scope="col">Cost</th>
            <th class="p-3 font-semibold text-slate-900 dark:text-slate-100" scope="col">Difficulty</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
</section>`.trim();
}

export function sectionCostEscalation(cost_escalation: HsdV25Payload["cost_escalation"]): string {
  const n = cost_escalation.length;
  const items = cost_escalation
    .map((c, i) => {
      const peak = i === n - 1 ? " hsd-cost-esc--peak" : "";
      /** One decisive line: `Stage — $range: what happens` (matches authority spec). */
      const line = `${c.stage} — ${c.cost}: ${c.description}`.trim();
      return `<li class="hsd-block${peak}"><span class="hsd-cost-esc-line font-semibold leading-relaxed text-slate-900 dark:text-slate-100">${escapeHtml(line)}</span></li>`;
    })
    .join("");
  return `
<section class="${HSD_V25_SECTION_SHELL}">
  <h2 id="${hsdSectionDomId("cost_escalation")}" class="hsd-section__title hsd-section-title"><span aria-hidden="true">⚡</span> Cost escalation</h2>
  <div class="hsd-section__body">
    <p class="hsd-cost-esc-lead mb-4 text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200">There is no idle recovery once the system runs wrong under load. Delay burns the cheap exit first, then leaves only expensive repairs.</p>
    <ol class="hsd-v2__cost-esc">${items}</ol>
  </div>
</section>`.trim();
}

export function sectionDecision(
  decision: HsdV25Payload["decision"],
  footer?: string,
  vertical?: string
): string {
  const col = (className: string, title: string, lines: string[]) =>
    `<div class="${className}"><h3 class="hsd-v2__h3">${title}</h3><ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul></div>`;
  const foot = String(footer ?? "").trim();
  const hookLine = foot ? "" : escapeHtml(decisionFailureHook(vertical));
  const hookBlock = hookLine
    ? `<p class="hsd-decision-hook mt-4 text-sm font-bold text-red-900 dark:text-red-200">${hookLine}</p>`
    : "";
  const footBlock = foot
    ? `<div class="hsd-decision-footer mt-4 border-t border-slate-200 pt-4 space-y-2 dark:border-slate-600">${summaryCoreTruthParagraphsHtml(foot, "m-0 text-sm font-semibold leading-relaxed text-slate-900 dark:text-white")}</div>`
    : "";
  return `
<section class="${HSD_V25_DECISION_SHELL}" id="${hsdSectionDomId("decision")}">
  <h2 class="hsd-section__title hsd-section-title">What you should do now</h2>
  <div class="hsd-section__body hsd-v2__cols">
    ${col("hsd-decision-safe", `<span aria-hidden="true">🟦</span> Safe — try first`, decision.safe)}
    ${col("hsd-decision-call", `<span aria-hidden="true">🟨</span> Call a pro — no longer DIY`, decision.call_pro)}
    ${col("hsd-decision-stop", `<span aria-hidden="true">🟥</span> STOP — risk of damage`, decision.stop_now)}
  </div>
  ${hookBlock}
  ${footBlock}
</section>`.trim();
}

export function sectionFinalWarning(
  final_warning: string,
  _canonicalTruths?: HsdV25Payload["canonical_truths"]
): string {
  const paras = bodyParagraphsHtml(
    final_warning,
    "text-base font-medium leading-relaxed text-slate-900 dark:text-slate-100"
  );
  return `
<section class="${HSD_V25_FINAL_SHELL}">
  <h2 id="${hsdSectionDomId("final_warning")}" class="hsd-section__title hsd-section-title"><span aria-hidden="true">🔥</span> Final warning</h2>
  <div class="hsd-section__body space-y-3">${paras}</div>
</section>`.trim();
}

export function sectionCta(cta: string, vertical: string = "hvac"): string {
  const t = String(cta ?? "").trim();
  if (!t) return "";
  return sectionPlacementCta("final", t, hsdSectionDomId("cta"), vertical);
}

/** @deprecated Prefer {@link sectionFinalWarning} + {@link sectionCta} via {@link joinSortedHsdV25Blocks}. */
export function sectionFinal(final_warning: string, cta: string): string {
  return `${sectionFinalWarning(final_warning)}\n${sectionCta(cta)}`;
}

/**
 * Full static HTML for a validated **HSD v2.5** (`HsdV25Payload`) page.
 * Use with {@link HsdLockedPageWithMermaid} (same Mermaid split contract as `renderHSDPage`).
 */
function buildHsdV25HeaderHtml(data: HsdV25RenderInput): string {
  const sub = subhead(data);
  const sym = String(data.symptom ?? "").trim();
  const possibleHeading = sym ? `Possible reasons for ${sym}` : "Possible reasons for this symptom";
  const quickDx = sectionQuickDiagnosisTable(data.quick_table, data.canonical_truths, possibleHeading);
  return `
<header class="${HSD_V25_HEADER_SHELL}" data-hsd-zone="credibility">
  <h1 class="hsd-cred__title">${escapeHtml(data.title)}</h1>
  ${sub ? `<p class="hsd-cred__sub">${escapeHtml(sub)}</p>` : ""}
  ${sectionCityContext(Array.isArray(data.cityContext) ? data.cityContext : [])}
  ${sectionFieldTriage(data.summary_30s, data.canonical_truths, data.slug)}
  ${renderCtasByTypes(data, ["top"])}
  ${quickDx}
  ${sectionMostCommonCause(data.most_common_cause)}
  ${sectionWhatThisMeans(data.what_this_means)}
  <hr class="hsd-cred__rule" />
  ${sectionQuickChecks(data.quick_checks, data.canonical_truths, hsdPageVertical(data), data.slug)}
  ${renderCtasByTypes(data, ["mid"])}
</header>`.trim();
}

function buildHsdV25MidBlocks(data: HsdV25RenderInput): HsdV25HtmlBlock[] {
  const quickDx = sectionQuickDiagnosisTable(data.quick_table, data.canonical_truths);
  const P = HSD_V25_BLOCK_PRIORITY;
  const repairMatrixHtml = sectionRepairMatrix(data.repair_matrix, data.repair_matrix_intro, data.vertical);
  const showPreRepairCtAs = repairMatrixHtml.trim().length > 0;
  const dangerCtas = showPreRepairCtAs ? renderCtasByTypes(data, ["danger"]) : "";
  return [
    {
      priority: P.diagnostic_steps,
      html: sectionDiagnosticSteps(data.diagnostic_steps, data.canonical_truths, data.slug),
    },
    { priority: P.decision_tree_text, html: sectionDecisionTreeText(data.decision_tree_text) },
    {
      priority: P.quick_table,
      html: quickDx.trim() ? "" : sectionQuickTable(data.quick_table, data.canonical_truths),
    },
    { priority: P.tools, html: sectionTools(data.tools, data.slug, hsdPageVertical(data)) },
    { priority: P.visual_diagnostic_flow, html: renderMermaid(data.diagnostic_flow, data.slug) },
    { priority: P.cta_danger_before_repair, html: dangerCtas },
    { priority: P.top_causes, html: sectionTopCauses(data.summary_30s, data.slug) },
    { priority: P.common_misdiagnosis, html: sectionCommonMisdiagnosis(data.common_misdiagnosis) },
    {
      priority: P.repair_matrix,
      html: repairMatrixHtml,
    },
    { priority: P.system_age_load, html: sectionSystemAgeLoad(data.system_age_load) },
    { priority: P.code_updates, html: sectionCodeUpdates(data.code_updates) },
    { priority: P.repair_vs_replace, html: sectionRepairVsReplace(data.repair_vs_replace) },
    { priority: P.upgrade_paths, html: sectionUpgradePaths(data.upgrade_paths) },
    { priority: 99, html: canonicalTruthsEchoHtml(data.canonical_truths, "pre_decision") },
    { priority: P.decision, html: sectionDecision(data.decision, data.decision_footer, data.vertical) },
  ];
}

function buildHsdV25ClosingBlocks(data: HsdV25RenderInput): HsdV25HtmlBlock[] {
  const P = HSD_V25_BLOCK_PRIORITY;
  return [
    { priority: P.cta, html: buildFinalCtaHtml(data) },
    { priority: P.final_warning, html: sectionFinalWarning(data.final_warning, data.canonical_truths) },
  ];
}

/** Header through Quick checks — for {@link renderHsdV25LeadSegments}. */
export function renderHsdV25HeaderOnly(data: HsdV25RenderInput): string {
  return buildHsdV25HeaderHtml(data);
}

/** Body after Quick checks through Decision (inclusive) — for lead-gen slot before hard CTA. */
export function renderHsdV25MidThroughDecision(data: HsdV25RenderInput): string {
  return joinSortedHsdV25Blocks(buildHsdV25MidBlocks(data));
}

/** Next step + Final warning — for lead-gen slot after hard CTA. */
export function renderHsdV25Closing(data: HsdV25RenderInput): string {
  return joinSortedHsdV25Blocks(buildHsdV25ClosingBlocks(data));
}

/** Three HTML segments so the app shell can place lead CTA blocks between them. */
export function renderHsdV25LeadSegments(data: HsdV25RenderInput): {
  headerHtml: string;
  midThroughDecisionHtml: string;
  closingHtml: string;
} {
  const safe = sanitizeHsdV25RenderInput(data);
  return {
    headerHtml: renderHsdV25HeaderOnly(safe),
    midThroughDecisionHtml: renderHsdV25MidThroughDecision(safe),
    closingHtml: renderHsdV25Closing(safe),
  };
}

export function renderHsdV25(data: HsdV25RenderInput | Record<string, unknown>): string {
  const safe = sanitizeHsdV25RenderInput(data);
  const header = buildHsdV25HeaderHtml(safe);
  const blocks: HsdV25HtmlBlock[] = [
    ...buildHsdV25MidBlocks(safe),
    ...buildHsdV25ClosingBlocks(safe),
  ];
  const related = sectionInternalRelatedLinks(safe);
  const inner = `${header}\n${joinSortedHsdV25Blocks(blocks)}\n${related}`.trim();
  return wrapHsdV25LayoutDocument(inner);
}
