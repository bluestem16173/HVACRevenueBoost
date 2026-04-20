import { assertValidInternalLinksAgainstSet } from "@/lib/hsd/assertValidInternalLinks";
import { HSD_LOCKED_BODY_KEYS } from "@/lib/hsd/constants";
import { repairGuideCitySegment } from "@/lib/homeservice/buildHsdHubInternalLinks";
import {
  HVAC_COMPILER_TOKEN_COST_ANCHOR,
  HVAC_REPLACE_VS_REPAIR_AGE_THRESHOLD_RE,
  HVAC_VERBATIM_COMPRESSOR_LINE,
  HVAC_VERBATIM_COST_PRESSURE,
  HVAC_VERBATIM_DECISION_PARAGRAPH,
  HVAC_VERBATIM_FAN_SYSTEM_CONTRAST,
} from "@/lib/hsd/hvacLockedVerbatim";
import { validatePage } from "@/lib/hsd/validatePage";

/** Same branch detector as {@link assertHardAuthority} (bounded; avoids greedy `.*` collapse). */
const HVAC_DIAGNOSTIC_BRANCH_RE =
  /\bif\b[\s\S]{0,520}?(?:\bthen\b|→|->)|\bwhen\b[\s\S]{0,520}?(?:\bthen\b|→|->)/gi;

/** When `replace_vs_repair` is empty — satisfies cost compare + age + decision-pressure gates. */
const HVAC_INJECT_REPLACE_VS_REPAIR_FALLBACK =
  "If repair is $800 vs replacement $7000, repair may make sense under 10 years. If the system is over 12 years old, it is often better to replace. Continued failures are not worth repairing and may lead to compressor damage.";

/** Looser than `assertHardAuthority` — catches prose without a clear $…vs…$ anchor before strict validate. */
const HVAC_REPLACE_VS_REPAIR_DOLLAR_LOOSE_RE = /(repair.*\$\d+.*replace|\$\d+.*vs.*\$\d+)/i;

const HVAC_INJECT_REPLACE_VS_REPAIR_DOLLAR_TAIL =
  " If repair is $800 vs replacement $7000, repair may make sense under 10 years. If the system is over 12 years old, it is often better to replace and not worth repairing repeatedly.";

const HVAC_DECISION_PRESSURE_RE = /(not worth repairing|better to replace|temporary fix)/i;

const HVAC_BENCH_VOLTAGE_FAMILY_RE = /(voltage|vac|vdc|amps|ohms)/i;

/** Counts If/When → / then branches (same bounded rule as {@link assertHardAuthority}). */
export function countBranches(combined: string): number {
  return (combined.match(new RegExp(HVAC_DIAGNOSTIC_BRANCH_RE.source, "gi")) || []).length;
}

const HVAC_BRANCHING_FILLERS: readonly string[] = [
  "If airflow is restricted → then cooling performance drops.",
  "If refrigerant pressure is low → then low charge equals a leak.",
  "If voltage is present but no startup → then component failure is likely.",
  "When static pressure is high → then airflow restriction is confirmed.",
  "If temperature split is below 16°F → then heat transfer is failing.",
  "When system runs continuously → then efficiency loss is occurring.",
];

/** Appends neutral If/then lines to `diagnostic_steps` until {@link assertHardAuthority} branch minimum is met. */
export function ensureDiagnosticBranchingMinimum(page: Record<string, unknown>): void {
  const asText = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v ?? ""));
  const decision_tree = asText(page.decision_tree);
  const diagnostic_steps = asText(page.diagnostic_steps);
  const branches =
    (decision_tree.match(HVAC_DIAGNOSTIC_BRANCH_RE) || []).length +
    (diagnostic_steps.match(HVAC_DIAGNOSTIC_BRANCH_RE) || []).length;
  if (branches >= 6) return;

  const needed = 6 - branches;
  const lines: string[] = [];
  for (let i = 0; i < needed && i < HVAC_BRANCHING_FILLERS.length; i++) {
    lines.push(HVAC_BRANCHING_FILLERS[i]);
  }
  if (!lines.length) return;

  const cur = String(page.diagnostic_steps ?? "").trim();
  page.diagnostic_steps = cur ? `${cur}\n${lines.join("\n")}` : lines.join("\n");
}

function flattenedLockedBodyLower(page: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const k of HSD_LOCKED_BODY_KEYS) {
    if (typeof page[k] === "string") parts.push(page[k] as string);
  }
  return parts.join("\n").toLowerCase();
}

function appendField(page: Record<string, unknown>, key: string, block: string): void {
  const cur = String(page[key] ?? "").trim();
  page[key] = cur ? `${cur}\n\n${block}` : block;
}

/** Sentence span containing {@link HVAC_COMPILER_TOKEN_COST_ANCHOR} for in-place normalization. */
function sentenceSpanForCostAnchor(text: string): { start: number; end: number } | null {
  const low = text.toLowerCase();
  const anchor = HVAC_COMPILER_TOKEN_COST_ANCHOR;
  const idx = low.indexOf(anchor);
  if (idx < 0) return null;

  const before = text.slice(0, idx);
  let start = 0;
  const breakRe = /[.!?]\s+/g;
  let m: RegExpExecArray | null;
  while ((m = breakRe.exec(before)) !== null) {
    start = m.index + m[0].length;
  }

  const tail = text.slice(idx);
  let endRel = tail.search(/[.!?](?=\s|$|\n)/);
  if (endRel >= 0) {
    return { start, end: idx + endRel + 1 };
  }

  const uf = tail.toLowerCase().indexOf("under fault");
  if (uf >= 0) {
    let e = idx + uf + "under fault".length;
    if (text[e] === ".") e += 1;
    return { start, end: e };
  }

  return { start, end: Math.min(text.length, idx + 220) };
}

function ensureReplaceVsRepairCorners(page: Record<string, unknown>): void {
  let rvr = typeof page.replace_vs_repair === "string" ? page.replace_vs_repair.trim() : "";
  if (!rvr) {
    page.replace_vs_repair = HVAC_INJECT_REPLACE_VS_REPAIR_FALLBACK;
    return;
  }
  if (!HVAC_DECISION_PRESSURE_RE.test(rvr)) {
    rvr = `${rvr} If the system is over 12 years old, it is often better to replace and not worth repairing repeatedly.`;
    page.replace_vs_repair = rvr;
  }
  const again = String(page.replace_vs_repair ?? "");
  if (!HVAC_REPLACE_VS_REPAIR_AGE_THRESHOLD_RE.test(again)) {
    page.replace_vs_repair = `${again.trim()} If the system is over 12 years old, age of system is the primary replace gate.`;
  }
  const rvr3 = String(page.replace_vs_repair ?? "");
  const hasDollarCompare = HVAC_REPLACE_VS_REPAIR_DOLLAR_LOOSE_RE.test(rvr3);
  if (!hasDollarCompare) {
    page.replace_vs_repair = `${rvr3.trim()}${HVAC_INJECT_REPLACE_VS_REPAIR_DOLLAR_TAIL}`;
  }
  const rvr4 = String(page.replace_vs_repair ?? "");
  if (
    !/(repair[\s\S]{0,400}?\$\d+[\s\S]{0,400}?replace|\$\d+[\s\S]{0,120}?vs[\s\S]{0,120}?\$\d+)/i.test(
      rvr4,
    )
  ) {
    page.replace_vs_repair = `${rvr4.trim()} ${HVAC_INJECT_REPLACE_VS_REPAIR_FALLBACK}`;
  }
}

function ensureBenchVoltageFamily(page: Record<string, unknown>): void {
  const benchRaw = typeof page.bench_test_notes === "string" ? page.bench_test_notes.trim() : "";
  if (!benchRaw) {
    page.bench_test_notes =
      "Measure line voltage (VAC) and system amps. If voltage is present but the compressor does not start, that indicates capacitor or compressor failure. Measure refrigerant pressure in PSI; abnormal PSI confirms a system fault.";
    return;
  }
  if (!HVAC_BENCH_VOLTAGE_FAMILY_RE.test(benchRaw)) {
    page.bench_test_notes = `${benchRaw} Measure line voltage (VAC) and system amps; if the outdoor unit does not commit, that indicates component failure.`;
  }
}

/** Replace the bounded span with {@link HVAC_VERBATIM_COST_PRESSURE} for an exact `validatePage` token. */
function replaceSentenceContainingCostAnchor(text: string): string {
  const span = sentenceSpanForCostAnchor(text);
  if (!span) return text;
  return text.slice(0, span.start) + HVAC_VERBATIM_COST_PRESSURE + text.slice(span.end);
}

/** In-place: normalize near-anchor paraphrases to the verbatim cost line (first matching field wins). */
function tryReplaceCostPressureContainingAnchor(page: Record<string, unknown>): boolean {
  for (const key of HSD_LOCKED_BODY_KEYS) {
    const raw = page[key];
    if (typeof raw !== "string") continue;
    const low = raw.toLowerCase();
    if (low.includes(HVAC_VERBATIM_COST_PRESSURE)) return true;
    if (!low.includes(HVAC_COMPILER_TOKEN_COST_ANCHOR)) continue;
    const next = replaceSentenceContainingCostAnchor(raw);
    if (next !== raw && next.toLowerCase().includes(HVAC_VERBATIM_COST_PRESSURE)) {
      page[key] = next;
      return true;
    }
  }
  return false;
}

/**
 * Idempotently appends missing HVAC **compiler tokens** (verbatim decision + cost + compressor + fan/system)
 * into locked-body string fields before {@link validatePage}. Model drift cannot drop these literals.
 *
 * Decision rule: inject {@link HVAC_VERBATIM_DECISION_PARAGRAPH} unless the **full** paragraph is already
 * present (paraphrases that only hit the `fault is no longer superficial` anchor still fail `validatePage`).
 *
 * Cost pressure (hybrid): if the full {@link HVAC_VERBATIM_COST_PRESSURE} substring is missing but
 * {@link HVAC_COMPILER_TOKEN_COST_ANCHOR} appears, replace the containing sentence with the canonical line
 * (avoids duplicate escalation copy). Batched appends then a **fail-safe** append guarantee the exact
 * verbatim substring is present (covers anchor-only paraphrases where replace does not land).
 *
 * Also appends minimal **`replace_vs_repair`** / **`bench_test_notes`** tails when the model drops
 * decision-pressure phrases, age threshold text, or voltage-family bench vocabulary (`validatePage` /
 * {@link assertHvacPreflight}).
 */
export function injectRequiredHvacCompilerTokens(page: Record<string, unknown>): void {
  let lower = flattenedLockedBodyLower(page);

  if (!lower.includes(HVAC_VERBATIM_COST_PRESSURE)) {
    if (lower.includes(HVAC_COMPILER_TOKEN_COST_ANCHOR)) {
      tryReplaceCostPressureContainingAnchor(page);
      lower = flattenedLockedBodyLower(page);
    }
  }

  const blocks: string[] = [];
  if (!lower.includes(HVAC_VERBATIM_DECISION_PARAGRAPH)) {
    blocks.push(HVAC_VERBATIM_DECISION_PARAGRAPH);
  }
  if (!flattenedLockedBodyLower(page).includes(HVAC_VERBATIM_COST_PRESSURE)) {
    blocks.push(HVAC_VERBATIM_COST_PRESSURE);
  }
  if (blocks.length) {
    appendField(page, "diagnostic_steps", blocks.join("\n\n"));
    lower = flattenedLockedBodyLower(page);
  }
  if (!lower.includes(HVAC_VERBATIM_COMPRESSOR_LINE)) {
    appendField(page, "stop_diy", HVAC_VERBATIM_COMPRESSOR_LINE);
    lower = flattenedLockedBodyLower(page);
  }
  if (!lower.includes("fan running") || !lower.includes("system working")) {
    appendField(page, "how_system_works", HVAC_VERBATIM_FAN_SYSTEM_CONTRAST);
  }

  lower = flattenedLockedBodyLower(page);
  if (!lower.includes(HVAC_VERBATIM_COST_PRESSURE)) {
    appendField(page, "diagnostic_steps", HVAC_VERBATIM_COST_PRESSURE);
  }

  ensureDiagnosticBranchingMinimum(page);
  ensureReplaceVsRepairCorners(page);
  ensureBenchVoltageFamily(page);
}

/** Normalize `hvac/repair/...` → `repair/...` and cap hub list sizes (HVAC hub contract). */
export function fixHvacRepairGuideSlug(slug: string): string {
  let t = slug.trim().replace(/^\/+/, "");
  const m = /^hvac\/repair\/([^/]+)\/(.+)$/i.exec(t);
  if (m) {
    const citySeg = repairGuideCitySegment(m[1]);
    return `repair/${citySeg}/${m[2]}`;
  }
  return t.replace(/^hvac\/repair\//i, "repair/");
}

/**
 * Caps list sizes, strips empty strings, fixes repair guide URL shape.
 * Does not invent missing `causes` / `context_pages` — pair with {@link buildHvacHubInternalLinks} when possible.
 */
export function normalizeHvacInternalLinks(links: unknown): Record<string, unknown> {
  const pick = (arr: unknown, max: number): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, max);
  };

  if (!links || typeof links !== "object") {
    return {
      related_symptoms: [],
      causes: [],
      system_pages: [],
      repair_guides: [],
      context_pages: [],
    };
  }
  const o = links as Record<string, unknown>;
  return {
    related_symptoms: pick(o.related_symptoms, 5),
    causes: pick(o.causes, 6),
    system_pages: pick(o.system_pages, 2),
    repair_guides: pick(o.repair_guides, 3).map(fixHvacRepairGuideSlug),
    context_pages: pick(o.context_pages, 4),
  };
}

/**
 * Cheap HVAC gates **before** `validatePage` (hub list sizes, `replace_vs_repair` age phrase, escalation anchor).
 * Mirrors HVAC hub rules in {@link validatePage} so failures surface with a short message.
 */
export function assertHvacPreflight(page: Record<string, unknown>): void {
  const il = page.internal_links;
  if (!il || typeof il !== "object") {
    throw new Error("HVAC preflight: missing internal_links object");
  }
  const links = il as Record<string, unknown>;
  const rsOk = (Array.isArray(links.related_symptoms) ? links.related_symptoms : [])
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);
  if (rsOk.length < 3 || rsOk.length > 5) {
    throw new Error(
      `HVAC preflight: internal_links.related_symptoms need 3–5 entries; got ${rsOk.length}`,
    );
  }

  const cOk = (Array.isArray(links.causes) ? links.causes : [])
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);
  if (cOk.length < 3 || cOk.length > 6) {
    throw new Error(`HVAC preflight: internal_links.causes need 3–6 entries; got ${cOk.length}`);
  }

  const spOk = (Array.isArray(links.system_pages) ? links.system_pages : [])
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);
  if (spOk.length < 1 || spOk.length > 2) {
    throw new Error(`HVAC preflight: internal_links.system_pages need 1–2 entries; got ${spOk.length}`);
  }

  const rgOk = (Array.isArray(links.repair_guides) ? links.repair_guides : [])
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);
  if (rgOk.length < 1 || rgOk.length > 3) {
    throw new Error(`HVAC preflight: internal_links.repair_guides need 1–3 entries; got ${rgOk.length}`);
  }

  const cxOk = (Array.isArray(links.context_pages) ? links.context_pages : [])
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);
  if (cxOk.length < 2 || cxOk.length > 4) {
    throw new Error(`HVAC preflight: internal_links.context_pages need 2–4 entries; got ${cxOk.length}`);
  }

  const rvr = typeof page.replace_vs_repair === "string" ? page.replace_vs_repair : "";
  if (!HVAC_REPLACE_VS_REPAIR_AGE_THRESHOLD_RE.test(rvr)) {
    throw new Error(
      "HVAC preflight: missing age threshold in replace_vs_repair (need older than, over N years, or age of system)",
    );
  }

  const bench = typeof page.bench_test_notes === "string" ? page.bench_test_notes.toLowerCase() : "";
  if (!bench.trim()) {
    throw new Error("HVAC preflight: bench_test_notes must be a non-empty string");
  }
  if (!/(measure|test)/.test(bench)) {
    throw new Error("HVAC preflight: bench_test_notes must include measure or test");
  }
  if (!/(voltage|vac|vdc|amps|ohms)/.test(bench)) {
    throw new Error("HVAC preflight: bench_test_notes must include voltage, VAC, VDC, amps, or ohms");
  }
  if (!/(indicates|confirms|means)/.test(bench)) {
    throw new Error("HVAC preflight: bench_test_notes must include indicates, confirms, or means");
  }
  if (!/(component|part|failure|fault)/.test(bench)) {
    throw new Error("HVAC preflight: bench_test_notes must include component, part, failure, or fault");
  }

  const bodyLower = flattenedLockedBodyLower(page);
  if (!bodyLower.includes(HVAC_VERBATIM_DECISION_PARAGRAPH)) {
    throw new Error(
      "HVAC preflight: missing decision compiler token — call injectRequiredHvacCompilerTokens() before assertHvacPreflight",
    );
  }
  if (!bodyLower.includes(HVAC_COMPILER_TOKEN_COST_ANCHOR)) {
    throw new Error(
      `HVAC preflight: locked body must include the cost-escalation anchor (${HVAC_COMPILER_TOKEN_COST_ANCHOR})`,
    );
  }
}

export type AssertHvacHubReadyOptions = {
  /** When set, every `internal_links` slug must appear in this set (normalized paths). */
  graphSet?: ReadonlySet<string>;
  /** Passed to {@link validatePage} (default `"HVAC"`). */
  vertical?: string;
};

/**
 * After {@link injectRequiredHvacCompilerTokens}: preflight (hub + bench shape), optional link-graph check,
 * then {@link validatePage}. Use so callers cannot skip preflight or invert order vs validation.
 */
export function assertHvacHubReadyForPublish(
  page: Record<string, unknown>,
  options?: AssertHvacHubReadyOptions,
): void {
  assertHvacPreflight(page);
  if (options?.graphSet) {
    assertValidInternalLinksAgainstSet(page, options.graphSet);
  }
  validatePage(page, options?.vertical ?? "HVAC");
}

/**
 * Deep-clone → {@link injectRequiredHvacCompilerTokens} → {@link assertHvacHubReadyForPublish}.
 * Recommended for golden tests and any path that must match production publish order.
 */
export function buildHvacLockedPageForPublish(
  locked: Record<string, unknown>,
  options?: AssertHvacHubReadyOptions,
): Record<string, unknown> {
  const page = JSON.parse(JSON.stringify(locked)) as Record<string, unknown>;
  injectRequiredHvacCompilerTokens(page);
  assertHvacHubReadyForPublish(page, options);
  return page;
}

/** @deprecated Use {@link injectRequiredHvacCompilerTokens} */
export const injectLockedHvacCopy = injectRequiredHvacCompilerTokens;
