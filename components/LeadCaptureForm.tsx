"use client";

import GHLFormEmbed from "./GHLFormEmbed";

export default function LeadCaptureForm({ city, symptomId }: { city?: string, symptomId?: string }) {
  return (
    <div className="manual-card-wrapper border-0 shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border-2 border-hvac-gold/20">
      <div className="p-10 bg-hvac-navy text-center border-b border-white/10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-hvac-gold text-hvac-navy px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap shadow-xl">
          Priority Dispatch Active
        </div>
        <h2 className="text-white m-0 text-3xl font-black tracking-tight">Find Local Help</h2>
        <p className="text-slate-400 text-sm mt-3 uppercase font-bold tracking-widest leading-loose">
          Verified Service for <span className="text-hvac-gold">{city || "HVAC Owners"}</span>
        </p>
      </div>
      
      <div className="p-6 bg-slate-50 dark:bg-slate-950">
        <GHLFormEmbed />
      </div>

      <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
        <div className="flex flex-col items-center gap-4 opacity-70">
           <div className="text-[11px] font-black tracking-[0.2em] text-slate-500">24/7 EMERGENCY RESPONSE READY</div>
           <p className="text-[10px] text-slate-400 m-0 max-w-xs mx-auto italic">
             "Our local diagnostic team is standing by to confirm your findings and provide professional repair support in {city || "your area"}."
           </p>
        </div>
      </div>
    </div>
  );
}
