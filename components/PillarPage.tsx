import Link from "next/link";
import { getClustersForPillar } from "@/lib/clusters";

interface PillarPageProps {
  slug: string;
  name: string;
  description: string;
}

export default function PillarPage({ slug, name, description }: PillarPageProps) {
  const clusters = getClustersForPillar(slug);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="max-w-4xl mx-auto px-4 py-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/hvac" className="hover:text-hvac-blue">HVAC Systems</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{name}</span>
      </nav>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="inline-block bg-hvac-gold/10 text-hvac-gold text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          Pillar
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight mb-6">
          {name}
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed mb-12">
          {description}
        </p>

        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-6">
          Problem Clusters
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {clusters.map((cluster) => (
            <Link
              key={cluster.slug}
              href={`/cluster/${cluster.slug}`}
              className="block p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-hvac-blue hover:shadow-xl transition-all"
            >
              <h3 className="text-xl font-bold text-hvac-navy dark:text-white mb-3">
                {cluster.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-4">
                {cluster.description}
              </p>
              <span className="text-xs font-bold text-hvac-blue uppercase tracking-wider">
                View Symptoms →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
