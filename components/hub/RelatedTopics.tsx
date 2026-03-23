import Link from "next/link";
import { ArrowRight, Wrench, AlertTriangle, Activity } from "lucide-react";

const RELATED_SYMPTOMS = [
  { title: "AC Not Cooling", slug: "ac-not-cooling" },
  { title: "AC Freezing Up", slug: "ac-freezing-up" },
  { title: "Furnace Not Heating", slug: "furnace-not-heating" }
];

const RELATED_DIAGNOSTICS = [
  { title: "Diagnose AC Not Cooling", slug: "ac-not-cooling" },
  { title: "Diagnose Furnace Failure", slug: "furnace-not-heating" }
];

const RELATED_REPAIRS = [
  { title: "Replace Capacitor", slug: "replace-capacitor" },
  { title: "Clean Evaporator Coil", slug: "clean-evaporator-coil" }
];

export function RelatedTopics() {
  return (
    <section className="py-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-10 text-center">
          Related HVAC Topics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Problems */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <AlertTriangle className="text-amber-500 w-5 h-5" />
              Common Problems
            </h3>
            <ul className="space-y-4">
              {RELATED_SYMPTOMS.map((item, i) => (
                <li key={i}>
                  <Link href={`/symptoms/${item.slug}`} className="group flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium hover:text-hvac-blue dark:hover:text-blue-400 transition-colors">
                    <span>{item.title}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Diagnostics */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Activity className="text-blue-500 w-5 h-5" />
              Diagnostic Path
            </h3>
            <ul className="space-y-4">
              {RELATED_DIAGNOSTICS.map((item, i) => (
                <li key={i}>
                  <Link href={`/diagnose/${item.slug}`} className="group flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium hover:text-hvac-blue dark:hover:text-blue-400 transition-colors">
                    <span>{item.title}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Fixes */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Wrench className="text-green-500 w-5 h-5" />
              Recommended Fixes
            </h3>
            <ul className="space-y-4">
              {RELATED_REPAIRS.map((item, i) => (
                <li key={i}>
                  <Link href={`/fix/${item.slug}`} className="group flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium hover:text-hvac-blue dark:hover:text-blue-400 transition-colors">
                    <span>{item.title}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
