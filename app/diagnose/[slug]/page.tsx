import { SYMPTOMS, CAUSES, REPAIRS } from "@/data/knowledge-graph";
import { getDiagnosticSteps, getCauseDetails } from "@/lib/diagnostic-engine";
import { getRelatedContent } from "@/lib/seo-linking";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return SYMPTOMS.map((s) => ({
    slug: s.id,
  }));
}

export default function SymptomPage({ params }: { params: { slug: string } }) {
  const symptom = SYMPTOMS.find((s) => s.id === params.slug);

  if (!symptom) {
    notFound();
  }

  const diagnosticSteps = getDiagnosticSteps(symptom.causes);
  const related = getRelatedContent(symptom);

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

      <section className="mb-16">
        <h1>{symptom.name}: Professional HVAC Diagnostic Guide</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-4 font-normal leading-relaxed">
          {symptom.description} Follow this technical repair manual to identify the root cause and find the correct repair solution.
        </p>
      </section>

      <section className="mb-16">
        <div className="bg-slate-50 dark:bg-slate-900 border-l-4 border-hvac-safety p-6 rounded-r-lg">
          <h2 className="mt-0 text-hvac-navy">Signs Your HVAC System Has This Problem</h2>
          <ul className="grid md:grid-cols-2 gap-4 mt-4">
            <li className="flex items-start gap-2">
              <span className="text-hvac-safety">●</span> Unusual noises from the outdoor unit
            </li>
            <li className="flex items-start gap-2">
              <span className="text-hvac-safety">●</span> Thermostat displays matching temperature but no cooling
            </li>
            <li className="flex items-start gap-2">
              <span className="text-hvac-safety">●</span> Rapid cycling (turning on and off frequently)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-hvac-safety">●</span> Significant increase in monthly utility bills
            </li>
          </ul>
        </div>
      </section>

      <section className="mb-16">
        <h2>Common Causes & Recommended Repairs</h2>
        <p className="mb-8 text-gray-600">Our diagnostic engine has identified these primary causes for {symptom.name}. Each cause is matched with its specific technical repair path.</p>
        
        <ol className="cause-list">
          {symptom.causes.map((causeId) => {
            const cause = getCauseDetails(causeId);
            if (!cause) return null;
            return (
              <li key={cause.id}>
                <h3>{cause.name}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{cause.explanation}</p>
                
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Deterministic Repairs</span>
                  <ul className="repair-list">
                    {cause.repairDetails.map((repair) => (
                      <li key={repair.id} className="text-hvac-blue font-medium">
                        {repair.name}
                        <span className="ml-2 text-xs text-gray-400 font-normal">({repair.description})</span>
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
          <h2 className="text-lg text-white m-0">How to Diagnose the Problem</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {diagnosticSteps.map((step, idx) => (
            <div key={idx} className="diagnostic-step p-6">
              <div className="step-number">{idx + 1}</div>
              <div className="flex-1">
                <h4 className="font-bold text-hvac-navy mb-1">{step.step}</h4>
                <p className="text-gray-600 m-0 leading-snug">{step.action}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2>Repair Cost Estimates</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="manual-card text-center border-t-4 border-t-green-500">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Minor Repair</span>
            <div className="text-3xl font-black text-hvac-navy mt-2">$150 - $350</div>
            <p className="text-xs mt-2 text-gray-500">Capacitors, cleanings, sensor adjustments</p>
          </div>
          <div className="manual-card text-center border-t-4 border-t-hvac-gold">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Component Replacement</span>
            <div className="text-3xl font-black text-hvac-navy mt-2">$450 - $1,200</div>
            <p className="text-xs mt-2 text-gray-500">Blower motors, control boards, thermostats</p>
          </div>
          <div className="manual-card text-center border-t-4 border-t-hvac-safety">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Major System Repair</span>
            <div className="text-3xl font-black text-hvac-navy mt-2">$1,500+</div>
            <p className="text-xs mt-2 text-gray-500">Compressors, coils, full unit replacement</p>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <div className="bg-blue-50 dark:bg-slate-800/50 p-8 rounded-2xl border border-blue-100 dark:border-blue-900/30">
          <h2 className="mt-0 text-hvac-blue border-0 p-0">When to Call an HVAC Technician</h2>
          <p className="text-gray-700">If you encounter any of the following, stop diagnostics immediately and call a professional:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-600">
            <li>Any smell of burning plastic or electrical ozone</li>
            <li>Sparking or crackling sounds from the electrical panel</li>
            <li>Signs of refrigerant leaks (hissing sounds or oily residue)</li>
            <li>System failure during extreme heat (safety risk)</li>
          </ul>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-12 mt-20 pt-12 border-t border-slate-200">
        <div className="md:col-span-2">
          <h2 className="mt-0">Related {symptom.name} Topics</h2>
          <div className="grid md:grid-cols-2 gap-8 mt-6">
            <div>
              <h4 className="font-bold text-hvac-navy text-xs uppercase tracking-widest mb-4">Related HVAC Problems</h4>
              <ul className="space-y-2">
                {related.relatedSymptoms.map(s => (
                  <li key={s.id}>
                    <Link href={`/diagnose/${s.id}`} className="text-hvac-blue hover:underline text-sm">
                      {s.name} Troubleshooting
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-hvac-navy text-xs uppercase tracking-widest mb-4">Related Components</h4>
              <ul className="space-y-2">
                {related.relatedComponents.map(c => (
                  <li key={c} className="text-gray-600 text-sm capitalize">
                    {c} Engineering & Maintenance
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="md:col-span-1">
          <LeadCaptureForm />
        </div>
      </div>
    </div>
  );
}
