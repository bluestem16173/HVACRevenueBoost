/**
 * Detects stored `pages.content_json` from HSD city_symptom generation
 * (`HSD_CITY_DIAGNOSTIC_SCHEMA_VERSION` / `generateDiagnosticEngineJson`).
 */
export function isHsdCityDiagnosticJson(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.title !== "string" || !o.title.trim()) return false;
  if (typeof o.problem !== "string" || !o.problem.trim()) return false;
  if (typeof o.summary_30s !== "string" || !o.summary_30s.trim()) return false;
  if (!Array.isArray(o.quick_checks) || o.quick_checks.length < 1) return false;
  if (!Array.isArray(o.likely_causes) || o.likely_causes.length < 3) return false;
  if (!Array.isArray(o.diagnostic_steps) || o.diagnostic_steps.length < 4) return false;
  const cta = o.cta;
  if (!cta || typeof cta !== "object") return false;
  const c = cta as Record<string, unknown>;
  if (typeof c.primary !== "string" || !String(c.primary).trim()) return false;
  return true;
}

/** Split summary_30s into display lines (supports newline bullets or single paragraph). */
export function linesFromSummary30s(summary: string): string[] {
  const raw = summary.trim();
  const byNl = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (byNl.length >= 2) return byNl.map((l) => l.replace(/^[•\-\*]\s*/, "").trim()).filter(Boolean);
  if (raw.includes("•")) {
    return raw
      .split("•")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return raw ? [raw] : [];
}
