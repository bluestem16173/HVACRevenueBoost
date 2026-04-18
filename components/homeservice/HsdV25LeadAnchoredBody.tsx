"use client";

import { HsdUrgentCta } from "@/components/HsdUrgentCta";
import { splitLockedHsdRenderedHtml } from "@/lib/hsd/renderHSDPage";

const shellClass =
  "hsd-locked-mermaid-host hsd-v1-locked-page mx-auto max-w-4xl px-4 sm:px-6 pb-16 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100";

const proseBodyClass =
  "prose prose-slate prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300";

/**
 * Renders HSD v2.5 HTML in three prose segments with HsdUrgentCta lead anchors (medium → high → final).
 * Keeps the same Mermaid split contract as HsdLockedPageWithMermaid on the middle segment only.
 */
export function HsdV25LeadAnchoredBody({
  headerHtml,
  midThroughDecisionHtml,
  closingHtml,
}: {
  headerHtml: string;
  midThroughDecisionHtml: string;
  closingHtml: string;
}) {
  const { before, chart, after } = splitLockedHsdRenderedHtml(midThroughDecisionHtml);
  const midMain = (before + after).trim() || midThroughDecisionHtml.trim();

  return (
    <div className={shellClass}>
      <div className={proseBodyClass}>
        {headerHtml.trim() ? (
          <div className="hsd-seg-header" dangerouslySetInnerHTML={{ __html: headerHtml }} />
        ) : null}

        <div className="not-prose my-8">
          <HsdUrgentCta level="medium" />
        </div>

        {chart.trim() ? (
          <>
            {before.trim() ? (
              <div className="hsd-seg-mid-before" dangerouslySetInnerHTML={{ __html: before }} />
            ) : null}
            <div className="not-prose my-8 text-center text-xs text-slate-400" aria-hidden>
              {/* Mermaid host reserved — chart source present but client render optional */}
            </div>
            {after.trim() ? (
              <div className="hsd-seg-mid-after" dangerouslySetInnerHTML={{ __html: after }} />
            ) : null}
          </>
        ) : (
          <div className="hsd-seg-mid" dangerouslySetInnerHTML={{ __html: midMain }} />
        )}

        <div className="not-prose my-10">
          <HsdUrgentCta level="high" />
        </div>

        {closingHtml.trim() ? (
          <div className="hsd-seg-closing" dangerouslySetInnerHTML={{ __html: closingHtml }} />
        ) : null}

        <div className="not-prose mt-10">
          <HsdUrgentCta level="final" />
        </div>
      </div>
    </div>
  );
}
