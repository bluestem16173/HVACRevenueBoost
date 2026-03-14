import Link from "next/link";
import { REPAIRS } from "@/data/knowledge-graph";
import { CITIES } from "@/data/knowledge-graph";

export const revalidate = 3600;

// Featured repairs for the hub (high-intent, common)
const FEATURED_REPAIR_SLUGS = [
  "replace-capacitor",
  "replace-blower-motor",
  "clean-evaporator-coil",
  "recharge-refrigerant",
  "duct-sealing",
  "replace-air-filter",
  "replace-thermostat",
  "clear-drain-line",
  "replace-contactor",
  "clean-flame-sensor",
];

export default function RepairHubPage() {
  const repairs = FEATURED_REPAIR_SLUGS.map((slug) => REPAIRS[slug]).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="max-w-4xl mx-auto px-4 py-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/diagnose" className="hover:text-hvac-blue">Diagnostics</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">Repair Guides</span>
      </nav>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight mb-6">
          HVAC Repair Guides
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed mb-12">
          Step-by-step repair procedures for common HVAC issues. Each guide includes diagnostic tests, tools required, and safety procedures.
        </p>

        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-6">
          Common HVAC Repairs
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {repairs.map((repair) => (
            <Link
              key={repair.id}
              href={`/fix/${repair.id}`}
              className="block p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-hvac-blue hover:shadow-lg transition-all"
            >
              <h3 className="font-bold text-hvac-navy dark:text-white mb-2">{repair.name}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-3">
                {repair.description}
              </p>
              <span className="text-xs font-bold text-slate-400 uppercase">
                {repair.estimatedCost === "low" ? "Low cost" : repair.estimatedCost === "medium" ? "Moderate cost" : "Higher cost"}
              </span>
              <span className="inline-block mt-2 text-xs font-bold text-hvac-blue uppercase tracking-wider">
                View Repair Manual →
              </span>
            </Link>
          ))}
        </div>

        <div className="pt-12 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-6">
            Find Local HVAC Repair
          </h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            Connect with verified HVAC technicians in your area.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {CITIES.slice(0, 12).map((city) => (
              <Link
                key={city.slug}
                href={`/repair/${city.slug}/ac-blowing-warm-air`}
                className="block p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-hvac-blue transition-colors"
              >
                {city.name}, {city.state}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
