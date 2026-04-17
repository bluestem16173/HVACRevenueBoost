import {
  DG_AUTHORITY_V3_LAYOUT,
  DG_AUTHORITY_V3_SCHEMA_VERSION,
} from "@/lib/generated-page-json-contract";
import { asCtaPayload, type DgAuthorityCtaPayload } from "@/lib/dg/dgAuthorityCta";

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function stringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string" && x.trim().length > 0);
}

function warningsArrayOk(v: unknown): boolean {
  return Array.isArray(v) && v.every((x) => typeof x === "string" && x.trim().length > 0);
}

function hasDiagnosticFlow(df: unknown): boolean {
  if (typeof df === "string" && df.trim().length > 0) return true;
  if (!df || typeof df !== "object") return false;
  const o = df as Record<string, unknown>;
  const nodes = Array.isArray(o.nodes) ? o.nodes : [];
  const edges = Array.isArray(o.edges) ? o.edges : [];
  return nodes.length > 0 || edges.length > 0;
}

function failureClustersOk(v: unknown): boolean {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.every((row) => {
    if (!row || typeof row !== "object") return false;
    const o = row as Record<string, unknown>;
    return (
      nonEmptyString(o.title) &&
      nonEmptyString(o.pro) &&
      nonEmptyString(o.home) &&
      nonEmptyString(o.risk)
    );
  });
}

function quickChecksOk(v: unknown): boolean {
  if (!Array.isArray(v) || v.length === 0 || v.length > 5) return false;
  return v.every((x) => typeof x === "string" && x.trim().length > 0);
}

function beforeYouCallOk(v: unknown, legacy: unknown): boolean {
  const raw = (v ?? legacy) as unknown;
  if (!Array.isArray(raw)) return false;
  if (raw.length < 3 || raw.length > 4) return false;
  return raw.every((x) => typeof x === "string" && x.trim().length > 0);
}

function riskNotesOk(v: unknown): boolean {
  if (v == null) return true;
  if (!Array.isArray(v)) return false;
  return v.every((row) => {
    if (!row || typeof row !== "object") return false;
    const o = row as Record<string, unknown>;
    return nonEmptyString(o.label) && nonEmptyString(o.text);
  });
}

function pickMidCta(o: Record<string, unknown>): unknown {
  return o.cta_mid ?? o.cta_midpage;
}

export function isStructuredDgAuthorityV3Payload(o: Record<string, unknown>): boolean {
  return (
    (o.layout === DG_AUTHORITY_V3_LAYOUT || o.schema_version === DG_AUTHORITY_V3_SCHEMA_VERSION) &&
    (o.cta_top != null || pickMidCta(o) != null || o.cta_final != null)
  );
}

export function assertDgAuthorityV3StructuredPayload(o: Record<string, unknown>): void {
  if (o.layout !== DG_AUTHORITY_V3_LAYOUT) {
    throw new Error("Invalid layout (expected dg_authority_v3)");
  }
  if (o.schema_version !== DG_AUTHORITY_V3_SCHEMA_VERSION) {
    throw new Error("schema_version must be dg_authority_v3");
  }
  if (!nonEmptyString(o.title)) throw new Error("Missing title");
  if (o.location != null && typeof o.location !== "string") {
    throw new Error("Invalid location (expected string when present)");
  }
  if (!nonEmptyString(o.summary_30s)) throw new Error("Missing summary_30s");

  if (!quickChecksOk(o.quick_checks)) {
    throw new Error("quick_checks must be 1–5 non-empty strings");
  }
  if (o.quick_checks_pro != null && typeof o.quick_checks_pro !== "string") {
    throw new Error("Invalid quick_checks_pro");
  }
  if (o.quick_checks_pro != null && !nonEmptyString(o.quick_checks_pro)) {
    throw new Error("quick_checks_pro must be non-empty when provided");
  }
  if (!nonEmptyString(o.quick_checks_home)) throw new Error("Missing quick_checks_home");

  if (!nonEmptyString(o.diagnostic_logic_pro)) throw new Error("Missing diagnostic_logic_pro");
  if (!nonEmptyString(o.diagnostic_logic_home)) throw new Error("Missing diagnostic_logic_home");

  if (!hasDiagnosticFlow(o.diagnostic_flow)) {
    throw new Error("Missing diagnostic_flow (Mermaid string or structured nodes/edges)");
  }
  if (!nonEmptyString(o.system_explanation)) throw new Error("Missing system_explanation");
  if (!failureClustersOk(o.failure_clusters)) {
    throw new Error("Missing or invalid failure_clusters (each row needs title, pro, home, risk)");
  }
  if (!stringArray(o.repair_matrix)) throw new Error("Missing or invalid repair_matrix");
  if (!nonEmptyString(o.repair_matrix_pro)) throw new Error("Missing repair_matrix_pro");
  if (!nonEmptyString(o.repair_matrix_home)) throw new Error("Missing repair_matrix_home");
  if (o.repair_matrix_risk != null && typeof o.repair_matrix_risk !== "string") {
    throw new Error("Invalid repair_matrix_risk");
  }

  if (!stringArray(o.field_measurements)) throw new Error("Missing or invalid field_measurements");
  if (!nonEmptyString(o.field_measurements_pro)) throw new Error("Missing field_measurements_pro");
  if (!nonEmptyString(o.field_measurements_home)) throw new Error("Missing field_measurements_home");

  if (!nonEmptyString(o.repair_vs_replace_pro)) throw new Error("Missing repair_vs_replace_pro");
  if (!nonEmptyString(o.repair_vs_replace_home)) throw new Error("Missing repair_vs_replace_home");

  if (!nonEmptyString(o.professional_threshold)) throw new Error("Missing professional_threshold");
  if (!warningsArrayOk(o.warnings)) throw new Error("Invalid warnings (array of non-empty strings)");

  if (!riskNotesOk(o.risk_notes)) throw new Error("Invalid risk_notes");
  if (!beforeYouCallOk(o.before_you_call, o.before_you_call_checks)) {
    throw new Error("before_you_call must be an array of 3–4 non-empty strings (or legacy before_you_call_checks)");
  }
  if (!stringArray(o.do_not_attempt)) throw new Error("Missing or invalid do_not_attempt");

  const top = asCtaPayload(o.cta_top);
  const mid = asCtaPayload(pickMidCta(o));
  const fin = asCtaPayload(o.cta_final);
  if (!top) throw new Error("Missing or invalid cta_top");
  if (!mid) throw new Error("Missing or invalid cta_mid (or legacy cta_midpage)");
  if (!fin) throw new Error("Missing or invalid cta_final");
}

export type { DgAuthorityCtaPayload };
