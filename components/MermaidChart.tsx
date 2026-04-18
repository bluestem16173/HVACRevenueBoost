"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { hsdSectionDomId } from "@/lib/mermaidMap";

let mermaidInitialized = false;

function attachClick(node: Element, sectionKey: string, cleanups: (() => void)[]) {
  const elId = hsdSectionDomId(sectionKey);
  (node as HTMLElement).style.cursor = "pointer";
  const handler = () => {
    const targetId = elId;
    console.log("User clicked:", targetId);
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("highlight");
    window.setTimeout(() => {
      el.classList.remove("highlight");
    }, 1500);
  };
  node.addEventListener("click", handler);
  cleanups.push(() => node.removeEventListener("click", handler));
}

/**
 * Renders a Mermaid flowchart from source via `mermaid.render`, then wires node clicks → HSD section ids.
 */
export default function MermaidChart({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    let cancelled = false;

    if (!mermaidInitialized) {
      mermaid.initialize({ startOnLoad: false, theme: "default" });
      mermaidInitialized = true;
    }

    if (!ref.current || !chart.trim()) {
      return () => {
        cancelled = true;
      };
    }

    const id = "m-" + Math.random().toString(36).slice(2);

    void mermaid
      .render(id, chart.trim())
      .then(({ svg }) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;

        const nodes = ref.current.querySelectorAll("g.node");
        nodes.forEach((node) => {
          const text = node.textContent?.toLowerCase() || "";
          let sectionKey: string | null = null;
          if (text.includes("filter")) sectionKey = "top_causes";
          else if (text.includes("refrigerant")) sectionKey = "top_causes";
          else if (text.includes("load")) sectionKey = "top_causes";
          if (sectionKey) attachClick(node, sectionKey, cleanups);
        });
      })
      .catch((e) => {
        if (!cancelled) console.error("[MermaidChart] render failed:", e);
      });

    return () => {
      cancelled = true;
      cleanups.forEach((u) => u());
    };
  }, [chart]);

  return <div className="mermaid-chart-root not-prose overflow-x-auto" ref={ref} />;
}
