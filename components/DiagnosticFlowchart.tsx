"use client";

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface DiagnosticFlowchartProps {
  symptomName: string;
  causes: any[];
}

export default function DiagnosticFlowchart({ symptomName, causes }: DiagnosticFlowchartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgCode, setSvgCode] = useState<string>('');

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#f8fafc',
        primaryTextColor: '#0f172a',
        primaryBorderColor: '#cbd5e1',
        lineColor: '#3b82f6',
        secondaryColor: '#eff6ff',
        tertiaryColor: '#f1f5f9'
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      }
    });

    // Dynamically generate the Mermaid diagram based on the symptom and causes
    let chartDef = `graph TD\n`;
    chartDef += `  A[<div class="font-bold text-lg">${symptomName}</div>]:::topic\n`;

    causes.forEach((cause, idx) => {
      const causeId = `C${idx}`;
      chartDef += `  A --> ${causeId}[<div class="font-medium">${cause.name}</div>]:::cause\n`;
      
      // If we have repairs loaded for this cause, branch to them
      if (cause.repairDetails && cause.repairDetails.length > 0) {
        cause.repairDetails.forEach((repair: any, rIdx: number) => {
          const repairId = `R${idx}_${rIdx}`;
          chartDef += `  ${causeId} -.->|Fix| ${repairId}(<div class="text-sm text-blue-700">${repair.name}</div>):::repair\n`;
          chartDef += `  click ${repairId} "/fix/${repair.slug}" "View Repair Manual"\n`;
        });
      }
      chartDef += `  click ${causeId} "/cause/${cause.slug}" "View Cause Details"\n`;
    });

    chartDef += `  classDef topic fill:#0f172a,stroke:#0f172a,color:#ffffff,rx:10,ry:10,padding:20px;\n`;
    chartDef += `  classDef cause fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#334155,rx:5,ry:5;\n`;
    chartDef += `  classDef repair fill:#eff6ff,stroke:#bfdbfe,stroke-width:2px,color:#1d4ed8,rx:20,ry:20;\n`;

    // Render it
    const renderChart = async () => {
      if (containerRef.current) {
        try {
          const { svg } = await mermaid.render('mermaid-diagnostic-graph', chartDef);
          setSvgCode(svg);
        } catch (error) {
          console.error("Mermaid rendering failed", error);
        }
      }
    };

    renderChart();
  }, [symptomName, causes]);

  if (!causes || causes.length === 0) return null;

  return (
    <div className="my-12 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
      <h3 className="text-xl font-black text-hvac-navy mb-6 text-center">Interactive Diagnostic Tree</h3>
      <div 
        ref={containerRef} 
        className="mermaid-wrapper flex justify-center min-w-[600px]"
        dangerouslySetInnerHTML={{ __html: svgCode }}
      />
    </div>
  );
}
