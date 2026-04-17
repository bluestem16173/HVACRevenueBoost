import {
  DG_AUTHORITY_V3_LAYOUT,
  DG_AUTHORITY_V3_SCHEMA_VERSION,
} from "@/lib/generated-page-json-contract";
import { assertDgAuthorityV3StructuredPayload } from "@/lib/dg/validateDgAuthorityV3Structured";
import type { DgAuthorityV3PageInput } from "@/lib/dg/typesDgAuthorityV3";

/**
 * Builds a validated `pages.content_json` object for **dg_authority_v3**
 * (dual-layer pro/home/risk + JSON CTAs `cta_top` / `cta_mid` / `cta_final`).
 */
export function buildDgAuthorityV3Page(input: DgAuthorityV3PageInput): Record<string, unknown> {
  const loc = typeof input.location === "string" ? input.location.trim() : "";

  const out: Record<string, unknown> = {
    layout: DG_AUTHORITY_V3_LAYOUT,
    schema_version: DG_AUTHORITY_V3_SCHEMA_VERSION,
    title: input.title,
    ...(loc ? { location: loc } : {}),
    summary_30s: input.summary_30s,
    cta_top: input.cta_top,
    quick_checks: input.quick_checks,
    ...(input.quick_checks_pro != null && String(input.quick_checks_pro).trim()
      ? { quick_checks_pro: String(input.quick_checks_pro).trim() }
      : {}),
    quick_checks_home: input.quick_checks_home,
    diagnostic_logic_pro: input.diagnostic_logic_pro,
    diagnostic_logic_home: input.diagnostic_logic_home,
    diagnostic_flow: input.diagnostic_flow,
    system_explanation: input.system_explanation,
    failure_clusters: input.failure_clusters,
    repair_matrix: input.repair_matrix,
    repair_matrix_pro: input.repair_matrix_pro,
    repair_matrix_home: input.repair_matrix_home,
    ...(input.repair_matrix_risk != null && String(input.repair_matrix_risk).trim()
      ? { repair_matrix_risk: String(input.repair_matrix_risk).trim() }
      : {}),
    cta_mid: input.cta_mid,
    field_measurements: input.field_measurements,
    field_measurements_pro: input.field_measurements_pro,
    field_measurements_home: input.field_measurements_home,
    repair_vs_replace_pro: input.repair_vs_replace_pro,
    repair_vs_replace_home: input.repair_vs_replace_home,
    professional_threshold: input.professional_threshold,
    warnings: input.warnings,
    cta_final: input.cta_final,
    before_you_call: input.before_you_call,
    do_not_attempt: input.do_not_attempt,
    risk_notes: input.risk_notes ?? [],
  };

  assertDgAuthorityV3StructuredPayload(out);
  return out;
}
