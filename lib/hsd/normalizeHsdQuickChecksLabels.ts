/** Normalize legacy "Quick Diagnosis" phrasing to the single on-site label "Quick checks". */
const QUICK_DIAGNOSIS_PHRASE = /\bquick\s*diagnosis\b/gi;

export function replaceQuickDiagnosisWithQuickChecks(s: string): string {
  return s.replace(QUICK_DIAGNOSIS_PHRASE, "Quick checks");
}

function normStr(v: unknown): unknown {
  return typeof v === "string" ? replaceQuickDiagnosisWithQuickChecks(v) : v;
}

/** Rewrites model copy that still says "Quick Diagnosis" to match the on-site "Quick checks" label. */
export function applyQuickChecksLabelNormalizationToHsdJson(json: Record<string, unknown>): void {
  if (typeof json.title === "string") json.title = replaceQuickDiagnosisWithQuickChecks(json.title);

  const s30 = json.summary_30s;
  if (s30 && typeof s30 === "object") {
    const o = s30 as Record<string, unknown>;
    for (const k of ["headline", "core_truth", "risk_warning"] as const) {
      if (typeof o[k] === "string") o[k] = replaceQuickDiagnosisWithQuickChecks(o[k] as string);
    }
    if (Array.isArray(o.flow_lines)) {
      o.flow_lines = (o.flow_lines as unknown[]).map((x) => normStr(x) as string);
    }
    if (Array.isArray(o.top_causes)) {
      o.top_causes = (o.top_causes as unknown[]).map((c) => {
        if (!c || typeof c !== "object") return c;
        const row = { ...(c as Record<string, unknown>) };
        for (const k of ["label", "probability", "deep_dive"] as const) {
          if (typeof row[k] === "string") row[k] = replaceQuickDiagnosisWithQuickChecks(row[k] as string);
        }
        return row;
      });
    }
  }

  for (const k of ["what_this_means", "how_system_works", "repair_matrix_intro", "decision_footer", "cta", "final_warning"] as const) {
    if (typeof json[k] === "string") json[k] = replaceQuickDiagnosisWithQuickChecks(json[k] as string);
  }

  if (Array.isArray(json.canonical_truths)) {
    json.canonical_truths = (json.canonical_truths as unknown[]).map((x) => normStr(x) as string);
  }

  if (Array.isArray(json.quick_checks)) {
    json.quick_checks = (json.quick_checks as unknown[]).map((row) => {
      if (!row || typeof row !== "object") return row;
      const r = { ...(row as Record<string, unknown>) };
      for (const k of ["check", "homeowner", "result_meaning", "next_step", "risk"] as const) {
        if (typeof r[k] === "string") r[k] = replaceQuickDiagnosisWithQuickChecks(r[k] as string);
      }
      return r;
    });
  }

  if (Array.isArray(json.diagnostic_steps)) {
    json.diagnostic_steps = (json.diagnostic_steps as unknown[]).map((row) => {
      if (!row || typeof row !== "object") return row;
      const r = { ...(row as Record<string, unknown>) };
      for (const k of ["step", "homeowner", "pro", "risk"] as const) {
        if (typeof r[k] === "string") r[k] = replaceQuickDiagnosisWithQuickChecks(r[k] as string);
      }
      return r;
    });
  }

  if (Array.isArray(json.quick_table)) {
    json.quick_table = (json.quick_table as unknown[]).map((row) => {
      if (!row || typeof row !== "object") return row;
      const r = { ...(row as Record<string, unknown>) };
      for (const k of ["symptom", "cause", "fix"] as const) {
        if (typeof r[k] === "string") r[k] = replaceQuickDiagnosisWithQuickChecks(r[k] as string);
      }
      return r;
    });
  }

  if (Array.isArray(json.decision_tree_text)) {
    json.decision_tree_text = (json.decision_tree_text as unknown[]).map((x) => normStr(x) as string);
  }

  if (Array.isArray(json.tools)) {
    json.tools = (json.tools as unknown[]).map((x) => normStr(x) as string);
  }

  const flow = json.diagnostic_flow;
  if (flow && typeof flow === "object") {
    const f = flow as Record<string, unknown>;
    if (Array.isArray(f.nodes)) {
      f.nodes = (f.nodes as unknown[]).map((n) => {
        if (!n || typeof n !== "object") return n;
        const row = { ...(n as Record<string, unknown>) };
        if (typeof row.label === "string") row.label = replaceQuickDiagnosisWithQuickChecks(row.label as string);
        return row;
      });
    }
    if (Array.isArray(f.edges)) {
      f.edges = (f.edges as unknown[]).map((e) => {
        if (!e || typeof e !== "object") return e;
        const row = { ...(e as Record<string, unknown>) };
        if (typeof row.label === "string") row.label = replaceQuickDiagnosisWithQuickChecks(row.label as string);
        return row;
      });
    }
  }

  if (Array.isArray(json.repair_matrix)) {
    json.repair_matrix = (json.repair_matrix as unknown[]).map((row) => {
      if (!row || typeof row !== "object") return row;
      const r = { ...(row as Record<string, unknown>) };
      for (const k of ["issue", "fix"] as const) {
        if (typeof r[k] === "string") r[k] = replaceQuickDiagnosisWithQuickChecks(r[k] as string);
      }
      return r;
    });
  }

  if (Array.isArray(json.cost_escalation)) {
    json.cost_escalation = (json.cost_escalation as unknown[]).map((row) => {
      if (!row || typeof row !== "object") return row;
      const r = { ...(row as Record<string, unknown>) };
      for (const k of ["stage", "description", "cost"] as const) {
        if (typeof r[k] === "string") r[k] = replaceQuickDiagnosisWithQuickChecks(r[k] as string);
      }
      return r;
    });
  }

  const dec = json.decision;
  if (dec && typeof dec === "object") {
    const d = dec as Record<string, unknown>;
    for (const col of ["safe", "call_pro", "stop_now"] as const) {
      if (Array.isArray(d[col])) {
        d[col] = (d[col] as unknown[]).map((x) => normStr(x) as string);
      }
    }
  }
}
