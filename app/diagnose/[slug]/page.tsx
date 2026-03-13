import { SYMPTOMS } from "@/data/knowledge-graph";
import { getDiagnosticSteps, getCauseDetails, getSymptomWithCausesFromDB } from "@/lib/diagnostic-engine";
import { getRelatedContent, getInternalLinksForPage } from "@/lib/seo-linking";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import Link from "next/link";
import { notFound } from "next/navigation";

// Enable ISR
export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  // Merge JSON and DB candidates if possible
  // For now, we use the JSON as the source of truth for build-time routes
  return SYMPTOMS.map((s) => ({
    slug: s.id,
  }));
}

export default async function SymptomPage({ params }: { params: { slug: string } }) {
  // Hybrid Fetching: Try Supabase first, fallback to JSON
  let symptomData = await getSymptomWithCausesFromDB(params.slug);
  let isFromDB = !!symptomData;

  // Fallback to local knowledge graph if DB is empty or connection fails
  if (!symptomData) {
    symptomData = SYMPTOMS.find((s) => s.id === params.slug) as any;
  }

  const symptom = symptomData as any;

  if (!symptom) {
    notFound();
  }

  // Content processing
  const causeIds = isFromDB 
    ? (symptom.causes?.map((c: any) => c.id) || [])
    : (symptom.causes || []);
    
  const diagnosticSteps = getDiagnosticSteps(causeIds);
  const relatedContent = getRelatedContent(symptomData);
  const internalLinks = await getInternalLinksForPage(params.slug);

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
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy leading-tight">
          {symptom.name}: Professional HVAC Diagnostic Guide
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-4 font-normal leading-relaxed">
          {symptom.description} Follow this technical repair manual to identify the root cause and find the correct repair solution.
        </p>
      </section>

      {/* Internal Links Cluster (SEO Flywheel) */}
      {internalLinks.length > 0 && (
        <section className="mb-12 flex flex-wrap gap-3">
          {internalLinks.map((link, idx) => (
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
          <ul className="grid md:grid-cols-2 gap-4 mt-4">
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
              <li key={cause.id} className="relative pl-12 before:content-[attr(data-step)] before:absolute before:left-0 before:top-0 before:w-8 before:h-8 before:bg-hvac-navy before:text-white before:rounded-full before:flex before:items-center before:justify-center before:font-bold border-b border-slate-100 dark:border-slate-800 pb-12 last:border-0">
                <h3 className="text-xl font-bold text-hvac-navy">{cause.name}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400 italic">"{cause.explanation}"</p>
                
                <div className="mt-6 bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-lg">
                  <span className="text-xs font-bold uppercase tracking-widest text-hvac-blue">Verified Repair Path</span>
                  <ul className="mt-4 space-y-3">
                    {cause.repairDetails.map((repair: any) => (
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
          <h2 className="text-lg text-white m-0">Diagnostic Workflow (Manual Extract)</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {diagnosticSteps.map((step, idx) => (
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

      <div className="grid md:grid-cols-3 gap-12 mt-20 pt-12 border-t border-slate-200">
        <div className="md:col-span-2">
          <h2 className="mt-0 text-xl font-bold">Topical Authority Exploration</h2>
          <div className="grid md:grid-cols-2 gap-8 mt-6">
            <div>
              <h4 className="font-bold text-hvac-navy text-xs uppercase tracking-widest mb-4">Related Diagnostics</h4>
              <ul className="space-y-2">
                {relatedContent.relatedSymptoms.map(s => (
                  <li key={s.id}>
                    <Link href={`/diagnose/${s.id}`} className="text-hvac-blue hover:underline text-sm font-medium">
                      {s.name} Manual
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-hvac-navy text-xs uppercase tracking-widest mb-4">System Components</h4>
              <ul className="space-y-2">
                {relatedContent.relatedComponents.map((c: any) => (
                  <li key={c} className="text-gray-500 text-sm capitalize flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    {c} Engineering
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="md:col-span-1">
          <LeadCaptureForm symptomId={symptom.id} />
        </div>
      </div>
    </div>
  );
}
