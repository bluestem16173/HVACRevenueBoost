"use client";

import { useEffect, useId, useRef } from "react";
import mermaid from "mermaid";

let mermaidInitialized = false;

type Props = {
  chart: string;
  className?: string;
};

/**
 * Client-only Mermaid render for DG structured preview (no HSD click wiring).
 */
export function DgStructuredPreviewMermaid({ chart, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, "");

  useEffect(() => {
    let cancelled = false;

    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#f1f5f9",
          primaryTextColor: "#0f172a",
          primaryBorderColor: "#94a3b8",
          lineColor: "#1c3d5a",
          secondaryColor: "#e2e8f0",
          tertiaryColor: "#f8fafc",
        },
        flowchart: {
          htmlLabels: true,
          curve: "basis",
          padding: 12,
        },
      });
      mermaidInitialized = true;
    }

    const el = ref.current;
    const src = chart.trim();
    if (!el || !src) {
      return;
    }

    const renderId = `dgflow-${reactId}-${Math.random().toString(36).slice(2, 9)}`;

    void mermaid
      .render(renderId, src)
      .then(({ svg }) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
      })
      .catch((err) => {
        if (!cancelled) console.error("[DgStructuredPreviewMermaid]", err);
      });

    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  if (!chart.trim()) return null;

  return (
    <div
      className={`dg-flow-mermaid-root not-prose overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 ${className ?? ""}`}
      ref={ref}
      aria-label="Diagnostic flow diagram"
    />
  );
}
