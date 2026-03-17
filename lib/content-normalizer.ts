/**
 * Content Normalizer — Multi-Schema Support
 * -----------------------------------------
 * Maps varied content_json field names from different page types/schemas
 * to a canonical shape the frontend expects.
 *
 * Schemas produce: summary | problem_summary | content | fast_answer
 *                  diagnostic_tests | diagnostic_steps | diagnostics
 * Frontend expects: fast_answer, summary, diagnostic_steps, causes, repairs
 */

export interface NormalizedSymptomContent {
  fast_answer: string | null;
  summary: string | null;
  causes: Array<{ name: string; [k: string]: unknown }>;
  repairs: Array<{ name: string; difficulty?: string; cost?: string; [k: string]: unknown }>;
  diagnostic_steps: Array<{ step?: number; action?: string } | string>;
  field_note?: string | null;
  field_notes?: string | null;
  mermaid_graph?: string | null;
  /** Diagram 1: Primary diagnostic triage */
  diagnosticFlowMermaid?: string | null;
  /** Diagram 2: Cause confirmation + repair routing */
  causeConfirmationMermaid?: string | null;
  [key: string]: unknown;
}

/**
 * Convert diagnostic_tests (name + steps[]) to diagnostic_steps (step + action)
 */
function mapDiagnosticTests(tests: unknown[]): Array<{ step: number; action: string }> {
  if (!Array.isArray(tests)) return [];
  const out: Array<{ step: number; action: string }> = [];
  let stepNum = 1;
  for (const t of tests) {
    if (typeof t !== "object" || t === null) continue;
    const obj = t as Record<string, unknown>;
    const name = String(obj.name ?? obj.title ?? "");
    const steps = Array.isArray(obj.steps) ? obj.steps : [];
    if (name) {
      out.push({ step: stepNum++, action: name });
    }
    for (const s of steps) {
      out.push({ step: stepNum++, action: typeof s === "string" ? s : String(s) });
    }
  }
  return out;
}

/**
 * Normalize raw content_json for symptom pages.
 * Handles: summary/problem_summary/content, diagnostic_tests/diagnostic_steps/diagnostics
 */
export function normalizeSymptomContent(raw: Record<string, unknown> | null | undefined): NormalizedSymptomContent {
  if (!raw || typeof raw !== "object") {
    return {
      fast_answer: null,
      summary: null,
      causes: [],
      repairs: [],
      diagnostic_steps: [],
    };
  }

  const summary =
    (raw.summary as string) ||
    (raw.problem_summary as string) ||
    (raw.fast_answer as string) ||
    (raw.content as string) ||
    null;

  const fast_answer =
    (raw.fast_answer as string) ||
    (raw.summary as string) ||
    (raw.problem_summary as string) ||
    (raw.content as string) ||
    null;

  const causes = Array.isArray(raw.causes) ? raw.causes : [];
  const repairs = Array.isArray(raw.repairs) ? raw.repairs : [];

  const diagnostic_steps =
    Array.isArray(raw.diagnostic_steps) && raw.diagnostic_steps.length > 0
      ? raw.diagnostic_steps
      : Array.isArray(raw.diagnostics) && raw.diagnostics.length > 0
        ? raw.diagnostics
        : Array.isArray(raw.diagnostic_tests) && raw.diagnostic_tests.length > 0
          ? mapDiagnosticTests(raw.diagnostic_tests)
          : [];

  return {
    ...raw,
    fast_answer,
    summary,
    causes,
    repairs,
    diagnostic_steps,
    field_note: (raw.field_note as string) ?? (raw.field_notes as string) ?? null,
    field_notes: (raw.field_notes as string) ?? (raw.field_note as string) ?? null,
    mermaid_graph: (raw.mermaid_graph as string) ?? (raw.diagnostic_tree_mermaid as string) ?? null,
    diagnosticFlowMermaid: (raw.diagnosticFlowMermaid as string) ?? (raw.diagnostic_flow_mermaid as string) ?? (raw.diagnostic_tree_mermaid as string) ?? (raw.mermaid_graph as string) ?? null,
    causeConfirmationMermaid: (raw.causeConfirmationMermaid as string) ?? (raw.cause_confirmation_mermaid as string) ?? null,
  };
}
