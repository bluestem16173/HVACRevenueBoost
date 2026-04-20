import type { ServiceVertical } from "@/lib/localized-city-path";

function asRec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? (v as unknown[]).map((x) => str(x)).filter(Boolean) : [];
}

/** Pull `$150–$450`, `$1.5k-$3k`, etc. → [min, max] with sane fallbacks. */
export function parseUsdRange(costRange: string): { min: number; max: number } {
  const s = String(costRange ?? "");
  const nums = [...s.matchAll(/\$?\s*([\d,.]+)\s*(k)?/gi)].map((m) => {
    let n = parseFloat(String(m[1]).replace(/,/g, ""));
    if (!Number.isFinite(n)) return null;
    if (m[2] && String(m[2]).toLowerCase() === "k") n *= 1000;
    return n;
  }).filter((n): n is number => n != null && n >= 0);
  if (nums.length >= 2) {
    const a = Math.min(nums[0], nums[1]);
    const b = Math.max(nums[0], nums[1]);
    return { min: a, max: Math.max(b, a + 50) };
  }
  if (nums.length === 1) {
    return { min: Math.max(50, nums[0] * 0.4), max: Math.max(nums[0], 500) };
  }
  return { min: 150, max: 950 };
}

function sectionsOf(raw: Record<string, unknown>): Record<string, unknown>[] {
  const sec = raw.sections;
  if (!Array.isArray(sec)) return [];
  return sec.map((x) => asRec(x));
}

function sectionByType(raw: Record<string, unknown>, t: string): Record<string, unknown> | null {
  const s = sectionsOf(raw).find((x) => str(x.type).toLowerCase() === t.toLowerCase());
  return s ?? null;
}

const CTA_DEFAULTS: Record<
  ServiceVertical,
  { mid: string; bottom: string }
> = {
  hvac: {
    mid: "Check airflow, filter, and thermostat now",
    bottom: "Schedule HVAC service before system damage worsens",
  },
  electrical: {
    mid: "Turn off power and verify the circuit safely",
    bottom: "Get a licensed electrician to inspect this issue",
  },
  plumbing: {
    mid: "Shut off water and inspect for active leaks",
    bottom: "Call a plumber before water damage spreads",
  },
};

const TOOLS_DEFAULTS: Record<ServiceVertical, string[]> = {
  hvac: ["multimeter", "manifold gauges", "non-contact voltage tester"],
  electrical: ["multimeter", "non-contact voltage tester", "insulated screwdriver"],
  plumbing: ["pressure gauge", "basin wrench", "pipe tape"],
};

/**
 * Converts **HSD_TIER1_PILLAR** + **DG_AUTHORITY_ENGINE_V4** problem-pillar LLM JSON into a partial **hsd_v2** row
 * for {@link coerceHsdJsonForV25View} → {@link finalizeHsdV25Page}.
 */
export function problemPillarRawToHsdCandidate(
  raw: Record<string, unknown>,
  vertical: ServiceVertical,
  pillarSlug: string
): Record<string, unknown> {
  const slug = `${vertical}/${String(pillarSlug ?? "").trim().toLowerCase()}`.replace(/\/+/g, "/");
  const hero = asRec(raw.hero);
  const title = str(raw.title) || str(hero.headline) || slug.split("/")[1]?.replace(/-/g, " ") || "Diagnostic pillar";

  const headlineBase = str(hero.headline) || title;
  const headline =
    headlineBase.length >= 50
      ? headlineBase
      : `${headlineBase} — National pillar triage: verify load, controls, and primary failure mode before local escalation.`;

  const fieldTriageLines = strList(raw.fieldTriage);
  const triageSec = sectionByType(raw, "triage");
  const triageFromSection = Array.isArray(triageSec?.content)
    ? (triageSec!.content as unknown[]).map((x) => str(x)).filter(Boolean)
    : [];
  const triageMerged = [...fieldTriageLines, ...triageFromSection].filter(Boolean);

  const summary30s = strList(raw.summary30s);
  const flowBase =
    triageMerged.length >= 4
      ? triageMerged
      : summary30s.length >= 4
        ? summary30s
        : [...triageMerged, ...summary30s];
  const flowLines =
    flowBase.length >= 4
      ? flowBase
      : [
          ...flowBase,
          "If basics check clean and the symptom persists:",
          "→ Stop DIY at sealed-system or energized equipment work.",
          "→ Route to a licensed technician with measurements.",
        ].slice(0, 10);

  const aiLines = strList(raw.aiSummary);
  const triageBlob = triageMerged.join(" ").trim();
  const coreTruth =
    aiLines.join(" ").trim().length >= 70
      ? aiLines.join(" ")
      : triageBlob.length >= 70
        ? triageBlob
        : [
            ...aiLines,
            triageBlob,
            "Mechanical symptoms trace to physical imbalance—airflow, charge, control, or rotating equipment.",
            "Ignoring drift under load stacks wear until repair costs jump past $1,500.",
          ]
            .filter(Boolean)
            .join(" ");

  const causesSec = sectionByType(raw, "causes");
  const causeItems = Array.isArray(causesSec?.items) ? (causesSec!.items as unknown[]).map((x) => asRec(x)) : [];

  const top_causes =
    causeItems.length >= 3
      ? causeItems.slice(0, 8).map((it, i) => ({
          label: str(it.title ?? it.name ?? it.label ?? `Cause ${i + 1}`).slice(0, 120),
          probability: str(it.probability ?? it.rank ?? (i === 0 ? "Most likely" : "Less common")),
          deep_dive: str(it.description ?? it.body ?? it.text ?? it.deep_dive).slice(0, 800),
        }))
      : [];

  const rmRaw = Array.isArray(raw.repairMatrix) ? (raw.repairMatrix as unknown[]) : [];
  for (const row of rmRaw) {
    const r = asRec(row);
    if (top_causes.length >= 8) break;
    const lab = str(r.symptom ?? r.issue);
    const lc = str(r.likelyCause ?? r.cause);
    const fx = str(r.fix);
    if (!lab && !lc) continue;
    top_causes.push({
      label: (lab || lc).slice(0, 120),
      probability: lc ? "Field-ranked" : "See matrix",
      deep_dive: [lc, fx].filter(Boolean).join(" — ").slice(0, 800),
    });
  }

  const rmRows =
    rmRaw.length > 0
      ? rmRaw
      : ([1, 2, 3, 4].map((i) => ({
          symptom: `${pillarSlug.replace(/-/g, " ")} — branch ${i}`,
          likelyCause: "Unclassified until measured",
          fix: "Licensed diagnosis before parts swap",
          costRange: "$200–$1,800",
        })) as unknown[]);

  while (top_causes.length < 3) {
    top_causes.push({
      label: `Failure mode ${top_causes.length + 1}`,
      probability: "Needs measurement",
      deep_dive:
        "Verify with gauges, electrical tests, and load context before sealed-system work—misdiagnosis stacks cost fast.",
    });
  }

  const stepsSec = sectionByType(raw, "steps");
  const stepLines = Array.isArray(stepsSec?.steps)
    ? (stepsSec!.steps as unknown[]).map((x) => {
        if (typeof x === "string") return x;
        const o = asRec(x);
        return str(o.text ?? o.step ?? o.title ?? o.instruction);
      })
    : [];
  const fast = str(raw.fastDiagnosis);
  const stepSource =
    stepLines.length >= 3
      ? stepLines
      : fast
        ? fast.split(/\n+/).map((l) => l.trim()).filter(Boolean)
        : [
            "If symptom present: verify power, mode, and setpoint before hardware tests.",
            "If controls OK: verify airflow and filter loading before coil or charge assumptions.",
            "If airflow OK: measure temperatures and pressures with correct tools—or stop and call a pro.",
          ];

  const diagnostic_steps = stepSource.slice(0, 20).map((line) => ({
    step: line.slice(0, 400),
    homeowner: "→ Compare to normal bands; stop if you smell burning, see arcing, or lose safeties.",
    pro: "→ Confirm with manufacturer specs, gauges, and electrical tests under load.",
    risk: "→ Wrong branch work turns nuisance repairs into $1,500+ component failures.",
  }));

  const quick_table = rmRows.slice(0, 12).map((row) => {
    const r = asRec(row);
    return {
      symptom: str(r.symptom ?? r.issue ?? pillarSlug).slice(0, 120),
      cause: str(r.likelyCause ?? r.cause ?? "See diagnostic flow").slice(0, 160),
      fix: str(r.fix ?? "Licensed diagnosis").slice(0, 200),
    };
  });

  while (quick_table.length < 4) {
    quick_table.push({
      symptom: `Check ${quick_table.length + 1}`,
      cause: "Pattern not yet isolated",
      fix: "Measure before replacing parts",
    });
  }

  const repair_matrix = rmRows.slice(0, 8).map((row, i) => {
    const r = asRec(row);
    const issue = str(r.symptom ?? r.issue ?? r.label ?? `Issue ${i + 1}`);
    const fix = str(r.fix ?? r.likelyCause ?? "Professional diagnosis");
    const { min, max } = parseUsdRange(str(r.costRange ?? r.cost));
    const diff = i < 2 ? "easy" : i < 4 ? "moderate" : "pro";
    return {
      issue: issue.slice(0, 200),
      fix: fix.slice(0, 240),
      cost_min: min,
      cost_max: Math.max(max, min + 100, 1500),
      difficulty: diff,
    };
  });

  const tech = strList(raw.technicianInsights);
  const canonical_truths =
    tech.length >= 2 ? tech.slice(0, 2) : tech.length === 1 ? [tech[0], DEFAULT_SECOND_TRUTH] : [DEFAULT_FIRST_TRUTH, DEFAULT_SECOND_TRUTH];

  const urgency = str(hero.urgencyLine);
  const final_warning = padMin(
    urgency +
      "\n\n" +
      (tech.join(" ") ||
        "Field failures compound when the system keeps running under faulted conditions—compressor and coil damage commonly lands $1,500–$3,500."),
    60
  );

  const ctaDef = CTA_DEFAULTS[vertical];
  const ctaRec = asRec(raw.cta);
  const ctaMid = str(ctaRec.mid) || ctaDef.mid;
  const ctaBottom = str(ctaRec.bottom) || ctaDef.bottom;
  const ctaLine = padMin([ctaBottom, ctaMid, str(hero.ctaLine)].filter(Boolean).join("\n\n"), 45);

  const mermaid = str(raw.systemFlowDiagram);
  const decision_tree_text =
    mermaid.length > 20
      ? mermaid
          .split(/\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 12)
      : stepSource.slice(0, 6).map((l) => (l.includes("→") ? l : `→ ${l}`));

  const what_this_means = padMin(aiLines.join("\n\n"), 100);

  return {
    page_type: "city_symptom",
    schema_version: "hsd_v2",
    slug,
    title: title.length >= 10 ? title : `${title} — diagnostic reference`,
    summary_30s: {
      headline,
      top_causes,
      core_truth: padMin(coreTruth, 70),
      risk_warning: padMin(str(hero.subheadline) || urgency || DEFAULT_RISK, 45),
      flow_lines: flowLines.slice(0, 8),
    },
    what_this_means,
    quick_checks: [],
    diagnostic_steps,
    quick_table,
    decision_tree_text,
    canonical_truths,
    tools: TOOLS_DEFAULTS[vertical],
    repair_matrix_intro: padMin(str(sectionByType(raw, "system_core")?.title) || "Repair ladder (ranked by what we see in the field).", 50),
    repair_matrix,
    cost_escalation: [],
    decision: { safe: [], call_pro: [], stop_now: [] },
    decision_footer: "Stop at energized work or sealed-system guesses—route to a licensed technician.",
    ctas: [],
    final_warning,
    cta: ctaLine,
  };
}

const DEFAULT_FIRST_TRUTH =
  "Symptoms are outputs—always verify inputs (power, airflow, setpoints) before blaming major components.";
const DEFAULT_SECOND_TRUTH =
  "If measurements disagree with the story, the failure mode is misclassified—re-run the branch checks.";

const DEFAULT_RISK =
  "Ignoring drift under load stacks wear until repairs cross $1,500 and climb toward major component replacement.";

function padMin(s: string, n: number): string {
  let t = String(s ?? "").trim();
  if (t.length >= n) return t;
  const pad =
    " Continuing operation under unresolved fault conditions accelerates wear and typical repair exposure past $1,500 once major parts fail.";
  while (t.length < n) t = (t + pad).slice(0, n + 40);
  return t.slice(0, Math.max(n, t.length));
}
