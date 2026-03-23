import { RelatedTopics } from "@/components/hub/RelatedTopics";
import { DollarSign, ShieldAlert, LineChart, Wrench, MapPin, Calculator, ThumbsUp } from "lucide-react";

export interface CostSchema {
  pageType: "cost";
  slug: string;
  title?: string;
  hook?: string;
  repairOrPart: string;
  costRange: {
    low: string;
    high: string;
    average: string;
  };
  content?: {
    whatAffectsCost?: string[];
    repairVsReplace?: {
      repairCost: string;
      replaceCost: string;
      recommendation: string;
    };
    laborVsParts?: {
      labor: string;
      parts: string;
    };
    costByLocation?: string;
    howToSaveMoney?: string[];
    whenItsWorthIt?: string;
  };
  cta: {
    primary: string;
    secondary?: string;
  };
}

export default function CostPageTemplate({ data }: { data: CostSchema }) {
  const displayHeadline = data.title || `${data.repairOrPart} Cost (Full Breakdown)`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 🦸‍♂️ HERO SECTION */}
      <section className="bg-slate-900 border-b border-slate-800 text-white pt-24 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 border border-green-500/30 bg-green-500/10 text-green-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            <DollarSign className="w-4 h-4" />
            Pricing Guide
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
            {displayHeadline}
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light max-w-2xl mx-auto">
            {data.hook || `Before you hire a contractor, know exactly what ${data.repairOrPart} should cost in your local market.`}
          </p>
        </div>
      </section>

      {/* 💰 8-STEP COST BREAKDOWN UI */}
      <section className="py-16 -mt-16 relative z-20">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* 1. Average Cost Range (The Big Anchor) */}
          <div className="bg-white dark:bg-slate-900 border-t-8 border-green-500 rounded-2xl p-10 shadow-2xl mb-12">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center justify-center gap-3">
              <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              Average Cost Range
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">Low End</div>
                <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{data.costRange.low}</div>
              </div>
              <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-500 shadow-md transform md:-translate-y-4">
                <div className="text-sm font-black text-green-600 dark:text-green-400 mb-2 uppercase tracking-widest">Typical Average</div>
                <div className="text-4xl font-black text-slate-900 dark:text-white">{data.costRange.average}</div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">High End</div>
                <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{data.costRange.high}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 shadow-xl mb-12">
            
            {/* 2. What Affects Cost */}
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              What Affects Cost
            </h2>
            <ul className="list-disc pl-16 space-y-2 text-slate-700 dark:text-slate-300 font-medium mb-12">
              {data.content?.whatAffectsCost?.map((c, i) => <li key={i}>{c}</li>) || (
                <>
                  <li>System age and accessibility (e.g., attics vs ground level)</li>
                  <li>OEM parts versus aftermarket / universal equivalents</li>
                  <li>Time of day (emergency after-hours fees)</li>
                </>
              )}
            </ul>

            {/* 3. Repair vs Replace Cost & 4. Labor vs Parts */}
            <div className="grid md:grid-cols-2 gap-8 pl-11 mb-12">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 className= mb-4 flex items-center gap-2">
                  <span className="bg-slate-200 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                  Repair vs Replace
                </h4>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Repair Cost:</span>
                    <span className="font-bold">{data.content?.repairVsReplace?.repairCost || data.costRange.average}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Full System Replace:</span>
                    <span className="font-bold">{data.content?.repairVsReplace?.replaceCost || "$6,500 - $12,000"}</span>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-md font-medium text-xs leading-relaxed">
                    {data.content?.repairVsReplace?.recommendation || "If your system is older than 12 years and uses R-22 refrigerant, replacement is mathematically superior to major isolated repairs."}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <span className="bg-slate-200 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                  Labor vs Parts
                </h4>
                <div className="flex items-center gap-4 h-full">
                  <div className="flex-1 space-y-4 text-sm">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">Parts</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{data.content?.laborVsParts?.parts || "40%"}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-hvac-blue h-2 rounded-full" style={{ width: data.content?.laborVsParts?.parts || "40%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">Labor</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{data.content?.laborVsParts?.labor || "60%"}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-slate-800 dark:bg-slate-400 h-2 rounded-full" style={{ width: data.content?.laborVsParts?.labor || "60%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Cost by Location */}
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
              Cost by Location
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed pl-11 mb-12">
              {data.content?.costByLocation || "Local labor rates vary wildly. High cost-of-living metropolitan areas charge $150–$250/hr, while rural areas typically bill $90–$120/hr."}
            </p>

            {/* 6. How to Save Money */}
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
              How to Save Money
            </h2>
            <ul className="list-disc pl-16 space-y-2 text-slate-700 dark:text-slate-300 font-medium mb-12">
              {data.content?.howToSaveMoney?.map((s, i) => <li key={i}>{s}</li>) || (
                <>
                  <li>Verify if your system is still under the 10-year manufacturer parts warranty.</li>
                  <li>Schedule repairs during standard business hours to avoid emergency dispatch fees.</li>
                  <li>Always get a second firm quote if the initial repair exceeds $1,000.</li>
                </>
              )}
            </ul>

            {/* 7. When It's Worth It */}
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">7</span>
              When It&apos;s Worth It
            </h2>
            <p className="text-lg justify-center flex p-6 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl text-slate-700 dark:text-slate-300 ml-11">
              <ThumbsUp className="w-6 h-6 text-green-600 mr-3 shrink-0" />
              {data.content?.whenItsWorthIt || "If replacing this component restores the system to 100% efficiency and the unit is under 8 years old, do the repair immediately to prevent compounding downstream failures."}
            </p>

          </div>
        </div>
      </section>

      {/* 8. CTA */}
      <section className="py-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-4 py-1 rounded-full text-sm mb-6">
            Step 8
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
            Ready for a Firm Quote?
          </h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button 
              data-open-lead-modal
              className="w-full sm:w-auto px-10 py-5 rounded-xl font-black uppercase tracking-widest transition-transform hover:scale-105 shadow-2xl bg-hvac-blue hover:bg-blue-500 text-white" 
            >
              {data.cta.primary || "Get Local Quotes"}
            </button>
            {data.cta.secondary && (
              <button className="w-full sm:w-auto px-8 py-5 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold uppercase hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                {data.cta.secondary}
              </button>
            )}
          </div>
        </div>
      </section>
          <RelatedTopics />
    </div>
  );
}
