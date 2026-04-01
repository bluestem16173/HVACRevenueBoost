import React from "react";
import MermaidRenderer from "@/components/MermaidRenderer";
import { DiagnosticEngineJson } from "@/content-engine/src/lib/validation/diagnosticSchema";
import { AlertTriangle, Wrench, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function DecisionGridV2Page({ payload }: { payload: DiagnosticEngineJson }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto max-w-4xl px-4 pt-10 pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <span>RESIDENTIAL HVAC</span>
            <ChevronRight className="h-3 w-3" />
            <span>DIAGNOSTIC ENGINE V2</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-hvac-blue">{payload.title}</span>
          </div>
          <h1 className="mb-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{payload.title}</h1>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">{payload.intro}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl space-y-12 px-4 pt-10">
        
        {/* Dynamic Answer / Hero */}
        <section className="rounded-xl border-l-4 border-hvac-blue bg-blue-50/90 p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-black tracking-wide text-blue-900 uppercase">Target Diagnosis</div>
            <span className="bg-blue-200 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Confidence: {payload.dynamicAnswer.confidence}
            </span>
          </div>
          <h2 className="text-xl font-bold leading-relaxed text-slate-900 mb-2">{payload.dynamicAnswer.likelyCause}</h2>
          <p className="text-slate-800 font-medium">{payload.dynamicAnswer.reason}</p>
        </section>

        {/* System Explanation */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h2 className="mb-4 text-xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-hvac-blue" />
            System Explanation & Quick Checks
           </h2>
           <ul className="space-y-3 text-slate-700 leading-relaxed list-disc list-inside">
             {payload.systemExplanation.map((exp, i) => (
               <li key={i}>{exp}</li>
             ))}
           </ul>
        </section>

        {/* Mermaid Tree */}
        <section>
          <h2 className="mb-3 text-xl font-black text-slate-900">Isolation Decision Tree</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <MermaidRenderer chart={payload.decision_tree} />
          </div>
        </section>

        {/* Diagnostic Flow */}
        <section>
          <h2 className="mb-4 text-xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-hvac-blue" />
            Step-by-Step Diagnostic Flow
          </h2>
          <div className="space-y-4">
             {payload.diagnosticFlow.map((flow, idx) => (
                <div key={idx} className="bg-white border-l-4 border-slate-400 p-5 shadow-sm rounded-r-xl">
                   <div className="font-black text-slate-800 mb-2">Step {flow.step}: {flow.question}</div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                     <div className="bg-emerald-50 text-emerald-900 p-3 rounded text-sm">
                       <strong>If YES:</strong> {flow.yes}
                     </div>
                     <div className="bg-rose-50 text-rose-900 p-3 rounded text-sm">
                       <strong>If NO:</strong> {flow.no}
                     </div>
                   </div>
                   {flow.next_step && <div className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Next: Proceed to Step {flow.next_step}</div>}
                </div>
             ))}
          </div>
        </section>

        {/* Common Causes & Fixes */}
        <section className="grid md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-4">Targeted Causes</h2>
              <ul className="space-y-4">
                {payload.commonCauses.map((cause: any, i) => (
                  <li key={i} className="text-sm">
                    <strong className="block text-slate-800 mb-1">{cause.name || "Cause"}</strong>
                    <span className="text-slate-600">{cause.description || "-"}</span>
                  </li>
                ))}
              </ul>
           </div>
           
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5" /> Recommended Fixes
              </h2>
              <ul className="space-y-4 text-sm">
                {payload.fixes.map((fix: any, i) => (
                  <li key={i}>
                    <strong className="block text-slate-800 mb-1">{fix.cause || "Fix"}</strong>
                    <span className="text-slate-600">{fix.repair || "-"}</span>
                  </li>
                ))}
              </ul>
           </div>
        </section>

        {/* CTA Conversion Box */}
        <section className="rounded-xl border-2 border-slate-200 bg-emerald-50 p-6 shadow-sm text-center">
            <h2 className="text-2xl font-black text-emerald-900 mb-2">{payload.cta.primary}</h2>
            <p className="text-emerald-800 mb-4 font-medium">{payload.cta.urgency}</p>
            <button className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold shadow-sm hover:bg-emerald-700 transition">
              {payload.cta.secondary}
            </button>
        </section>

      </div>
    </div>
  );
}
