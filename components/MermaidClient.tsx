"use client";

import MermaidRenderer from "@/components/MermaidRenderer";

/**
 * Client-only flowchart from Mermaid source. Delegates to {@link MermaidRenderer}
 * (`mermaid.render`, theme + error UI) — avoids `mermaid.run()` on `.mermaid` DOM,
 * which is brittle in React and misses `chart` prop updates.
 *
 * In Next.js App Router pages that import this module from a **Server Component**, wrap
 * with `dynamic(..., { ssr: false })` (see `HsdDecisionTreeMermaid` and
 * `HsdLockedPageWithMermaid`).
 *
 * For HSD locked pages that need **node click → section scroll**, use {@link MermaidChart} instead of this wrapper.
 */
export default function MermaidClient({ chart }: { chart: string }) {
  return <MermaidRenderer chart={chart} />;
}
