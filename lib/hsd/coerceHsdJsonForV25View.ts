import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";
import { electricalPublishGuardHit } from "@/lib/hsd/assertVerticalContentIsolation";
import { applyBreakerKeepsTrippingMoneyToSummary30s } from "@/lib/hsd/breakerKeepsTrippingMoneyCopy";
import { applyDedupeLinesPassToHsdJson } from "@/lib/hsd/dedupeHsdMultilineFields";
import { injectProgrammaticHsdCtas } from "@/lib/hsd/injectProgrammaticHsdCtas";
import { applyQuickChecksLabelNormalizationToHsdJson } from "@/lib/hsd/normalizeHsdQuickChecksLabels";
import {
  LOCKED_AC_NOT_COOLING_HEADLINE,
  isAcNotCoolingCitySlug,
} from "@/lib/hsd/lockedAcNotCoolingHeadline";
import { HSDV25Schema, type HsdV25Payload } from "@/src/lib/validation/hsdV25Schema";
import { enforceStoredSlug } from "@/lib/slug-utils";

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

const ELECTRICAL_DEFAULT_CANONICAL: [string, string] = [
  "Localized power loss usually tracks to one branch before it becomes a panel-wide fault.",
  "Breakers trip to protect wiring — repeat resets without finding the load fault compound damage.",
];

const ELECTRICAL_DEFAULT_FLOW_LINES = [
  "Start here:",
  "Whole room out → breaker or circuit issue",
  "One outlet dead → device or wiring failure",
  "Lights flickering → loose connection or load issue",
];

const ELECTRICAL_DEFAULT_TOOLS = [
  "Check the breaker and panel for faults",
  "Test voltage at outlets and switches",
  "Isolate which part of the circuit is causing the trip",
  "Inspect wiring connections for looseness or heat damage",
];

const ELECTRICAL_DEFAULT_WTM =
  "Power loss in part of the home is usually a branch issue: a trip, a dead device, or a loose connection on that circuit.\n\nUnder Florida humidity, oxidation at lugs and stab connections accelerates—small resistance becomes heat, then nuisance trips or voltage collapse at the farthest outlets.";

const ELECTRICAL_DEFAULT_RMI =
  "Small fixes stay on the occupancy side; once you are in the panel, feeders, or hidden homeruns under load, costs jump fast.";

const ELECTRICAL_DEFAULT_DECISION_FOOTER =
  "At this point, repeated resets or hot metal at the panel risks arcing damage—call a licensed electrician before the fault spreads.";

const ELECTRICAL_DEFAULT_FINAL_WARNING =
  "Electrical faults do not self-heal under load.\n\nRepeat trips, heat at devices, or buzzing panels usually mean resistance or arc risk is already building. Past that point you are buying feeder and panel repairs that commonly run $1,500–$4,000.";

const ELECTRICAL_DEFAULT_COST_ESCALATION: { stage: string; description: string; cost: string }[] = [
  { stage: "Basic fix", description: "Device reset or outlet swap", cost: "$75–$200" },
  { stage: "Moderate repair", description: "Branch and GFCI work", cost: "$300–$900" },
  { stage: "Major repair", description: "Panel and feeder corrections", cost: "$900–$2,500" },
  { stage: "Failure", description: "Rewire or damage spread", cost: "$2,500–$6,000+" },
];

const ELECTRICAL_DEFAULT_DECISION_TREE = [
  "Is the whole room dead while other rooms work? → Yes → breaker, GFCI, or branch fault path",
  "Is a single outlet dead but neighbors work? → Yes → device or connection failure path",
  "Do lights flicker under kitchen or laundry load? → Yes → loose connection or overloaded branch path",
];

const ELECTRICAL_DEFAULT_QUICK_TABLE_ROWS: { symptom: string; cause: string; fix: string }[] = [
  { symptom: "Whole room dead", cause: "Tripped breaker or GFCI", fix: "Reset once; if repeats, stop" },
  { symptom: "Single outlet dead", cause: "Failed device or loose stab", fix: "Replace device or secure connection" },
  { symptom: "Lights flicker", cause: "Loose neutral or overload", fix: "Reduce load; call pro if heat or smell" },
  { symptom: "Breaker trips on reset", cause: "Hard fault or overload", fix: "Do not keep resetting — call electrician" },
];

const ELECTRICAL_DEFAULT_QUICK_CHECKS: {
  check: string;
  homeowner: string;
  result_meaning: string;
  next_step: string;
  risk: string;
}[] = [
  {
    check: "Check breaker position for the room circuit.",
    homeowner: "→ Flip fully off, then on once; note if it trips again immediately.",
    result_meaning: "→ Instant trip usually means a hard fault or dead short on the branch.",
    next_step: "→ If it trips again, stop resetting and move to call-a-pro.",
    risk: "→ Repeat resets under fault can damage breakers and wiring—typical correction often lands $300–$900.",
  },
  {
    check: "Test GFCI reset on the circuit.",
    homeowner: "→ Press test, then reset; verify downstream outlets return.",
    result_meaning: "→ If GFCI will not hold, the protection path or a downstream device is suspect.",
    next_step: "→ If bathrooms or kitchen legs are involved, map what is downstream before swapping parts.",
    risk: "→ Ignored ground faults can energize unintended paths—repairs commonly run $200–$800.",
  },
  {
    check: "Scan outlets for heat, smell, or discoloration.",
    homeowner: "→ Feel cover plates lightly; look for brown marks or buzz.",
    result_meaning: "→ Heat or odor means resistance is already present at a connection.",
    next_step: "→ Shut the breaker off and call a licensed electrician for torque and insulation checks.",
    risk: "→ Arcing faults escalate fast—panel-level repairs often exceed $1,500 once feeders are involved.",
  },
];

const ELECTRICAL_DEFAULT_DIAGNOSTIC_STEPS: {
  step: string;
  homeowner: string;
  pro: string;
  risk: string;
}[] = [
  {
    step: "Verify which devices lost power together.",
    homeowner: "→ List outlets and switches on the same wall or room circuit.",
    pro: "→ Map branch layout and identify the breaker that should feed that string.",
    risk: "→ If the pattern jumps rooms randomly, you may be past DIY triage—mis-mapped branches often exceed $500 once traced.",
  },
  {
    step: "Inspect the breaker handle and bus for heat signs.",
    homeowner: "→ Look and listen only—do not remove the cover without training.",
    pro: "→ Measure lug torque and thermal rise under controlled load when safe.",
    risk: "→ Hot breakers or buzzing buses indicate arcing risk—damage can pass $2,000 if ignored.",
  },
  {
    step: "Confirm GFCI protection on required circuits.",
    homeowner: "→ Reset once; if it trips again, unplug loads and retry.",
    pro: "→ Split downstream halves to isolate a leaking appliance or neutral fault.",
    risk: "→ Chronic nuisance trips mask real ground faults—professional isolation commonly runs $300–$1,200.",
  },
];

const ELECTRICAL_DEFAULT_REPAIR_MATRIX: {
  issue: string;
  fix: string;
  cost_min: number;
  cost_max: number;
  difficulty: "easy" | "moderate" | "pro";
}[] = [
  { issue: "Outlet — failed device", fix: "replace", cost_min: 75, cost_max: 225, difficulty: "easy" },
  { issue: "Breaker — nuisance trip", fix: "diagnose load", cost_min: 150, cost_max: 450, difficulty: "moderate" },
  { issue: "GFCI — ground fault path", fix: "trace and repair", cost_min: 200, cost_max: 650, difficulty: "pro" },
  { issue: "Feeder — damaged branch", fix: "rewire scope", cost_min: 900, cost_max: 2800, difficulty: "pro" },
];

const ELECTRICAL_DEFAULT_DECISION: { safe: string[]; call_pro: string[]; stop_now: string[] } = {
  safe: ["Reset GFCI once if it trips", "Identify which outlets share the dead circuit"],
  call_pro: ["Power loss crosses multiple rooms", "Any burning smell or hot breakers"],
  stop_now: [
    "Shut the circuit off if you smell burning or hear buzzing at the panel.",
    "If a breaker trips again immediately after reset, do not keep resetting.",
  ],
};

const ELECTRICAL_FALLBACK_DIAGNOSTIC_FLOW = {
  nodes: [
    { id: "e1", label: "Symptom localized to one branch" },
    { id: "e2", label: "Breaker and GFCI path" },
    { id: "e3", label: "Device and connection integrity" },
    { id: "e4", label: "Hidden homerun or panel work" },
  ],
  edges: [
    { from: "e1", to: "e2", label: "Start here" },
    { from: "e2", to: "e3", label: "If reset rules branch in" },
    { from: "e3", to: "e4", label: "If fault persists under load" },
  ],
};

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

/** Default Quick checks ladder when `quick_table` is thin (HVAC cooling pattern). */
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
 * Does not run {@link assertHsdV26AuthorityRules} — publish / upsert paths still enforce full authority before save.
 */
export function coerceHsdJsonForV25View(raw: Record<string, unknown>): HsdV25Payload | null {
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (
    (o.page_type !== "city_symptom" && o.page_type !== "hsd") ||
    o.schema_version !== "hsd_v2"
  ) {
    return null;
  }

  const slugStr = String(o.slug ?? "").trim();
  const slugNorm = enforceStoredSlug(slugStr).toLowerCase();
  const isElectricalSlug = slugNorm.startsWith("electrical/");

  const s30 = asRecord(o.summary_30s);
  if (!s30 || !Array.isArray(s30.top_causes)) return null;

  if (isAcNotCoolingCitySlug(slugStr)) {
    s30.headline = LOCKED_AC_NOT_COOLING_HEADLINE;
  } else {
    let headline = String(s30.headline ?? "").trim();
    if (headline.length < 50) {
      headline = padStringMin(
        headline,
        isElectricalSlug
          ? "Follow the scan lines in order, then run quick checks before you reset breakers again or open devices—call a licensed electrician if trips repeat or anything feels hot."
          : "Start with filter, thermostat, and airflow before sealed-system work—call a licensed technician if symptoms persist.",
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
      isElectricalSlug
        ? "Branch symptoms often start small: a weak device, a dim pattern, or a trip only under load. Under humidity, connection resistance grows until the breaker does its job—or the fault spreads upstream."
        : "This leads to longer runtimes, higher utility draw, and mechanical stress that turns a nuisance into a major repair when ignored.",
      70
    );
  }
  s30.core_truth = coreTruth;

  let risk = String(s30.risk_warning ?? "").trim();
  if (isElectricalSlug) {
    if (risk.length < 45 || !risk.includes("$") || electricalPublishGuardHit(risk)) {
      risk = padStringMin(
        risk,
        "Heat at the breaker, buzzing breakers, or repeat trips under normal load often precede arcing damage—letting it ride commonly pushes repair scope past $800 and toward $2,500 once feeders or devices need replacement.",
        45
      );
    }
  } else if (risk.length < 45 || !risk.includes("$")) {
    risk = padStringMin(
      risk,
      "Ignoring the pattern forces coil stress, compressor overload, and typical repair costs of $1,500–$3,500 once major parts fail.",
      45
    );
  }
  s30.risk_warning = risk;

  let flowLines = Array.isArray(s30.flow_lines)
    ? (s30.flow_lines as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  if (isElectricalSlug) {
    if (flowLines.length === 0 || flowLines.length < 3 || electricalPublishGuardHit(flowLines.join("\n"))) {
      flowLines = [...ELECTRICAL_DEFAULT_FLOW_LINES];
    } else {
      while (flowLines.length < 3) {
        flowLines.push(
          "→ Pattern unclear under safe observation → intermittent fault class",
        );
      }
    }
  } else if (flowLines.length === 0) {
    flowLines = [...DEFAULT_FLOW_LINES];
  } else {
    while (flowLines.length < 3) {
      flowLines.push("→ If branches disagree, stop DIY and call a licensed technician for measured diagnosis.");
    }
  }
  s30.flow_lines = flowLines;

  const causes = (s30.top_causes as unknown[]).map((c) => asRecord(c));
  while (causes.length < 3) {
    causes.push(
      isElectricalSlug
        ? {
            label: "Branch fault under load",
            probability: "High when trips repeat",
            deep_dive:
              "Most branch faults show up as heat at the device, breaker, or neutral connection. A licensed electrician verifies voltage under load and connection integrity before replacement so the same fault does not return.",
          }
        : {
            label: "Upstream load or control issue",
            probability: "Requires measurement",
            deep_dive:
              "When basics are uncertain, a licensed technician verifies airflow, temperatures, and electrical control before sealed-system work.",
          },
    );
  }
  s30.top_causes = causes.map((c) => ({
    label: String(c.label ?? "Cause"),
    probability: String(c.probability ?? "See technician"),
    deep_dive: String(c.deep_dive ?? ""),
  }));

  applyBreakerKeepsTrippingMoneyToSummary30s(s30, slugStr);

  o.summary_30s = s30;

  let wtm = String(o.what_this_means ?? "").trim();
  if (wtm.length < 100) wtm = isElectricalSlug ? ELECTRICAL_DEFAULT_WTM : DEFAULT_WHAT_THIS_MEANS;
  o.what_this_means = wtm;

  let rmi = String(o.repair_matrix_intro ?? "").trim();
  if (rmi.length < 50) rmi = isElectricalSlug ? ELECTRICAL_DEFAULT_RMI : DEFAULT_REPAIR_MATRIX_INTRO;
  o.repair_matrix_intro = rmi;

  let df = String(o.decision_footer ?? "").trim();
  if (df.length < 35) df = isElectricalSlug ? ELECTRICAL_DEFAULT_DECISION_FOOTER : DEFAULT_DECISION_FOOTER;
  o.decision_footer = df;

  let ct = Array.isArray(o.canonical_truths)
    ? (o.canonical_truths as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  if (ct.length < 1) ct = [isElectricalSlug ? ELECTRICAL_DEFAULT_CANONICAL[0] : DEFAULT_CANONICAL[0]];
  if (ct.length < 2) {
    ct = [
      ct[0] ?? (isElectricalSlug ? ELECTRICAL_DEFAULT_CANONICAL[0] : DEFAULT_CANONICAL[0]),
      isElectricalSlug ? ELECTRICAL_DEFAULT_CANONICAL[1] : DEFAULT_CANONICAL[1],
    ];
  }
  o.canonical_truths = ct.slice(0, 2);
  if (isElectricalSlug && electricalPublishGuardHit((o.canonical_truths as string[]).join("\n"))) {
    o.canonical_truths = [...ELECTRICAL_DEFAULT_CANONICAL];
  }

  let ce = Array.isArray(o.cost_escalation) ? [...(o.cost_escalation as unknown[])] : [];
  const cePad = isElectricalSlug ? ELECTRICAL_DEFAULT_COST_ESCALATION : DEFAULT_COST_ESCALATION;
  for (let i = ce.length; i < 4; i++) {
    ce.push({ ...cePad[i]! });
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
  if (fw.length < 60) {
    fw = isElectricalSlug ? ELECTRICAL_DEFAULT_FINAL_WARNING : DEFAULT_FINAL_WARNING;
  }
  if (isElectricalSlug && electricalPublishGuardHit(fw)) {
    fw = ELECTRICAL_DEFAULT_FINAL_WARNING;
  }
  o.final_warning = fw;

  let cta = String(o.cta ?? "").trim();
  if (cta.length < 45) {
    cta = isAcNotCoolingCitySlug(slugStr) ? defaultCtaAcNotCooling(slugStr) : DEFAULT_CTA_FALLBACK;
  }
  o.cta = cta;

  let dtree = Array.isArray(o.decision_tree_text)
    ? (o.decision_tree_text as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  const dtreeFb = isElectricalSlug ? ELECTRICAL_DEFAULT_DECISION_TREE : DEFAULT_DECISION_TREE;
  if (dtree.length < 3) dtree = [...dtreeFb];
  if (isElectricalSlug && electricalPublishGuardHit(dtree.join("\n"))) {
    dtree = [...ELECTRICAL_DEFAULT_DECISION_TREE];
  }
  o.decision_tree_text = dtree;

  let tools = Array.isArray(o.tools)
    ? (o.tools as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  const toolsFb = isElectricalSlug ? ELECTRICAL_DEFAULT_TOOLS : DEFAULT_TOOLS;
  if (tools.length < 3) tools = [...toolsFb];
  if (isElectricalSlug && electricalPublishGuardHit(tools.join("\n"))) {
    tools = [...ELECTRICAL_DEFAULT_TOOLS];
  }
  o.tools = tools;

  const qtFb = isElectricalSlug ? ELECTRICAL_DEFAULT_QUICK_TABLE_ROWS : DEFAULT_QUICK_TABLE_ROWS;
  let qt = Array.isArray(o.quick_table) ? [...(o.quick_table as unknown[])] : [];
  for (let i = qt.length; i < 4; i++) {
    qt.push(qtFb[i]!);
  }
  o.quick_table = qt.map((row) => {
    const r = asRecord(row);
    return {
      symptom: String(r.symptom ?? ""),
      cause: String(r.cause ?? ""),
      fix: String(r.fix ?? ""),
    };
  });
  if (isElectricalSlug && electricalPublishGuardHit(JSON.stringify(o.quick_table))) {
    o.quick_table = ELECTRICAL_DEFAULT_QUICK_TABLE_ROWS.map((row) => ({ ...row }));
  }

  const qcFb = isElectricalSlug ? ELECTRICAL_DEFAULT_QUICK_CHECKS : DEFAULT_QUICK_CHECKS;
  let qc = Array.isArray(o.quick_checks) ? [...(o.quick_checks as unknown[])] : [];
  for (let i = qc.length; i < 3; i++) {
    qc.push(qcFb[i]!);
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
  if (isElectricalSlug && electricalPublishGuardHit(JSON.stringify(o.quick_checks))) {
    o.quick_checks = ELECTRICAL_DEFAULT_QUICK_CHECKS.map((row) => ({ ...row }));
  }

  const dsFb = isElectricalSlug ? ELECTRICAL_DEFAULT_DIAGNOSTIC_STEPS : DEFAULT_DIAGNOSTIC_STEPS;
  let ds = Array.isArray(o.diagnostic_steps) ? [...(o.diagnostic_steps as unknown[])] : [];
  for (let i = ds.length; i < 3; i++) {
    ds.push(dsFb[i]!);
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
  if (isElectricalSlug && electricalPublishGuardHit(JSON.stringify(o.diagnostic_steps))) {
    o.diagnostic_steps = ELECTRICAL_DEFAULT_DIAGNOSTIC_STEPS.map((row) => ({ ...row }));
  }

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
    o.diagnostic_flow = isElectricalSlug ? ELECTRICAL_FALLBACK_DIAGNOSTIC_FLOW : FALLBACK_DIAGNOSTIC_FLOW;
  } else if (isElectricalSlug && electricalPublishGuardHit(JSON.stringify(o.diagnostic_flow))) {
    o.diagnostic_flow = ELECTRICAL_FALLBACK_DIAGNOSTIC_FLOW;
  }

  function normalizeDifficulty(v: unknown, fb: "easy" | "moderate" | "pro"): "easy" | "moderate" | "pro" {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "easy" || s === "moderate" || s === "pro") return s;
    return fb;
  }

  const rmFb = isElectricalSlug ? ELECTRICAL_DEFAULT_REPAIR_MATRIX : DEFAULT_REPAIR_MATRIX;
  let rm = Array.isArray(o.repair_matrix) ? [...(o.repair_matrix as unknown[])] : [];
  for (let i = rm.length; i < 4; i++) {
    rm.push({ ...rmFb[i]! });
  }
  o.repair_matrix = rm.map((row, i) => {
    const r = asRecord(row);
    const fb = rmFb[Math.min(i, 3)]!;
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
  if (isElectricalSlug && electricalPublishGuardHit(JSON.stringify(o.repair_matrix))) {
    o.repair_matrix = ELECTRICAL_DEFAULT_REPAIR_MATRIX.map((row) => ({
      issue: row.issue,
      fix: row.fix,
      cost_min: row.cost_min,
      cost_max: row.cost_max,
      difficulty: row.difficulty,
    }));
  }

  const decIn = asRecord(o.decision);
  const strList = (v: unknown) =>
    Array.isArray(v) ? (v as unknown[]).map((x) => String(x ?? "").trim()) : [];
  const decDef = isElectricalSlug ? ELECTRICAL_DEFAULT_DECISION : DEFAULT_DECISION;
  o.decision = {
    safe: mergeStringList(strList(decIn.safe), decDef.safe, 2),
    call_pro: mergeStringList(strList(decIn.call_pro), decDef.call_pro, 2),
    stop_now: mergeStringList(strList(decIn.stop_now), decDef.stop_now, 2),
  };
  if (isElectricalSlug && electricalPublishGuardHit(JSON.stringify(o.decision))) {
    o.decision = {
      safe: [...ELECTRICAL_DEFAULT_DECISION.safe],
      call_pro: [...ELECTRICAL_DEFAULT_DECISION.call_pro],
      stop_now: [...ELECTRICAL_DEFAULT_DECISION.stop_now],
    };
  }

  applyDedupeLinesPassToHsdJson(o);
  applyQuickChecksLabelNormalizationToHsdJson(o);
  injectProgrammaticHsdCtas(o);

  const parsed = HSDV25Schema.safeParse(o);
  return parsed.success ? parsed.data : null;
}
