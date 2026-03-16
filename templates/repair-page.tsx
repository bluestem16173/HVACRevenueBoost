import Link from "next/link";

import ThirtySecondSummary from "@/components/ThirtySecondSummary";

export default function RepairPageTemplate({ repair, component, tools, cause, contentJson }: any) {
  const {
    fast_answer,
    tools_required,
    parts_required,
    step_overview,
    cost_estimates,
    technician_insights,
    faq,
  } = contentJson || {};

  const displayTools = tools_required?.length > 0 ? tools_required : tools;

  const summaryPoints = [
    { label: "Repair Type", value: repair.name },
    { label: "Cost Estimate", value: repair.repair_type === 'low' ? '$150 - $350' : repair.repair_type === 'high' ? '$800+' : '$350 - $800' },
    { label: "Target Component", value: component?.name || "System Level" },
    { label: "Skill Level", value: repair.skill_level || "Professional Recommended" }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <nav className="text-sm text-gray-500 mb-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/components/${component?.slug || ''}`} className="hover:text-hvac-blue">{component?.name || 'Components'}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">How to Fix</span>
      </nav>

      <section className="mb-12">
        <div className="inline-block bg-hvac-blue/10 text-hvac-blue text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          Technical Service Manual
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy leading-tight">
          How to {repair.name.toLowerCase()}
        </h1>
      </section>

      <ThirtySecondSummary points={summaryPoints} />

      {fast_answer && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-3">Fast Answer</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{fast_answer}</p>
        </section>
      )}

      {displayTools?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Tools Required</h2>
          <ul className="space-y-3 list-none p-0">
            {displayTools.map((t: any, i: number) => (
              <li key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-hvac-navy dark:text-white">{t.name}</span>
                {(t.reason || t.description) && <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">— {t.reason || t.description}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {parts_required?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Parts Required</h2>
          <ul className="space-y-3 list-none p-0">
            {parts_required.map((p: any, i: number) => (
              <li key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-hvac-navy dark:text-white">{p.name}</span>
                {p.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 m-0">{p.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {step_overview?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Repair Overview</h2>
          <div className="space-y-4">
            {step_overview.map((step: any, i: number) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-hvac-navy dark:text-white">Step {i + 1}</strong>
                <p className="text-slate-600 dark:text-slate-400 mt-2 m-0">{step.description ?? step.step}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-24 pt-24 border-t border-slate-200">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-7">
            <h2 className="mt-0 text-3xl font-black border-0 leading-tight">Tools & Precautions</h2>
            <p className="text-hvac-safety font-bold text-sm mt-4 bg-hvac-safety/10 p-4 rounded-lg border border-hvac-safety/20">
              WARNING: Extreme risk of electrical shock. Always discharge capacitors and disconnect main breaker before proceeding.
            </p>
            
            <div className="mt-8">
              <h4 className="font-black text-hvac-navy text-xs uppercase tracking-widest mb-4">Required Tools</h4>
              <ul className="space-y-3 list-none p-0">
                {tools?.map((t: any) => (
                  <li key={t.slug} className="text-sm border border-slate-200 rounded-lg p-3">
                    <Link href={`/tools/${t.slug}`} className="font-bold text-hvac-blue hover:underline block">{t.name}</Link>
                    <span className="text-xs text-gray-500 mt-1 block">{t.description}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-8 bg-slate-50 p-6 rounded-xl">
              <h4 className="font-black text-hvac-navy text-xs uppercase tracking-widest mb-4">Primary Triggers (Why you are here)</h4>
              <p className="text-sm text-gray-600 m-0">This manual is intended for systems suffering from <strong>{cause?.name || "a detected fault"}</strong>.</p>
              <Link href={`/cause/${cause?.slug}`} className="text-xs font-bold text-hvac-blue uppercase hover:underline mt-4 inline-block">Review Root Cause Analysis →</Link>
            </div>

          </div>
          <div className="md:col-span-5">
            <div className="bg-hvac-navy text-white p-8 rounded-2xl text-center shadow-xl">
              <h3 className="text-2xl font-black mb-4 border-0">Need Professional Installation?</h3>
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">Don't risk electrical or refrigerant hazards. Get quotes from local experts.</p>
              <button data-open-lead-modal className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-6 py-3 rounded-xl uppercase tracking-widest text-sm transition-colors shadow-md w-full">
                Get Repair Quotes
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
