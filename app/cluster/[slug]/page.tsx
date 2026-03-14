import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCluster,
  getSymptomsForCluster,
  getClustersForPillar,
  CLUSTERS,
} from "@/lib/clusters";
import { getConditionsForSymptom } from "@/lib/conditions";

export const revalidate = 3600;

export async function generateStaticParams() {
  return CLUSTERS.map((c) => ({ slug: c.slug }));
}

export default async function ClusterPage({ params }: { params: { slug: string } }) {
  const cluster = getCluster(params.slug);

  if (!cluster) {
    notFound();
  }

  const symptoms = getSymptomsForCluster(cluster);
  const siblingClusters = getClustersForPillar(cluster.pillarSlug).filter(
    (c) => c.slug !== cluster.slug
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="max-w-4xl mx-auto px-4 py-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/${cluster.pillarSlug}`} className="hover:text-hvac-blue">
          {cluster.pillarSlug.replace("hvac-", "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{cluster.name}</span>
      </nav>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="inline-block bg-hvac-blue/10 text-hvac-blue text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          Problem Cluster
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight mb-6">
          {cluster.name}
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed mb-12">
          {cluster.description}
        </p>

        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-6">
          Symptoms in This Cluster
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {symptoms.map((symptom: any) => {
            const conditions = getConditionsForSymptom(symptom.id);
            return (
              <div
                key={symptom.id}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <Link
                  href={`/diagnose/${symptom.id}`}
                  className="block group"
                >
                  <h3 className="font-bold text-hvac-navy dark:text-white mb-2 group-hover:text-hvac-blue transition-colors">
                    {symptom.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-4">
                    {symptom.description}
                  </p>
                  <span className="text-xs font-bold text-hvac-blue uppercase tracking-wider">
                    Full Diagnostic Guide →
                  </span>
                </Link>
                {conditions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Condition Variations
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {conditions.slice(0, 3).map((c) => (
                        <Link
                          key={c.slug}
                          href={`/conditions/${c.slug}`}
                          className="text-xs text-hvac-blue hover:underline"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {siblingClusters.length > 0 && (
          <div className="pt-12 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
              Related Clusters
            </h3>
            <div className="flex flex-wrap gap-3">
              {siblingClusters.map((c) => (
                <Link
                  key={c.slug}
                  href={`/cluster/${c.slug}`}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-hvac-blue transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 pt-8">
          <Link
            href={`/${cluster.pillarSlug}`}
            className="inline-flex items-center gap-2 text-hvac-blue font-bold hover:underline"
          >
            ← Back to {cluster.pillarSlug.replace("hvac-", "").replace(/-/g, " ")}
          </Link>
        </div>
      </section>
    </div>
  );
}
