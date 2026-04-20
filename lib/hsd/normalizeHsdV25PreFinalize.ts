import { applyDedupeLinesPassToHsdJson } from "@/lib/hsd/dedupeHsdMultilineFields";
import { injectProgrammaticHsdCtas } from "@/lib/hsd/injectProgrammaticHsdCtas";
import { patchHsdLlmJsonMinimumGates } from "@/lib/hsd/patchHsdLlmJsonMinimumGates";
import { applyQuickChecksLabelNormalizationToHsdJson } from "@/lib/hsd/normalizeHsdQuickChecksLabels";
import { backfillLocalizedPlumbingAuthorityFields } from "@/lib/homeservice/backfillLocalizedTradeAuthority";
import { isAcNotCoolingCitySlug } from "@/lib/hsd/lockedAcNotCoolingHeadline";
import { isPlumbingNoHotWaterSlug, parseLocalizedStorageSlug } from "@/lib/localized-city-path";
import { stripCostBandsFromTitle } from "@/lib/utils";

/** Classify-only — locked for every `plumbing/no-hot-water` page (symptom → failure class, no actions). */
const NO_HOT_WATER_CLASSIFY_FLOW_LINES = [
  "No hot water at all? → Power loss or failed element",
  "Water warm but not hot? → Partial element failure or thermostat issue",
  "Hot water runs out fast? → Sediment limiting recovery",
  "Rusty or discolored water? → Tank corrosion (replacement path)",
] as const;

const NO_HOT_WATER_WHAT_THIS_MEANS =
  "This is a failed heat transfer system.\n\n" +
  "If the element is open → no current → no heat\n" +
  "If the thermostat does not close → element never energizes\n" +
  "If sediment insulates the element → heat is trapped → element overheats and fails\n\n" +
  "Result:\n" +
  "• No heat output\n" +
  "• Unstable temperature\n" +
  "• Accelerating internal damage";

/** IF/THEN only in homeowner; pro/risk empty (no “technician will…” narrative). */
const NO_HOT_WATER_CORE_TRUTH_CLASSIFY_ONLY =
  "Field triage above maps symptom class (full loss vs weak vs fast runout vs rusty) to failure class before parts swap. " +
  "That order matters because a satisfied thermostat, tripped breaker, or stuck high-limit reads like a bad tank until supply and control paths are proven.";

const NO_HOT_WATER_QUICK_CHECKS: {
  check: string;
  homeowner: string;
  result_meaning: string;
  next_step: string;
  risk: string;
}[] = [
  {
    check: "Heater breaker / disconnect state",
    homeowner:
      "Read breaker position; reset once only if tripped; confirm disconnect is ON (cover on—no exposed touching).",
    result_meaning:
      "If it trips again immediately or under load → ground/short fault class (not a flush-first problem).",
    next_step:
      "If it holds → continue to setpoint vs outlet temp; if repeat trip → stop; licensed electrician.",
    risk: "Hammering breakers or working live can turn a heater repair into a $1,500+ panel-class path fast.",
  },
  {
    check: "Thermostat setpoint vs delivered hot-water temp",
    homeowner:
      "Record setpoint; run a hot-only sample at a lav after a 30-minute quiet window; compare numbers (or hotter/colder verdict).",
    result_meaning:
      "If setpoint is below what you measured at the tap → no heat call is issued (thermostat satisfied / wrong target).",
    next_step: "Raise setpoint 10-15°F; re-check the same tap in 30-45 minutes.",
    risk: "Chasing elements while the stat never calls wastes parts and masks controls-side faults.",
  },
  {
    check: "Post-demand heating activity (recovery clue)",
    homeowner:
      "After a shower draw, listen for brief normal heating sounds and note if tank skin warms briefly (safe touch only—no cover removal).",
    result_meaning:
      "If tank never enters a heat cycle after heavy use → dead element, stuck stat/ECO, or supply path fault ahead of water.",
    next_step:
      "If heating returns but outlets stay cold → mixing/crossfeed suspicion; if no cycles ever → power/controls/element branch.",
    risk: "Opening covers without lockout exposes lethal voltage—stop when you cannot verify safely.",
  },
  {
    check: "Hot-only discoloration vs cold baseline",
    homeowner: "Fill two glasses: cold-only vs hot-only; compare color/tint side by side under light.",
    result_meaning:
      "If discoloration is hot-only → corrosion/anode load / vessel integrity class (not thermostat tuning).",
    next_step: "Stop chasing element swaps; photograph samples; plan tank integrity and replacement banding with a plumber.",
    risk: "Hidden tank seam failure can flood finished spaces—past $2,000+ once drywall/subfloor are involved.",
  },
];

function buildNoHotWaterMostCommonCause(slug: string): { cause: string; why: string; fix: string; cost: string } {
  const parsed = parseLocalizedStorageSlug(slug);
  const city = parsed?.citySlug?.toLowerCase() ?? "";
  const waterLine =
    city === "fort-myers-fl"
      ? "In Fort Myers, mineral-heavy water accelerates scale buildup, which traps heat at the element and shortens element life."
      : city
        ? "In hard-water coastal markets, mineral loading accelerates scale on elements, traps heat at the sheath, and shortens element life."
        : "In hard-water markets, scale on the sheath traps heat and accelerates element burnout.";

  const why =
    "Electric elements fail in two primary ways:\n\n" +
    "• Scale insulation → element overheats → internal break\n" +
    "• Dry-fire / air exposure → element burns out instantly\n\n" +
    waterLine;

  return {
    cause: "Dead electric element or open control path (thermostat/high-limit) blocking heat into tank water.",
    why,
    fix: "Prove supply at the heater → verify thermostat demand/output → then continuity-test elements before tank replacement.",
    cost: "Typical verified element + mixed-rebuild class runs about $180–$650; mis-parts and repeat trips push past $1,000+ fast.",
  };
}

const NO_HOT_WATER_DIAGNOSTIC_STEPS: { step: string; homeowner: string; pro: string; risk: string }[] = [
  {
    step: "Step 1 — Check power",
    homeowner: "IF no power → electrical issue → stop",
    pro: "",
    risk: "",
  },
  {
    step: "Step 2 — Check thermostat output",
    homeowner: "IF no signal → replace thermostat",
    pro: "",
    risk: "",
  },
  {
    step: "Step 3 — Test element resistance",
    homeowner: "IF open circuit → replace element",
    pro: "",
    risk: "",
  },
  {
    step: "Step 4 — Inspect for sediment",
    homeowner: "IF severe buildup → flush or replace (based on age)",
    pro: "",
    risk: "",
  },
];

function ensureNoHotWaterLockedCopy(json: Record<string, unknown>): void {
  const slug = String(json.slug ?? "");
  if (!isPlumbingNoHotWaterSlug(slug)) return;
  json.what_this_means = NO_HOT_WATER_WHAT_THIS_MEANS;
  json.diagnostic_steps = NO_HOT_WATER_DIAGNOSTIC_STEPS.map((s) => ({ ...s }));
  json.quick_checks = NO_HOT_WATER_QUICK_CHECKS.map((r) => ({ ...r }));
  json.most_common_cause = buildNoHotWaterMostCommonCause(slug);
  const s30 = json.summary_30s;
  if (s30 && typeof s30 === "object") {
    (s30 as Record<string, unknown>).core_truth = NO_HOT_WATER_CORE_TRUTH_CLASSIFY_ONLY;
  }
}

/** Same dollar parser as {@link assertHsdV25ContentRules} / CTA gate. */
function maxParsedUsdInText(s: string): number {
  let max = 0;
  const re = /\$\s*([\d,]+(?:\.\d+)?)\s*(k)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    let n = parseFloat(String(m[1]).replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    if (m[2] && m[2].toLowerCase() === "k") n *= 1000;
    if (n > max) max = n;
  }
  return max;
}

function verticalFromSlug(slug: string): string {
  return String(slug ?? "").split("/")[0]?.trim().toLowerCase() || "hvac";
}

function ctaMeetsBar(cta: string, vertical: string): boolean {
  const t = String(cta ?? "").trim();
  if (t.length < 45) return false;
  if (maxParsedUsdInText(t) < 1500) return false;
  const stressOk =
    vertical === "hvac"
      ? /\b(heat|humidity|humid|runtime|load|operating|fault|design|stress|peak|outdoor)\b/i.test(t)
      : /\b(water|pressure|runtime|load|arc|fault|stress|peak|wet|flow|voltage|panel|breaker|leak|freeze)\b/i.test(
          t
        );
  if (!stressOk) return false;
  if (!/\b(technician|licensed|tech\b|call\s+a\s*pro|get\s+a\s*pro|book|service\s*call|schedule)\b/i.test(t)) {
    return false;
  }
  return true;
}

/** Top-level title + `summary_30s.headline` (Zod ≥50) without forbidden scaffolding words. */
export function ensureHeadline(json: Record<string, unknown>): Record<string, unknown> {
  const slug = String(json.slug ?? "");
  let title = stripCostBandsFromTitle(String(json.title ?? ""));
  if (!title || title.length < 10) {
    const v = verticalFromSlug(slug);
    const label = v === "plumbing" ? "Plumbing issue" : v === "electrical" ? "Electrical issue" : "HVAC issue";
    title = `${title || label} — causes, fixes, and typical repair costs`;
    json.title = title.slice(0, 200);
  } else if (title.length < 40) {
    json.title = `${title} — causes, fixes, and typical repair costs (2026)`.slice(0, 200);
  }

  if (isAcNotCoolingCitySlug(slug)) {
    return json;
  }

  const s30 = json.summary_30s;
  if (!s30 || typeof s30 !== "object") return json;
  const o = s30 as Record<string, unknown>;
  let h = String(o.headline ?? "").trim();
  if (h.length < 50) {
    const v = verticalFromSlug(slug);
    const base = (h || title || (v === "plumbing" ? "Plumbing issue" : v === "electrical" ? "Electrical issue" : "HVAC issue")).trim();
    o.headline =
      v === "hvac"
        ? `${base} — direct diagnosis, field fixes, and cost escalation when faults persist under heat and humidity load.`
        : `${base} — direct diagnosis, safe homeowner checks, and when to stop before water or electrical damage stacks past $1,500.`;
  }
  return json;
}

const CTA_FALLBACK_HVAC =
  "Book a licensed HVAC technician before peak heat and humidity add runtime stress. Delaying can turn a $300 issue into a $2,000+ repair — $1,500+ compressor-class failures are common when faults persist under load.";

const CTA_FALLBACK_DEFAULT =
  "Book a licensed technician before pressure and leak paths worsen. Delays can turn a $300 fix into a $2,000+ repair — $1,500+ damage is common when faults persist under peak water and electrical stress.";

/** Single string `cta` matching Zod + {@link assertCtaStrength}. */
export function ensureCta(json: Record<string, unknown>): Record<string, unknown> {
  const v = verticalFromSlug(String(json.slug ?? ""));
  const cur = String(json.cta ?? "");
  if (ctaMeetsBar(cur, v)) return json;
  json.cta = v === "hvac" ? CTA_FALLBACK_HVAC : CTA_FALLBACK_DEFAULT;
  return json;
}

export function ensureFinalWarning(json: Record<string, unknown>): Record<string, unknown> {
  const fw = String(json.final_warning ?? "").trim();
  if (!fw || fw.length < 60 || !fw.includes("$")) {
    const v = verticalFromSlug(String(json.slug ?? ""));
    if (v === "plumbing") {
      json.final_warning =
        "Ignoring active leaks, pressure loss, or repeated relief events can push drywall, cabinet, and subfloor damage into a $2,000+ tear-out class while mold risk climbs—stop the water path and get a licensed plumber.";
    } else if (v === "electrical") {
      json.final_warning =
        "Ignoring repeat trips, heat at devices, or partial power can push panel and feeder damage into a $2,000+ repair class—de-energize what you can safely and get a licensed electrician.";
    } else {
      json.final_warning =
        "Ignoring this issue under sustained runtime load can push compressor and coil stress into a $2,000+ repair class once the system keeps operating under fault.";
    }
  }
  return json;
}

function ensureFlowLines(json: Record<string, unknown>): void {
  const s30 = json.summary_30s;
  if (!s30 || typeof s30 !== "object") return;
  const o = s30 as Record<string, unknown>;
  const slug = String(json.slug ?? "");
  const lines = Array.isArray(o.flow_lines)
    ? (o.flow_lines as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : [];

  if (isPlumbingNoHotWaterSlug(slug)) {
    o.flow_lines = [...NO_HOT_WATER_CLASSIFY_FLOW_LINES];
    return;
  }

  if (lines.length >= 4) return;
  const v = verticalFromSlug(slug);
  if (v === "plumbing") {
    o.flow_lines = [
      "Cold at every fixture? → Whole-house heater or supply-side class",
      "Only one tap wrong? → Fixture or local mixing class",
      "Hot runs out quickly? → Recovery or capacity class",
      "Rust, odor, or water at the tank? → Integrity or corrosion class",
    ];
  } else if (v === "electrical") {
    o.flow_lines = [
      "Power loss (scan):",
      "→ One device vs whole circuit → localized vs branch trip path",
      "→ GFCI / breaker resets once only → repeat trips → stop forcing power",
      "→ Heat, ozone, or sparking → emergency electrician path before $1,500+ panel damage",
    ];
  } else {
    o.flow_lines = [
      "Fault is active at the equipment:",
      "→ Verify power, mode, setpoint, and register airflow",
      "→ If comfort does not return after basics → stop extended runtime",
      "→ Licensed diagnosis before damage exceeds a $1,500+ repair class",
    ];
  }
}

function ensureRiskWarning(json: Record<string, unknown>): void {
  const s30 = json.summary_30s;
  if (!s30 || typeof s30 !== "object") return;
  const o = s30 as Record<string, unknown>;
  let rw = String(o.risk_warning ?? "").trim();
  if (!rw || !rw.includes("$")) {
    const v = verticalFromSlug(String(json.slug ?? ""));
    if (v === "plumbing") {
      rw =
        "If a tank leak or pressure fault keeps running, finishes and subfloors soak fast—small plumbing delays commonly cross $1,500 once tear-out and mold controls start.";
    } else if (v === "electrical") {
      rw =
        "If breakers trip repeatedly or devices run hot, fault current keeps working on connections—small electrical delays often exceed $1,500 once panels and feeders are damaged.";
    } else {
      rw =
        "If airflow, charge, or control faults persist under load, small repairs can stack into a $1,500+ failure class—stop extended runtime once comfort stalls.";
    }
    o.risk_warning = rw;
  }
}

function ensureWhatThisMeans(json: Record<string, unknown>): void {
  const slug = String(json.slug ?? "");
  if (isPlumbingNoHotWaterSlug(slug)) return;

  let w = String(json.what_this_means ?? "").trim();
  if (w.length >= 100) return;
  const v = verticalFromSlug(slug);
  const pad =
    v === "plumbing"
      ? " Hot water depends on a clean heat path into the tank, stable controls, and safe venting/combustion on gas units. When demand spikes or minerals stack, the system can look ‘broken’ while the real fault is still on the water heater, mixing, or distribution side—misreads waste money and time."
      : v === "electrical"
        ? " Household power depends on stable branch circuits, correct overcurrent protection, and solid connections. When trips repeat or heat appears at devices, the fault is often progressing under load—continued resets can damage the panel and feeders."
        : " The equipment is still moving working fluid and air, but it is failing to shed load at the coil under real outdoor conditions—restriction or charge faults force longer cycles, raise head pressure, and accelerate wear until a major component fails.";
  json.what_this_means = (w + pad).trim().slice(0, 1200);
}

function ensureRepairMatrixIntro(json: Record<string, unknown>): void {
  let r = String(json.repair_matrix_intro ?? "").trim();
  if (r.length >= 50) return;
  const v = verticalFromSlug(String(json.slug ?? ""));
  const tail =
    v === "plumbing"
      ? "Most hot-water calls start as controls, mixing, or dip-tube/sediment issues; once the tank shell leaks or gas venting is compromised, costs jump quickly—treat the matrix as planning ranges, not firm quotes."
      : v === "electrical"
        ? "Most electrical triage starts with device resets and obvious overloads; once you smell heat/ozone or breakers will not hold, costs jump quickly—treat the matrix as planning ranges, not firm quotes."
        : "Most failures start as airflow or control-side issues; once sealed-system or compressor problems appear, costs jump quickly—treat the matrix below as planning ranges from field work, not firm quotes.";
  json.repair_matrix_intro = (r ? `${r} ` : "") + tail;
}

function ensureDecisionFooter(json: Record<string, unknown>): void {
  let d = String(json.decision_footer ?? "").trim();
  if (d.length >= 35) return;
  const v = verticalFromSlug(String(json.slug ?? ""));
  const tail =
    v === "plumbing"
      ? "At this point, continuing to operate a leaking or overheating water heater risks floor damage and scalding—shut the water path you can control and call a licensed plumber."
      : v === "electrical"
        ? "At this point, continuing to reset breakers or force power under heat/ozone risks panel and feeder damage—stop and call a licensed electrician."
        : "At this point, continuing to run the system under fault risks compressor and coil damage.";
  json.decision_footer = (d ? `${d} ` : "") + tail;
}

/**
 * Server-side minimums so imperfect LLM JSON still passes Zod + HSD v2.5 publish rules before
 * {@link finalizeHsdV25Page} (no extra model tokens).
 */
export function normalizeHsdV25PreFinalize(json: Record<string, unknown>): Record<string, unknown> {
  injectProgrammaticHsdCtas(json);
  patchHsdLlmJsonMinimumGates(json);
  ensureHeadline(json);
  ensureFlowLines(json);
  ensureRiskWarning(json);
  ensureWhatThisMeans(json);
  ensureRepairMatrixIntro(json);
  ensureDecisionFooter(json);
  ensureCta(json);
  ensureFinalWarning(json);
  backfillLocalizedPlumbingAuthorityFields(json);
  ensureNoHotWaterLockedCopy(json);
  applyDedupeLinesPassToHsdJson(json);
  applyQuickChecksLabelNormalizationToHsdJson(json);
  return json;
}
