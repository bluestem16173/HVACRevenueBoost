import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";
import {
  LOCKED_AC_NOT_COOLING_HEADLINE,
  isAcNotCoolingCitySlug,
} from "@/lib/hsd/lockedAcNotCoolingHeadline";
import { HSDV25Schema, type HsdV25Payload } from "@/src/lib/validation/hsdV25Schema";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

const DEFAULT_FINAL_WARNING =
  "AC systems do not recover from strain — they fail.\n\nSmall cooling problems become expensive repairs when the equipment is forced to keep running under load. Past that point you are buying compressor and coil failures that commonly run $1,500–$3,500.";

const DEFAULT_CTA_FALLBACK =
  "If the system still misbehaves after basic checks, do not keep forcing runtime under fault conditions — secondary damage stacks fast. Book a licensed technician before repairs cross $1,500 and climb toward $3,000-class failures.";

function defaultCtaAcNotCooling(slug: string): string {
  const seg = slug.split("/").filter(Boolean)[2] ?? "";
  const city = seg ? formatCityPathSegmentForDisplay(seg) : "Tampa";
  return `If your AC is still not cooling, stop running it.\n\nIn ${city} heat, systems fail faster under continuous load. What starts as a small issue quickly becomes compressor damage.\n\n→ Request service now before this becomes a $3,000 repair.`;
}

const DEFAULT_WHAT_THIS_MEANS =
  "When the equipment runs but comfort drifts, the system is still moving air but failing to remove heat.\n\nThat means airflow, refrigerant charge, control logic, or compressor load is outside normal operating range. At that point, wear accelerates until a major component fails.";

const DEFAULT_REPAIR_MATRIX_INTRO =
  "Most AC failures start as airflow or control issues. Once refrigerant or compressor problems appear, costs increase quickly.";

const DEFAULT_DECISION_FOOTER =
  "At this point, continuing to run the system risks compressor failure.";

const DEFAULT_CANONICAL: [string, string] = [
  "Airflow problems don't stay small — restriction leads to strain, and strain leads to failure.",
  "Refrigerant is not consumed — loss means a leak.",
];

const DEFAULT_FLOW_LINES = [
  "Symptom still present after basic checks:",
  "→ Controls and thermostat path first",
  "→ Airflow and coil loading second",
  "→ Sealed refrigerant or compressor third",
];

const DEFAULT_DECISION_TREE = [
  "Is airflow strong at registers? → No → filter, blower, coil face, or ducts",
  "Is the thermostat calling for cooling? → No → mode, setpoint, wiring, or control fault",
  "Does cooling return after basics? → No → licensed refrigerant and compressor diagnosis",
];

const DEFAULT_TOOLS = ["multimeter", "manifold gauges", "coil cleaner"];

/** Default Quick Diagnosis ladder when `quick_table` is thin (HVAC cooling pattern). */
const DEFAULT_QUICK_TABLE_ROWS: { symptom: string; cause: string; fix: string }[] = [
  { symptom: "Weak airflow", cause: "Dirty filter", fix: "Replace filter" },
  { symptom: "Ice on lines", cause: "Frozen evaporator", fix: "Thaw + restore airflow" },
  { symptom: "Fan runs, no cooling", cause: "Refrigerant leak", fix: "Leak repair + recharge" },
  { symptom: "No cooling at all", cause: "Compressor issue", fix: "Professional diagnosis" },
];

const DEFAULT_QUICK_CHECKS: {
  check: string;
  homeowner: string;
  result_meaning: string;
  next_step: string;
  risk: string;
}[] = [
  {
    check: "Check thermostat settings.",
    homeowner: '→ Set to "cool" and below room temperature.',
    result_meaning: "→ If settings are wrong, the system never receives a real cooling call.",
    next_step: "→ If settings are correct and cooling still does not return, move past controls.",
    risk: "→ If ignored: thermostat or control faults usually turn into $200–$500 repairs.",
  },
  {
    check: "Check air filter and return path.",
    homeowner: "→ Dirty filter or blocked return chokes airflow at the coil.",
    result_meaning: "→ Replace filter, confirm registers open, then recheck supply temperature.",
    next_step: "→ If airflow stays weak after filter service, stop guessing past occupancy-side fixes.",
    risk: "→ If ignored: coil freeze and compressor strain — repairs often exceed $1,500.",
  },
  {
    check: "Check for refrigerant leaks.",
    homeowner: "→ Look for ice on the evaporator coil or hissing at the indoor or outdoor section.",
    result_meaning: "→ Refrigerant is not consumed — loss means a leak.",
    next_step: "→ If suspected, stop guessing and schedule licensed service.",
    risk: "→ If ignored: low charge forces longer run cycles and compressor strain, often leading to $1,500+ repairs.",
  },
];

const DEFAULT_DIAGNOSTIC_STEPS: {
  step: string;
  homeowner: string;
  pro: string;
  risk: string;
}[] = [
  {
    step: "Verify thermostat operation.",
    homeowner: "→ Confirm display, mode, and setpoint.",
    pro: "→ Check wiring and calibration.",
    risk: "→ If defective: thermostat failure usually runs $200–$400.",
  },
  {
    step: "Inspect evaporator and condenser coils.",
    homeowner: "→ Look for ice, dirt loading, or blocked airflow.",
    pro: "→ Clean or service coils as needed.",
    risk: "→ If ignored: airflow restriction leads to strain, and strain leads to failure.",
  },
  {
    step: "Test refrigerant levels.",
    homeowner: "→ Compare actual cooling against demand.",
    pro: "→ Measure pressures and operating conditions with gauges.",
    risk: '→ Low refrigerant means leak repair, not "topping off," and usually starts at $500–$1,500.',
  },
];

const FALLBACK_DIAGNOSTIC_FLOW = {
  nodes: [
    { id: "n1", label: "Symptom confirmed under load" },
    { id: "n2", label: "Controls and airflow path" },
    { id: "n3", label: "Heat exchange and charge signs" },
    { id: "n4", label: "Compressor / sealed system" },
  ],
  edges: [
    { from: "n1", to: "n2", label: "Start here" },
    { from: "n2", to: "n3", label: "If basics ruled in" },
    { from: "n3", to: "n4", label: "If temps still flat" },
  ],
};

const DEFAULT_COST_ESCALATION: { stage: string; description: string; cost: string }[] = [
  { stage: "Basic fix", description: "Filter or thermostat", cost: "$20–$100" },
  { stage: "Moderate repair", description: "Airflow or electrical", cost: "$300–$800" },
  { stage: "Major repair", description: "Refrigerant leak", cost: "$500–$1,500" },
  { stage: "Failure", description: "Compressor damage", cost: "$1,500–$3,500+" },
];

const DEFAULT_REPAIR_MATRIX: {
  issue: string;
  fix: string;
  cost_min: number;
  cost_max: number;
  difficulty: "easy" | "moderate" | "pro";
}[] = [
  { issue: "Thermostat — no signal", fix: "replace", cost_min: 200, cost_max: 400, difficulty: "moderate" },
  { issue: "Filter — airflow restriction", fix: "replace", cost_min: 20, cost_max: 50, difficulty: "easy" },
  { issue: "Refrigerant — leak", fix: "repair", cost_min: 500, cost_max: 1500, difficulty: "pro" },
  { issue: "Compressor — failure", fix: "replace", cost_min: 1200, cost_max: 2500, difficulty: "pro" },
];

const DEFAULT_DECISION: { safe: string[]; call_pro: string[]; stop_now: string[] } = {
  safe: ["Replace filter", "Check thermostat"],
  call_pro: ["Cooling does not return after basic checks", "System runs continuously"],
  stop_now: [
    "Shut the system off if ice is forming, the compressor is grinding, or you smell burning insulation.",
    "If the system runs continuously without cooling, stop forcing runtime — that is how compressor failures happen.",
  ],
};

function mergeStringList(existing: string[], defaults: string[], min: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of existing) {
    const t = String(x ?? "").trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  for (const d of defaults) {
    if (out.length >= min) break;
    const t = d.trim();
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  let k = 0;
  while (out.length < min && defaults.length > 0) {
    out.push(defaults[k % defaults.length]!.trim());
    k += 1;
  }
  return out;
}

function padStringMin(s: string, min: string, minLen: number): string {
  const t = String(s ?? "").trim();
  if (t.length >= minLen) return t;
  return `${t}${t ? " " : ""}${min}`.trim();
}

/**
 * When stored `hsd_v2` JSON predates strict v2.5 Zod (e.g. 3-row cost escalation, short final_warning),
 * patch a **cloned** object so {@link HSDV25Schema} accepts it for **read-time** rendering only.
 * Does not run {@link assertHsdV25ContentRules} — publish workers still enforce full authority.
 */
export function coerceHsdJsonForV25View(raw: Record<string, unknown>): HsdV25Payload | null {
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (o.page_type !== "city_symptom" || o.schema_version !== "hsd_v2") {
    return null;
  }

  const slugStr = String(o.slug ?? "").trim();

  const s30 = asRecord(o.summary_30s);
  if (!s30 || !Array.isArray(s30.top_causes)) return null;

  if (isAcNotCoolingCitySlug(slugStr)) {
    s30.headline = LOCKED_AC_NOT_COOLING_HEADLINE;
  } else {
    let headline = String(s30.headline ?? "").trim();
    if (headline.length < 50) {
      headline = padStringMin(
        headline,
        "Start with filter, thermostat, and airflow before sealed-system work—call a licensed technician if symptoms persist.",
        50
      );
    }
    s30.headline = headline;
  }

  let coreTruth = String(s30.core_truth ?? "").trim();
  if (isAcNotCoolingCitySlug(slugStr)) {
    const seg = slugStr.split("/").filter(Boolean)[2] ?? "";
    const cityPretty = seg ? formatCityPathSegmentForDisplay(seg) : "Local";
    const goldOpening = `If the system is running but not cooling, it is failing to remove heat.\n\nIn ${cityPretty} heat, that usually means airflow restriction, refrigerant loss, or compressor trouble. Once the system keeps running under load, component stress builds quickly.\n\nIgnoring it is how a small cooling problem turns into a $1,500–$3,500 repair.`;
    if (coreTruth.length < 120) coreTruth = goldOpening;
  }
  if (coreTruth.length < 70) {
    coreTruth = padStringMin(
      coreTruth,
      "This leads to longer runtimes, higher utility draw, and mechanical stress that turns a nuisance into a major repair when ignored.",
      70
    );
  }
  s30.core_truth = coreTruth;

  let risk = String(s30.risk_warning ?? "").trim();
  if (risk.length < 45 || !risk.includes("$")) {
    risk = padStringMin(
      risk,
      "Ignoring the pattern forces coil stress, compressor overload, and typical repair bands of $1,500–$3,500 once major parts fail.",
      45
    );
  }
  s30.risk_warning = risk;

  let flowLines = Array.isArray(s30.flow_lines)
    ? (s30.flow_lines as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  if (flowLines.length === 0) {
    flowLines = [...DEFAULT_FLOW_LINES];
  } else {
    while (flowLines.length < 4) {
      flowLines.push("→ If branches disagree, stop DIY and call a licensed technician for measured diagnosis.");
    }
  }
  s30.flow_lines = flowLines;

  const causes = (s30.top_causes as unknown[]).map((c) => asRecord(c));
  while (causes.length < 3) {
    causes.push({
      label: "Upstream load or control issue",
      probability: "Requires measurement",
      deep_dive:
        "When basics are uncertain, a licensed technician verifies airflow, temperatures, and electrical control before sealed-system work.",
    });
  }
  s30.top_causes = causes.map((c) => ({
    label: String(c.label ?? "Cause"),
    probability: String(c.probability ?? "See technician"),
    deep_dive: String(c.deep_dive ?? ""),
  }));

  o.summary_30s = s30;

  let wtm = String(o.what_this_means ?? "").trim();
  if (wtm.length < 100) wtm = DEFAULT_WHAT_THIS_MEANS;
  o.what_this_means = wtm;

  let rmi = String(o.repair_matrix_intro ?? "").trim();
  if (rmi.length < 50) rmi = DEFAULT_REPAIR_MATRIX_INTRO;
  o.repair_matrix_intro = rmi;

  let df = String(o.decision_footer ?? "").trim();
  if (df.length < 35) df = DEFAULT_DECISION_FOOTER;
  o.decision_footer = df;

  let ct = Array.isArray(o.canonical_truths)
    ? (o.canonical_truths as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  if (ct.length < 1) ct = [DEFAULT_CANONICAL[0]];
  if (ct.length < 2) ct = [ct[0] ?? DEFAULT_CANONICAL[0], DEFAULT_CANONICAL[1]];
  o.canonical_truths = ct.slice(0, 2);

  let ce = Array.isArray(o.cost_escalation) ? [...(o.cost_escalation as unknown[])] : [];
  for (let i = ce.length; i < 4; i++) {
    ce.push({ ...DEFAULT_COST_ESCALATION[i]! });
  }
  o.cost_escalation = ce.map((row) => {
    const r = asRecord(row);
    return {
      stage: String(r.stage ?? "Stage"),
      description: String(r.description ?? ""),
      cost: String(r.cost ?? ""),
    };
  });

  let fw = String(o.final_warning ?? "").trim();
  if (fw.length < 60) fw = DEFAULT_FINAL_WARNING;
  o.final_warning = fw;

  let cta = String(o.cta ?? "").trim();
  if (cta.length < 45) {
    cta = isAcNotCoolingCitySlug(slugStr) ? defaultCtaAcNotCooling(slugStr) : DEFAULT_CTA_FALLBACK;
  }
  o.cta = cta;

  let dtree = Array.isArray(o.decision_tree_text)
    ? (o.decision_tree_text as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  if (dtree.length < 3) dtree = [...DEFAULT_DECISION_TREE];
  o.decision_tree_text = dtree;

  let tools = Array.isArray(o.tools)
    ? (o.tools as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  if (tools.length < 3) tools = [...DEFAULT_TOOLS];
  o.tools = tools;

  let qt = Array.isArray(o.quick_table) ? [...(o.quick_table as unknown[])] : [];
  for (let i = qt.length; i < 4; i++) {
    qt.push(DEFAULT_QUICK_TABLE_ROWS[i]!);
  }
  o.quick_table = qt.map((row) => {
    const r = asRecord(row);
    return {
      symptom: String(r.symptom ?? ""),
      cause: String(r.cause ?? ""),
      fix: String(r.fix ?? ""),
    };
  });

  let qc = Array.isArray(o.quick_checks) ? [...(o.quick_checks as unknown[])] : [];
  for (let i = qc.length; i < 3; i++) {
    qc.push(DEFAULT_QUICK_CHECKS[i]!);
  }
  o.quick_checks = qc.map((row) => {
    const r = asRecord(row);
    return {
      check: String(r.check ?? ""),
      homeowner: String(r.homeowner ?? ""),
      result_meaning: String(r.result_meaning ?? ""),
      next_step: String(r.next_step ?? ""),
      risk: String(r.risk ?? ""),
    };
  });

  let ds = Array.isArray(o.diagnostic_steps) ? [...(o.diagnostic_steps as unknown[])] : [];
  for (let i = ds.length; i < 3; i++) {
    ds.push(DEFAULT_DIAGNOSTIC_STEPS[i]!);
  }
  o.diagnostic_steps = ds.map((row) => {
    const r = asRecord(row);
    return {
      step: String(r.step ?? ""),
      homeowner: String(r.homeowner ?? ""),
      pro: String(r.pro ?? ""),
      risk: String(r.risk ?? ""),
    };
  });

  const flow = asRecord(o.diagnostic_flow);
  const nodes = Array.isArray(flow.nodes) ? flow.nodes : [];
  const edges = Array.isArray(flow.edges) ? flow.edges : [];
  const ids = new Set(
    nodes.map((n) => String(asRecord(n).id ?? "").trim()).filter(Boolean)
  );
  let edgesOk =
    edges.length >= 3 &&
    edges.every((e) => {
      const ed = asRecord(e);
      return ids.has(String(ed.from ?? "").trim()) && ids.has(String(ed.to ?? "").trim());
    });
  if (nodes.length < 4 || !edgesOk) {
    o.diagnostic_flow = FALLBACK_DIAGNOSTIC_FLOW;
  }

  function normalizeDifficulty(v: unknown, fb: "easy" | "moderate" | "pro"): "easy" | "moderate" | "pro" {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "easy" || s === "moderate" || s === "pro") return s;
    return fb;
  }

  let rm = Array.isArray(o.repair_matrix) ? [...(o.repair_matrix as unknown[])] : [];
  for (let i = rm.length; i < 4; i++) {
    rm.push({ ...DEFAULT_REPAIR_MATRIX[i]! });
  }
  o.repair_matrix = rm.map((row, i) => {
    const r = asRecord(row);
    const fb = DEFAULT_REPAIR_MATRIX[Math.min(i, 3)]!;
    const costMin = Number(r.cost_min);
    const costMax = Number(r.cost_max);
    return {
      issue: String(r.issue ?? "").trim() || fb.issue,
      fix: String(r.fix ?? "").trim() || fb.fix,
      cost_min: Number.isFinite(costMin) ? costMin : fb.cost_min,
      cost_max: Number.isFinite(costMax) ? costMax : fb.cost_max,
      difficulty: normalizeDifficulty(r.difficulty, fb.difficulty),
    };
  });

  const decIn = asRecord(o.decision);
  const strList = (v: unknown) =>
    Array.isArray(v) ? (v as unknown[]).map((x) => String(x ?? "").trim()) : [];
  o.decision = {
    safe: mergeStringList(strList(decIn.safe), DEFAULT_DECISION.safe, 2),
    call_pro: mergeStringList(strList(decIn.call_pro), DEFAULT_DECISION.call_pro, 2),
    stop_now: mergeStringList(strList(decIn.stop_now), DEFAULT_DECISION.stop_now, 2),
  };

  const parsed = HSDV25Schema.safeParse(o);
  return parsed.success ? parsed.data : null;
}
