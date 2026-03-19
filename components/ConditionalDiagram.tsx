/**
 * Conditional diagrams for symptom pages — uses getImageForPage (LOCKED).
 * Frontend handles images; AI does not generate diagrams.
 * Uses <img> for SVGs — Next.js Image can fail with .svg.svg in dev.
 */
import { getImageForPage } from "@/lib/image-for-page";
import { PLACEHOLDER_IMAGE } from "@/lib/image-fallbacks";

const TITLES: Record<string, string> = {
  "/images/hvac_rv_system.svg.svg": "RV AC System",
  "/images/hvac_heat_pump.svg.svg": "Heat Pump Reversible Cycle",
  "/images/hvac_ac_cycle.svg.svg": "AC Cooling Cycle",
  "/images/hvac_airflow_duct.svg.svg": "HVAC Airflow & Ductwork",
  "/images/hvac_mini_split.svg.svg": "Mini Split System",
  "/images/hvac_system_main.svg.svg": "HVAC System Overview",
};

export default function ConditionalDiagram({
  symptomSlug,
}: {
  symptomSlug: string;
}) {
  const src = getImageForPage(symptomSlug);
  const title = TITLES[src] ?? "HVAC System";

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">
        {title}
      </h2>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
        <img
          src={src || PLACEHOLDER_IMAGE}
          alt={title ? `${title} diagram` : "HVAC illustration"}
          className="w-full h-auto object-cover"
        />
      </div>
    </section>
  );
}
