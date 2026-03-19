/**
 * System Overview Block — Trust + Clarity (Meyer-style)
 * ----------------------------------------------------
 * Static block explaining how HVAC systems work. Reduces bounce, improves dwell time.
 * 3 variants: symptom (full), cause (modified), repair (light).
 * Do NOT generate this content via AI — handled by frontend.
 * Uses <img> for SVGs — Next.js Image can fail with .svg.svg in dev.
 */
import { PLACEHOLDER_IMAGE } from "@/lib/image-fallbacks";

export type SystemOverviewVariant = "symptom" | "cause" | "repair";

const VARIANTS = {
  symptom: {
    title: "How Your HVAC System Works",
    intro: "Your HVAC system moves air through your home while heating or cooling it using a continuous cycle of airflow and heat exchange.",
    microCta: "If your system isn't working correctly, the issue usually comes from one of four core systems below.",
  },
  cause: {
    title: "Where This Problem Happens in Your HVAC System",
    intro: "Understanding where this issue sits in your system helps you diagnose and fix it correctly.",
    microCta: "This component plays a key role in the system shown above — when it fails, specific symptoms appear.",
  },
  repair: {
    title: "How This Component Fits Into Your HVAC System",
    intro: "This repair targets a specific part of the heating and cooling cycle.",
    microCta: "Use the diagnostic guide above to confirm this is the right fix before proceeding.",
  },
} as const;

export default function SystemOverviewBlock({
  variant = "symptom",
  data,
}: {
  variant?: SystemOverviewVariant;
  data?: { variant?: SystemOverviewVariant };
}) {
  const v: SystemOverviewVariant = ["symptom", "cause", "repair"].includes(data?.variant ?? variant)
    ? (data?.variant ?? variant) as SystemOverviewVariant
    : "symptom";
  const config = VARIANTS[v];

  return (
    <section className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm mb-12">
      <h2 className="text-2xl font-semibold text-hvac-navy dark:text-white mb-4">
        {config.title}
      </h2>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div className="w-full">
          <img
            src="/images/hvac_system_main.svg.svg"
            alt="HVAC system diagram showing thermostat, furnace, evaporator coil, condenser, and ductwork"
            className="rounded-lg border border-slate-200 dark:border-slate-700 w-full h-auto object-cover"
          />
        </div>

        <div className="space-y-4 text-sm md:text-base">
          <p className="text-slate-700 dark:text-slate-300">
            {config.intro}
          </p>

          <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
            <li>
              <strong>Thermostat:</strong> Signals the system to turn on when temperature changes
            </li>
            <li>
              <strong>Indoor Unit:</strong> Heats or cools air using coils and a blower
            </li>
            <li>
              <strong>Outdoor Unit:</strong> Releases or absorbs heat through the condenser
            </li>
            <li>
              <strong>Ductwork:</strong> Distributes conditioned air throughout your home
            </li>
          </ul>

          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm">
            ⚠️ {config.microCta}
          </div>
        </div>
      </div>
    </section>
  );
}
