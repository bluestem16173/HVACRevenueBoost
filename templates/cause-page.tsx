/**
 * Cause Page Template — Structured rendering only
 * -----------------------------------------------
 * NEVER renders raw DB HTML. All content from pageViewModel (translator layer).
 * @see docs/MASTER-PROMPT-DECISIONGRID.md
 */
import Link from "next/link";
import ThirtySecondSummary from "@/components/ThirtySecondSummary";
import ServiceCTA from "@/components/ServiceCTA";
import SystemOverviewBlock from "@/components/sections/SystemOverviewBlock";
import { CauseContent } from "@/lib/content-engine/schema";
import { toSafeString } from "@/lib/content";
import AuthorityGraph from "@/components/AuthorityGraph";

export default function CausePageTemplate({
  cause,
  symptom,
  repairs,
  component,
  diagnosticTests,
  pageViewModel,
  rawContent,
}: {
  cause: { name: string; explanation?: string; description?: string; difficulty?: string };
  symptom: { name: string; slug: string } | null;
  repairs: Array<{ id?: string; name: string; slug?: string; description?: string; skill_level?: string; repair_type?: string }>;
  component: { name: string; slug: string } | null;
  diagnosticTests: Array<{ id?: string; name: string; description?: string; test_steps?: string[]; tools_required?: string[] }>;
  pageViewModel: {
    fastAnswer?: string;
    bodyText?: string;
    repairOptions?: Array<{ name: string; difficulty?: string; cost?: string; link?: string; slug?: string }>;
    faq?: Array<{ question: string; answer: string }>;
    commonSymptoms?: Array<{ name: string; slug?: string; link?: string; description?: string }>;
    technicianInsights?: Array<string | { text: string; cite?: string }>;
  };
  rawContent?: any;
}) {
  const ai = rawContent as CauseContent | undefined;

  // New Deep Dive AI Render Path
  if (ai && ai.whatIsIt && ai.hero) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 dark:text-gray-400 mb-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
          <Link href="/" className="hover:text-hvac-blue">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/diagnose" className="hover:text-hvac-blue">Diagnostics</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-white font-medium">{ai.hero.headline}</span>
        </nav>

        {/* 🟢 HERO (Authority + Clarity) */}
        <section className="mb-12">
          <div className="inline-block bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            Root Cause Breakdown
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight mb-4">
            {ai.hero.headline}
          </h1>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 leading-relaxed">
            {ai.hero.subheadline}
          </p>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed border-l-4 border-hvac-blue pl-4 bg-blue-50/50 dark:bg-slate-800/50 p-4 rounded-r-lg mb-8">
            {ai.hero.intro}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <button 
              data-open-lead-modal 
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-full sm:w-auto px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all border border-slate-700 shadow-xl flex items-center justify-center gap-3 shrink-0"
            >
              Local Techs Coming Soon <span className="text-lg">→</span>
            </button>
            <div className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-3 px-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse shrink-0"></span>
              Skip the reading. Get professional diagnostic help right now before the damage cascades.
            </div>
          </div>
        </section>

        {/* 🔍 WHAT THIS PROBLEM REALLY IS */}
        <section className="mb-12 bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <span>🔬</span> What This Problem Really Is
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            {ai.whatIsIt.explanation}
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-hvac-gold p-4 rounded-r-xl">
            <strong className="text-amber-900 dark:text-amber-400 font-black block mb-1">Key Insight:</strong>
            <span className="text-amber-800 dark:text-amber-300 text-base">{ai.whatIsIt.whyItMatters}</span>
          </div>
        </section>

        {/* ⚙️ SYSTEM MECHANICS */}
        {ai.systemMechanics && (
          <section className="mb-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-4">
              <span>⚙️</span> System Mechanics
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Core Principle</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{ai.systemMechanics.corePrinciple}</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">What Physically Breaks</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{ai.systemMechanics.whatBreaks}</p>
              </div>
              {ai.systemMechanics.downstreamEffects && ai.systemMechanics.downstreamEffects.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">Downstream Effects</h3>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {ai.systemMechanics.downstreamEffects.map((effect, idx) => (
                      <li key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-2 shadow-sm text-sm">
                        <span className="text-red-500 font-bold mt-0.5">⚠️</span>
                        <span className="text-slate-700 dark:text-slate-300">{effect}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 📈 VISUAL PERFORMANCE GRAPH */}
        {ai.graphBlock && (
          <AuthorityGraph data={ai.graphBlock as any} />
        )}

        {/* 📚 TECHNICAL DEEP DIVE (E-E-A-T) */}
        {ai.technicalDeepDive && (
          <section className="mb-12">
            <details className="group bg-slate-900 rounded-2xl border border-slate-800 open:pb-8 shadow-xl overflow-hidden cursor-pointer transition-all">
              <summary className="p-6 md:p-8 flex justify-between items-center outline-none list-none select-none hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-hvac-blue/20 p-3 rounded-xl border border-hvac-blue/30 text-hvac-blue shadow-[0_0_15px_rgba(40,120,255,0.2)]">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-wider mb-1">Technical Deep Dive</h2>
                    <p className="text-slate-200 text-sm font-medium">Thermodynamics, System Physics & Quantitative Indicators</p>
                  </div>
                </div>
                <div className="text-slate-300 group-open:text-hvac-blue transform group-open:rotate-180 transition-all duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </summary>

              <div className="px-6 md:px-8 text-white space-y-8 cursor-default">
                
                {/* Thermodynamics & Heat Transfer */}
                <div className="grid md:grid-cols-2 gap-8 border-t border-slate-800 pt-8">
                  <div>
                    <h3 className="text-hvac-gold font-bold uppercase tracking-widest text-sm mb-3">Heat Transfer Overview</h3>
                    <p className="leading-relaxed text-white mb-6">{ai.technicalDeepDive.heatTransferOverview}</p>
                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
                      <h4 className="text-slate-200 font-bold text-xs uppercase mb-3 tracking-wider">Thermodynamic Principles</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {ai.technicalDeepDive.thermodynamics.principles?.map((p, i) => (
                          <span key={i} className="bg-slate-700/50 text-white border border-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{p}</span>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm leading-relaxed text-white"><span className="text-hvac-blue font-black uppercase text-xs tracking-wider block mb-1">Phase Change</span> {ai.technicalDeepDive.thermodynamics.phaseChangeExplanation}</p>
                        <p className="text-sm leading-relaxed text-white"><span className="text-hvac-blue font-black uppercase text-xs tracking-wider block mb-1">Pressure & Temp</span> {ai.technicalDeepDive.thermodynamics.pressureTemperatureRelationship}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quantitative Signals */}
                  <div>
                    <h3 className="text-hvac-gold font-bold uppercase tracking-widest text-sm mb-3">Quantitative Indicators</h3>
                    <ul className="space-y-4">
                      <li className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <span className="text-white font-medium">Target Temperature Split (ΔT)</span>
                        <span className="font-mono text-hvac-blue bg-blue-900/20 px-3 py-1 rounded border border-blue-900/50 font-bold tracking-wider">{ai.technicalDeepDive.quantitativeIndicators.temperatureSplit}</span>
                      </li>
                      <li className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <span className="text-white font-medium">Pressure Behavior</span>
                        <span className="font-mono text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded border border-emerald-900/50 font-bold text-right max-w-[200px] text-sm">{ai.technicalDeepDive.quantitativeIndicators.pressureRanges}</span>
                      </li>
                      <li className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <span className="text-white font-medium">Airflow (CFM) Impact</span>
                        <span className="font-mono text-amber-400 bg-amber-900/20 px-3 py-1 rounded border border-amber-900/50 font-bold text-right max-w-[200px] text-sm">{ai.technicalDeepDive.quantitativeIndicators.airflowCFMImpact}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* System Components Grid */}
                <div>
                  <h3 className="text-hvac-gold font-bold uppercase tracking-widest text-sm mb-4">Component Roles During Fault</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                      <span className="text-slate-200 text-xs font-black uppercase tracking-wider block mb-2">Evaporator Coil</span>
                      <p className="text-sm text-white leading-relaxed">{ai.technicalDeepDive.systemComponents.evaporator}</p>
                    </div>
                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                      <span className="text-slate-200 text-xs font-black uppercase tracking-wider block mb-2">Condenser Coil</span>
                      <p className="text-sm text-white leading-relaxed">{ai.technicalDeepDive.systemComponents.condenser}</p>
                    </div>
                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                      <span className="text-slate-200 text-xs font-black uppercase tracking-wider block mb-2">Compressor</span>
                      <p className="text-sm text-white leading-relaxed">{ai.technicalDeepDive.systemComponents.compressor}</p>
                    </div>
                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                      <span className="text-slate-200 text-xs font-black uppercase tracking-wider block mb-2">Metering Device</span>
                      <p className="text-sm text-white leading-relaxed">{ai.technicalDeepDive.systemComponents.expansionDevice}</p>
                    </div>
                  </div>
                </div>

                {/* Failure Dynamics & Graph Models */}
                <div className="grid md:grid-cols-2 gap-8 border-t border-slate-800 pt-8">
                  <div>
                    <h3 className="text-red-400 font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                      <span className="animate-pulse">🔴</span> Failure Dynamics
                    </h3>
                    <div className="bg-red-900/10 border border-red-900/30 p-5 rounded-xl mb-6">
                      <p className="text-white mb-3 text-sm leading-relaxed"><span className="text-red-400 font-bold uppercase tracking-wider text-xs block mb-1">Efficiency Loss Mechanism</span> {ai.technicalDeepDive.failureDynamics.efficiencyLossMechanism}</p>
                      <p className="text-white text-sm leading-relaxed"><span className="text-red-400 font-bold uppercase tracking-wider text-xs block mb-1">Physical Change</span> {ai.technicalDeepDive.failureDynamics.whatChanges}</p>
                    </div>
                    
                    <h4 className="text-slate-200 font-black text-xs uppercase tracking-wider mb-3">Cascade Effects</h4>
                    <ul className="space-y-2">
                      {ai.technicalDeepDive.failureDynamics.cascadeEffects?.map((c, i) => (
                        <li key={i} className="text-white text-sm flex gap-3 items-start bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                          <span className="text-red-500/70 mt-0.5">↳</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Graph Models */}
                  {ai.technicalDeepDive.graphModels && ai.technicalDeepDive.graphModels.length > 0 && (
                    <div>
                      <h3 className="text-hvac-blue font-black uppercase tracking-widest text-sm mb-4">Mathematical Models</h3>
                      <div className="space-y-4">
                        {ai.technicalDeepDive.graphModels.map((g, i) => (
                          <div key={i} className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl">
                            <h4 className="text-white font-bold text-sm mb-3">{g.description}</h4>
                            <div className="font-mono text-hvac-gold bg-slate-900 p-4 rounded-lg border border-slate-800 text-center tracking-widest font-black text-lg overflow-x-auto shadow-inner">
                              {g.equation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Real World Interpretation */}
                <div className="bg-white text-slate-900 p-6 md:p-8 rounded-xl border border-slate-200 mt-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-hvac-blue to-hvac-navy"></div>
                  <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs mb-3">Real-World Interpretation</h3>
                  <p className="font-bold text-lg leading-relaxed text-slate-800">{ai.technicalDeepDive.realWorldInterpretation}</p>
                </div>

              </div>
            </details>
          </section>
        )}

        {/* ⚠️ SYMPTOMS YOU’LL NOTICE */}
        {ai.symptoms && ai.symptoms.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">⚠️ Symptoms You’ll Notice</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {ai.symptoms.map((sym, idx) => (
                <div key={idx} className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex items-start gap-3 border border-slate-200 dark:border-slate-700">
                  <span className="text-red-500 font-bold mt-0.5">→</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{sym}</span>
                </div>
              ))}
            </div>
            {ai.internalLinks?.diagnose && ai.internalLinks.diagnose.length > 0 && (
              <div className="mt-4 text-sm font-bold flex gap-3 flex-wrap">
                <span className="text-slate-500">Related diagnostics:</span>
                {ai.internalLinks.diagnose.map((d, i) => (
                  <Link key={i} href={`/diagnose/${d}`} className="text-hvac-blue hover:underline">
                    {d.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 🧪 WHY THIS HAPPENS */}
        {ai.whyItHappens && ai.whyItHappens.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">⚙️ Why This Happens</h2>
            <ul className="space-y-4">
              {ai.whyItHappens.map((causeStr, idx) => (
                <li key={idx} className="flex items-start gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-hvac-blue/10 text-hvac-blue flex items-center justify-center font-black shrink-0">{idx + 1}</div>
                  <span className="text-slate-700 dark:text-slate-300 mt-1">{causeStr}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 🧠 SYSTEM IMPACT */}
        {ai.systemImpact && ai.systemImpact.length > 0 && (
          <section className="mb-12 bg-slate-900 text-white p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-hvac-blue opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <h2 className="text-2xl font-black text-white mb-6 relative z-10 flex items-center gap-2">
              <span>🧠</span> System Impact (If Ignored)
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 relative z-10">
              {ai.systemImpact.map((impact, idx) => (
                <div key={idx} className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                  <span className="text-hvac-gold block mb-2">⚡</span>
                  <p className="text-slate-300 text-sm leading-relaxed">{impact}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 🔎 HOW TO CONFIRM */}
        {ai.howToConfirm && ai.howToConfirm.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">🔎 How to Confirm (Safe DIY Checks)</h2>
            <div className="space-y-3">
              {ai.howToConfirm.map((check, idx) => (
                <div key={idx} className="flex gap-3 items-center bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-4 rounded-xl text-green-900 dark:text-green-300 font-medium">
                  <span>✅</span> {check}
                </div>
              ))}
            </div>
            {ai.quickChecks && ai.quickChecks.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {ai.quickChecks.map((qc, i) => (
                  <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700">
                    🛠 {qc}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 🛑 SAFETY & REGULATORY RISKS */}
        {ai.safetyRisks && (
          <section className="mb-12">
            <h2 className="text-2xl font-black text-red-600 dark:text-red-400 mb-6 flex items-center gap-2">
              <span>🛑</span> Safety & Regulatory Risks
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {ai.safetyRisks.mechanical && ai.safetyRisks.mechanical.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-xl border border-red-200 dark:border-red-900/30">
                  <h3 className="font-bold text-red-900 dark:text-red-300 mb-2 uppercase tracking-wider text-xs">Mechanical Risks</h3>
                  <ul className="space-y-1">
                    {ai.safetyRisks.mechanical.map((r, i) => (
                      <li key={i} className="text-sm text-red-800 dark:text-red-400 flex gap-2"><span className="opacity-50">•</span> {r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {ai.safetyRisks.electrical && ai.safetyRisks.electrical.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-900/30">
                  <h3 className="font-bold text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wider text-xs">Electrical Risks</h3>
                  <ul className="space-y-1">
                    {ai.safetyRisks.electrical.map((r, i) => (
                      <li key={i} className="text-sm text-amber-800 dark:text-amber-400 flex gap-2"><span className="opacity-50">⚡</span> {r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {ai.safetyRisks.chemical && ai.safetyRisks.chemical.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-300 mb-2 uppercase tracking-wider text-xs">Chemical / Refrigerant</h3>
                  <ul className="space-y-1">
                    {ai.safetyRisks.chemical.map((r, i) => (
                      <li key={i} className="text-sm text-emerald-800 dark:text-emerald-400 flex gap-2"><span className="opacity-50">🧪</span> {r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {ai.safetyRisks.regulatory && ai.safetyRisks.regulatory.length > 0 && (
                <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-xl border border-slate-300 dark:border-slate-600">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider text-xs">Regulatory Notes</h3>
                  <ul className="space-y-1">
                    {ai.safetyRisks.regulatory.map((r, i) => (
                      <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex gap-2"><span className="opacity-50">⚖️</span> {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 🛠 SOLUTIONS & COST */}
        {ai.solutions && ai.solutions.length > 0 && (
          <section className="mb-16">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">🛠 Professional Solutions</h2>
                <div className="space-y-4">
                  {ai.solutions.map((sol, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-hvac-blue font-bold">✓</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{sol}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-8 grid sm:grid-cols-2 gap-8 items-center">
                {ai.costImpact && (
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">Estimated Cost Impact</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-black text-slate-800 dark:text-white">{ai.costImpact.estimatedCost}</span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold rounded-full uppercase">
                        {ai.costImpact.severity} Severity
                      </span>
                    </div>
                  </div>
                )}
                {ai.whenToAct && (
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">When To Act</h3>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      ⏱ {ai.whenToAct}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ⚖️ DECISION FRAMEWORK */}
        {ai.decisionFramework && (
          <section className="mb-16">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">⚖️ Repair Decision Framework</h2>
            <div className="grid md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8">
              
              {/* DIY Column */}
              {ai.decisionFramework.diy && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-slate-200 dark:bg-slate-600"></div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mb-4 flex justify-between items-center">
                    DIY Approach
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded uppercase tracking-wider">Not Recommended</span>
                  </h3>
                  <ul className="space-y-4 mb-4">
                    <li className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                      <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Estimated Cost</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{ai.decisionFramework.diy.cost}</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                      <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Time Required</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{ai.decisionFramework.diy.time}</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                      <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Risk Level</span>
                      <span className="text-red-600 dark:text-red-400 font-bold">{ai.decisionFramework.diy.risk}</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Professional Column */}
              {ai.decisionFramework.professional && (
                <div className="bg-hvac-navy dark:bg-slate-800 p-6 rounded-xl border border-hvac-blue shadow-lg shadow-hvac-blue/10 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-hvac-blue"></div>
                  <h3 className="text-xl font-black text-white mb-4 flex justify-between items-center">
                    Professional Repair
                    <span className="text-xs font-bold px-2 py-1 bg-hvac-blue text-white rounded uppercase tracking-wider">Recommended</span>
                  </h3>
                  <ul className="space-y-4 mb-4">
                    <li className="flex justify-between items-center border-b border-slate-700 pb-2">
                      <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Estimated Cost</span>
                      <span className="text-white font-bold">{ai.decisionFramework.professional.cost}</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-slate-700 pb-2">
                      <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Time to Resolve</span>
                      <span className="text-white font-bold">{ai.decisionFramework.professional.time}</span>
                    </li>
                    <li className="flex justify-between border-b border-slate-700 pb-2">
                      <span className="text-slate-400 text-sm font-bold uppercase tracking-wider shrink-0 mr-4">Risk Reduction</span>
                      <span className="text-hvac-gold font-bold text-right text-sm">{ai.decisionFramework.professional.riskReduction}</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Recommendation Ribbon */}
              {ai.decisionFramework.recommendation && (
                <div className="md:col-span-2 mt-4 bg-blue-50 dark:bg-slate-800 border-l-4 border-hvac-blue p-4 rounded-r-lg">
                  <strong className="text-hvac-navy dark:text-white font-black block mb-1">Expert Recommendation:</strong>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{ai.decisionFramework.recommendation}</p>
                </div>
              )}

            </div>
          </section>
        )}

        {/* 🔗 INTERNAL LINK GRID */}
        {ai.internalLinks && (
          <section className="mb-16 mt-8">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">Explore Related Technical Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">🔄 Related Symptoms</h3>
                <ul className="space-y-3">
                  {(ai.internalLinks.diagnose || []).map((linkSlug, i) => (
                    <li key={i}>
                      <Link href={`/diagnose/${linkSlug}`} className="text-hvac-blue hover:text-blue-700 font-bold text-sm hover:underline capitalize">
                        {linkSlug.replace(/-/g, ' ')}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">🔍 Related Causes</h3>
                <ul className="space-y-3">
                  {(ai.internalLinks.relatedCauses || []).map((linkSlug, i) => (
                    <li key={i}>
                      <Link href={`/causes/${linkSlug}`} className="text-hvac-blue hover:text-blue-700 font-bold text-sm hover:underline capitalize">
                        {linkSlug.replace(/-/g, ' ')}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">🔧 Component Repairs</h3>
                <ul className="space-y-3">
                  {(ai.internalLinks.repairs || []).map((linkSlug, i) => (
                    <li key={i}>
                      <Link href={`/fix/${linkSlug}`} className="text-hvac-blue hover:text-blue-700 font-bold text-sm hover:underline capitalize">
                        {linkSlug.replace(/-/g, ' ')}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 📣 CTA */}
        {ai.cta && (
          <section className="mb-16 bg-gradient-to-br from-hvac-navy to-slate-900 text-white p-10 rounded-3xl text-center shadow-xl border border-slate-700 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-4 border-0 text-white">{ai.cta.primary}</h2>
              <p className="text-slate-300 mb-8 text-base leading-relaxed max-w-2xl mx-auto">
                {ai.cta.secondary} Stop guessing and have a certified technician inspect the root cause before it damages your entire system.
              </p>
              <button data-open-lead-modal className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-8 py-4 rounded-xl uppercase tracking-widest text-sm transition-all border border-slate-600 shadow-md">
                Local Techs Coming Soon
              </button>
            </div>
          </section>
        )}

        {/* ❓ FAQ */}
        {ai.faq && ai.faq.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              {ai.faq.map((item, i) => (
                <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 m-0 leading-snug flex gap-3">
                    <span className="text-hvac-blue shrink-0">Q.</span>
                    {item.question}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mt-3 m-0 text-base leading-relaxed flex gap-3">
                    <span className="text-slate-300 dark:text-slate-600 font-bold shrink-0">A.</span>
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ============== LEGACY CAUSE RENDERER ==============
  const vm = pageViewModel;
  const displayFastAnswer = vm.fastAnswer ?? toSafeString(cause?.explanation ?? cause?.description);
  const displayRepairs = (vm.repairOptions?.length ?? 0) > 0 ? vm.repairOptions! : repairs;
  const hasStructuredContent = !!(displayFastAnswer || vm.bodyText || (vm.commonSymptoms?.length ?? 0) > 0 || (displayRepairs?.length ?? 0) > 0);

  const summaryPoints = [
    { label: "Technical Cause", value: cause.name },
    { label: "Associated Symptom", value: symptom?.name || "System Failure" },
    { label: "Failed Component", value: component?.name || "Multiple" },
    { label: "Repair Difficulty", value: cause.difficulty || "Intermediate" },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <nav className="text-sm text-gray-500 mb-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/hvac" className="hover:text-hvac-blue">HVAC Systems</Link>
        <span className="mx-2">/</span>
        <Link href="/diagnose" className="hover:text-hvac-blue">Diagnostics</Link>
        <span className="mx-2">/</span>
        <Link href={`/diagnose/${symptom?.slug || ""}`} className="hover:text-hvac-blue">
          {symptom?.name || "Symptom"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">Root Cause</span>
      </nav>

      <section className="mb-12">
        <div className="inline-block bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          Root Cause Analysis
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight">
          {cause.name} – Symptoms & Technical Breakdown
        </h1>
      </section>

      <SystemOverviewBlock variant="cause" />

      {hasStructuredContent ? (
        <>
          {displayFastAnswer && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-3">Fast Answer</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{displayFastAnswer}</p>
            </section>
          )}

          {vm.bodyText && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-3">Technical Breakdown</h2>
              <div className="prose prose-slate max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
                {vm.bodyText.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="mb-4 last:mb-0">{para.trim()}</p>
                ))}
              </div>
            </section>
          )}

          {(vm.commonSymptoms?.length ?? 0) > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Symptoms This Cause Creates</h2>
              <div className="grid gap-4">
                {vm.commonSymptoms!.map((s, i) => (
                  <Link
                    key={i}
                    href={s.link || `/diagnose/${s.slug || ""}`}
                    className="block p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-hvac-blue transition-colors"
                  >
                    <strong className="text-hvac-navy dark:text-white">{s.name}</strong>
                    {s.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 m-0">{s.description}</p>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {displayRepairs.length > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Repair Options</h2>
              <div className="space-y-4">
                {displayRepairs.map((repair, i) => {
                  const r = repair as { name: string; description?: string; link?: string; slug?: string };
                  const repairHref = r.link ?? (r.slug ? `/fix/${r.slug}` : null);
                  return (
                    <div
                      key={i}
                      className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <h3 className="font-bold text-hvac-navy dark:text-white m-0">{r.name}</h3>
                      {r.description && (
                        <p className="text-slate-600 dark:text-slate-400 mt-2 m-0">{r.description}</p>
                      )}
                      {repairHref && (
                        <Link
                          href={repairHref}
                          className="text-sm font-bold text-hvac-blue hover:underline mt-2 inline-block"
                        >
                          View Repair Guide →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(vm.technicianInsights?.length ?? 0) > 0 && (
            <section className="mb-10 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <h2 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-3">Technician Insights</h2>
              {vm.technicianInsights!.slice(0, 2).map((insight, i) => (
                <p key={i} className="text-amber-900 dark:text-amber-200 text-sm mb-2 last:mb-0">
                  {typeof insight === "string" ? insight : insight.text}
                </p>
              ))}
            </section>
          )}

          <ServiceCTA variant="secondary" />

          {(vm.faq?.length ?? 0) > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">FAQ</h2>
              <div className="space-y-4">
                {vm.faq!.slice(0, 4).map((item, i) => (
                  <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-hvac-navy dark:text-white m-0">{item.question}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 m-0 text-sm">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-16 bg-hvac-navy text-white p-10 rounded-2xl text-center">
            <h2 className="text-2xl font-black mb-4 border-0 text-white">Need Professional Assistance?</h2>
            <p className="text-slate-300 mb-6 text-sm leading-relaxed">
              Don&apos;t guess on expensive control boards and compressors. Have a certified technician run diagnostic tests.
            </p>
            <button
              data-open-lead-modal
              className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-6 py-3 rounded-xl uppercase tracking-widest text-sm"
            >
              Get HVAC Repair Quotes
            </button>
          </section>
        </>
      ) : (
        <>
          <ThirtySecondSummary points={summaryPoints} />

          <section className="mb-16 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm leading-relaxed text-lg">
            <h2 className="mt-0 text-hvac-navy dark:text-white border-0">Technical Explanation</h2>
            <p className="mt-4">{cause.explanation || cause.description}</p>
            <p className="mt-4 text-gray-600 dark:text-slate-400">
              When this fault path is triggered, it typically requires immediate attention to prevent cascading failures
              across the {component?.name || "system"}. Follow the diagnostic tests below to verify, then proceed to repair
              options.
            </p>
          </section>

          {diagnosticTests?.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-2 border-0">
                Diagnostic Tests
              </h2>
              <p className="text-gray-600 dark:text-slate-400 mb-6">
                Technician verification procedures to confirm this cause before repair.
              </p>
              <div className="space-y-6">
                {diagnosticTests.map((test, idx) => (
                  <div
                    key={test.id || idx}
                    className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <h3 className="text-lg font-bold text-hvac-navy dark:text-white m-0 mb-2">
                      {test.name}
                    </h3>
                    {test.description && (
                      <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 m-0">{test.description}</p>
                    )}
                    {Array.isArray(test.test_steps) && test.test_steps.length > 0 && (
                      <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        {test.test_steps.map((step, i) => (
                          <li key={i}>{typeof step === "string" ? step : String(step)}</li>
                        ))}
                      </ol>
                    )}
                    {Array.isArray(test.tools_required) && test.tools_required.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Tools required:
                        </span>
                        <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                          {test.tools_required.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-16 pt-16 border-t border-slate-200 dark:border-slate-800">
            <div className="grid md:grid-cols-12 gap-12 items-start">
              <div className="md:col-span-7">
                <h2 className="mt-0 text-3xl font-black text-hvac-navy dark:text-white border-0 leading-tight">
                  Repair Options
                </h2>
                <p className="text-gray-600 dark:text-slate-400 mt-4 leading-relaxed">
                  Based on the detected root cause ({cause.name}), these are the standard protocol repairs.
                </p>
                <ul className="mt-8 space-y-4 list-none p-0">
                  {repairs?.map((r, idx) => (
                    <li
                      key={r.id || idx}
                      className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <h4 className="font-bold text-hvac-navy dark:text-white m-0">{r.name}</h4>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          Difficulty:{" "}
                          <strong className="text-hvac-navy dark:text-white uppercase tracking-widest">
                            {r.skill_level || r.repair_type || "Variable"}
                          </strong>
                        </span>
                        <Link
                          href={`/fix/${r.slug}`}
                          className="text-xs font-bold text-hvac-blue uppercase hover:underline"
                        >
                          View Manual →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
                {(!repairs || repairs.length === 0) && (
                  <p className="text-slate-500 dark:text-slate-400 italic mt-4">
                    No repairs mapped for this cause. Professional diagnostic recommended.
                  </p>
                )}
              </div>
              <div className="md:col-span-5 space-y-6">
                <Link
                  href="/repair"
                  className="block p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:border-hvac-blue transition-colors"
                >
                  <span className="font-bold text-hvac-navy dark:text-white">All Repair Guides</span>
                  <span className="block text-xs text-gray-500 mt-1">→ /repair</span>
                </Link>
                <div className="bg-hvac-navy text-white p-8 rounded-2xl text-center shadow-xl">
                  <h3 className="text-2xl font-black mb-4 border-0 text-white">
                    Need Professional Assistance?
                  </h3>
                  <p className="text-white mb-6 text-sm leading-relaxed">
                    Don&apos;t guess on expensive control boards and compressors. Have a certified technician run
                    diagnostic tests.
                  </p>
                  <button
                data-open-lead-modal
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-6 py-4 rounded-xl uppercase tracking-widest text-sm transition-colors border border-slate-700 shadow-md w-full"
              >
                Local Techs Coming Soon
              </button>
                </div>
              </div>
            </div>
          </section>
          <ServiceCTA variant="secondary" />
        </>
      )}
    </div>
  );
}
