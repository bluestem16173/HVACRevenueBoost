import { renderDiagnosticEngineJsonToHtml } from "@/lib/render/renderDiagnosticEngineJsonToHtml";

function parseContentJsonRecord(contentJson: unknown): Record<string, unknown> | null {
  if (contentJson == null) return null;
  try {
    const v =
      typeof contentJson === "string" ? JSON.parse(contentJson) : contentJson;
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Returns static HTML from {@link renderDiagnosticEngineJsonToHtml} when `content_json`
 * uses a supported layout; otherwise null (caller should not treat as “empty page”).
 */
export function tryRenderDiagnosticEngineJsonToHtml(
  contentJson: unknown
): string | null {
  const obj = parseContentJsonRecord(contentJson);
  if (!obj) return null;
  const html = renderDiagnosticEngineJsonToHtml(obj);
  if (
    html.includes("data-diagnostic-fallback") ||
    html.includes("Unsupported diagnostic JSON")
  ) {
    return null;
  }
  return html;
}

/**
 * Prefer HTML generated from `content_json` when the diagnostic engine supports it;
 * otherwise fall back to stored `content_html`.
 */
export function resolveDiagnosticBodyHtml(page: {
  content_json?: unknown;
  content_html?: string | null;
}): string | null {
  const fromJson = tryRenderDiagnosticEngineJsonToHtml(page.content_json);
  if (fromJson?.trim()) return fromJson.trim();
  const h = page.content_html?.trim();
  if (h) return page.content_html!.trim();
  return null;
}
