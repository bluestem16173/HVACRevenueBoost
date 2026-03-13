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

      <section className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy leading-tight">
          {symptom.name}: Professional HVAC Diagnostic Guide
        </h1>
      </section>

      <FastAnswer answer={fastAnswerText} />
      
      <ThirtySecondSummary points={summaryPoints} />

      <DiagnosticFlowchart symptomName={symptom.name} causes={fullCauses} />

      {/* Internal Links Cluster (SEO Flywheel) */}
      {internalLinks.length > 0 && (
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

      <section className="mb-16">
        <div className="bg-slate-50 dark:bg-slate-900 border-l-4 border-hvac-safety p-6 rounded-r-lg">
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
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Common Causes & Recommended Repairs</h2>
        
        <ol className="cause-list space-y-12 list-none p-0">
          {causeIds.map((causeId: string) => {
            const cause = getCauseDetails(causeId);
            if (!cause) return null;
            return (
              <li key={cause.id} className="relative pl-12 border-b border-slate-100 dark:border-slate-800 pb-12 last:border-0">
                <h3 className="text-xl font-bold text-hvac-navy">{cause.name}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400 italic">"{cause.explanation}"</p>
                
                <div className="mt-6 bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-lg">
                  <span className="text-xs font-bold uppercase tracking-widest text-hvac-blue">Verified Repair Path</span>
                  <ul className="mt-4 space-y-3 p-0 list-none">
                    {cause.repairDetails?.map((repair: any) => (
                      <li key={repair.id} className="flex flex-col">
                        <span className="text-hvac-navy font-bold">{repair.name}</span>
                        <span className="text-xs text-gray-500 font-normal">{repair.description}</span>
                        <span className={`text-[10px] mt-1 font-bold uppercase px-2 py-0.5 rounded w-fit ${
                          repair.estimatedCost === 'low' ? 'bg-green-100 text-green-700' : 
                          repair.estimatedCost === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          Cost: {repair.estimatedCost}
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

      <section className="mb-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
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
      </section>

      <section className="mt-24 pt-24 border-t border-slate-200">
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
