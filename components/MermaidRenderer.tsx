"use client";

import React, { useEffect, useId, useRef, useState } from "react";

/**
 * Loads mermaid only on the client via dynamic import() so the diagnose route
 * server chunk does not reference ./vendor-chunks/mermaid.js (Next bundling quirk).
 */
export default function MermaidRenderer({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    let mounted = true;

    async function renderChart() {
      if (!chart?.trim() || !containerRef.current) return;

      try {
        setHasError(false);
        containerRef.current.innerHTML = "";

        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#0f172a",
            primaryTextColor: "#ffffff",
            primaryBorderColor: "#1e293b",
            lineColor: "#64748b",
            secondaryColor: "#334155",
            tertiaryColor: "#f1f5f9",
          },
          flowchart: {
            htmlLabels: false,
            curve: "basis",
          },
        });

        const svgId = `mermaid-${id}-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(svgId, chart);

        if (mounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Mermaid parsing failed:", err);
        if (mounted) setHasError(true);
      }
    }

    void renderChart();

    return () => {
      mounted = false;
    };
  }, [chart, id]);

  if (hasError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/10">
        <p className="mb-2 font-bold text-red-600 dark:text-red-400">Error rendering diagnostic flowchart</p>
        <p className="text-sm text-red-500/80">
          The system encountered an structural issue while mapping the node relationships.
        </p>
        <div className="mt-4 overflow-x-auto rounded bg-slate-100 p-4 text-left text-xs text-slate-500 dark:bg-slate-900">
          <code>{chart}</code>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center overflow-x-auto py-4">
      <div ref={containerRef} className="mermaid-container" />
    </div>
  );
}
