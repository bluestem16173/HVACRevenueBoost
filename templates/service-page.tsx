import Link from "next/link";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import FastAnswer from "@/components/FastAnswer";

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

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="md:col-span-2 space-y-12">
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

        <aside className="md:col-span-1">
          <div className="sticky top-24">
            <LeadCaptureForm city={city.name} symptomId={symptom.id} />
            
            <div className="mt-8 p-6 bg-hvac-navy text-white rounded-xl shadow-lg border-b-4 border-hvac-gold">
              <h4 className="text-white m-0 text-sm font-bold uppercase tracking-widest">Local Service Hub</h4>
              <p className="text-xs text-blue-100 mt-2 mb-6">Immediate HVAC assistance available for {city.name} residents.</p>
              
              <div className="space-y-4">
                {localContractors.length > 0 ? (
                  localContractors.map((contractor: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-hvac-gold/50 pl-4 py-1">
                      <div className="text-sm font-bold text-white">{contractor.company_name}</div>
                      <div className="text-[10px] text-blue-200 uppercase tracking-tighter">{contractor.trade} • {city.name} Certified</div>
                    </div>
                  ))
                ) : (
                  <div className="text-2xl font-black text-hvac-gold">24/7 Priority Repair</div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 text-xs text-blue-200">
                Verified Techs in {city.name} • Licensed & Insured • Fast Response
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
