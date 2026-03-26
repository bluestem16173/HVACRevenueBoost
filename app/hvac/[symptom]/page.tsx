import Link from "next/link";
import { notFound } from "next/navigation";
import { getSystemHub, getSymptomsForHub, SYSTEM_HUBS } from "@/lib/system-hubs";

export const revalidate = 3600;

const SLUG_MAP: Record<string, string> = {
  "air-conditioning": "hvac-air-conditioning",
  "heating-systems": "hvac-heating-systems",
  "airflow-ductwork": "hvac-airflow-ductwork",
  "electrical-controls": "hvac-electrical-controls",
  "thermostats-controls": "hvac-thermostats-controls",
  "maintenance": "hvac-maintenance",
};

export async function generateStaticParams() {
  return Object.keys(SLUG_MAP).map((slug) => ({ symptom: slug }));
}

export default async function SystemHubPage({ params }: { params: { symptom: string } }) {
  const hubSlug = SLUG_MAP[params.symptom] || params.symptom;
  const hub = getSystemHub(hubSlug);

  if (!hub) {
    notFound();
  }

  const symptoms = getSymptomsForHub(hub);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="max-w-4xl mx-auto px-4 py-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/diagnose" className="hover:text-hvac-blue">Diagnostics</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{hub.name}</span>
      </nav>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="inline-block bg-hvac-blue/10 text-hvac-blue text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          System Hub
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight mb-6">
          {hub.name}
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed mb-12">
          {hub.description}
        </p>

        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-6">
          Common {hub.name.replace("HVAC ", "")} Problems
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {symptoms.map((symptom: any) => (
            <Link
              key={symptom.id}
              href={`/diagnose/${symptom.id}`}
              className="block p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-hvac-blue hover:shadow-lg transition-all"
            >
              <h3 className="font-bold text-hvac-navy dark:text-white mb-2">{symptom.name}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">
                {symptom.description}
              </p>
              <span className="inline-block mt-3 text-xs font-bold text-hvac-blue uppercase tracking-wider">
                Diagnostic Guide →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
            Other System Hubs
          </h3>
          <div className="flex flex-wrap gap-3">
            {SYSTEM_HUBS.filter((h) => h.slug !== hub.slug).map((h) => {
              const shortSlug = Object.entries(SLUG_MAP).find(([, v]) => v === h.slug)?.[0] || h.slug;
              return (
                <Link
                  key={h.slug}
                  href={`/hvac/${shortSlug}`}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-hvac-blue transition-colors"
                >
                  {h.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
