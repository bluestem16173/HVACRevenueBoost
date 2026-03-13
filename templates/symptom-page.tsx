import Link from "next/link";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import FastAnswer from "@/components/FastAnswer";
import ThirtySecondSummary from "@/components/ThirtySecondSummary";
import DiagnosticFlowchart from "@/components/DiagnosticFlowchart";

export default function SymptomPageTemplate({
  symptom,
  causeIds,
  diagnosticSteps,
  relatedContent,
  internalLinks,
  tools,
  getCauseDetails
}: any) {
  // Extract a "Fast Answer" from the description or first cause
  const firstCause = causeIds.length > 0 ? getCauseDetails(causeIds[0]) : null;
  const fastAnswerText = firstCause 
    ? `Likely caused by ${firstCause.name}. ${firstCause.explanation}`
    : symptom.description;

  const summaryPoints = [
    { label: "Core Symptom", value: symptom.name },
    { label: "Primary Cause", value: firstCause?.name || "System Analysis Required" },
    { label: "Repair Level", value: firstCause?.repairDetails?.[0]?.estimatedCost || "Variable" },
    { label: "Urgency", value: "Moderate to High" }
  ];

  // Map cause details for the flowchart
  const fullCauses = causeIds.map((id: string) => getCauseDetails(id)).filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* breadcrumbs */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/diagnose" className="hover:text-hvac-blue">Diagnostics</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{symptom.name}</span>
      </nav>

      {/* STEP 1: Problem Statement & Summary */}
      <section className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy leading-tight">
          {symptom.name}: Professional HVAC Diagnostic Guide
        </h1>
      </section>

      <FastAnswer answer={fastAnswerText} />
      <ThirtySecondSummary points={summaryPoints} />

      {/* STEP 2: Causes (Mermaid Flowchart) */}
      <DiagnosticFlowchart symptomName={symptom.name} causes={fullCauses} />

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

      {/* STEP 3: Diagnostics */}
      <section className="mb-16">
        <div className="bg-slate-50 dark:bg-slate-900 border-l-4 border-hvac-safety p-6 rounded-r-lg mb-8">
          <h2 className="mt-0 text-hvac-navy">Signs Your HVAC System Has This Problem</h2>
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

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="bg-hvac-navy text-white px-6 py-4">
            <h2 className="text-lg text-white m-0 border-0">Diagnostic Workflow (Manual Extract)</h2>
          </div>
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
        </div>
      </section>

      {/* STEP 4: Possible Fixes */}
      <section className="mb-16">
        <h2 className="text-3xl font-black mb-6 border-0">Common Causes & Possible Fixes</h2>
        
        <ol className="cause-list space-y-12 list-none p-0">
          {causeIds.map((causeId: string) => {
            const cause = getCauseDetails(causeId);
            if (!cause) return null;
            return (
              <li key={cause.id} className="relative pl-12 border-b border-slate-100 dark:border-slate-800 pb-12 last:border-0">
                <Link href={`/cause/${cause.slug}`} className="hover:opacity-80 transition-opacity block w-fit">
                  <h3 className="text-xl font-bold text-hvac-navy mt-0">{cause.name}</h3>
                </Link>
                <p className="mt-2 text-gray-600 dark:text-gray-400 italic">"{cause.explanation}"</p>
                <Link href={`/cause/${cause.slug}`} className="text-xs font-bold text-hvac-blue hover:text-hvac-navy uppercase tracking-widest mt-3 inline-block">
                  Read Full Diagnostic Analysis →
                </Link>
                
                <div className="mt-6 bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-lg">
                  <span className="text-xs font-bold uppercase tracking-widest text-hvac-blue">Verified Repair Path</span>
                  <ul className="mt-4 space-y-3 p-0 list-none">
                    {cause.repairDetails?.map((repair: any) => (
                      <li key={repair.id} className="flex flex-col relative pb-3 border-b border-blue-900/10 last:border-0 last:pb-0">
                        <Link href={`/fix/${repair.slug}`} className="text-hvac-navy font-black hover:text-hvac-blue transition-colors">
                          {repair.name} <span className="text-xs font-normal text-hvac-blue underline ml-2">View DIY Manual →</span>
                        </Link>
                        <span className="text-xs text-gray-500 font-normal mt-1">{repair.description}</span>
                        <span className={`text-[10px] mt-2 font-bold uppercase px-2 py-0.5 rounded w-fit ${
                          repair.estimatedCost === 'low' ? 'bg-green-100 text-green-700' : 
                          repair.estimatedCost === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          Cost Estimate: {repair.estimatedCost}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* STEP 5: DIY Parts / Tools (Amazon) */}
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

      {/* STEP 6: When to Call an HVAC Technician */}
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
        </div>
      </section>

      {/* STEP 7: Lead Capture */}
      <section className="mt-16 pt-16 border-t border-slate-200">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-7">
            <h2 className="mt-0 text-3xl font-black border-0 leading-tight">Expert Diagnostic Assistance</h2>
            <p className="text-gray-600 mt-4 leading-relaxed">
              If your system exhibits these symptoms, immediate professional verification is recommended. Our specialized HVAC diagnostic team in your area can confirm the root cause and provide a fixed-price repair estimate.
            </p>
            <div className="grid grid-cols-2 gap-8 mt-12">
              <div>
                <h4 className="font-black text-hvac-navy text-xs uppercase tracking-widest mb-4">Related Diagnostics</h4>
                <ul className="space-y-3 list-none p-0">
                  {relatedContent.relatedSymptoms.map((s: any) => (
                    <li key={s.id}>
                      <Link href={`/diagnose/${s.id}`} className="text-hvac-blue hover:text-hvac-navy text-sm font-bold flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full group-hover:bg-hvac-gold transition-colors"></span>
                        {s.name} Manual
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-black text-hvac-navy text-xs uppercase tracking-widest mb-4">System Components</h4>
                <ul className="space-y-3 list-none p-0">
                  {relatedContent.relatedComponents.map((c: any) => (
                    <li key={c} className="text-slate-500 text-sm capitalize flex items-center gap-2 font-medium">
                      <span className="w-1.5 h-1.5 bg-slate-100 rounded-full"></span>
                      {c} Engineering
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="md:col-span-5">
            <LeadCaptureForm symptomId={symptom.id} />
          </div>
        </div>
      </section>
    </div>
  );
}
