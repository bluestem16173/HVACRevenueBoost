"use client";

import { splitLockedHsdRenderedHtml } from "@/lib/hsd/renderHSDPage";
import { HsdLockedPage } from "@/components/homeservice/HsdLockedPage";

// TEMP: Mermaid disabled (hydration isolation) — re-enable dynamic import + client chart when stable.
// import dynamic from "next/dynamic";
// const MermaidClient = dynamic(() => import("@/components/MermaidClient"), { ssr: false, loading: ... });

/**
 * Renders locked HSD HTML from `renderHSDPage` / v2 / v2.5: **no Mermaid in `dangerouslySetInnerHTML`**.
 * The `<div class="mermaid">…</div>` segment from the server string is stripped out; chart source is passed to
 * {@link MermaidClient} (`mermaid.render` on the client). Section click → scroll is not wired here (use
 * {@link MermaidChart} if that returns).
 */
export function HsdLockedPageWithMermaid({ html }: { html: string }) {
  const { before, chart, after } = splitLockedHsdRenderedHtml(html);
  const htmlWithoutMermaid = before + after;

  if (!chart.trim()) {
    return <HsdLockedPage beforeHtml={htmlWithoutMermaid} afterHtml="" />;
  }

  return (
    <HsdLockedPage
      beforeHtml={before}
      afterHtml={after}
      diagram={
        <div className="text-center text-xs text-slate-400" aria-hidden>
          {/* TEMP: <MermaidClient chart={chart} /> */}
        </div>
      }
    />
  );
}
