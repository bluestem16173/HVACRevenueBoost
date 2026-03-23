import { RelatedTopics } from "@/components/hub/RelatedTopics";
import { ShieldAlert, AlertTriangle, Clock, MapPin, Star, PhoneCall, ShieldCheck } from "lucide-react";

export interface EmergencySchema {
  pageType: "emergency";
  city: string;
  service: string;
  hero: {
    headline: string;
    subheadline: string;
  };
  urgency: {
    message: string;
  };
  problem: string;
  trust: {
    badges: string[];
    guarantee: string;
  };
  localProof: {
    city: string;
    reviews: Array<{ author: string; text: string }>;
  };
  cta: {
    primary: string;
    secondary: string;
  };
  content?: {
    immediateAction?: string[];
    isDangerous?: string;
    quickDiagnosis?: string[];
    likelyCauses?: string[];
    temporaryFixes?: string[];
    whenToCall?: string;
    costExpectation?: string;
    faq?: Array<{ question: string; answer: string }>;
  }
}

export default function EmergencyPageTemplate({ data }: { data: EmergencySchema }) {
  const replaceCity = (text: string) => text.replace(/{{city}}/g, data.city);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 🚨 EMERGENCY HERO */}
      <section className="bg-red-600 text-white pt-24 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 border border-red-200 bg-red-800/50 text-white px-5 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-6 shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            24/7 HVAC Emergency in {data.city}
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight drop-shadow-lg">
            {replaceCity(data.hero.headline)}
          </h1>
          <p className="text-xl md:text-2xl text-red-100 leading-relaxed font-bold max-w-2xl mx-auto mb-10 drop-shadow-md">
            {replaceCity(data.hero.subheadline)}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button data-open-lead-modal className="w-full sm:w-auto px-10 py-5 bg-white text-red-700 rounded-xl font-black uppercase tracking-widest hover:bg-slate-100 shadow-2xl hover:scale-105 transition-all outline-none focus:ring-4 focus:ring-red-400">
              {data.cta.primary}
            </button>
            <button className="w-full sm:w-auto px-8 py-5 border-2 border-red-200 text-white rounded-xl font-bold uppercase hover:bg-red-700 transition-colors">
              {data.cta.secondary}
            </button>
          </div>
          <p className="mt-8 text-sm font-bold flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            {data.urgency.message}
          </p>
        </div>
      </section>

      {/* ⚠️ STRUCTURAL SURVIVAL GUIDE */}
      <section className="py-16 -mt-16 relative z-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-slate-900 border-t-8 border-red-600 rounded-2xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-8 border-b pb-4 border-slate-100 dark:border-slate-800">
              Emergency? What To Do Right Now.
            </h2>
            
            <div className="space-y-12">
              {/* 1. Immediate Action */}
              <div>
                <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                  <span className="bg-red-100 text-red-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span> 
                  Immediate Action (DO THIS FIRST)
                </h3>
                <ul className="list-disc pl-10 space-y-2 text-slate-700 dark:text-slate-300 font-medium">
                  {data.content?.immediateAction?.map((item, i) => <li key={i}>{item}</li>) || (
                    <>
                      <li>Turn off your thermostat immediately to prevent compressor burnout.</li>
                      <li>Find your electrical breaker panel and flip the HVAC breakers to OFF.</li>
                    </>
                  )}
                </ul>
              </div>

              {/* 2. Is This Dangerous? */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span> 
                  Is This Dangerous?
                </h3>
                <p className="pl-10 text-slate-600 dark:text-slate-400 leading-relaxed">
                  {data.content?.isDangerous || "If you smell burning plastic, electrical ozone, or natural gas, evacuate immediately and call emergency services. Otherwise, property damage (like water leaks) is the primary risk."}
                </p>
              </div>

              {/* 3. Quick Diagnosis & 4. Likely Causes */}
              <div className="grid md:grid-cols-2 gap-8 pl-10">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3">Quick Diagnosis</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {data.content?.quickDiagnosis?.map((d, i) => <li key={i}>{d}</li>) || (
                      <>
                        <li>Is the outside fan spinning?</li>
                        <li>Is water dripping near the furnace?</li>
                        <li>Is the filter completely black?</li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3">Most Likely Causes</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {data.content?.likelyCauses?.map((c, i) => <li key={i}>{c}</li>) || (
                      <>
                        <li>Blown dual-run capacitor</li>
                        <li>Clogged condensate drain line</li>
                        <li>Frozen evaporator coil</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* 5. Temporary Fixes */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span> 
                  Temporary Fixes (If Safe)
                </h3>
                <p className="pl-10 text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {data.content?.temporaryFixes?.[0] || "If your coil is frozen solid, turn the thermostat to OFF and set the Fan to ON. This will force ambient air across the ice to melt it faster while you wait for a technician."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 LOCAL PROOF & CALL TO ACTION */}
      <section className="py-16 bg-slate-900 text-white border-y border-slate-800">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 text-amber-500 mb-4">
            <MapPin className="w-5 h-5" />
            <span className="font-bold uppercase tracking-widest text-sm">Serving {data.localProof.city || data.city}</span>
          </div>
          
          <h2 className="text-3xl font-black mb-8">
            When To Call A Professional
          </h2>
          
          <p className="text-slate-400 mb-10 max-w-2xl mx-auto">
            {data.content?.whenToCall || "If you reset the breaker and it trips instantly again, or you hear loud buzzing from the outside unit without the fan spinning, stop. Continuing to run the system will destroy the compressor."}
          </p>

          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-left">
              <h4 className="font-bold text-xl mb-2 flex items-center gap-2">
                <ShieldCheck className="text-green-400" />
                {data.trust.guarantee}
              </h4>
              <p className="text-sm text-slate-400">
                {data.content?.costExpectation || "Diagnostic fees typically range from $89–$150 depending on the time of night. Never pay for a repair before knowing the exact written diagnostic."}
              </p>
            </div>
            <button data-open-lead-modal className="w-full md:w-auto shrink-0 bg-hvac-blue hover:bg-blue-500 px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-transform hover:scale-105 flex items-center justify-center gap-2">
              <PhoneCall className="w-5 h-5" />
              {data.cta.primary}
            </button>
          </div>
        </div>
      </section>
          <RelatedTopics />
    </div>
  );
}
