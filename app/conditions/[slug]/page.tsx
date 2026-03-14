import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCondition,
  getCauseDetailsForCondition,
  getConditionsForSymptom,
  getDiagnosticTestsForCause,
  CONDITIONS,
} from "@/lib/conditions";
import { getClusterForSymptom } from "@/lib/clusters";
import { SYMPTOMS } from "@/data/knowledge-graph";

export const revalidate = 3600;

export async function generateStaticParams() {
  return CONDITIONS.map((c) => ({ slug: c.slug }));
}

export default async function ConditionPage({ params }: { params: { slug: string } }) {
  const condition = getCondition(params.slug);

  if (!condition) {
    notFound();
  }

  const causes = getCauseDetailsForCondition(condition);
  const symptom = SYMPTOMS.find((s) => s.id === condition.symptomId);
  const cluster = getClusterForSymptom(condition.symptomId);
  const siblingConditions = getConditionsForSymptom(condition.symptomId).filter(
    (c) => c.slug !== condition.slug
  );

  // Collect unique repairs and components for linking
  const allRepairs = causes.flatMap((c: any) => c.repairDetails || []);
  const uniqueRepairs = Array.from(
    new Map(allRepairs.map((r: any) => [r.id || r.slug, r])).values()
  );
  const componentSlugs = Array.from(new Set(uniqueRepairs.map((r: any) => r.component?.replace(/\s+/g, "-")).filter(Boolean)));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="max-w-4xl mx-auto px-4 py-4 text-sm text-gray-500">
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
        <Link href={`/diagnose/${condition.symptomId}`} className="hover:text-hvac-blue">
          {symptom?.name || "Symptom"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{condition.name}</span>
      </nav>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="inline-block bg-hvac-gold/10 text-hvac-gold text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          Condition
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight mb-6">
          {condition.name}
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed mb-12">
          {condition.description}
        </p>

        {/* Possible Causes */}
        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-6">
          Possible Causes
        </h2>
        <div className="space-y-8 mb-16">
          {causes.map((cause: any) => {
            const diagnosticTests = getDiagnosticTestsForCause(condition.symptomId, cause.id || cause.slug);
            return (
              <div
                key={cause.id}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <Link
                  href={`/cause/${cause.id}`}
                  className="block group"
                >
                  <h3 className="font-bold text-hvac-navy dark:text-white mb-2 group-hover:text-hvac-blue transition-colors">
                    {cause.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {cause.explanation}
                  </p>
                  <span className="text-xs font-bold text-hvac-blue uppercase tracking-wider">
                    Root Cause Analysis →
                  </span>
                </Link>

                {diagnosticTests.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Diagnostic Tests
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      {diagnosticTests.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {cause.repairDetails?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Repair Options
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cause.repairDetails.map((repair: any) => (
                        <Link
                          key={repair.id}
                          href={`/fix/${repair.id}`}
                          className="text-sm font-medium text-hvac-blue hover:underline"
                        >
                          {repair.name} →
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Repair Options Summary */}
        {uniqueRepairs.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-6">
              Repair Options
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {uniqueRepairs.slice(0, 6).map((repair: any) => (
                <Link
                  key={repair.id}
                  href={`/fix/${repair.id}`}
                  className="block p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-hvac-blue transition-colors"
                >
                  <span className="font-medium text-hvac-navy dark:text-white">{repair.name}</span>
                  <span className="block text-xs text-slate-500 mt-1">View Repair Manual →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Components / Parts */}
        {componentSlugs.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-6">
              Related Components & Parts
            </h2>
            <div className="flex flex-wrap gap-3">
              {componentSlugs.slice(0, 8).map((slug) => (
                <Link
                  key={slug}
                  href={`/components/${slug}`}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-hvac-blue transition-colors capitalize"
                >
                  {slug.replace(/-/g, " ")}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sibling Conditions */}
        {siblingConditions.length > 0 && (
          <div className="pt-12 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
              Other {symptom?.name || "Symptom"} Conditions
            </h3>
            <div className="flex flex-wrap gap-3">
              {siblingConditions.map((c) => (
                <Link
                  key={c.slug}
                  href={`/conditions/${c.slug}`}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-hvac-blue transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Symptom */}
        <div className="mt-12 pt-8 flex flex-wrap gap-4">
          <Link
            href={`/diagnose/${condition.symptomId}`}
            className="inline-flex items-center gap-2 text-hvac-blue font-bold hover:underline"
          >
            ← Back to {symptom?.name || "Symptom"} Diagnostic
          </Link>
          <Link href="/repair" className="inline-flex items-center gap-2 text-hvac-blue font-bold hover:underline">
            All Repair Guides →
          </Link>
        </div>
      </section>
    </div>
  );
}
