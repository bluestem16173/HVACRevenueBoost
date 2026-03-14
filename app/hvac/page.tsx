import Link from "next/link";
import { SYSTEM_HUBS } from "@/lib/system-hubs";

export const revalidate = 3600;

export default function HVACSystemIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="max-w-4xl mx-auto px-4 py-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/diagnose" className="hover:text-hvac-blue">Diagnostics</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">HVAC Systems</span>
      </nav>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight mb-6">
          HVAC System Pillars
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed mb-12">
          Navigate by system domain to find problem clusters, diagnostic guides, and repair pathways.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {SYSTEM_HUBS.map((hub) => (
            <Link
              key={hub.slug}
              href={`/${hub.slug}`}
              className="block p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-hvac-blue hover:shadow-xl transition-all"
            >
              <h2 className="text-xl font-bold text-hvac-navy dark:text-white mb-3">
                {hub.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">
                {hub.description}
              </p>
              <span className="inline-block mt-4 text-xs font-bold text-hvac-blue uppercase tracking-wider">
                View Clusters →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
