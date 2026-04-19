import type { LocalizedDiagnosticChrome } from "@/components/diagnostic-hub/LocalizedDiagnosticSeoDisclosure";
import { DiagnosticFallbackPage } from "@/components/homeservice/DiagnosticFallbackPage";
import { HSDPage } from "@/components/homeservice/HSDPage";
import type { ServiceVertical } from "@/lib/localized-city-path";
import { getDefaultRelatedSlugs } from "@/lib/default-related-slugs";
import { isHsdPageEnvelope } from "@/lib/hsd/isHsdPageEnvelope";

type PageRow = {
  slug: string;
  content_html?: string | null;
  content_json?: unknown;
  title?: string | null;
  schema_version?: string | null;
};

/**
 * Shared diagnostic shell: routes `hsd_v2` / `hsd_v1_locked` / v1-locked shape → {@link HSDPage};
 * everything else → {@link DiagnosticFallbackPage}.
 */
export function DiagnosticPageView({
  page,
  localLabel,
  relatedVertical,
  localizedChrome,
}: {
  page: PageRow;
  localLabel?: string | null;
  relatedVertical?: ServiceVertical | null;
  localizedChrome?: LocalizedDiagnosticChrome | null;
}) {
  const related = getDefaultRelatedSlugs(relatedVertical ?? null, page.slug);
  const relatedPrefix = relatedVertical ? `/${relatedVertical}` : "/diagnose";
  const relatedHeading =
    relatedVertical === "plumbing"
      ? "Related plumbing issues"
      : relatedVertical === "electrical"
        ? "Related electrical issues"
        : relatedVertical === "hvac"
          ? "Related HVAC issues"
          : "Related issues";

  let parsedContentJson: unknown = null;
  if (page.content_json != null) {
    try {
      parsedContentJson =
        typeof page.content_json === "string" ? JSON.parse(page.content_json) : page.content_json;
    } catch {
      parsedContentJson = null;
    }
  }

  const rowSchema =
    typeof page.schema_version === "string" ? page.schema_version.trim() : "";
  const jsonSchema =
    parsedContentJson != null && typeof parsedContentJson === "object"
      ? String((parsedContentJson as Record<string, unknown>).schema_version ?? "").trim()
      : "";
  const effectiveSchema = rowSchema || jsonSchema;

  if (parsedContentJson != null && typeof parsedContentJson === "object") {
    const content = parsedContentJson as Record<string, unknown>;
    if (isHsdPageEnvelope(effectiveSchema, content)) {
      return (
        <HSDPage
          content={content}
          page={page}
          localLabel={localLabel}
          localizedChrome={localizedChrome}
          related={related}
          relatedPrefix={relatedPrefix}
          relatedHeading={relatedHeading}
        />
      );
    }
    return (
      <DiagnosticFallbackPage
        page={page}
        content={content}
        localLabel={localLabel}
        relatedVertical={relatedVertical}
        localizedChrome={localizedChrome}
        related={related}
        relatedPrefix={relatedPrefix}
        relatedHeading={relatedHeading}
      />
    );
  }

  return (
    <DiagnosticFallbackPage
      page={page}
      content={null}
      localLabel={localLabel}
      relatedVertical={relatedVertical}
      localizedChrome={localizedChrome}
      related={related}
      relatedPrefix={relatedPrefix}
      relatedHeading={relatedHeading}
    />
  );
}
