import DiagnosticModal from "@/components/DiagnosticModal";
import { RelatedLinks } from "@/components/RelatedLinks";
import { StickyCTA } from "@/components/StickyCTA";
import { LegacyRenderer } from "@/components/LegacyRenderer";
import { DgAuthorityV3View } from "@/components/dg/DgAuthorityV3View";
import { isDgAuthorityV3Payload } from "@/components/dg/isDgAuthorityV3Payload";
import type { ServiceVertical } from "@/lib/localized-city-path";
import { getDefaultRelatedSlugs } from "@/lib/default-related-slugs";

type PageRow = {
  slug: string;
  content_html?: string | null;
  content_json?: unknown;
  title?: string | null;
};

/**
 * Shared HTML/JSON diagnostic article shell (used by `/diagnose/[slug]` and localized HVAC URLs).
 */
export function DiagnosticPageView({
  page,
  localLabel,
  relatedVertical,
}: {
  page: PageRow;
  /** e.g. "Tampa, FL" — optional line under the sticky CTA */
  localLabel?: string | null;
  /** When set, related links target `/{vertical}/{slug}` instead of `/diagnose/{slug}`. */
  relatedVertical?: ServiceVertical | null;
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

  const htmlTrimmed = (page.content_html || "").trim();
  const isDgFullStaticHtml = htmlTrimmed.includes('data-dg-authority-v3="1"');
  const isDgLegacyStubHtml =
    htmlTrimmed.includes("dg-authority-v3") && !isDgFullStaticHtml;
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

  if (page.content_html && page.content_html.trim()) {
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

  if (page.content_json && parsedContentJson != null) {
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
          <LegacyRenderer title={fallbackTitle} data={parsedContentJson} />
          <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
        </main>
      </>
    );
  }

  return <div className="p-8 text-center text-slate-500">Empty page</div>;
}
