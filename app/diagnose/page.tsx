import { SYMPTOMS } from "@/data/knowledge-graph";
import Link from "next/link";

export default function DiagnosticsIndex() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="bg-hvac-navy text-white pt-24 pb-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/10 opacity-50 pointer-events-none"></div>
        <div className="container mx-auto max-w-6xl relative">
          <div className="inline-block bg-hvac-gold/20 text-hvac-gold text-[10px] font-black px-3 py-1 rounded-full mb-6 border border-hvac-gold/30 uppercase tracking-[0.3em]">
            Professional HVAC Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[0.9] tracking-tighter">
            HVAC Troubleshooting <br/><span className="text-hvac-gold">& Diagnostics</span>
          </h1>
          <p className="max-w-2xl text-xl text-blue-100 font-medium leading-relaxed opacity-80">
            Identify the root cause of your AC or heating failure using our clinical technical manuals. Select a symptom below to start the diagnostic flow.
          </p>
        </div>
      </section>

      {/* Grid Section */}
      <section className="container mx-auto max-w-6xl px-4 -mt-16 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SYMPTOMS.map((symptom) => (
            <Link 
              key={symptom.id} 
              href={`/diagnose/${symptom.id}`}
              className="group bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-hvac-blue group-hover:text-white transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-[10px] font-bold text-slate-300 group-hover:text-hvac-gold transition-colors font-mono">MANUAL V2.1</div>
              </div>
              <h3 className="text-xl font-black text-hvac-navy dark:text-white mb-3 group-hover:text-hvac-blue transition-colors border-0 p-0">{symptom.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-8 flex-1 leading-relaxed">
                {symptom.description}
              </p>
              <div className="flex items-center gap-2 text-xs font-black text-hvac-blue uppercase tracking-widest group-hover:gap-4 transition-all duration-300">
                Full Diagnostic Guide <span className="text-lg leading-none">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Methodology Section */}
      <section className="bg-white dark:bg-slate-900 py-24 border-t border-slate-100 dark:border-slate-800">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="inline-block px-4 py-2 border-b-4 border-hvac-gold mb-12">
            <h2 className="text-hvac-navy text-2xl font-black m-0 border-0">HVAC Diagnostic Methodology</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-left">
            <div>
              <h4 className="font-black text-hvac-blue uppercase tracking-tighter mb-4 text-sm">Technical Accuracy</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold text-center border-t border-slate-100 pt-4">Manual Extract</p>
              <p className="text-xs text-gray-500 leading-relaxed mt-2 text-center italic">"All diagnostic flows are modeled after manufacturer service manuals and verified by licensed Field Engineering Specialists."</p>
            </div>
            <div>
              <h4 className="font-black text-hvac-blue uppercase tracking-tighter mb-4 text-sm">Quarterly Reviews</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold text-center border-t border-slate-100 pt-4">Flywheel Data</p>
              <p className="text-xs text-gray-500 leading-relaxed mt-2 text-center italic">"Our symptom database is updated every 90 days to include emerging failure patterns in modern high-efficiency SEER2 systems."</p>
            </div>
            <div>
              <h4 className="font-black text-hvac-blue uppercase tracking-tighter mb-4 text-sm">Independent Search</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold text-center border-t border-slate-100 pt-4">Vendor Neutral</p>
              <p className="text-xs text-gray-500 leading-relaxed mt-2 text-center italic">"DecisionGrid remains vendor-neutral. Our guides prioritize the root cause over specific product marketing."</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
