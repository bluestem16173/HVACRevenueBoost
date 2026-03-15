import Link from "next/link";
import FastAnswer from "@/components/FastAnswer";
import ThirtySecondSummary from "@/components/ThirtySecondSummary";
import InteractiveDiagnosticTree from "@/components/InteractiveDiagnosticTree";
import { getConditionsForSymptom } from "@/lib/conditions";
import { getClusterForSymptom } from "@/lib/clusters";

export default function SymptomPageTemplate({
  symptom,
  causeIds,
  causeDetails,
  diagnosticSteps,
  relatedContent,
  internalLinks,
  relatedLinks,
  tools,
  getCauseDetails,
  htmlContent
}: any) {
  // Use causeDetails when passed (DB), otherwise resolve from causeIds (static KG)
  const fullCauses = causeDetails?.length > 0
    ? causeDetails
    : (causeIds || []).map((id: string) => getCauseDetails(id)).filter(Boolean);
  const firstCause = fullCauses[0] || null;

  const fastAnswerText = firstCause
    ? `Likely caused by ${firstCause.name}. ${firstCause.explanation || ""}`
    : symptom.description;

  const summaryPoints = [
    { label: "Core Symptom", value: symptom.name },
    { label: "Primary Cause", value: firstCause?.name || "System Analysis Required" },
    { label: "Repair Level", value: firstCause?.repairDetails?.[0]?.estimatedCost || "Variable" },
    { label: "Urgency", value: "Moderate to High" }
  ];

  // Generate JSON-LD Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": `${symptom.name}: Professional HVAC Diagnostic Guide`,
    "description": fastAnswerText,
    "proficiencyLevel": "Expert",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://hvacrevenueboost.com/diagnose/${symptom.id}`
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": fullCauses.map((c: any) => ({
      "@type": "Question",
      "name": `Can a ${c.name.toLowerCase()} cause ${symptom.name.toLowerCase()}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": c.explanation
      }
    }))
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      {/* breadcrumbs */}
      {(() => {
        const cluster = getClusterForSymptom(symptom.id);
        return (
          <nav className="text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-hvac-blue">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/hvac" className="hover:text-hvac-blue">HVAC Systems</Link>
            <span className="mx-2">/</span>
            {cluster ? (
              <>
                <Link href={`/${cluster.pillarSlug}`} className="hover:text-hvac-blue">
                  {cluster.pillarSlug.replace("hvac-", "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Link>
                <span className="mx-2">/</span>
                <Link href={`/cluster/${cluster.slug}`} className="hover:text-hvac-blue">
                  {cluster.name}
                </Link>
                <span className="mx-2">/</span>
              </>
            ) : (
              <Link href="/diagnose" className="hover:text-hvac-blue">Diagnostics</Link>
            )}
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-white font-medium">{symptom.name}</span>
          </nav>
        );
      })()}

      {/* STEP 1: Problem Statement & Above-the-Fold Conversion */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-hvac-blue bg-blue-50/50 w-fit px-3 py-1.5 rounded-full border border-blue-100">
          <span className="text-green-600">✔</span> Reviewed by Certified HVAC Technicians
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy leading-tight">
          {symptom.name}: Professional HVAC Diagnostic Guide
        </h1>

        {/* Multi-Query Search Variations SEO Block */}
        {symptom.query_variations && symptom.query_variations.length >= 2 && (
          <div className="mt-4 text-gray-600 text-lg leading-relaxed">
            If your <strong>{symptom.query_variations[0]}</strong> or <strong>{symptom.query_variations[1]}</strong>, the issue may be related to {symptom.name.toLowerCase()}. 
            Homeowners also notice this when <strong>{symptom.query_variations[2] || 'the system malfunctions'}</strong> or <strong>{symptom.query_variations[3] || 'cooling drops'}</strong>.
          </div>
        )}
        
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-hvac-gold rounded-r-lg">
          <p className="m-0 text-yellow-900 dark:text-yellow-200 font-medium">
            <strong>Most Common Cause:</strong> {firstCause?.name || "Dirty Air Filter (40-50% of cases)"}. {firstCause?.explanation?.substring(0, 100)}...
          </p>
        </div>

        {/* Action Strip CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <a 
            href="#diagnostics" 
            className="flex-1 bg-white border-2 border-hvac-navy text-hvac-navy hover:bg-slate-50 text-center py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2"
          >
            Diagnose the Problem ↓
          </a>
          <button 
            data-open-lead-modal
            className="flex-1 bg-hvac-blue hover:bg-blue-700 text-white text-center py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-md transition-colors flex items-center justify-center gap-2"
          >
            Get Local HVAC Repair →
          </button>
        </div>
      </section>

      {htmlContent ? (
        <div className="prose max-w-none w-full" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      ) : (
        <>
          {/* STEP 2: Quick Fix Section (High Engagement) */}
          <section className="mb-12 bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 shadow-sm" id="quick-fix">
        <h2 className="text-2xl font-black text-hvac-navy mb-6 m-0 border-0 flex items-center gap-2">
          <span>⚡</span> Quick Fixes to Try First
        </h2>
        <ol className="grid md:grid-cols-2 gap-4 list-none p-0 m-0 mb-8">
          <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
            <span className="bg-hvac-gold text-hvac-navy w-6 h-6 flex items-center justify-center rounded-full text-sm font-black p-0">1</span> 
            Verify thermostat is set to cool
          </li>
          <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
            <span className="bg-hvac-gold text-hvac-navy w-6 h-6 flex items-center justify-center rounded-full text-sm font-black p-0">2</span> 
            Replace dirty air filter
          </li>
          <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
            <span className="bg-hvac-gold text-hvac-navy w-6 h-6 flex items-center justify-center rounded-full text-sm font-black p-0">3</span> 
            Reset HVAC breaker
          </li>
          <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
            <span className="bg-hvac-gold text-hvac-navy w-6 h-6 flex items-center justify-center rounded-full text-sm font-black p-0">4</span> 
            Check outdoor condenser coil
          </li>
        </ol>
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-bold text-hvac-navy dark:text-white m-0">Still having the problem?</p>
          <button data-open-lead-modal className="bg-hvac-navy text-white hover:bg-slate-800 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-colors w-full sm:w-auto shadow-md">
            Get Local HVAC Help →
          </button>
        </div>
      </section>

      {/* STEP 3: Interactive Diagnostic Tree */}
      <section className="mb-16 mt-8" id="diagnostics">
        <InteractiveDiagnosticTree symptomName={symptom.name} causes={fullCauses} />
      </section>

      {/* Condition Links (Symptom → Condition pathway) */}
      {(() => {
        const conditions = getConditionsForSymptom(symptom.id);
        if (conditions.length === 0) return null;
        return (
          <section className="mb-12">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Narrow Your Diagnosis</h3>
            <div className="flex flex-wrap gap-3">
              {conditions.map((c) => (
                <Link
                  key={c.slug}
                  href={`/conditions/${c.slug}`}
                  className="text-xs font-bold uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded text-hvac-blue hover:bg-hvac-blue hover:text-white transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Related Problems (Phase 16) */}
      {relatedLinks?.length > 0 && (
        <section className="mb-12">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Related Problems</h3>
          <div className="flex flex-wrap gap-3">
            {relatedLinks.slice(0, 8).map((link: any, idx: number) => (
              <Link
                key={idx}
                href={link.slug}
                className="text-xs font-bold uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded text-hvac-blue hover:bg-hvac-blue hover:text-white transition-colors"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Internal Links Cluster */}
      {internalLinks?.length > 0 && (
        <section className="mb-12 flex flex-wrap gap-3">
          {internalLinks.map((link: any, idx: number) => (
            <Link 
              key={idx} 
              href={`/${link.target_slug}`} 
              className="text-xs font-bold uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-hvac-blue hover:bg-hvac-blue hover:text-white transition-colors"
            >
              {link.anchor_text}
            </Link>
          ))}
        </section>
      )}

      {/* STEP 4: Signs Your HVAC System Has This Problem */}
      <section className="mb-16">
        <div className="bg-slate-50 dark:bg-slate-900 border-l-4 border-hvac-safety p-6 rounded-r-lg mb-8">
          <h2 className="mt-0 text-hvac-navy text-2xl font-black">Signs Your HVAC System Has This Problem</h2>
          <ul className="grid md:grid-cols-2 gap-4 mt-4 list-none p-0">
            <li className="flex items-start gap-2 text-sm">
              <span className="text-hvac-safety">●</span> Unusual noises from the outdoor unit
            </li>
            <li className="flex items-start gap-2 text-sm">
              <span className="text-hvac-safety">●</span> Thermostat displays matching temperature but no cooling
            </li>
            <li className="flex items-start gap-2 text-sm">
              <span className="text-hvac-safety">●</span> Rapid cycling (turning on and off frequently)
            </li>
            <li className="flex items-start gap-2 text-sm">
              <span className="text-hvac-safety">●</span> Significant increase in monthly utility bills
            </li>
          </ul>
        </div>

      {/* STEP 5: Diagnostic Steps */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="bg-hvac-navy text-white px-6 py-4">
            <h2 className="text-lg text-white m-0 border-0">Diagnostic Workflow (Manual Extract)</h2>
          </div>
          {htmlContent ? (
            <div className="p-6">
              <div 
                className="prose prose-slate max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {diagnosticSteps.map((step: any, idx: number) => (
                <div key={idx} className="p-6 flex gap-6">
                  <div className="text-2xl font-black text-slate-200">{idx + 1}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-hvac-navy mb-1">{step.step}</h4>
                    <p className="text-gray-600 m-0 leading-snug text-sm">{step.action}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* STEP 6: Common Causes & Repairs */}
      <section className="mb-16">
        <h2 className="text-3xl font-black mb-6 border-0">Common Causes & Possible Fixes</h2>
        
        <ol className="cause-list space-y-12 list-none p-0">
          {fullCauses.map((cause: any, idx: number) => {
            if (!cause) return null;
            return (
              <li key={cause.id || cause.slug || idx} className="relative pl-12 border-b border-slate-100 dark:border-slate-800 pb-12 last:border-0">
                <Link href={`/cause/${cause.slug || cause.id}`} className="hover:opacity-80 transition-opacity block w-fit">
                  <h3 className="text-xl font-bold text-hvac-navy mt-0">{cause.name}</h3>
                </Link>
                <p className="mt-2 text-gray-600 dark:text-gray-400 italic">&quot;{cause.explanation}&quot;</p>
                <Link href={`/cause/${cause.slug}`} className="text-xs font-bold text-hvac-blue hover:text-hvac-navy uppercase tracking-widest mt-3 inline-block">
                  Read Full Diagnostic Analysis →
                </Link>
                
                <div className="mt-6 bg-blue-50/30 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-black uppercase tracking-widest text-hvac-blue bg-white dark:bg-slate-800 px-3 py-1 rounded shadow-sm">Verified Repair Path</span>
                  </div>
                  
                  {cause.repairDetails?.length > 0 ? (
                    <div className="grid gap-3">
                      {cause.repairDetails.map((repair: any) => (
                        <Link 
                          href={`/fix/${repair.slug}`} 
                          key={repair.id} 
                          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-hvac-blue hover:shadow-md transition-all"
                        >
                          <div className="flex-1">
                            <h4 className="text-hvac-navy font-black m-0 group-hover:text-hvac-blue transition-colors flex items-center gap-2">
                              {repair.name} <span className="opacity-0 group-hover:opacity-100 text-xs transition-opacity">→</span >
                            </h4>
                            <p className="text-xs text-gray-500 font-medium m-0 mt-1 line-clamp-1">{repair.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Est. Cost:</span>
                            <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-md ${
                              repair.estimatedCost === 'low' ? 'bg-green-100 text-green-700 border border-green-200' : 
                              repair.estimatedCost === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                              'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              {repair.estimatedCost === 'low' ? '$50 - $150' : 
                               repair.estimatedCost === 'medium' ? '$150 - $450' : 
                               '$450+'}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic mt-2 m-0">No standardized repairs mapped yet.</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* STEP 7: Cost Estimates */}
      <section className="mb-16">
        <h2 className="text-3xl font-black mb-6 border-0">Typical Repair Costs</h2>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Repair</th>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-right">Typical Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {fullCauses.flatMap((c: any) => c.repairDetails || []).map((repair: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-medium text-hvac-navy dark:text-slate-200">{repair.name}</td>
                  <td className="p-4 text-right font-bold text-gray-700 dark:text-gray-300">
                    {repair.estimatedCost === 'low' ? '$150 - $400' : 
                     repair.estimatedCost === 'medium' ? '$400 - $800' : 
                     '$800 - $1,500+'}
                  </td>
                </tr>
              ))}
              {(!fullCauses.some((c: any) => c.repairDetails?.length > 0)) && (
                <tr>
                  <td className="p-4 font-medium text-slate-500 italic" colSpan={2}>
                    Diagnostics required for accurate repair cost.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
             <p className="text-sm font-bold m-0 text-slate-600 dark:text-slate-400">Not sure what's broken?</p>
             <button data-open-lead-modal className="w-full md:w-auto bg-hvac-navy text-white hover:bg-slate-800 font-black px-6 py-3 rounded-lg uppercase tracking-widest text-sm transition-colors shadow-sm">
               Get Local Repair Quotes →
             </button>
          </div>
        </div>
      </section>

      {/* STEP 8: DIY Parts / Tools (Amazon) */}
      <section className="mb-16 bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-3xl font-black mb-2 border-0">Recommended DIY Parts & Tools</h2>
        <p className="text-gray-600 mb-8">
          If you plan to execute the repairs above yourself, these are the industry-standard tools and common replacement parts required.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {tools && tools.length > 0 ? (
            tools.map((tool: any) => (
              <div key={tool.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
                <h4 className="font-bold text-hvac-navy text-lg m-0">{tool.name}</h4>
                <p className="text-sm text-gray-500 mt-2 flex-grow">{tool.description}</p>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                  <Link href={`/tools/${tool.slug}`} className="text-xs font-bold text-hvac-navy uppercase hover:underline">
                    View Guide
                  </Link>
                  <a href={tool.affiliate_link || "#amazon"} className="text-xs font-bold text-green-600 uppercase hover:underline ml-auto flex items-center gap-1">
                    Check Price on Amazon <span>↗</span>
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-6 text-gray-500 text-sm">
              No specific tools loaded for this diagnostic block. General Multimeter recommended.
            </div>
          )}
        </div>
      </section>

      {/* STEP 9: When to Call an HVAC Technician */}
      <section className="mb-16">
        <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-2xl border-2 border-red-200 dark:border-red-900/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-black text-2xl border border-red-200">
              !
            </div>
            <div>
              <h2 className="text-2xl font-black text-red-900 dark:text-red-400 m-0 border-0">When to Call an HVAC Technician</h2>
              <span className="text-[10px] uppercase font-bold tracking-widest text-red-700">Safety Threshold Warning</span>
            </div>
          </div>
          
          <p className="text-red-800 dark:text-red-300 font-medium leading-relaxed mt-6">
            While basic maintenance like filter changes and drain cleaning are highly encourage for homeowners, HVAC systems operate on <strong>high-voltage electricity (240V)</strong> and pressurized chemical refrigerants.
          </p>
          
          <ul className="mt-6 space-y-3 list-none p-0">
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-black">1.</span>
              <span className="text-sm text-red-900 dark:text-red-200"><strong>Electrical Risk:</strong> If a repair involves checking contactors, capacitors, or control boards and you are not trained in capacitor discharge or LOTO (Lockout/Tagout) procedures.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-black">2.</span>
              <span className="text-sm text-red-900 dark:text-red-200"><strong>Refrigerant Handling:</strong> It is federally illegal (EPA Section 608) to vent or handle refrigerants without a license. If you suspect a leak, stop immediately.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-black">3.</span>
              <span className="text-sm text-red-900 dark:text-red-200"><strong>Gas Appliances:</strong> Never attempt to modify furnace gas valves or heat exchangers due to carbon monoxide and explosion risks.</span>
            </li>
          </ul>
          <div className="mt-8 pt-6 border-t border-red-200 dark:border-red-900/30">
            <button data-open-lead-modal className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-black px-8 py-4 rounded-xl uppercase tracking-widest text-sm transition-colors shadow-md">
              Find Local HVAC Repair →
            </button>
          </div>
        </div>
      </section>

      {/* STEP 10: Lead Capture CTA */}
      <section className="mb-16" id="get-quote">
        <div className="bg-hvac-navy text-white p-10 md:p-14 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-hvac-blue opacity-20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
          
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black m-0 border-0 leading-tight text-white mb-6">
              Get Local HVAC Repair Help
            </h2>
            <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-8">
              Don't let {symptom.name.toLowerCase()} turn into a catastrophic compressor failure. Our network of licensed local professionals can fix it today.
            </p>
            <button data-open-lead-modal className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-10 py-5 rounded-2xl uppercase tracking-widest text-lg transition-transform hover:scale-105 shadow-xl w-full sm:w-auto">
              Request Repair Quote
            </button>
          </div>
        </div>
      </section>

      {/* STEP 11: Related HVAC Problems */}
      {relatedContent?.relatedSymptoms?.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-black mb-6 border-0">Related HVAC Problems</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {relatedContent.relatedSymptoms.slice(0, 4).map((s: any) => (
              <Link 
                key={s.id} 
                href={`/diagnose/${s.id}`} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl hover:border-hvac-blue hover:shadow-md transition-all group"
              >
                <h4 className="font-bold text-hvac-navy dark:text-white m-0 group-hover:text-hvac-blue transition-colors line-clamp-2">
                  {s.name}
                </h4>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* STEP 12: Frequency Asked Questions */}
      <section className="mb-16">
        <h2 className="text-3xl font-black mb-8 border-0">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {fullCauses.map((c: any) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold text-hvac-navy dark:text-white m-0">Can a {c.name.toLowerCase()} cause {symptom.name.toLowerCase()}?</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-3 m-0 leading-relaxed">
                Yes. {c.explanation} If you suspect this is the case, <button data-open-lead-modal className="text-hvac-blue hover:underline font-bold inline">get a professional diagnostic</button> to confirm before replacing parts.
              </p>
            </div>
          ))}
        </div>
      </section>
      </>
      )}
    </div>
  );
}
