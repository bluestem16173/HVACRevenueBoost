import DiagnosticModal from "@/components/DiagnosticModal";
import { RelatedLinks } from "@/components/RelatedLinks";
import { StickyCTA } from "@/components/StickyCTA";
import { LegacyRenderer } from "@/components/LegacyRenderer";
import { DgAuthorityV3View } from "@/components/dg/DgAuthorityV3View";
import { isDgAuthorityV3Payload } from "@/components/dg/isDgAuthorityV3Payload";
import type { LocalizedDiagnosticChrome } from "@/components/diagnostic-hub/LocalizedDiagnosticSeoDisclosure";
import { LocalizedDiagnosticFooterDetails } from "@/components/diagnostic-hub/LocalizedDiagnosticFooterDetails";
import type { ServiceVertical } from "@/lib/localized-city-path";
import { getDefaultRelatedSlugs } from "@/lib/default-related-slugs";
import { isHsdCityDiagnosticJson } from "@/lib/homeservice/isHsdCityDiagnosticJson";
import { isHsdV1LockedJson } from "@/lib/hsd/isHsdV1LockedJson";
import { renderHSDPage } from "@/lib/hsd/renderHSDPage";
import { HsdLockedPageWithMermaid } from "@/components/homeservice/HsdLockedPageWithMermaid";
import { HsdCityDiagnosticView } from "@/components/homeservice/HsdCityDiagnosticView";
import { HsdInternalSiteLinks } from "@/components/homeservice/HsdInternalSiteLinks";
import { renderDiagnosticEngineJsonToHtml } from "@/lib/render/renderDiagnosticEngineJsonToHtml";

type PageRow = {
  slug: string;
  content_html?: string | null;
  content_json?: unknown;
  title?: string | null;
  /** DB column — drives render precedence for DG contract rows. */
  schema_version?: string | null;
};

/**
 * Shared HTML/JSON diagnostic article shell (used by `/diagnose/[slug]` and localized HVAC URLs).
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
  const isDgAuthorityV2Contract =
    (rowSchema === "dg_authority_v2" || jsonSchema === "dg_authority_v2") &&
    parsedContentJson != null &&
    typeof parsedContentJson === "object";

  const rowDgV2WithJson =
    rowSchema === "dg_authority_v2" &&
    parsedContentJson != null &&
    typeof parsedContentJson === "object";

  /**
   * DB row `schema_version` is authoritative: never serve stale `content_html` for v2 JSON rows.
   * (JSON-only v2 without the column still flows through `isDgAuthorityV2Contract` below.)
   */
  let suppressContentHtmlForDgV2 = rowDgV2WithJson;

  /** Row-tagged dg_authority_v2 + HSD locked JSON → always live `renderHSDPage` (not stored HTML). */
  if (rowDgV2WithJson && isHsdV1LockedJson(parsedContentJson)) {
    const lockedHtml = renderHSDPage(parsedContentJson as Record<string, unknown>);
    return (
      <>
        <StickyCTA />
        {localLabel ? (
          <div className="max-w-4xl mx-auto px-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
            Local guide: <span className="font-semibold text-slate-900 dark:text-white">{localLabel}</span>
          </div>
        ) : null}
        <main className="pb-16">
          <DiagnosticModal />
          <HsdLockedPageWithMermaid html={lockedHtml} />
        </main>
        <div className="max-w-4xl mx-auto px-4">
          <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
        </div>
      </>
    );
  }

  if (isDgAuthorityV2Contract) {
    const obj = parsedContentJson as Record<string, unknown>;
    /** Locked HSD from JSON-only v2 rows (column unset); row-tagged v2 handled above. */
    if (isHsdV1LockedJson(obj) && !rowDgV2WithJson) {
      const lockedHtml = renderHSDPage(obj);
      return (
        <>
          <StickyCTA />
          {localLabel ? (
            <div className="max-w-4xl mx-auto px-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
              Local guide: <span className="font-semibold text-slate-900 dark:text-white">{localLabel}</span>
            </div>
          ) : null}
          <main className="pb-16">
            <DiagnosticModal />
            <HsdLockedPageWithMermaid html={lockedHtml} />
          </main>
          <div className="max-w-4xl mx-auto px-4">
            <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
          </div>
        </>
      );
    }

    const engineHtml = renderDiagnosticEngineJsonToHtml(obj);
    const engineUnsupported =
      engineHtml.includes("data-diagnostic-fallback") ||
      engineHtml.includes("Unsupported diagnostic JSON");
    if (!engineUnsupported) {
      const cleanHtml = engineHtml.replace(
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
          <main className="pb-16">
            <DiagnosticModal />
            <article dangerouslySetInnerHTML={{ __html: cleanHtml || "" }} />
            <div className="max-w-4xl mx-auto px-4">
              <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
            </div>
          </main>
        </>
      );
    }
    suppressContentHtmlForDgV2 = true;
  }

  const htmlTrimmed = (page.content_html || "").trim();
  const isDgFullStaticHtml =
    !suppressContentHtmlForDgV2 && htmlTrimmed.includes('data-dg-authority-v3="1"');
  const isDgLegacyStubHtml =
    !suppressContentHtmlForDgV2 &&
    htmlTrimmed.includes("dg-authority-v3") &&
    !isDgFullStaticHtml;
  const preferDgReactView =
    parsedContentJson != null &&
    isDgAuthorityV3Payload(parsedContentJson) &&
    (!htmlTrimmed || isDgLegacyStubHtml);

  if (isDgFullStaticHtml && page.content_html?.trim()) {
    const cleanHtml = page.content_html.replace(
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
        <main className="pb-16">
          <DiagnosticModal />
          <article dangerouslySetInnerHTML={{ __html: cleanHtml || "" }} />
          <div className="max-w-4xl mx-auto px-4">
            <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
          </div>
        </main>
      </>
    );
  }

  if (preferDgReactView && parsedContentJson && typeof parsedContentJson === "object") {
    const pageTitle =
      (typeof page.title === "string" && page.title.trim()) || fallbackTitle;
    return (
      <>
        <StickyCTA />
        {localLabel ? (
          <div className="max-w-4xl mx-auto px-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
            Local guide: <span className="font-semibold text-slate-900 dark:text-white">{localLabel}</span>
          </div>
        ) : null}
        <main className="pb-16">
          <DiagnosticModal />
          <DgAuthorityV3View
            data={parsedContentJson as Record<string, unknown>}
            pageTitle={pageTitle}
            localLabel={localLabel}
          />
          <div className="max-w-4xl mx-auto px-4">
            <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
          </div>
        </main>
      </>
    );
  }

  const skipLegacyHtmlForLockedHsd =
    parsedContentJson != null &&
    typeof parsedContentJson === "object" &&
    isHsdV1LockedJson(parsedContentJson);

  if (
    page.content_html &&
    page.content_html.trim() &&
    !skipLegacyHtmlForLockedHsd &&
    !suppressContentHtmlForDgV2
  ) {
    const cleanHtml = page.content_html.replace(
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
          <article dangerouslySetInnerHTML={{ __html: cleanHtml || "" }} />
          <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
        </main>
      </>
    );
  }

  if (page.content_json && parsedContentJson != null && typeof parsedContentJson === "object") {
    const pageTitle =
      (typeof page.title === "string" && page.title.trim()) || fallbackTitle;

    if (isHsdV1LockedJson(parsedContentJson)) {
      const lockedHtml = renderHSDPage(parsedContentJson as Record<string, unknown>);
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

  return <div className="p-8 text-center text-slate-500">Empty page</div>;
}
