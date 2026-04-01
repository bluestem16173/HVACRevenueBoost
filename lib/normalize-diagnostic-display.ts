/**
 * Single render contract: raw v5_master / v6 JSON → stable shape for DiagnosticGoldPage.
 * Keep validateV2 + relational upsert on the raw payload; this layer is presentation-only.
 */

export type QuickToolkitRow = { tool: string; purpose: string; difficulty: string };
export type ToolsNeededRow = { name: string; purpose: string; difficulty: string };

export type QuickDecisionRow = {
  question?: string;
  likelyModes?: string[];
  nextStep?: string;
};

export type TopCauseRow = {
  name: string;
  failureMode: string;
  signal: string;
  test: string;
  expected: string;
  confidence: number;
  mechanism: string;
  symptoms: string[];
};

export type RepairMatrixRow = {
  name: string;
  cause: string;
  effect: string;
  difficulty: string;
  cost: string;
  description: string;
};

export type BenchProcedureRow = {
  title: string;
  steps: string[];
  field_insight: string;
};

export type FaqRow = { question: string; answer: string };

/** Stable display model for the DG/HVAC hybrid shell (DiagnosticGoldPage). */
export type DiagnosticGoldDisplayModel = {
  title: string;
  symptom: string;
  system: string;

  summary: unknown;
  toolkit: QuickToolkitRow[];

  overview: string;

  quickDecisionTree: QuickDecisionRow[];
  /** Raw guided rows for FastIsolationPanel */
  guidedDiagnosis: unknown[];

  systemExplainer: string;
  diagnosticOrder: string[];
  mermaid: string;

  failureModeNames: string[];

  topCauses: TopCauseRow[];

  repairMatrix: RepairMatrixRow[];

  benchProcedures: BenchProcedureRow[];

  /** Structured tools list (explicit schema field tools_needed) */
  tools: ToolsNeededRow[];

  prevention: string[];

  faq: FaqRow[];

  internalLinks: unknown[];
};

/**
 * Older `content_json` rows used a "hub" shape (hero, commonCauses, mermaidGraph)
 * instead of v5_master field names. Map into v5-like fields before display mapping.
 */
function mergeLegacyHubContent(raw: Record<string, unknown>, routeSlug?: string): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };

  const hero = raw.hero as Record<string, unknown> | undefined;
  if (hero && typeof hero === "object") {
    if (!out.title && typeof hero.title === "string") out.title = hero.title;
    if (out.fast_answer == null) {
      const sub = hero.subtitle ?? hero.description;
      if (typeof sub === "string" && sub.trim()) out.fast_answer = sub;
    }
  }

  if ((!Array.isArray(out.causes) || out.causes.length === 0) && Array.isArray(raw.commonCauses)) {
    out.causes = raw.commonCauses.map((name) => ({
      name: String(name),
      failure_mode: String(name),
      diagnostic_signal: "Cross-check this pattern against operating conditions and quick checks.",
      test: "Verify the symptom and environment match this failure pattern.",
      expected_result: "Consistent with this contributor when supporting observations align.",
      mechanism: "",
      confidence: 0.5,
      symptoms: [] as string[],
    }));
  }

  if (!Array.isArray(out.failure_modes) || out.failure_modes.length === 0) {
    if (Array.isArray(out.causes) && out.causes.length > 0) {
      out.failure_modes = (out.causes as Record<string, unknown>[]).map((c) => ({
        name: String(c.name ?? "Failure mode"),
        description: String(c.diagnostic_signal ?? c.mechanism ?? ""),
      }));
    }
  }

  if (typeof out.mermaid_diagram !== "string" || !String(out.mermaid_diagram).trim()) {
    if (typeof raw.mermaidGraph === "string" && raw.mermaidGraph.trim()) {
      out.mermaid_diagram = raw.mermaidGraph;
    } else {
      const df = raw.diagnosticFlow as Record<string, unknown> | undefined;
      if (df && typeof df === "object") {
        const m = df.mermaid ?? df.chart ?? df.mermaidCode;
        if (typeof m === "string" && m.trim()) out.mermaid_diagram = m;
      }
    }
  }

  if (!Array.isArray(out.diagnostic_order) || out.diagnostic_order.length === 0) {
    const qc = raw.quickChecks;
    if (Array.isArray(qc) && qc.length > 0) {
      out.diagnostic_order = qc.map((x: unknown) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object" && "text" in (x as object)) {
          return String((x as { text?: unknown }).text);
        }
        if (x && typeof x === "object" && "label" in (x as object)) {
          return String((x as { label?: unknown }).label);
        }
        return String(x);
      });
    }
  }

  const bareSlug = routeSlug?.replace(/^diagnose\//, "") ?? "";
  if ((!out.symptom || String(out.symptom).trim() === "") && bareSlug) {
    out.symptom = bareSlug;
  }
  if ((!out.title || String(out.title).trim() === "") && bareSlug) {
    out.title = bareSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return out;
}

function inferToolkitFromTests(causes: unknown[]): QuickToolkitRow[] {
  const tools = new Set<string>();
  if (!Array.isArray(causes)) return [];
  for (const c of causes) {
    const t = typeof (c as { test?: string }).test === "string" ? (c as { test: string }).test : "";
    if (/multimeter|ohm|voltage|continuity/i.test(t)) tools.add("Digital multimeter");
    if (/manifold|gauge|psi|pressure/i.test(t)) tools.add("Manifold gauge set");
    if (/thermometer|°f|°c|temperature/i.test(t)) tools.add("Temperature probe");
    if (/inspect|visual|sight|flashlight/i.test(t)) tools.add("Inspection light");
  }
  return Array.from(tools).slice(0, 6).map((tool) => ({
    tool,
    purpose: "First-pass field verification",
    difficulty: "moderate",
  }));
}

export type NormalizeDiagnosticOptions = {
  /** URL param when DB row omits `symptom` / `title` (legacy hub JSON). */
  routeSlug?: string;
};

/**
 * Map raw diagnostic JSON (v5_master / v6) → DiagnosticGoldDisplayModel.
 */
export function normalizeDiagnosticToDisplayModel(
  raw: Record<string, unknown>,
  options?: NormalizeDiagnosticOptions
): DiagnosticGoldDisplayModel {
  const data = mergeLegacyHubContent(raw, options?.routeSlug);
  const failureModes = (data.failure_modes as { name?: string; description?: string }[]) || [];
  const fmCount = failureModes.length;

  const overview =
    (typeof data.problem_overview === "string" && data.problem_overview.trim()) ||
    `This symptom usually maps to ${fmCount || "several"} primary physical failure state${
      fmCount === 1 ? "" : "s"
    }. Use the isolation matrix to confirm before replacing parts.`;

  const guided = (data.guided_diagnosis as unknown[]) || [];

  const quickDecisionTree: QuickDecisionRow[] = guided.slice(0, 3).map((g: any) => ({
    question: g?.scenario,
    likelyModes: Array.isArray(g?.likely_modes) ? g.likely_modes : [],
    nextStep: g?.next_step,
  }));

  const causes = (data.causes as Record<string, unknown>[]) || [];
  const repairs = (data.repairs as Record<string, unknown>[]) || [];

  const qt = data.quick_toolkit as QuickToolkitRow[] | undefined;
  let toolkit: QuickToolkitRow[] =
    Array.isArray(qt) && qt.length > 0
      ? qt.map((x) => ({
          tool: String(x.tool ?? ""),
          purpose: String(x.purpose ?? ""),
          difficulty: String(x.difficulty ?? "moderate"),
        }))
      : inferToolkitFromTests(causes);

  const tn = data.tools_needed as ToolsNeededRow[] | undefined;
  let tools: ToolsNeededRow[] =
    Array.isArray(tn) && tn.length > 0
      ? tn.map((x) => ({
          name: String(x.name ?? ""),
          purpose: String(x.purpose ?? ""),
          difficulty: String(x.difficulty ?? "moderate"),
        }))
      : toolkit.map((k) => ({
          name: k.tool,
          purpose: k.purpose,
          difficulty: k.difficulty,
        }));

  let benchProcedures: BenchProcedureRow[] =
    Array.isArray(data.bench_procedures) && (data.bench_procedures as unknown[]).length > 0
      ? (data.bench_procedures as Record<string, unknown>[]).map((b) => ({
          title: String(b.title ?? ""),
          steps: Array.isArray(b.steps) ? (b.steps as unknown[]).map(String) : [],
          field_insight: String(b.field_insight ?? ""),
        }))
      : causes.map((c) => {
          const test = String(c.test ?? "");
          const exp = String(c.expected_result ?? "");
          const steps = [test, exp].filter((s) => s.trim().length > 0);
          if (steps.length === 1) steps.push("Re-run observation after conditions stabilize.");
          return {
            title: String(c.name ?? "Procedure"),
            steps,
            field_insight: String(c.diagnostic_signal ?? c.mechanism ?? ""),
          };
        });

  const topCauses: TopCauseRow[] = causes.map((c) => ({
    name: String(c.name ?? ""),
    failureMode: String(c.failure_mode ?? ""),
    signal: String(c.diagnostic_signal ?? ""),
    test: String(c.test ?? ""),
    expected: String(c.expected_result ?? ""),
    confidence: typeof c.confidence === "number" ? c.confidence : Number(c.confidence) || 0,
    mechanism: String(c.mechanism ?? ""),
    symptoms: Array.isArray(c.symptoms) ? (c.symptoms as unknown[]).map(String) : [],
  }));

  const repairMatrix: RepairMatrixRow[] = repairs.map((r) => ({
    name: String(r.name ?? ""),
    cause: String(r.cause ?? ""),
    effect: String(r.system_effect ?? ""),
    difficulty: String(r.difficulty ?? ""),
    cost: String(r.estimated_cost ?? ""),
    description: String(r.description ?? ""),
  }));

  const prevention = Array.isArray(data.prevention_tips)
    ? (data.prevention_tips as unknown[]).map(String)
    : [];

  const faq: FaqRow[] = Array.isArray(data.faq)
    ? (data.faq as unknown[]).map((f) => {
        if (typeof f === "string") return { question: "FAQ", answer: f };
        const rec = f as Record<string, unknown>;
        return {
          question: String(rec.question ?? ""),
          answer: String(rec.answer ?? ""),
        };
      })
    : [];

  const internalLinks = Array.isArray(data.internal_links) ? data.internal_links : [];

  return {
    title: String(data.title ?? ""),
    symptom: String(data.symptom ?? ""),
    system: String(data.system ?? ""),

    summary: data.fast_answer ?? null,
    toolkit,

    overview,

    quickDecisionTree,
    guidedDiagnosis: guided,

    systemExplainer: typeof data.system_explainer === "string" ? data.system_explainer : "",
    diagnosticOrder: Array.isArray(data.diagnostic_order)
      ? (data.diagnostic_order as unknown[]).map(String)
      : [],
    mermaid: typeof data.mermaid_diagram === "string" ? data.mermaid_diagram : "",

    failureModeNames: failureModes.map((m) => String(m.name ?? "")),

    topCauses,
    repairMatrix,
    benchProcedures,
    tools,
    prevention,
    faq,
    internalLinks,
  };
}
