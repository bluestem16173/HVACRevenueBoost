import {
  HSD_LOCKED_BODY_KEYS,
  HSD_V1_LOCKED_LAYOUT,
  HSD_V1_LOCKED_SCHEMA_VERSION,
} from "./constants";
import { isHsdDiagnosticFlowGraph } from "./diagnosticFlowGraph";

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** True when `pages.content_json` carries the flat HSD locked sections (current or legacy markers). */
export function isHsdV1LockedJson(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const legacy =
    o.layout === "hsd_v1_locked" || o.schema_version === "hsd_v1_locked";
  const current =
    o.layout === HSD_V1_LOCKED_LAYOUT || o.schema_version === HSD_V1_LOCKED_SCHEMA_VERSION;
  if (!legacy && !current) {
    return false;
  }

  const hasStructuredFlow = isHsdDiagnosticFlowGraph(o.diagnostic_flow);
  const legacyMermaidOnly = !hasStructuredFlow && nonEmptyString(o.mermaid_flow);

  if (!hasStructuredFlow && !legacyMermaidOnly) {
    return false;
  }

  for (const k of HSD_LOCKED_BODY_KEYS) {
    if (!nonEmptyString(o[k])) return false;
  }
  return nonEmptyString(o.title) && nonEmptyString(o.slug);
}
