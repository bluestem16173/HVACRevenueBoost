import {
  DG_AUTHORITY_V3_LAYOUT,
  DG_AUTHORITY_V3_SCHEMA_VERSION,
  GENERATED_PAGE_LAYOUT,
  GENERATED_PAGE_SCHEMA_VERSION,
} from "@/lib/generated-page-json-contract";

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function stringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string" && x.trim().length > 0);
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
    return nonEmptyString(o.category) && nonEmptyString(o.details);
  });
}

/**
 * Hard validation for **structured** dg_authority_v2 pages (quick_checks[], etc.).
 * Call when `content_json` is this contract — not HSD locked flat keys.
 */
export function assertDgAuthorityV2StructuredPayload(o: Record<string, unknown>): void {
  if (o.layout !== GENERATED_PAGE_LAYOUT) {
    throw new Error("Invalid layout");
  }
  if (o.schema_version !== GENERATED_PAGE_SCHEMA_VERSION) {
    throw new Error("schema_version must be dg_authority_v2");
  }
  if (!nonEmptyString(o.title)) throw new Error("Missing title");
  if (!nonEmptyString(o.summary_30s)) throw new Error("Missing summary_30s");
  if (!stringArray(o.quick_checks)) throw new Error("Missing or invalid quick_checks");
  if (!nonEmptyString(o.diagnostic_logic)) throw new Error("Missing diagnostic_logic");
  if (!hasDiagnosticFlow(o.diagnostic_flow)) {
    throw new Error("Missing diagnostic_flow (Mermaid string or structured nodes/edges)");
  }
  if (!nonEmptyString(o.system_explanation)) throw new Error("Missing system_explanation");
  if (!failureClustersOk(o.failure_clusters)) {
    throw new Error("Missing or invalid failure_clusters");
  }
  if (!stringArray(o.repair_matrix)) throw new Error("Missing or invalid repair_matrix");
  if (!stringArray(o.field_measurements)) throw new Error("Missing or invalid field_measurements");
  if (!nonEmptyString(o.repair_vs_replace)) throw new Error("Missing repair_vs_replace");
  if (!nonEmptyString(o.professional_threshold)) throw new Error("Missing professional_threshold");

  if (!stringArray(o.warnings)) {
    throw new Error("Missing or invalid warnings (non-empty string array)");
  }

  const next = o.next_step ?? o.cta;
  if (!nonEmptyString(next)) throw new Error("Missing next_step");
}

export function isStructuredDgAuthorityV2Payload(o: Record<string, unknown>): boolean {
  if (!Array.isArray(o.quick_checks)) return false;
  if (o.layout === DG_AUTHORITY_V3_LAYOUT || o.schema_version === DG_AUTHORITY_V3_SCHEMA_VERSION) {
    return false;
  }
  return true;
}
