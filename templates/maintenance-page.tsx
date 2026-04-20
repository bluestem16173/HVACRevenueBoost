import { RelatedTopics } from "@/components/hub/RelatedTopics";
import { SmsLegalFooterLinks } from "@/components/SmsLegalFooterLinks";
import { ShieldCheck, CheckCircle, TrendingUp, Calendar, Zap } from "lucide-react";

export interface MaintenanceSchema {
  pageType: "maintenance";
  slug: string;
  city?: string;
  service?: string;
  hero: {
    headline: string;
  };
  title?: string;
  hook?: string;
  problem: string;
  benefits?: string[];
  cta: {
    primary: string;
    secondary?: string;
  };
  content?: {
    whyItHappens?: string;
    maintenanceChecklist?: string[];
    seasonalTips?: string[];
    warningSigns?: string[];
    toolsNeeded?: string[];
    diyVsProfessional?: string;
    costOfMaintenance?: string;
  }
}

export default function MaintenancePageTemplate({ data }: { data: MaintenanceSchema }) {
  const displayHeadline = data.hero?.headline?.replace(/{{city}}/g, data.city || "") || data.title || `Prevent ${data.slug.replace(/-/g, ' ')}`;
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 🦸‍♂️ HERO SECTION */}
      <section className="bg-gradient-to-b from-hvac-navy to-slate-900 text-white pt-24 pb-32 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 border border-green-500/30 bg-green-500/10 text-green-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
            <Calendar className="w-4 h-4" />
            Preventative Maintenance
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight drop-shadow-lg">
            {displayHeadline}
          </h1>
          {data.hook && (
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light max-w-2xl mx-auto drop-shadow-md">
              {data.hook}
            </p>
          )}
        </div>
      </section>

      {/* ⚠️ 7-STEP MAINTENANCE UI */}
      <section className="py-16 -mt-16 relative z-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 shadow-xl mb-12">
            
            {/* 1. Why It Happens */}
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              Why It Happens
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed pl-11 mb-8">
              {data.content?.whyItHappens || data.problem || "Lack of recurring lubrication, filter changes, and pressure checks destroys components exponentially faster."}
            </p>

            {/* 2. Maintenance Checklist */}
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Maintenance Checklist
            </h2>
            <ul className="list-disc pl-16 space-y-2 text-slate-700 dark:text-slate-300 font-medium mb-8">
              {data.content?.maintenanceChecklist?.map((item, i) => <li key={i}>{item}</li>) || (
                <>
                  <li>Clear debris from outdoor condenser</li>
                  <li>Check line temperatures and refrigerant pressures</li>
                  <li>Lubricate blower motor and verify amp draw</li>
                </>
              )}
            </ul>

            {/* 3. Seasonal Tips & 4. Warning Signs */}
            <div className="grid md:grid-cols-2 gap-8 pl-11 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span className="bg-slate-200 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                  Seasonal Tips
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {data.content?.seasonalTips?.map((c, i) => <li key={i}>{c}</li>) || (
                    <>
                      <li>Spring: Wash out coils before heavy usage.</li>
                      <li>Fall: Validate furnace flame sensors and ignitors.</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span className="bg-slate-200 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                  Warning Signs
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {data.content?.warningSigns?.map((w, i) => <li key={i}>{w}</li>) || (
                    <>
                      <li>Odd smells on startup</li>
                      <li>Ice forming on the copper lines</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* 5. Tools Needed */}
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
              Tools Needed
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed pl-11 mb-8">
              {data.content?.toolsNeeded?.join(", ") || "Safety gloves, multimeter, coil cleaner, fin comb, and standard nut drivers."}
            </p>

            {/* 6. DIY vs Professional */}
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
              DIY vs Professional
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed pl-11 mb-8">
              {data.content?.diyVsProfessional || "Filter swaps and basic hose rinsing are DIY-friendly. Anything involving high voltage or refrigerant gauges requires an EPA-certified professional."}
            </p>

            {/* 7. Cost of Maintenance */}
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">7</span>
              Cost of Maintenance
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed pl-11">
              {data.content?.costOfMaintenance || "A comprehensive bi-annual tune-up typically costs between $120 and $180, significantly less than the $800+ average breakdown repair."}
            </p>
          </div>
        </div>
      </section>

      {/* 📈 CORE BENEFITS */}
      {data.benefits && data.benefits.length > 0 && (
        <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-black text-center text-slate-800 dark:text-slate-100 mb-10">
              Immediate Benefits
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {data.benefits.map((benefit, idx) => (
                <div key={idx} className="flex flex-col items-center text-center gap-4 bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:-translate-y-1 transition-transform">
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <TrendingUp className="text-green-500 w-8 h-8 shrink-0" />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 🛡️ TRUST & CTA */}
      <section className="py-24 relative bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="flex flex-col md:flex-row justify-center gap-8 mb-12">
            </div>

            <div className="bg-hvac-navy border border-slate-800 p-12 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent_60%)] pointer-events-none"></div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight drop-shadow-sm">
                  {data.cta.primary || "Schedule Maintenance Now"}
                </h2>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button 
                    data-open-lead-modal
                    className="w-full sm:w-auto px-10 py-5 rounded-xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl bg-hvac-blue hover:bg-blue-500 text-white hover:scale-105" 
                  >
                    {data.cta.primary}
                  </button>
                  {data.cta.secondary && (
                    <button className="w-full sm:w-auto px-8 py-5 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white">
                      {data.cta.secondary}
                    </button>
                  )}
                </div>
                <SmsLegalFooterLinks className="mt-4 justify-center text-[10px]" tone="onDark" />
              </div>
            </div>
        </div>
      </section>
          <RelatedTopics />
    </div>
  );
}
