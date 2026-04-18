import { HSD_LOCKED_BODY_KEYS } from "./constants";
import { isHsdDiagnosticFlowGraph } from "./diagnosticFlowGraph";

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
  const keys = ["problem_overview", "decision_tree", "field_insight", "cost_matrix", "top_causes"] as const;
  return keys.map((k) => stringField(c, k)).join("\n");
}

function stringField(data: Record<string, unknown>, key: string): string {
  return typeof data[key] === "string" ? (data[key] as string) : "";
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
  const hasBranch =
    /\bif\b[\s\S]{0,600}\b(then|→|->)\b/i.test(blob) ||
    (/\bif\b/.test(blob) && /\blikely\b/.test(blob)) ||
    /\bwhen\b[\s\S]{0,600}\b(then|→|->)\b/i.test(blob);
  if (!hasBranch) {
    throw new Error('Include explicit diagnostic branching (e.g. "If X → …" / "When Y, then …") in decision_tree or top_causes.');
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

  assertRejectCallNowOrActFast(text);
  assertDegFPsiOrVoltagePresent(text);
  assertNoMarketingVoice(text);
  assertNoDesignLanguage(text);
  assertNoGenericAdvice(text);
  assertFieldMeasurements(c, vertical);
  assertDiagnosticReasoning(`${stringField(c, "decision_tree")}\n${stringField(c, "top_causes")}`);

  const v = normVertical(vertical);
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
    const dm =
      "if airflow, thermostat, and power are confirmed and the system still is not cooling, the fault is no longer superficial. continuing to run the system is what turns a manageable repair into a major failure";
    if (!lower.includes(dm)) {
      throw new Error("Missing required decision_moment paragraph (HVAC locked text).");
    }
    const cp =
      "what starts as a minor repair can become a multi-thousand-dollar failure when the system continues running under fault";
    if (!lower.includes(cp)) {
      throw new Error("Missing required cost_pressure sentence.");
    }
    const fi = "this is how minor complaints turn into compressor failures";
    if (!lower.includes(fi)) {
      throw new Error("Missing required field_insight compressor escalation line.");
    }
    if (!lower.includes("fan running") || !lower.includes("system working")) {
      throw new Error('field_insight must contrast partial operation (e.g. "fan running" vs system working).');
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

  return true;
}
