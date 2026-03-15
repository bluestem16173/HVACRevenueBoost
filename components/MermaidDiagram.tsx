"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  className?: string;
}

export default function MermaidDiagram({ chart, title = "Diagnostic Flowchart", className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgCode, setSvgCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chart?.trim()) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        primaryColor: "#eff6ff",
        primaryTextColor: "#0f172a",
        primaryBorderColor: "#93c5fd",
        lineColor: "#3b82f6",
        secondaryColor: "#f8fafc",
        tertiaryColor: "#f1f5f9",
      },
      flowchart: {
        htmlLabels: true,
        curve: "basis",
        useMaxWidth: true,
      },
    });

    const id = `mermaid-${Math.random().toString(36).slice(2)}`;
    const renderChart = async () => {
      try {
        const { svg } = await mermaid.render(id, chart.trim());
        setSvgCode(svg);
        setError(null);
      } catch (e) {
        setError("Could not render flowchart");
        console.error("Mermaid render error:", e);
      }
    };

    renderChart();
  }, [chart]);

  if (error) return null;

  return (
    <div className={`my-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto ${className}`}>
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
      <div
        ref={containerRef}
        className="mermaid-diagram flex justify-center min-w-[400px]"
        dangerouslySetInnerHTML={{ __html: svgCode }}
      />
    </div>
  );
}
