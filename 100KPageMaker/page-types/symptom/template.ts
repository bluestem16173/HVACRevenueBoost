/**
 * Renderers for /diagnose/[symptom] — branch on schema_version + inferDiagnosticSchemaVersion.
 * Import actual components only from app routes; this file lists stable names for the registry.
 */
export const DIAGNOSE_RENDERERS = [
  "DiagnosticGoldPage",
  "GoldStandardPage",
  "AuthoritySymptomPage",
  "MasterDecisionGridPage",
] as const;
