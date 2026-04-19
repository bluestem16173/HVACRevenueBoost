import { RelatedLinks } from "@/components/RelatedLinks";
import { StickyCTA } from "@/components/StickyCTA";
import { LegacyRenderer } from "@/components/LegacyRenderer";
import { HsdV25LeadAnchoredBody } from "@/components/homeservice/HsdV25LeadAnchoredBody";
import { HsdTampaRelatedHvacIssues } from "@/components/homeservice/HsdTampaRelatedHvacIssues";
import { HsdLockedPageWithMermaid } from "@/components/homeservice/HsdLockedPageWithMermaid";
import type { LocalizedDiagnosticChrome } from "@/components/diagnostic-hub/LocalizedDiagnosticSeoDisclosure";
import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import { coerceHsdJsonForV25View } from "@/lib/hsd/coerceHsdJsonForV25View";
import { renderHSDPage } from "@/lib/hsd/renderHSDPage";
import { renderHsdV2CitySymptomPage } from "@/lib/hsd/renderHsdV2CitySymptomPage";
import { renderHsdV25LeadSegments } from "@/src/lib/hsd/renderHsdV25";
import type { HsdV25RenderInput } from "@/lib/hsd/renderHsdV25";
import { HSDV25Schema, type HsdV25Payload } from "@/lib/validation/hsdV25Schema";
import { isHsdV1LockedJson } from "@/lib/hsd/isHsdV1LockedJson";

type PageRow = {
  slug: string;
  title?: string | null;
  schema_version?: string | null;
};

function hsdV25RenderInputFromStoredRow(
  parsed: HsdV25Payload,
  raw: Record<string, unknown>,
  localizedChrome: LocalizedDiagnosticChrome | null | undefined
): HsdV25RenderInput {
  const city =
    (typeof raw.city === "string" && raw.city.trim()) ||
    (localizedChrome?.cityLabel?.trim() ?? "");
  const vertical =
    (typeof raw.vertical === "string" && raw.vertical.trim()) ||
    (localizedChrome?.vertical ?? "");
  let symptom = (typeof raw.symptom === "string" && raw.symptom.trim()) || "";
  if (!symptom && localizedChrome?.pillarSlug) {
    symptom = localizedChrome.pillarSlug.replace(/-/g, " ");
  }
  return { ...parsed, city, vertical, symptom };
}

/**
 * HSD stack only: `hsd_v2` (v2.5 segments or legacy v2 HTML) and v1 locked (`renderHSDPage` + Mermaid shell).
 * Routed when {@link isHsdPageEnvelope} is true.
 */
export function HSDPage({
  content,
  page,
  localLabel,
  localizedChrome,
  related,
  relatedPrefix,
  relatedHeading,
}: {
  content: Record<string, unknown>;
  page: PageRow;
  localLabel?: string | null;
  localizedChrome?: LocalizedDiagnosticChrome | null;
  related: string[];
  relatedPrefix: string;
  relatedHeading: string;
}) {
  const rowSchema =
    typeof page.schema_version === "string" ? page.schema_version.trim() : "";
  const jsonSchema = String(content.schema_version ?? "").trim();
  const isHsdV2Row =
    rowSchema === HSD_V2_SCHEMA_VERSION || jsonSchema === HSD_V2_SCHEMA_VERSION;

  if (isHsdV2Row) {
    const strict = HSDV25Schema.safeParse(content);
    const coerced = strict.success ? strict.data : coerceHsdJsonForV25View(content);
    let segments: ReturnType<typeof renderHsdV25LeadSegments> | null = null;
    let legacyV2Html: string | null = null;
    if (coerced) {
      const v25Input = hsdV25RenderInputFromStoredRow(coerced, content, localizedChrome);
      segments = renderHsdV25LeadSegments(v25Input);
    } else {
      legacyV2Html = renderHsdV2CitySymptomPage(content);
    }
    return (
      <>
        <StickyCTA />
        {!localizedChrome && localLabel ? (
          <div className="mx-auto max-w-4xl px-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
            Local guide: <span className="font-semibold text-slate-900 dark:text-white">{localLabel}</span>
          </div>
        ) : null}
        <main className="pb-16">
          {segments ? (
            <HsdV25LeadAnchoredBody
              headerHtml={segments.headerHtml}
              midThroughDecisionHtml={segments.midThroughDecisionHtml}
              closingHtml={segments.closingHtml}
            />
          ) : (
            <HsdLockedPageWithMermaid html={legacyV2Html ?? ""} />
          )}
        </main>
        <div className="mx-auto max-w-4xl px-4">
          <HsdTampaRelatedHvacIssues storageSlug={page.slug} />
        </div>
        {!localizedChrome ? (
          <div className="mx-auto max-w-4xl px-4 pb-16">
            <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
          </div>
        ) : null}
      </>
    );
  }

  if (isHsdV1LockedJson(content)) {
    const lockedHtml = renderHSDPage(content);
    return (
      <>
        {!localizedChrome && localLabel ? (
          <div className="mx-auto max-w-4xl px-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
            Local guide: <span className="font-semibold text-slate-900 dark:text-white">{localLabel}</span>
          </div>
        ) : null}
        <main className="pb-16">
          <HsdLockedPageWithMermaid html={lockedHtml} />
        </main>
        <div className="mx-auto max-w-4xl px-4">
          <HsdTampaRelatedHvacIssues storageSlug={page.slug} />
        </div>
        {!localizedChrome ? (
          <div className="mx-auto max-w-4xl px-4 pb-16">
            <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
          </div>
        ) : null}
      </>
    );
  }

  const fallbackTitle = page.slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
  return (
    <>
      <StickyCTA />
      {!localizedChrome && localLabel ? (
        <div className="mx-auto max-w-4xl px-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
          Local guide: <span className="font-semibold text-slate-900 dark:text-white">{localLabel}</span>
        </div>
      ) : null}
      <main style={{ padding: 24, paddingBottom: localizedChrome ? 24 : 60 }}>
        <LegacyRenderer
          title={(typeof page.title === "string" && page.title.trim()) || fallbackTitle}
          data={content}
        />
        {!localizedChrome ? (
          <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
        ) : null}
      </main>
      <div className="mx-auto max-w-4xl px-4">
        <HsdTampaRelatedHvacIssues storageSlug={page.slug} />
      </div>
    </>
  );
}
