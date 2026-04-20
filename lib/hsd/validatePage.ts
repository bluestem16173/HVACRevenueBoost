import { HSD_LOCKED_BODY_KEYS } from "./constants";
import { isHsdDiagnosticFlowGraph } from "./diagnosticFlowGraph";
import {
  HVAC_REPLACE_VS_REPAIR_AGE_THRESHOLD_RE,
  HVAC_VERBATIM_COMPRESSOR_LINE,
  HVAC_VERBATIM_COST_PRESSURE,
  HVAC_VERBATIM_DECISION_PARAGRAPH,
} from "./hvacLockedVerbatim";

function normVertical(v: string): "hvac" | "plumbing" | "electrical" | "other" {
  const x = (v || "").trim().toLowerCase();
  if (x === "hvac") return "hvac";
  if (x === "plumbing") return "plumbing";
  if (x === "electrical") return "electrical";
  return "other";
}

/** Model-authored copy only (excludes structured `diagnostic_flow` graph nodes). */
function flattenedModelStrings(content: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const k of HSD_LOCKED_BODY_KEYS) {
    if (typeof content[k] === "string") parts.push(content[k] as string);
  }
  return parts.join("\n");
}

/** Technical depth: numbers + units/ranges in the highest-signal fields. */
function measurementSampleText(c: Record<string, unknown>): string {
  const keys = [
    "summary_30s",
    "decision_tree",
    "top_causes",
    "how_system_works",
    "diagnostic_steps",
    "cost_matrix",
    "replace_vs_repair",
    "bench_test_notes",
  ] as const;
  return keys.map((k) => stringField(c, k)).join("\n");
}

function stringField(data: Record<string, unknown>, key: string): string {
  return typeof data[key] === "string" ? (data[key] as string) : "";
}

/** Branching check must see array/object `decision_tree` / `top_causes`, not only plain strings. */
function diagnosticReasoningText(c: Record<string, unknown>): string {
  const asText = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v ?? ""));
  const v2Extras =
    typeof c.summary_30s === "object" && c.summary_30s !== null
      ? `\n${JSON.stringify(c.summary_30s)}`
      : asText(c.summary_30s);
  const dtt = Array.isArray(c.decision_tree_text) ? JSON.stringify(c.decision_tree_text) : asText(c.decision_tree_text);
  const dsteps = Array.isArray(c.diagnostic_steps) ? JSON.stringify(c.diagnostic_steps) : asText(c.diagnostic_steps);
  return `${asText(c.decision_tree)}\n${asText(c.top_causes)}\n${dtt}\n${dsteps}${v2Extras}`;
}

function assertNoRawMermaidStored(content: Record<string, unknown>): void {
  const { diagnostic_flow: _df, ...rest } = content;
  const blob = JSON.stringify(rest).toLowerCase();
  if (blob.includes("flowchart td") || blob.includes("```mermaid")) {
    throw new Error("Invalid format: raw Mermaid must not be stored in JSON");
  }
}

function assertVerticalBleed(content: Record<string, unknown>, vertical: string): void {
  const v = normVertical(vertical);
  if (v === "hvac") return;
  const t = flattenedModelStrings(content).toLowerCase();
  if (/\brefrigerant\b/.test(t)) {
    throw new Error("System bleed: refrigerant language on non-HVAC page");
  }
  if (/\bcompressor\b/.test(t)) {
    throw new Error("System bleed: compressor language on non-HVAC page");
  }
  if (/\bevaporator\b|\bcondenser\b|\bsubcool\b|\bsuperheat\b/.test(t)) {
    throw new Error("System bleed: HVAC-only thermal terms on non-HVAC page");
  }
}

/** Explicit product gate (pairs with prompt): case-insensitive. */
function assertRejectCallNowOrActFast(text: string): void {
  const lower = text.toLowerCase();
  if (lower.includes("call now") || lower.includes("act fast")) {
    throw new Error('Rejected: content contains "Call now" or "Act fast".');
  }
}

/**
 * Guarantees visible measurement vocabulary: °F and/or PSI and/or voltage-family terms.
 * Matches spec; VAC/VDC count as voltage-family for electrical substance.
 */
function assertDegFPsiOrVoltagePresent(text: string): void {
  const low = text.toLowerCase();
  const hasDegF = text.includes("°F") || text.includes("\u00B0F") || /°\s*f/i.test(text);
  const hasPSI = text.includes("PSI") || /\bpsi\b/i.test(low);
  const hasVoltageFamily = /\bvoltage\b|\bvolts\b|\bvac\b|\bvdc\b/i.test(text);
  if (!hasDegF && !hasPSI && !hasVoltageFamily) {
    throw new Error(
      'Technical substance: page must include °F, PSI, and/or voltage-related terms (e.g. voltage, VAC, VDC).'
    );
  }
}

function assertNoMarketingVoice(text: string): void {
  const banned = [
    "need help now",
    "don't wait",
    "dont wait",
    "hurry",
    "book today",
    "limited time",
    "schedule now",
    "get help fast",
    "call today",
    "don't delay",
    "dont delay",
  ];
  const lower = text.toLowerCase();
  for (const phrase of banned) {
    if (lower.includes(phrase)) {
      throw new Error(`Marketing / urgency voice forbidden: "${phrase}"`);
    }
  }
}

function assertNoDesignLanguage(text: string): void {
  const lower = text.toLowerCase();
  const banned = [
    "yellow box",
    "red box",
    "blue box",
    "green box",
    "pink background",
    "rgb(",
    "cta button",
    "banner",
    "card layout",
    "tailwind",
    "css class",
    "font color",
    "background color",
  ];
  for (const phrase of banned) {
    if (lower.includes(phrase)) {
      throw new Error(`Design / UI language forbidden in content: "${phrase}"`);
    }
  }
  if (/#[0-9a-f]{3,8}\b/i.test(text)) {
    throw new Error("Design language forbidden: hex color token in content");
  }
}

function assertNoGenericAdvice(text: string): void {
  const lower = text.toLowerCase();
  if (lower.includes("check your system")) {
    throw new Error('Generic advice forbidden: "check your system"');
  }
  if (lower.includes("inspect components")) {
    throw new Error('Generic advice forbidden: "inspect components"');
  }
  if (/\bmake sure everything is working\b/i.test(lower)) {
    throw new Error("Generic advice forbidden: vague 'make sure everything is working'");
  }
}

function assertFieldMeasurements(c: Record<string, unknown>, vertical: string): void {
  const v = normVertical(vertical);
  const sample = measurementSampleText(c);
  const t = sample;
  if (!/\d/.test(t)) {
    throw new Error("Technical depth: include numeric measurements or thresholds in overview, checks, field insight, or cost matrix.");
  }
  if (v === "hvac") {
    const hasRange = /\d+\s*[-–]\s*\d+/.test(t);
    const hasUnit =
      /°\s*f|°f|\bpsi\b|\bpsig\b|\bvac\b|\bvdc\b|\bvolt|\bohm|w\.c|subcool|superheat|\bcf\b|\bamp\b|Δt|delta\s*t|btuh|static/i.test(
        t
      );
    if (!hasRange && !hasUnit) {
      throw new Error(
        "HVAC: include measurable ranges or units (ΔT, °F, PSI, W.C., voltage, superheat/subcool, CFM, etc.)."
      );
    }
  } else if (v === "plumbing") {
    const ok = /\bpsi\b|\bpsig\b|°\s*f|°f|\bgpm\b|\bohm\b|\bwatt/i.test(t) || /\d+\s*[-–]\s*\d+/.test(t);
    if (!ok) {
      throw new Error("Plumbing: include pressure/flow/temperature or resistance-style measurements (PSI, GPM, °F, etc.).");
    }
  } else if (v === "electrical") {
    const ok =
      /\bvolt\b|\bvac\b|\bvdc\b|\bamp\b|\bohm\b|continuity|gfci|nec/i.test(t) || /\d+\s*[-–]\s*\d+/.test(t);
    if (!ok) {
      throw new Error("Electrical: include voltage/continuity/GFCI or other measurable electrical framing.");
    }
  }
}

function assertDiagnosticReasoning(text: string): void {
  const blob = text.toLowerCase();
  // Note: do not use `\b` around `→` — arrows sit between spaces and fail `\b` word-boundary rules.
  const hasBranch =
    /\bif\b[\s\S]{0,600}(?:\bthen\b|→|->)/i.test(blob) ||
    (/\bif\b/.test(blob) && /\blikely\b/.test(blob)) ||
    /\bwhen\b[\s\S]{0,600}(?:\bthen\b|→|->)/i.test(blob);
  if (!hasBranch) {
    throw new Error('Include explicit diagnostic branching (e.g. "If X → …" / "When Y, then …") in decision_tree or top_causes.');
  }
}

/** ≥6 explicit branches across page text (If/When → / then; or "indicates … because"). */
function assertBranchingDensity(fullText: string): void {
  const t = fullText;
  const low = t.toLowerCase();
  let n = 0;
  const ifBranches = t.match(/\bif\b[\s\S]{0,520}?(?:→|->|\bthen\b)/gi);
  if (ifBranches) n += ifBranches.length;
  const whenBranches = t.match(/\bwhen\b[\s\S]{0,520}?(?:→|->|\bthen\b)/gi);
  if (whenBranches) n += whenBranches.length;
  const indicatesBecause = low.match(/\bindicates\b[\s\S]{0,400}?\bbecause\b/g);
  if (indicatesBecause) n += indicatesBecause.length;
  if (n < 6) {
    throw new Error(
      `Branching density: need ≥6 explicit branches (If X → Y, When X then Y, or "indicates … because …"); found ${n}.`
    );
  }
}

function nonEmptySlugPath(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0 && !/^https?:\/\//i.test(x.trim());
}

/**
 * Trade-consistent slug paths on hub `internal_links` (optional leading `/`, no bare URLs).
 * `repair_guides` may use `repair/...` conversion URLs on HVAC pages.
 */
function assertTradeInternalLinksSlugFormat(vertical: string, raw: unknown): void {
  if (!raw || typeof raw !== "object") return;
  const v = normVertical(vertical);
  if (v === "other") return;

  const o = raw as Record<string, unknown>;
  const prefix = v === "hvac" ? "hvac" : v === "plumbing" ? "plumbing" : "electrical";
  const tradeRe = new RegExp(`^\\/?${prefix}\\/`, "i");
  const repairRe = /^\/?repair\//i;

  const lists: { key: string; allowRepair: boolean }[] = [
    { key: "related_symptoms", allowRepair: false },
    { key: "causes", allowRepair: false },
    { key: "system_pages", allowRepair: false },
    { key: "context_pages", allowRepair: false },
    { key: "repair_guides", allowRepair: true },
  ];

  for (const { key, allowRepair } of lists) {
    const list = o[key];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item !== "string") continue;
      const link = item.trim();
      if (!link || /^https?:\/\//i.test(link)) continue;
      if (allowRepair && repairRe.test(link)) continue;
      if (!tradeRe.test(link)) {
        throw new Error(`Invalid ${vertical} slug format on internal_links.${key}: "${link}"`);
      }
    }
  }
}

/**
 * HSD hub graph density on `internal_links`.
 * **HVAC** enforces the full hub (causes + context long-tail + repair conversion band).
 * Other trades keep lateral + system + repair minimums until hub maps ship for those verticals.
 */
function assertInternalLinksDensity(raw: unknown, vertical: string): void {
  if (!raw || typeof raw !== "object") {
    throw new Error("internal_links must be an object");
  }
  const o = raw as Record<string, unknown>;
  const rs = o.related_symptoms;
  const sp = o.system_pages;
  const rg = o.repair_guides;
  const v = normVertical(vertical);

  if (!Array.isArray(rs) || !Array.isArray(sp) || !Array.isArray(rg)) {
    throw new Error("internal_links: related_symptoms, system_pages, and repair_guides must be arrays");
  }
  const rsOk = rs.filter(nonEmptySlugPath);
  const spOk = sp.filter(nonEmptySlugPath);
  const rgOk = rg.filter(nonEmptySlugPath);

  if (rsOk.length < 3 || rsOk.length > 5) {
    throw new Error(`internal_links.related_symptoms: need 3–5 non-empty slug paths; got ${rsOk.length}`);
  }
  if (spOk.length < 1 || spOk.length > (v === "hvac" ? 2 : 3)) {
    throw new Error(
      v === "hvac"
        ? `internal_links.system_pages: need 1–2 non-empty slug paths; got ${spOk.length}`
        : `internal_links.system_pages: need 1–3 non-empty slug paths; got ${spOk.length}`,
    );
  }
  if (rgOk.length < 1) {
    throw new Error("internal_links.repair_guides: need at least 1 non-empty slug path");
  }
  if (v === "hvac" && rgOk.length > 3) {
    throw new Error(`internal_links.repair_guides: need 1–3 non-empty slug paths; got ${rgOk.length}`);
  }

  if (v !== "hvac") {
    return;
  }

  const c = o.causes;
  const cx = o.context_pages;
  if (!Array.isArray(c) || !Array.isArray(cx)) {
    throw new Error("internal_links: causes and context_pages must be arrays (HVAC hub)");
  }
  const cOk = c.filter(nonEmptySlugPath);
  const cxOk = cx.filter(nonEmptySlugPath);
  if (cOk.length < 3 || cOk.length > 6) {
    throw new Error(`internal_links.causes: need 3–6 non-empty root-cause slug paths; got ${cOk.length}`);
  }
  if (cxOk.length < 2 || cxOk.length > 4) {
    throw new Error(
      `internal_links.context_pages: need 2–4 non-empty long-tail slug paths; got ${cxOk.length}`,
    );
  }
}

/** Conversion layer: cost consequence language across the page (not only one field). */
function assertDecisionPressure(c: Record<string, unknown>, fullText: string): void {
  const stop = stringField(c, "stop_diy").trim();
  const rvr = stringField(c, "replace_vs_repair").trim();
  if (!stop || !rvr) {
    throw new Error("Decision pressure: stop_diy and replace_vs_repair must be non-empty");
  }
  const low = fullText.toLowerCase();
  const costImplication =
    (fullText.match(/\$/g) || []).length >= 1 ||
    (fullText.match(/\d{3,}/g) || []).length >= 2 ||
    /multi-?thousand|repair bill|changeout|replacement cost|cost escalation|invoice|estimate|stacking cost/i.test(low);
  if (!costImplication) {
    throw new Error(
      "Decision pressure: add explicit cost implication language ($ bands, multiple three-digit+ money anchors, or invoice / escalation wording) across cost_matrix, replace_vs_repair, and narrative fields."
    );
  }
}

/** Blocks filler `replace_vs_repair` that omits cost, age, or repair/replace framing. */
function assertReplaceVsRepairHardRules(raw: unknown): void {
  const replace_vs_repair = typeof raw === "string" ? raw : "";
  if (!replace_vs_repair.trim()) {
    throw new Error("replace_vs_repair must be a non-empty string");
  }
  if (!/(\$|\d{3,})/.test(replace_vs_repair)) {
    throw new Error("Missing cost logic");
  }
  if (!/(year|age|older)/i.test(replace_vs_repair)) {
    throw new Error("Missing age logic");
  }
  if (!/(replace|repair)/i.test(replace_vs_repair)) {
    throw new Error("Missing decision framing");
  }
}

/** Blocks generic `bench_test_notes` without test vocabulary and conclusion language. */
function assertBenchTestNotesHardRules(raw: unknown): void {
  const bench_test_notes = typeof raw === "string" ? raw : "";
  if (!bench_test_notes.trim()) {
    throw new Error("bench_test_notes must be a non-empty string");
  }
  if (!/(bench|test|measure|voltage|resistance)/i.test(bench_test_notes)) {
    throw new Error("Not diagnostic enough");
  }
  if (!/(confirms|indicates|means)/i.test(bench_test_notes)) {
    throw new Error("No conclusion logic");
  }
}

/**
 * HVAC-only hard gate: branching on decision_tree + diagnostic_steps, truth phrases,
 * measurable vocabulary, replace_vs_repair / bench_test_notes discipline (prompt-aligned).
 * Also invoked from {@link HSD_Page_Build} after {@link validatePage} for an explicit pipeline gate.
 */
export function assertHardAuthority(page: Record<string, unknown>): void {
  const asText = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v ?? ""));
  const decision_tree = asText(page.decision_tree);
  const diagnostic_steps = asText(page.diagnostic_steps);
  const replace_vs_repair = typeof page.replace_vs_repair === "string" ? page.replace_vs_repair : "";
  const bench_test_notes = typeof page.bench_test_notes === "string" ? page.bench_test_notes : "";

  const content = JSON.stringify(page).toLowerCase();

  // Bounded, non-greedy: greedy `.*` collapses one-line trees into a single match.
  const branchRe =
    /\bif\b[\s\S]{0,520}?(?:\bthen\b|→|->)|\bwhen\b[\s\S]{0,520}?(?:\bthen\b|→|->)/gi;
  const branches =
    (decision_tree.match(branchRe) || []).length + (diagnostic_steps.match(branchRe) || []).length;
  if (branches < 6) {
    throw new Error("FAIL: Insufficient diagnostic branching (min 6)");
  }

  const truthPhrases = [
    "refrigerant is not consumed",
    "low charge equals a leak",
    "airflow restriction",
    "static pressure",
    "heat transfer",
  ];
  const truthHits = truthPhrases.filter((p) => content.includes(p)).length;
  if (truthHits < 2) {
    throw new Error("FAIL: Missing HVAC system-law authority phrases");
  }

  if (!/(volt|v\b|amp|ohm|°f|°\s*f|psi|pressure)/i.test(content)) {
    throw new Error("FAIL: Missing measurable diagnostics");
  }

  if (!/(repair[\s\S]{0,400}?\$\d+[\s\S]{0,400}?replace|\$\d+[\s\S]{0,120}?vs[\s\S]{0,120}?\$\d+)/i.test(replace_vs_repair)) {
    throw new Error("FAIL: Must compare repair vs replace cost");
  }
  if (!HVAC_REPLACE_VS_REPAIR_AGE_THRESHOLD_RE.test(replace_vs_repair)) {
    throw new Error("FAIL: Missing age threshold logic");
  }
  if (!/(not worth repairing|better to replace|temporary fix)/i.test(replace_vs_repair)) {
    throw new Error("FAIL: Missing decision pressure language");
  }

  // Bench gate: measurable voltage family + conclusion verb + fault vocabulary.
  // Reliable authoring pattern: Measure … voltage|amps|ohms … → indicates|confirms … failure|fault|component.
  if (!/(measure|test)[\s\S]{0,400}?(voltage|ohms|amps)/i.test(bench_test_notes)) {
    throw new Error("FAIL: Missing measurable bench test");
  }
  if (!/(\bif\b[\s\S]{0,400}?\bthen\b|means|indicates|confirms)/i.test(bench_test_notes)) {
    throw new Error("FAIL: Missing diagnostic conclusion");
  }
  if (!/(component|part|failure|fault)/i.test(bench_test_notes)) {
    throw new Error("FAIL: Missing fault isolation");
  }
}

/**
 * Safety net: field-manual voice, measurements, no marketing/design/Mermaid, vertical bleed, DIY repair ban.
 * @param vertical Page vertical from slug (`HVAC`, `Plumbing`, `Electrical`).
 */
export function validatePage(content: unknown, vertical: string): true {
  if (!content || typeof content !== "object") {
    throw new Error("Missing content object");
  }
  const c = content as Record<string, unknown>;

  if (!isHsdDiagnosticFlowGraph(c.diagnostic_flow)) {
    throw new Error("Missing or invalid diagnostic_flow (structured graph required)");
  }

  assertNoRawMermaidStored(c);
  assertVerticalBleed(c, vertical);

  const text = flattenedModelStrings(c);
  const lower = text.toLowerCase();
  const v = normVertical(vertical);

  assertRejectCallNowOrActFast(text);
  assertDegFPsiOrVoltagePresent(text);
  assertNoMarketingVoice(text);
  assertNoDesignLanguage(text);
  assertNoGenericAdvice(text);
  assertFieldMeasurements(c, vertical);
  assertDiagnosticReasoning(diagnosticReasoningText(c));
  assertInternalLinksDensity(c.internal_links, vertical);
  if (v === "hvac" || v === "plumbing" || v === "electrical") {
    assertTradeInternalLinksSlugFormat(vertical, c.internal_links);
  }
  if (v === "hvac") {
    assertHardAuthority(c);
  } else {
    assertBranchingDensity(text);
    assertReplaceVsRepairHardRules(c.replace_vs_repair);
    assertBenchTestNotesHardRules(c.bench_test_notes);
  }

  if (v === "hvac") {
    const required = [
      "low charge equals a leak",
      "refrigerant is not consumed",
      "forces the compressor outside its design limits",
      "Stop.",
      "Professional diagnosis is not optional",
    ];
    for (const phrase of required) {
      if (!lower.includes(phrase.toLowerCase())) {
        throw new Error(`Missing required phrase: ${phrase}`);
      }
    }
    // Compiler token (verbatim substring after lowercasing) — production injects via injectRequiredHvacCompilerTokens.
    if (!lower.includes(HVAC_VERBATIM_DECISION_PARAGRAPH)) {
      throw new Error(
        "Missing required decision paragraph (HVAC locked text) — include verbatim in diagnostic_steps and/or how_system_works."
      );
    }
    if (!lower.includes(HVAC_VERBATIM_COST_PRESSURE)) {
      throw new Error(
        "Missing required cost-pressure sentence — include verbatim in diagnostic_steps and/or how_system_works."
      );
    }
    if (!lower.includes(HVAC_VERBATIM_COMPRESSOR_LINE)) {
      throw new Error(
        "Missing required compressor escalation line — include verbatim in diagnostic_steps, top_causes, or how_system_works."
      );
    }
    if (!lower.includes("fan running") || !lower.includes("system working")) {
      throw new Error(
        'HVAC copy must contrast partial operation (e.g. "fan running" vs system working) in diagnostic_steps, top_causes, or how_system_works.'
      );
    }
  } else if (v === "plumbing") {
    if (!lower.includes("professional diagnosis is not optional")) {
      throw new Error("Missing required phrase: Professional diagnosis is not optional");
    }
    if (!lower.includes("stop.")) {
      throw new Error('Missing required token: Stop.');
    }
    const plumbingSignals = [
      "pressure",
      "valve",
      "drain",
      "supply",
      "fixture",
      "sediment",
      "heater",
      "pipe",
    ];
    if (!plumbingSignals.some((s) => lower.includes(s))) {
      throw new Error(
        "Plumbing copy must reference real plumbing mechanics (e.g. pressure, valve, drain, supply, fixture, sediment, heater, pipe)."
      );
    }
  } else if (v === "electrical") {
    if (!lower.includes("professional diagnosis is not optional")) {
      throw new Error("Missing required phrase: Professional diagnosis is not optional");
    }
    if (!lower.includes("stop.")) {
      throw new Error('Missing required token: Stop.');
    }
    const electricalSignals = ["breaker", "panel", "voltage", "circuit", "ground", "arc", "overload"];
    if (!electricalSignals.some((s) => lower.includes(s))) {
      throw new Error(
        "Electrical copy must reference real electrical mechanics (e.g. breaker, panel, voltage, circuit, ground, arc, overload)."
      );
    }
  }

  const forbidden = [
    "step 1",
    "turn off power",
    "remove the capacitor",
    "use a screwdriver",
  ];
  for (const word of forbidden) {
    if (lower.includes(word)) {
      throw new Error(`DIY instruction detected: ${word}`);
    }
  }

  assertDecisionPressure(c, text);

  return true;
}
