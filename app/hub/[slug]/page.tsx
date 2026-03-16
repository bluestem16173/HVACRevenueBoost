import Link from "next/link";
import { notFound } from "next/navigation";
import { getClustersForPillar } from "@/lib/clusters";
import { getConditionsForPillar } from "@/lib/conditions";
import { getSymptomsForHub, getSystemHub } from "@/lib/system-hubs";
import { SYMPTOMS, CAUSES, REPAIRS } from "@/data/knowledge-graph";

export const revalidate = 3600;

const HUB_SLUG_MAP: Record<string, string> = {
  "home-ac": "hvac-air-conditioning",
  "rv-ac": "hvac-air-conditioning",
  "rv-furnace": "hvac-heating-systems",
  "home-furnace": "hvac-heating-systems",
  "mini-split": "hvac-air-conditioning",
  "airflow": "hvac-airflow-ductwork",
  "electrical": "hvac-electrical-controls",
  "thermostat": "hvac-thermostats-controls",
  "maintenance": "hvac-maintenance",
};

const HUB_TITLES: Record<string, string> = {
  "home-ac": "Home Air Conditioner Troubleshooting",
  "rv-ac": "RV Air Conditioner Troubleshooting",
  "rv-furnace": "RV Furnace Troubleshooting",
  "home-furnace": "Home Furnace Troubleshooting",
  "mini-split": "Mini Split Troubleshooting",
  "airflow": "HVAC Airflow & Ductwork",
  "electrical": "HVAC Electrical & Controls",
  "thermostat": "HVAC Thermostats & Controls",
  "maintenance": "HVAC Maintenance",
};

export async function generateStaticParams() {
  return Object.keys(HUB_SLUG_MAP).map((slug) => ({ slug }));
}

export default async function DiagnosticHubPage({ params }: { params: { slug: string } }) {
  const hubSlug = HUB_SLUG_MAP[params.slug] || params.slug;
  const hub = getSystemHub(hubSlug);

  if (!hub) {
    notFound();
  }

  const symptoms = getSymptomsForHub(hub);
  const clusters = getClustersForPillar(hub.slug);
  const conditions = getConditionsForPillar(hub.slug);
  const title = HUB_TITLES[params.slug] || hub.name;

  const repairIds = new Set<string>();
  for (const s of SYMPTOMS) {
    if (symptoms.some((sym: any) => sym.id === s.id)) {
      for (const cId of s.causes || []) {
        const cause = CAUSES[cId];
        if (cause?.repairs) cause.repairs.forEach((r: string) => repairIds.add(r));
      }
    }
  }
  const repairs = Array.from(repairIds)
    .slice(0, 12)
    .map((id) => REPAIRS[id])
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="max-w-4xl mx-auto px-4 py-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/hvac" className="hover:text-hvac-blue">HVAC Systems</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{title}</span>
      </nav>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="inline-block bg-hvac-gold/10 text-hvac-gold text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          Diagnostic Hub
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight mb-6">
          {title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed mb-12">
          {hub.description}
        </p>

        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Symptoms</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-12">
          {symptoms.map((s: any) => (
            <Link
              key={s.id}
              href={`/diagnose/${s.id}`}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-hvac-blue text-sm font-medium"
            >
              {s.name}
            </Link>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Conditions</h2>
        <div className="flex flex-wrap gap-2 mb-12">
          {conditions.slice(0, 20).map((c) => (
            <Link
              key={c.slug}
              href={`/conditions/${c.slug}`}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:border-hvac-blue"
            >
              {c.name}
            </Link>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Problem Clusters</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {clusters.map((cluster) => (
            <Link
              key={cluster.slug}
              href={`/cluster/${cluster.slug}`}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-hvac-blue"
            >
              <h3 className="font-bold text-hvac-navy dark:text-white">{cluster.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{cluster.description}</p>
            </Link>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Repair Guides</h2>
        <div className="flex flex-wrap gap-2 mb-12">
          {repairs.map((r: any) => (
            <Link
              key={r.id}
              href={`/fix/${r.id}`}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:border-hvac-blue"
            >
              {r.name}
            </Link>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Replacement Parts</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/components/compressor" className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg text-sm hover:border-hvac-blue">Compressor</Link>
          <Link href="/components/capacitor" className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg text-sm hover:border-hvac-blue">Capacitor</Link>
          <Link href="/components/evaporator-coil" className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg text-sm hover:border-hvac-blue">Evaporator Coil</Link>
          <Link href="/components/thermostat" className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg text-sm hover:border-hvac-blue">Thermostat</Link>
        </div>
      </section>
    </div>
  );
}
