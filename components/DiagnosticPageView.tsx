import DiagnosticModal from "@/components/DiagnosticModal";
import { RelatedLinks } from "@/components/RelatedLinks";
import { StickyCTA } from "@/components/StickyCTA";
import { LegacyRenderer } from "@/components/LegacyRenderer";
import type { LocalizedDiagnosticChrome } from "@/components/diagnostic-hub/LocalizedDiagnosticSeoDisclosure";
import { LocalizedDiagnosticFooterDetails } from "@/components/diagnostic-hub/LocalizedDiagnosticFooterDetails";
import type { ServiceVertical } from "@/lib/localized-city-path";
import { getDefaultRelatedSlugs } from "@/lib/default-related-slugs";
import { isHsdCityDiagnosticJson } from "@/lib/homeservice/isHsdCityDiagnosticJson";
import { isHsdV1LockedJson } from "@/lib/hsd/isHsdV1LockedJson";
import { renderHSDPage } from "@/lib/hsd/renderHSDPage";
import { renderHsdV2CitySymptomPage } from "@/lib/hsd/renderHsdV2CitySymptomPage";
import { renderHsdV25, type HsdV25RenderInput } from "@/lib/hsd/renderHsdV25";
import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import { coerceHsdJsonForV25View } from "@/lib/hsd/coerceHsdJsonForV25View";
import { HSDV25Schema, type HsdV25Payload } from "@/lib/validation/hsdV25Schema";
import { HsdLockedPageWithMermaid } from "@/components/homeservice/HsdLockedPageWithMermaid";
import { HsdCityDiagnosticView } from "@/components/homeservice/HsdCityDiagnosticView";
import { HsdInternalSiteLinks } from "@/components/homeservice/HsdInternalSiteLinks";
import { resolveDiagnosticBodyHtml } from "@/lib/render/resolveDiagnosticBodyHtml";

type PageRow = {
  slug: string;
  content_html?: string | null;
  content_json?: unknown;
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
 * Shared HTML/JSON diagnostic article shell (used by `/diagnose/[slug]` and localized HVAC URLs).
 * JSON shapes win over `content_html` when structured `content_json` is present.
 */
export function DiagnosticPageView({
  page,
  localLabel,
  relatedVertical,
  localizedChrome,
}: {
  page: PageRow;
  /** e.g. "Tampa, FL" — optional line under the sticky CTA */
  localLabel?: string | null;
  /** When set, related links target `/{vertical}/{slug}` instead of `/diagnose/{slug}`. */
  relatedVertical?: ServiceVertical | null;
  /** When set, breadcrumbs / pillar / hub nav move to a footer disclosure (city diagnostic UX). */
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

  const fallbackTitle = page.slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

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

  const isHsdV2Row =
    rowSchema === HSD_V2_SCHEMA_VERSION || jsonSchema === HSD_V2_SCHEMA_VERSION;

  if (parsedContentJson != null && typeof parsedContentJson === "object") {
    const pageTitle =
      (typeof page.title === "string" && page.title.trim()) || fallbackTitle;
    const obj = parsedContentJson as Record<string, unknown>;

    if (isHsdV2Row) {
      const strict = HSDV25Schema.safeParse(obj);
      const coerced = strict.success ? strict.data : coerceHsdJsonForV25View(obj);
      const html = coerced
        ? renderHsdV25(hsdV25RenderInputFromStoredRow(coerced, obj, localizedChrome))
        : renderHsdV2CitySymptomPage(obj);
      return (
        <>
          <StickyCTA />
          {!localizedChrome && localLabel ? (
            <div className="mx-auto max-w-4xl px-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
              Local guide: <span className="font-semibold text-slate-900 dark:text-white">{localLabel}</span>
            </div>
          ) : null}
          <main className="pb-16">
            <DiagnosticModal />
            <HsdLockedPageWithMermaid html={html} />
          </main>
          {!localizedChrome ? (
            <div className="mx-auto max-w-4xl px-4 pb-16">
              <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
            </div>
          ) : null}
        </>
      );
    }

    if (isHsdV1LockedJson(parsedContentJson)) {
      const lockedHtml = renderHSDPage(obj);
      return (
        <>
          {!localizedChrome && localLabel ? (
            <div className="mx-auto max-w-4xl px-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
              Local guide: <span className="font-semibold text-slate-900 dark:text-white">{localLabel}</span>
            </div>
          ) : null}
          <main className="pb-16">
            <DiagnosticModal />
            <HsdLockedPageWithMermaid html={lockedHtml} />
          </main>
          {!localizedChrome ? (
            <div className="mx-auto max-w-4xl px-4 pb-16">
              <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
            </div>
          ) : null}
        </>
      );
    }

    if (isHsdCityDiagnosticJson(parsedContentJson)) {
      return (
        <>
          {!localizedChrome && localLabel ? (
            <div className="mx-auto max-w-4xl px-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
              Local guide: <span className="font-semibold text-slate-900 dark:text-white">{localLabel}</span>
            </div>
          ) : null}
          <main className="pb-16">
            <DiagnosticModal />
            <HsdCityDiagnosticView
              data={parsedContentJson}
              pageTitle={pageTitle}
              storageSlug={page.slug}
              deferInternalSiteLinks={Boolean(localizedChrome)}
            />
          </main>
          {localizedChrome ? (
            <LocalizedDiagnosticFooterDetails
              chrome={localizedChrome}
              related={related}
              relatedPrefix={relatedPrefix}
              relatedHeading={relatedHeading}
            >
              <HsdInternalSiteLinks data={parsedContentJson} />
            </LocalizedDiagnosticFooterDetails>
          ) : (
            <div className="mx-auto max-w-4xl px-4 pb-16">
              <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <StickyCTA />
        {!localizedChrome && localLabel ? (
          <div className="max-w-4xl mx-auto px-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
            Local guide: <span className="font-semibold text-slate-900 dark:text-white">{localLabel}</span>
          </div>
        ) : null}
        <main style={{ padding: 24, paddingBottom: localizedChrome ? 24 : 60 }}>
          <DiagnosticModal />
          <LegacyRenderer title={fallbackTitle} data={parsedContentJson} />
          {!localizedChrome ? (
            <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
          ) : null}
        </main>
        {localizedChrome ? (
          <LocalizedDiagnosticFooterDetails
            chrome={localizedChrome}
            related={related}
            relatedPrefix={relatedPrefix}
            relatedHeading={relatedHeading}
          />
        ) : null}
      </>
    );
  }

  const resolvedBodyHtml = resolveDiagnosticBodyHtml(page)?.trim();
  if (resolvedBodyHtml) {
    const cleanHtml = resolvedBodyHtml.replace(
      /<div[^>]*position:\s*sticky[^>]*>[\s\S]*?<\/div>/i,
      ""
    );

    return (
      <>
        <StickyCTA />
        {localLabel ? (
          <div className="max-w-4xl mx-auto px-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
            Local guide: <span className="font-semibold text-slate-900 dark:text-white">{localLabel}</span>
          </div>
        ) : null}
        <main style={{ padding: 24, paddingBottom: 60 }}>
          <DiagnosticModal />
          <div className="prose prose-slate mx-auto max-w-4xl dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: cleanHtml || "" }} />
          </div>
          <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
        </main>
      </>
    );
  }

  return <div className="p-8 text-center text-slate-500">Empty page</div>;
}
