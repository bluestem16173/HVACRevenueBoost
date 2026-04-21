import { parseLocalizedStorageSlug } from "@/lib/localized-city-path";

function plumbingHotWaterCodeItems(): string[] {
  return [
    "What changed: model plumbing codes increasingly require temperature-limiting (mixing) protection at the tank or distribution point when replacement work alters the hot-water path — not just a tank swap.",
    "Why it matters here: without correct tempering, a simple element or gas valve job can fail inspection and force rework while you are without hot water.",
    "Repair vs replace impact: grandfathered installs often meet old minimums; a new tank or tankless swap can trigger venting, combustion air, gas pipe sizing, or relief/thermal-expansion updates that change total job cost.",
  ];
}

function plumbingHotWaterRepairVsReplace(): { title: string; guidance: string; rules: string[] } {
  return {
    title: "Repair vs Replace (Where people lose money)",
    guidance:
      "Temporary fixes feel cheaper—but they accelerate failure.\n\n" +
      "What actually happens:\n" +
      "• Replace element without flushing sediment → new element burns out\n" +
      "• Reset breaker without diagnosing cause → electrical damage compounds\n" +
      "• Ignore early corrosion → tank failure → full replacement",
    rules: [
      "Repair-first: tank under ~8–10 years, dry shell, single failed component.",
      "Replace-first: visible rust or leaks, repeated failures, 10+ year system.",
      "Hard truth: If you are stacking repairs, you are already in replacement territory.",
    ],
  };
}

function plumbingHotWaterCommonMisdiagnosis(): string[] {
  return [
    "Replacing the element when the breaker is tripped",
    "Flushing the tank when the thermostat has failed",
    'Assuming "no hot water" = bad tank',
    "Ignoring sediment → destroying new elements",
    "Why it matters: Misdiagnosis is how a $200 fix becomes a $1,500 replacement.",
  ];
}

function commonMisdiagnosisWeak(raw: unknown): boolean {
  if (!Array.isArray(raw) || raw.length < 3) return true;
  const lines = raw.map((x) => String(x ?? "").trim()).filter(Boolean);
  return lines.length < 3;
}

function plumbingHotWaterSystemAge(): { summary: string; ranges: { age_range: string; likely_failure: string }[] } {
  return {
    summary:
      "Hot-water reliability is driven by tank age, local water hardness, and household demand cycles (showers, laundry, dishwashers). Coastal humidity also accelerates exterior rust on garage/lanai heaters.",
    ranges: [
      {
        age_range: "0–6 years",
        likely_failure: "Dip-tube debris, element, or control faults while the tank shell is usually sound.",
      },
      {
        age_range: "7–12 years",
        likely_failure: "Sediment bake, anode depletion, union corrosion — performance drops and small leaks become common.",
      },
      {
        age_range: "12+ years",
        likely_failure: "Tank metal fatigue and repeated T&P events — replacement planning usually beats major surgery on the vessel.",
      },
    ],
  };
}

function plumbingHotWaterUpgradePaths(citySeg: string): { title: string; description: string; href: string }[] {
  const c = citySeg.toLowerCase();
  return [
    {
      title: "Water heater leaking",
      description: "T&P weeps vs tank seam — containment before floor damage.",
      href: `/plumbing/water-heater-leaking/${c}`,
    },
    {
      title: "Low water pressure",
      description: "Whole-house vs fixture-only — when pressure maps to supply or obstruction.",
      href: `/plumbing/low-water-pressure/${c}`,
    },
    {
      title: "Pipe leaking",
      description: "Slab vs visible runs — stop-the-water triage before finish damage.",
      href: `/plumbing/pipe-leaking/${c}`,
    },
  ];
}

function needsObjectFill(raw: unknown): boolean {
  return raw == null || typeof raw !== "object" || Array.isArray(raw);
}

function codeUpdatesWeak(raw: unknown): boolean {
  if (needsObjectFill(raw)) return true;
  const o = raw as Record<string, unknown>;
  const items = Array.isArray(o.items) ? o.items : [];
  return items.map((x) => String(x ?? "").trim()).filter(Boolean).length < 2;
}

function repairVsReplaceWeak(raw: unknown): boolean {
  if (needsObjectFill(raw)) return true;
  const o = raw as Record<string, unknown>;
  const g = String(o.guidance ?? "").trim();
  const rules = Array.isArray(o.rules) ? o.rules : [];
  const rl = rules.map((x) => String(x ?? "").trim()).filter(Boolean);
  return g.length < 40 && rl.length < 2;
}

/** Prior backfill copy; refresh so locked Fort Myers / no-hot-water authority stays in sync. */
function repairVsReplaceStalePlumbingDefault(raw: unknown): boolean {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const o = raw as Record<string, unknown>;
  const g = String(o.guidance ?? "");
  const t = String(o.title ?? "");
  return (
    /Separate a contained control/i.test(g) ||
    /temporary workaround on the wrong part/i.test(g) ||
    /repair vs replace, how costs escalate/i.test(t)
  );
}

function systemAgeWeak(raw: unknown): boolean {
  if (needsObjectFill(raw)) return true;
  const o = raw as Record<string, unknown>;
  const summary = String(o.summary ?? "").trim();
  const ranges = Array.isArray(o.ranges) ? o.ranges : [];
  return summary.length < 50 && ranges.length < 2;
}

function upgradePathsWeak(raw: unknown): boolean {
  if (!Array.isArray(raw) || raw.length === 0) return true;
  return raw.every((p) => {
    if (!p || typeof p !== "object") return true;
    const o = p as Record<string, unknown>;
    return !String(o.title ?? "").trim() && !String(o.description ?? "").trim();
  });
}

/**
 * When localized plumbing JSON omits authority-extension blocks, fill trade-correct
 * defaults so the renderer always has code / decision / age / internal-link surfaces.
 * Only runs for `plumbing/no-hot-water/{city}` storage slugs; does not overwrite rich model output.
 */
export function backfillLocalizedPlumbingAuthorityFields(json: Record<string, unknown>): void {
  const slug = String(json.slug ?? "").trim();
  const parsed = parseLocalizedStorageSlug(slug);
  if (!parsed || parsed.vertical !== "plumbing") return;
  if (parsed.pillarCore !== "no-hot-water") return;

  const citySeg = parsed.citySlug;

  if (codeUpdatesWeak(json.code_updates)) {
    json.code_updates = {
      title: "Recent code & material changes (hot water)",
      items: plumbingHotWaterCodeItems(),
    };
  }
  if (repairVsReplaceWeak(json.repair_vs_replace) || repairVsReplaceStalePlumbingDefault(json.repair_vs_replace)) {
    json.repair_vs_replace = plumbingHotWaterRepairVsReplace();
  }
  if (systemAgeWeak(json.system_age_load)) {
    json.system_age_load = plumbingHotWaterSystemAge();
  }
  if (upgradePathsWeak(json.upgrade_paths)) {
    json.upgrade_paths = plumbingHotWaterUpgradePaths(citySeg);
  }
  if (commonMisdiagnosisWeak(json.common_misdiagnosis)) {
    json.common_misdiagnosis = plumbingHotWaterCommonMisdiagnosis();
  }
}
