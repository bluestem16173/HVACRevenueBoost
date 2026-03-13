export default function FastAnswer({ answer, confidence = "High" }: { answer: string, confidence?: string }) {
  return (
    <div className="bg-blue-50 dark:bg-slate-900/50 border-2 border-hvac-blue/20 rounded-2xl p-6 mb-12 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-hvac-blue/10 px-4 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-widest text-hvac-blue">
        Fast Answer • {confidence} Confidence
      </div>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-hvac-blue text-white rounded-full flex items-center justify-center shrink-0 font-black text-xl shadow-lg shadow-hvac-blue/20">
          !
        </div>
        <div>
          <h3 className="text-hvac-navy text-sm font-bold uppercase tracking-wider mb-2 border-0">Immediate Diagnostic Summary</h3>
          <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-snug m-0 italic">
            "{answer}"
          </p>
        </div>
      </div>
    </div>
  );
}
