"use client";

import type { ReactNode } from "react";

/** Locked frame + prose wrapper for server-rendered HSD HTML (`dangerouslySetInnerHTML`). */
const shellClass =
  "hsd-locked-mermaid-host hsd-v1-locked-page mx-auto max-w-4xl px-4 sm:px-6 pb-16 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100";

const proseBodyClass =
  "prose prose-slate prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300";

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
  const before = beforeHtml.trim();
  const after = afterHtml.trim();

  return (
    <div className={shellClass}>
      <div className={proseBodyClass}>
        {before ? <div className="hsd-locked-before" dangerouslySetInnerHTML={{ __html: beforeHtml }} /> : null}
        {diagram ? <div className="not-prose my-8">{diagram}</div> : null}
        {after ? <div className="hsd-locked-after" dangerouslySetInnerHTML={{ __html: afterHtml }} /> : null}
      </div>
    </div>
  );
}
