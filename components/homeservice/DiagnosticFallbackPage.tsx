import { RelatedLinks } from "@/components/RelatedLinks";
import { StickyCTA } from "@/components/StickyCTA";
import { LegacyRenderer } from "@/components/LegacyRenderer";
import type { LocalizedDiagnosticChrome } from "@/components/diagnostic-hub/LocalizedDiagnosticSeoDisclosure";
import { LocalizedDiagnosticFooterDetails } from "@/components/diagnostic-hub/LocalizedDiagnosticFooterDetails";
import { HsdCityDiagnosticView } from "@/components/homeservice/HsdCityDiagnosticView";
import { HsdInternalSiteLinks } from "@/components/homeservice/HsdInternalSiteLinks";
import type { ServiceVertical } from "@/lib/localized-city-path";
import { isHsdCityDiagnosticJson } from "@/lib/homeservice/isHsdCityDiagnosticJson";
import { resolveDiagnosticBodyHtml } from "@/lib/render/resolveDiagnosticBodyHtml";

type PageRow = {
  slug: string;
  content_html?: string | null;
  content_json?: unknown;
  title?: string | null;
  schema_version?: string | null;
};

/**
 * Non-HSD diagnostic JSON, legacy structured pages, HTML body, or empty.
 */
export function DiagnosticFallbackPage({
  page,
  content,
  localLabel,
  relatedVertical,
  localizedChrome,
  related,
  relatedPrefix,
  relatedHeading,
}: {
  page: PageRow;
  /** Parsed `content_json` object, or `null` if missing / invalid JSON. */
  content: Record<string, unknown> | null;
  localLabel?: string | null;
  relatedVertical?: ServiceVertical | null;
  localizedChrome?: LocalizedDiagnosticChrome | null;
  related: string[];
  relatedPrefix: string;
  relatedHeading: string;
}) {
  const fallbackTitle = page.slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  if (content != null && typeof content === "object") {
    const pageTitle = (typeof page.title === "string" && page.title.trim()) || fallbackTitle;

    if (isHsdCityDiagnosticJson(content)) {
      return (
        <>
          {!localizedChrome && localLabel ? (
            <div className="mx-auto max-w-4xl px-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
              Local guide: <span className="font-semibold text-slate-900 dark:text-white">{localLabel}</span>
            </div>
          ) : null}
          <main className="pb-16">
            <HsdCityDiagnosticView
              data={content}
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
              <HsdInternalSiteLinks data={content} />
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
          <LegacyRenderer title={fallbackTitle} data={content} />
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
