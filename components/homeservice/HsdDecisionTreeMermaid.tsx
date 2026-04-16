"use client";

import dynamic from "next/dynamic";

const MermaidRenderer = dynamic(() => import("@/components/MermaidRenderer"), { ssr: false });

type Props = { chart: string };

/**
 * Visual flow under the decision-tree branches — client-only Mermaid.
 */
export function HsdDecisionTreeMermaid({ chart }: Props) {
  if (!chart.trim()) return null;
  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900/50">
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Diagnostic flow (visual)</div>
      <p className="mb-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
        Follow the path that matches your symptoms, then use the sections below.
      </p>
      <MermaidRenderer chart={chart} />
    </div>
  );
}
