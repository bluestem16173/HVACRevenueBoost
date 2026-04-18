"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    if (!ref.current) return;

    mermaid.initialize({ startOnLoad: false });

    const renderChart = async () => {
      try {
        renderIdRef.current += 1;
        const id = `mermaid-${renderIdRef.current}`;
        const { svg } = await mermaid.render(id, chart);
        if (ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (ref.current) ref.current.innerHTML = "Diagram failed to render";
      }
    };

    renderChart();
  }, [chart]);

  return <div ref={ref} />;
}
