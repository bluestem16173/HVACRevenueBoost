"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  className?: string;
  /** When set, shows a download button for the rendered SVG */
  downloadFilename?: string;
}

export default function MermaidDiagram({ chart, title = "Diagnostic Flowchart", className = "", downloadFilename }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgCode, setSvgCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const renderIdRef = useRef(0);

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

    renderIdRef.current += 1;
    const id = `mermaid-${renderIdRef.current}`;
    const renderChart = async () => {
      try {
        const formattedChart = chart.trim().replace(/;/g, ';\n');
        const { svg } = await mermaid.render(id, formattedChart);
        setSvgCode(svg);
        setError(null);
      } catch (e) {
        setError("Could not render flowchart");
        console.error("Mermaid render error:", e);
      }
    };

    renderChart();
  }, [chart]);

  const handleDownload = () => {
    if (!svgCode || !downloadFilename) return;
    const blob = new Blob([svgCode], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename.endsWith(".svg") ? downloadFilename : `${downloadFilename}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="my-8 p-6 bg-red-50 border border-red-200 rounded-xl text-red-900 overflow-x-auto w-full">
        <h3 className="font-bold mb-2">Mermaid Render Error: {error}</h3>
        <p className="text-sm mb-4">The AI generated invalid flowchart syntax:</p>
        <pre className="text-xs bg-white p-4 rounded border border-red-100 whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div className={`my-8 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto w-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        {downloadFilename && svgCode && (
          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Download SVG
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="mermaid-diagram flex justify-center w-full min-w-0 [&>svg]:max-w-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svgCode }}
      />
    </div>
  );
}
