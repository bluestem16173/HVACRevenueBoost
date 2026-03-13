import Link from "next/link";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import FastAnswer from "@/components/FastAnswer";
import ThirtySecondSummary from "@/components/ThirtySecondSummary";

export default function ServicePageTemplate({ 
  city, 
  symptom, 
  causeIds, 
  diagnosticSteps, 
  internalLinks, 
  localContractors,
  getCauseDetails
}: any) {
  const firstCause = causeIds.length > 0 ? getCauseDetails(causeIds[0]) : null;
  const fastAnswerText = firstCause 
    ? `For homeowners in ${city.name}, ${symptom.name} is frequently caused by ${firstCause.name}. ${firstCause.explanation}`
    : `Technical diagnostic manual for ${symptom.name} specifically for ${city.name} residents.`;

  const summaryPoints = [
    { label: "Location", value: `${city.name}, ${city.state}` },
    { label: "Symptom", value: symptom.name },
    { label: "Avg. Repair Cost", value: firstCause?.repairDetails?.[0]?.estimatedCost || "$150-$450" },
    { label: "Local Response", value: "< 30 Minutes" }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* breadcrumbs */}
      <nav className="text-sm text-gray-500 mb-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/repair" className="hover:text-hvac-blue">Local Repair</Link>
        <span className="mx-2">/</span>
        <span className="capitalize">{city.slug.split('-').join(' ')}</span>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{symptom.name}</span>
      </nav>

      <section className="mb-12">
        <div className="inline-block bg-hvac-gold/10 text-hvac-gold text-xs font-black px-3 py-1 rounded-full mb-4 border border-hvac-gold/20 uppercase tracking-widest">
          {city.name}, {city.state} Localized Guide
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy leading-tight">
          {symptom.name} Repair in {city.name}
        </h1>
      </section>

      <FastAnswer answer={fastAnswerText} />

      <ThirtySecondSummary points={summaryPoints} />

      <div className="grid lg:grid-cols-5 gap-12 mb-16">
        <div className="lg:col-span-3 space-y-12">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="mt-0 text-hvac-navy border-0">Technical Root Causes</h2>
            <div className="space-y-8 mt-8">
              {causeIds.map((causeId: string, idx: number) => {
                const cause = getCauseDetails(causeId);
                if (!cause) return null;
                return (
                  <div key={idx} className="border-b border-slate-100 last:border-0 pb-8 last:pb-0">
                    <h4 className="font-bold text-hvac-blue m-0 text-lg flex items-center gap-2">
                       <span className="text-slate-300">0{idx+1}</span> {cause.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-2 leading-snug">{cause.explanation}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-hvac-navy">Quick {city.name} Diagnostic Steps</h2>
            <div className="manual-grid mt-6">
              {diagnosticSteps.slice(0, 4).map((step: any, idx: number) => (
                <div key={idx} className="p-5 border border-slate-100 dark:border-slate-800 rounded-lg">
                  <div className="text-xs font-black text-hvac-blue uppercase mb-1">Step {idx+1}</div>
                  <h5 className="font-bold m-0 leading-tight mb-2">{step.step}</h5>
                  <p className="text-xs text-gray-500 m-0">{step.action}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-2">
          <div className="sticky top-24">
            <LeadCaptureForm city={city.name} symptomId={symptom.id} />
            
            <div className="mt-8 p-8 bg-hvac-navy text-white rounded-2xl shadow-xl border-b-8 border-hvac-gold border-r-8 border-hvac-gold/10">
              <h4 className="text-white m-0 text-lg font-black uppercase tracking-widest leading-none">Local Service Hub</h4>
              <p className="text-[10px] text-blue-300 mt-3 mb-8 uppercase tracking-[0.2em] font-bold">Immediate HVAC assistance for {city.name}</p>
              
              <div className="space-y-6">
                {localContractors.length > 0 ? (
                  localContractors.map((contractor: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-hvac-gold/30 pl-6 py-2 bg-white/5 rounded-r-xl">
                      <div className="text-sm font-black text-white">{contractor.company_name}</div>
                      <div className="text-[10px] text-hvac-gold uppercase tracking-widest mt-1">{contractor.trade} • {city.name} Certified</div>
                    </div>
                  ))
                ) : (
                  <div className="text-3xl font-black text-hvac-gold leading-none tracking-tighter">24/7 Priority Repair Available</div>
                )}
              </div>

              <div className="mt-10 pt-6 border-t border-white/10 text-[10px] text-blue-200 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Verified Techs in {city.name}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {internalLinks.length > 0 && (
        <section className="mb-20 pt-12 border-t border-slate-200">
          <h2 className="text-center text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Crawl Accelerator Index</h2>
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
