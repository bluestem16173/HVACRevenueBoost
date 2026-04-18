"use client";

import type { ReactNode } from "react";

/** Locked frame + body: white field, borders/spacing only — no prose “color zones”. */
const shellClass =
  "hsd-locked-mermaid-host hsd-v1-locked-page mx-auto max-w-3xl px-4 sm:px-6 pb-16 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100";

const afterBodyClass =
  "hsd-locked-after prose prose-slate prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300";

/**
 * Locked HSD HTML shell **without** embedding a `<div class="mermaid">` in React `innerHTML`.
 * Pass diagram source via {@link HsdLockedPageWithMermaid} as a sibling client chart, or omit `diagram`.
 */
export function HsdLockedPage({
  beforeHtml,
  afterHtml,
  diagram,
}: {
  beforeHtml: string;
  afterHtml: string;
  /** Client-only chart (e.g. `MermaidClient`) — inserted between `before` and `after`. */
  diagram?: ReactNode;
}) {
  return (
    <div className={shellClass}>
      <div className="hsd-locked-before not-prose" dangerouslySetInnerHTML={{ __html: beforeHtml }} />
      {diagram ?? null}
      <div className={afterBodyClass} dangerouslySetInnerHTML={{ __html: afterHtml }} />
    </div>
  );
}
