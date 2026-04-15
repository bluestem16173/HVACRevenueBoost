import DiagnosticModal from "@/components/DiagnosticModal";
import { RelatedLinks } from "@/components/RelatedLinks";
import { StickyCTA } from "@/components/StickyCTA";
import { LegacyRenderer } from "@/components/LegacyRenderer";
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

  if (page.content_json) {
    const parsedJson =
      typeof page.content_json === "string" ? JSON.parse(page.content_json) : page.content_json;
    const fallbackTitle = page.slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

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
          <LegacyRenderer title={fallbackTitle} data={parsedJson} />
          <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
        </main>
      </>
    );
  }

  return <div className="p-8 text-center text-slate-500">Empty page</div>;
}
