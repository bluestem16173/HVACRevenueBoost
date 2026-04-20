import { RenderDGAuthority } from "@/components/dg/RenderDGAuthority";
import { LegacyRenderer } from "@/components/LegacyRenderer";
import { isHsdPageEnvelope } from "@/lib/hsd/isHsdPageEnvelope";
import type { ServiceVertical } from "@/lib/localized-city-path";
import { renderHsdV25 } from "@/src/lib/hsd/renderHsdV25";

function parseContentJson(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return Object.keys(raw as object).length > 0 ? (raw as Record<string, unknown>) : null;
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    try {
      const o = JSON.parse(t) as unknown;
      return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Renders `pages.content_json` for authority / diagnostic rows. Prefer this over `content_html` when JSON exists.
 */
export function RenderAuthority({
  content,
  vertical = "hvac",
}: {
  content: unknown;
  vertical?: ServiceVertical;
}) {
  const parsed = parseContentJson(content);
  if (!parsed) {
    return <div className="p-6 text-slate-600 dark:text-slate-400">Invalid or empty content_json.</div>;
  }

  const layout = String(parsed.layout ?? "").trim().toLowerCase();
  const schema = String(parsed.schema_version ?? "").trim().toLowerCase();

  if (layout === "dg_authority_v2" || schema === "dg_authority_v2") {
    return (
      <div className="dg-authority-v2-root min-h-screen bg-white dark:bg-slate-950">
        <RenderDGAuthority data={parsed} />
      </div>
    );
  }

  if (isHsdPageEnvelope(schema, parsed)) {
    const html = renderHsdV25({ ...parsed, vertical });
    return (
      <div className="hsd-v25-root min-h-screen bg-white dark:bg-slate-950" dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  const title = String(parsed.title ?? "Diagnostic").trim() || "Diagnostic";
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <LegacyRenderer title={title} data={parsed} />
    </div>
  );
}
