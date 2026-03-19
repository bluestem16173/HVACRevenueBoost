"use client";

import { useEffect } from "react";

/**
 * Loads Mermaid from CDN and initializes when .mermaid elements exist.
 * Used on condition pages that render HTML with embedded Mermaid flowcharts.
 */
export default function MermaidInit() {
  useEffect(() => {
    const el = document.querySelector(".mermaid");
    if (!el) return;

    const init = async () => {
      try {
        const mermaid = (window as any).mermaid;
        if (!mermaid) {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
          script.async = true;
          script.onload = () => runMermaid();
          document.head.appendChild(script);
        } else {
          runMermaid();
        }
      } catch {
        // ignore
      }
    };

    const runMermaid = async () => {
      const mermaid = (window as any).mermaid;
      if (!mermaid) return;
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#e2e8f0",
          primaryTextColor: "#0f172a",
          primaryBorderColor: "#94a3b8",
          lineColor: "#64748b",
        },
      });
      await mermaid.run({ nodes: document.querySelectorAll(".mermaid") });
    };

    init();
  }, []);

  return null;
}
