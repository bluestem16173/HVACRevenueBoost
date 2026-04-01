import { RelatedTopics } from "@/components/hub/RelatedTopics";
import { ShieldAlert, AlertTriangle, ShieldCheck, PhoneCall, CheckSquare } from "lucide-react";
import dynamic from "next/dynamic";

const MermaidDiagram = dynamic(() => import("@/components/MermaidDiagram"), { ssr: false });

export interface EmergencySchema {
  bannerHeadline: string;
  dangerLine: string;
  immediateChecks: string[];

  fix60Title: string;
  fix60Steps: string[];

  mermaidFlow: string;

  mostLikelyTitle: string;
  mostLikelyFix: string;
  costBand: string;
  difficulty: string;
  timeEstimate: string;

  monetizationHeadline: string;
  monetizationBullets: string[];

  leadStyle?: "soft" | "urgent";
}

export default function EmergencyPageTemplate({ data, city }: { data: EmergencySchema, city: string }) {
  const replaceCity = (text: string) => text ? text.replace(/{{city}}/g, city) : "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      
      {/* HEADER / BREADCRUMBS */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-6 pb-6 shadow-sm">
        <div className="container mx-auto px-4 max-w-3xl">
           <div className="flex items-center gap-2 text-sm text-slate-500 font-bold mb-4 uppercase tracking-wider">
              <span>Emergency Diagnostics</span>
              <span>/</span>
              <span className="text-hvac-blue">{city}</span>
           </div>
           <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-2">
             {replaceCity(data.bannerHeadline)}
           </h1>
           <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 w-max px-3 py-1 rounded-full border border-green-200">
             <ShieldCheck className="w-4 h-4" />
             Reviewed by Certified HVAC Technicians
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl mt-8 space-y-6">
        
        {/* 1. 🔴 Emergency Banner (Authority + Control) */}
        <div className="bg-orange-50 border-2 border-orange-600 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-bl-[100px] pointer-events-none"></div>
          
          <h2 className="text-xl md:text-2xl font-black text-orange-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            Emergency Protocol
          </h2>

          <p className="text-orange-800 font-bold mb-5 text-lg leading-relaxed">
            <span className="text-orange-600 uppercase tracking-widest text-xs block mb-1">Critical Warning</span>
            {replaceCity(data.dangerLine)}
          </p>

          <div className="bg-white/60 rounded-lg p-5 border border-orange-200">
            <h3 className="text-sm font-black text-orange-900 uppercase tracking-wider mb-3">Immediate Checks:</h3>
            <ul className="space-y-3 text-orange-900 font-medium">
              {data.immediateChecks.map((check, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="min-w-6 h-6 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <span className="leading-snug">{replaceCity(check)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. 🟢 Fix in 60 Seconds (Momentum Builder) */}
        <div className="bg-green-50 border border-green-300 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-green-900 mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-green-600" />
            {replaceCity(data.fix60Title)}
          </h2>

          <ol className="space-y-4 text-green-900 list-none">
            {data.fix60Steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-bold text-green-600 text-lg">{i + 1}.</span>
                <span className="font-medium leading-relaxed">{replaceCity(step)}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* 3. 🧠 Mermaid Diagnostic Flow (THE ENGINE) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-hidden">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Step-by-Step Diagnosis
          </h2>

          <p className="text-slate-600 mb-4">
            Follow this quick flow to identify the issue before calling a technician.
          </p>

          <div className="overflow-x-auto w-full">
            <MermaidDiagram chart={data.mermaidFlow} title="" className="border-none shadow-none p-0 my-0 bg-transparent dark:bg-transparent" />
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mt-6">
            <p className="text-yellow-800 font-medium">
              ⚠️ If your system reached a repair-level issue above, this typically requires tools or parts most homeowners don't have.
            </p>
          </div>
        </div>

        {/* 4. 🔵 Most Likely Fix (THE MONEY BLOCK) */}
        <div className="bg-blue-50 border border-blue-300 rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-black text-blue-900 mb-3">
            {replaceCity(data.mostLikelyTitle)}
          </h2>

          <p className="text-blue-900 text-lg leading-relaxed mb-2 font-medium">
            {replaceCity(data.mostLikelyFix)}
          </p>
          
          <p className="text-blue-700 font-bold mb-6 italic border-l-4 border-blue-400 pl-3 py-1 bg-blue-100/50">
            "This fixes the issue in ~60–70% of cases."
          </p>

          <div className="grid grid-cols-3 gap-4 text-sm mt-2">
            <div className="bg-white rounded-lg p-3 lg:p-4 border border-blue-200 shadow-sm text-center">
              <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mb-1">Cost</p>
              <p className="text-blue-900 font-black text-lg">{replaceCity(data.costBand)}</p>
            </div>

            <div className="bg-white rounded-lg p-3 lg:p-4 border border-blue-200 shadow-sm text-center">
              <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mb-1">Difficulty</p>
              <p className="text-blue-900 font-black text-lg">{replaceCity(data.difficulty)}</p>
            </div>

            <div className="bg-white rounded-lg p-3 lg:p-4 border border-blue-200 shadow-sm text-center">
              <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mb-1">Time</p>
              <p className="text-blue-900 font-black text-lg">{replaceCity(data.timeEstimate)}</p>
            </div>
          </div>
        </div>

        {/* 5. ⚙️ Monetization Block (Where HVAC > DG) */}
        <div className="bg-slate-50 border border-slate-300 rounded-xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-hvac-navy"></div>
          
          <h3 className="text-2xl font-black text-slate-900 mb-4 pr-10">
            {replaceCity(data.monetizationHeadline)}
          </h3>

          <p className="text-slate-600 font-bold mb-5 italic">
            You've tried the checks → now fix it fast.
          </p>

          <ul className="space-y-3 text-slate-700 mb-8 font-medium">
            {data.monetizationBullets.map((b, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-blue-500 font-black mt-0.5">✓</span> 
                <span className="leading-snug">{replaceCity(b)}</span>
              </li>
            ))}
          </ul>

          <button data-open-lead-modal className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-xl font-black text-lg shadow-xl shadow-blue-500/20 hover:scale-105 transition-all outline-none focus:ring-4 focus:ring-blue-400 flex items-center justify-center gap-3">
            <PhoneCall className="w-5 h-5 animate-pulse" />
            Get Local HVAC Help
          </button>
        </div>

      </div>

      <div className="container mx-auto px-4 max-w-3xl mt-16">
        <RelatedTopics />
      </div>
    </div>
  );
}
