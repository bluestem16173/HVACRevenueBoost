/**
 * When `pages.schema_version` is null (older jobs, drift, or manual inserts),
 * infer which renderer branch to use so /diagnose/[symptom] does not fall through
 * to "Unknown schema" with only the debug footer visible.
 */

export function inferDiagnosticSchemaVersion(content: unknown): string | null {
  if (content == null || typeof content !== "object") return null;
  const o = content as Record<string, unknown>;

  if (o.layout === "hvac_authority_v3" || o.schemaVersion === "hvac_authority_v3") {
    return "hvac_authority_v3";
  }

  if (o.layout === "dg_authority_v3" || o.schemaVersion === "dg_authority_v3") {
    return "dg_authority_v3";
  }

  if (o.layout === "authority_symptom" || o.schemaVersion === "authority_symptom") {
    return "authority_symptom";
  }

  if (o.layout === "decisiongrid_master" || o.schemaVersion === "decisiongrid_master") {
    return "decisiongrid_master";
  }

  if (o.schemaVersion === "v2_goldstandard") {
    return "v2_goldstandard";
  }

  const hasV5OrLegacyHub =
    Array.isArray(o.failure_modes) ||
    Array.isArray(o.causes) ||
    Array.isArray(o.repairs) ||
    Array.isArray(o.guided_diagnosis) ||
    (typeof o.mermaid_diagram === "string" && o.mermaid_diagram.trim().length > 0) ||
    Array.isArray(o.diagnostic_order) ||
    Array.isArray(o.commonCauses) ||
    typeof o.mermaidGraph === "string" ||
    (o.hero !== null && typeof o.hero === "object") ||
    (o.diagnosticFlow !== null && typeof o.diagnosticFlow === "object");

  if (hasV5OrLegacyHub) {
    return "v5_master";
  }

  if (o.fast_answer !== undefined && o.fast_answer !== null) {
    return "v5_master";
  }

  return null;
}
