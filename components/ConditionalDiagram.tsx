/**
 * Conditional diagrams for symptom pages — uses getImageForPage (LOCKED).
 * Frontend handles images; AI does not generate diagrams.
 */
import Image from "next/image";
import { getImageForPage } from "@/lib/image-for-page";

const TITLES: Record<string, string> = {
  "/images/hvac-rv-system.svg": "RV AC System",
  "/images/hvac-heat-pump.svg": "Heat Pump Reversible Cycle",
  "/images/hvac-ac-cycle.svg": "AC Cooling Cycle",
  "/images/hvac-airflow-duct.svg": "HVAC Airflow & Ductwork",
  "/images/hvac-mini-split.svg": "Mini Split System",
  "/images/hvac-system-main.svg": "HVAC System Overview",
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
        <Image
          src={src}
          alt={`${title} diagram`}
          width={600}
          height={280}
          className="w-full h-auto"
        />
      </div>
    </section>
  );
}
