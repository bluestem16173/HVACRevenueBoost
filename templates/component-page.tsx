import Link from "next/link";

import ThirtySecondSummary from "@/components/ThirtySecondSummary";

export default function ComponentPageTemplate({
  component,
  symptoms,
  repairs,
  internalLinks,
  localContractors,
}: any) {
  const summaryPoints = [
    { label: "Core Component", value: component },
    { label: "Common Symptoms", value: symptoms.length > 0 ? `${symptoms.length} Identified` : "System Check Needed" },
    { label: "Replacement Cost", value: repairs?.[0]?.estimatedCost || "$250-$800" },
    { label: "Technical Status", value: "Standard Service Part" }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* breadcrumbs */}
      <nav className="text-sm text-gray-500 mb-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/components" className="hover:text-hvac-blue">Components</Link>
        <span className="mx-2">/</span>
        <span className="capitalize">{component}</span>
      </nav>

      <section className="mb-12">
        <div className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full mb-4 border border-slate-200 dark:border-slate-700 uppercase tracking-widest">
          HVAC Component technical Guide
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy leading-tight">
          {component.charAt(0).toUpperCase() + component.slice(1)} Troubleshooting
        </h1>
      </section>

      <ThirtySecondSummary points={summaryPoints} />

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="md:col-span-2 space-y-12">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="mt-0 text-hvac-navy border-0">Primary Signs of Failure</h2>
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              {symptoms.slice(0, 4).map((symptom: any, idx: number) => (
                <Link key={idx} href={`/diagnose/${symptom.slug}`} className="block p-4 border border-slate-100 hover:border-hvac-blue rounded-lg transition-colors group">
                  <h4 className="font-bold text-hvac-blue group-hover:text-hvac-navy m-0">{symptom.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{symptom.description}</p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-hvac-navy">Professional Repair Solutions</h2>
            <div className="space-y-4 mt-6">
              {repairs.slice(0, 3).map((repair: any, idx: number) => (
                <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-hvac-navy m-0 leading-tight mb-2">{repair.name}</h4>
                  <p className="text-sm text-gray-600 m-0 leading-snug">{repair.description || "Technical servicing and restoration for this component."}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="md:col-span-1">
          <div className="sticky top-24">
            <div className="bg-hvac-navy text-white p-8 rounded-2xl text-center shadow-xl">
              <h3 className="text-2xl font-black mb-4 border-0">Diagnosing {component.name}?</h3>
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">Don't guess on expensive parts. Have a certified technician test it for you.</p>
              <button data-open-lead-modal className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-6 py-3 rounded-xl uppercase tracking-widest text-sm transition-colors shadow-md w-full">
                Get HVAC Repair Quotes
              </button>
            </div>
            
            <div className="mt-8 p-6 bg-hvac-navy text-white rounded-xl shadow-lg border-b-4 border-hvac-gold">
              <h4 className="text-white m-0 text-sm font-bold uppercase tracking-widest">Licensed Assistance</h4>
              <p className="text-xs text-blue-100 mt-2 mb-6">Connect with a certified technician specifically trained in {component} replacement.</p>
              
              <div className="space-y-4">
                {localContractors && localContractors.length > 0 ? (
                  localContractors.map((contractor: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-hvac-gold/50 pl-4 py-1">
                      <div className="text-sm font-bold text-white">{contractor.company_name}</div>
                      <div className="text-[10px] text-blue-200 uppercase tracking-tighter">{contractor.trade} Certified</div>
                    </div>
                  ))
                ) : (
                  <div className="text-2xl font-black text-hvac-gold">Priority Tech Match</div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {internalLinks && internalLinks.length > 0 && (
        <section className="mb-20 pt-12 border-t border-slate-200">
          <h2 className="text-center text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Related Authority Nodes</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {internalLinks.map((link: any, idx: number) => (
              <Link 
                key={idx} 
                href={`/${link.target_slug}`} 
                className="text-xs font-medium border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors"
              >
                {link.anchor_text}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
