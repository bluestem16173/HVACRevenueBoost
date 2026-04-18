"use client";

// TEMP: import dynamic from "next/dynamic";
// TEMP: const MermaidDiagram = dynamic(() => import("@/components/MermaidDiagram"), { ssr: false });

export default function DiagnosticFlow({ data }: { data: any }) {
  const mermaid = data?.mermaid;
  if (!mermaid) return null;
  return (
    <section className="mb-12" id="flowchart">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Diagnostic Flowchart</h2>
      <div className="w-full overflow-auto bg-hvac-brown/5 dark:bg-hvac-brown/10 border border-hvac-brown/20 rounded-xl p-6">
        {/* TEMP: <MermaidDiagram chart={mermaid} title="Diagnostic Flowchart" className="w-full min-w-0" /> */}
      </div>
    </section>
  );
}
