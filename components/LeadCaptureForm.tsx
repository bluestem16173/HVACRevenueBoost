"use client";

import GHLFormEmbed from "./GHLFormEmbed";

export default function LeadCaptureForm({ city, symptomId }: { city?: string, symptomId?: string }) {
  return (
    <div className="manual-card-wrapper border-0 shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
      <div className="p-8 bg-hvac-navy text-center border-b border-white/10">
        <h2 className="text-white m-0 text-2xl font-black tracking-tight">Professional Local Dispatch</h2>
        <p className="text-slate-400 text-xs mt-2 uppercase font-bold tracking-widest">
          Verified Service for {city || "HVAC Owners"}
        </p>
      </div>
      
      <div className="p-4 bg-slate-50 dark:bg-slate-950">
        <GHLFormEmbed />
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
        <div className="flex items-center justify-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
           {/* Trust indicators can go here */}
           <div className="text-[9px] font-black tracking-widest text-slate-400">24/7 EMERGENCY READY</div>
           <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
           <div className="text-[9px] font-black tracking-widest text-slate-400">QUALIFIED TECHNICIANS</div>
        </div>
      </div>
    </div>
  );
}
