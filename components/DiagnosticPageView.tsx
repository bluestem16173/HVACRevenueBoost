import DiagnosticModal from "@/components/DiagnosticModal";
import { RelatedLinks } from "@/components/RelatedLinks";
import { StickyCTA } from "@/components/StickyCTA";
import { LegacyRenderer } from "@/components/LegacyRenderer";

type PageRow = {
  slug: string;
  content_html?: string | null;
  content_json?: unknown;
  title?: string | null;
};

function defaultRelatedForSlug(slug: string): string[] {
  if (slug.includes("ac-not") || slug.includes("cooling")) {
    return ["ac-not-cooling", "ac-running-but-not-cooling", "ac-weak-airflow", "one-room-not-cooling"];
  }
  return ["ac-not-cooling", "furnace-not-heating", "hvac-short-cycling", "weak-airflow-vents"];
}

/**
 * Shared HTML/JSON diagnostic article shell (used by `/diagnose/[slug]` and localized HVAC URLs).
 */
export function DiagnosticPageView({
  page,
  localLabel,
}: {
  page: PageRow;
  /** e.g. "Tampa, FL" — optional line under the sticky CTA */
  localLabel?: string | null;
}) {
  const related = defaultRelatedForSlug(page.slug);

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
          <RelatedLinks slugs={related} />
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
          <RelatedLinks slugs={related} />
        </main>
      </>
    );
  }

  return <div className="p-8 text-center text-slate-500">Empty page</div>;
}
