"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { diagnosticFlowToMermaidSource } from "@/lib/dg/diagnosticFlowToMermaid";

let mermaidInitialized = false;

export type DGMermaidProps = {
  /** Pre-built Mermaid source (e.g. `buildMermaid(page.title)`). Wins over `source`. */
  chart?: string;
  /** Mermaid string or structured `{ nodes, edges }` when `chart` is omitted. */
  source?: unknown;
};

function ensureMermaidInit() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    themeVariables: {
      fontSize: "12px",
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
      nodeSpacing: 40,
      rankSpacing: 50,
      padding: 10,
    },
  });
  mermaidInitialized = true;
}

/**
 * Renders a diagnostic flowchart from `chart` and/or `source` via `mermaid.run`.
 */
export default function DGMermaid({ source, chart: chartProp }: DGMermaidProps) {
  const ref = useRef<HTMLDivElement>(null);

  const explicit =
    typeof chartProp === "string" && chartProp.trim() ? chartProp.trim() : "";
  const chart = explicit || diagnosticFlowToMermaidSource(source) || "";
  const src = chart.trim();

  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;

    let cancelled = false;

    ensureMermaidInit();

    el.textContent = src;
    el.classList.add("mermaid");

    void mermaid
      .run({ nodes: [el] })
      .then(() => {
        if (cancelled) return;
      })
      .catch((err) => {
        if (!cancelled) console.error("[DGMermaid]", err);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src) return null;

  return (
    <div className="dg-mermaid-wrapper">
      <div
        ref={ref}
        className="mermaid dg-flow-mermaid-root not-prose rounded-lg border border-slate-200 bg-white p-4"
        aria-label="Diagnostic flow diagram"
      />
    </div>
  );
}

export { DGMermaid };
