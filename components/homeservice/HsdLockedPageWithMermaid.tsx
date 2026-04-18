"use client";

import MermaidChart from "@/components/MermaidChart";
import { splitLockedHsdRenderedHtml } from "@/lib/hsd/renderHSDPage";

/** Locked frame + body: white field, borders/spacing only — no prose “color zones”. */
const shellClass =
  "hsd-locked-mermaid-host hsd-v1-locked-page mx-auto max-w-3xl px-4 sm:px-6 pb-16 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100";

const afterBodyClass =
  "hsd-locked-after prose prose-slate prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300";

/**
 * Renders locked HSD HTML from `renderHSDPage`, with the Mermaid block rendered via `MermaidChart` (`mermaid.render` + click → sections).
 */
export function HsdLockedPageWithMermaid({ html }: { html: string }) {
  const { before, chart, after } = splitLockedHsdRenderedHtml(html);

  if (!chart.trim()) {
    return <div className={shellClass} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <div className={shellClass}>
      <div className="hsd-locked-before not-prose" dangerouslySetInnerHTML={{ __html: before }} />
      <div className="not-prose my-8">
        <MermaidChart chart={chart} />
      </div>
      <div className={afterBodyClass} dangerouslySetInnerHTML={{ __html: after }} />
    </div>
  );
}
