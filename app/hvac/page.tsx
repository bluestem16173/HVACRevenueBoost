import Link from "next/link";
import { HubHero } from "@/components/hub/HubHero";
import { ProblemCard } from "@/components/diagnostic-hub/ProblemCard";
import { ProblemClusterSection } from "@/components/diagnostic-hub/ProblemClusterSection";
import { buildHvacLocalizedPillarPath } from "@/lib/localized-city-path";
import { HVAC_SYSTEM_HUB_PATHS, hvacPillarPath } from "@/lib/hvac-hub-clusters";
import { FL_EXAMPLE_CITIES, FL_EXAMPLE_PRIMARY_CITY_SLUG, HOW_IT_WORKS_STEPS } from "@/lib/vertical-hub-shared";

export const revalidate = 3600;

const DEMO_SYMPTOM = "ac-not-cooling";

export default function ResidentialHub() {
  const p = hvacPillarPath;

  const problemClusters = [
    {
      icon: "🧊",
      heading: "AIR CONDITIONING",
      items: [
        { title: "AC Not Cooling", href: p("ac-not-cooling") },
        { title: "AC Not Turning On", href: p("ac-not-turning-on") },
        { title: "AC Blowing Warm Air", href: p("ac-blowing-warm-air") },
        { title: "AC Freezing Up", href: p("ac-freezing-up") },
        { title: "AC Leaking Water", href: p("hvac-leaking-water") },
      ],
      viewAllHref: HVAC_SYSTEM_HUB_PATHS.airConditioning,
      viewAllLabel: "View All AC Problems",
    },
    {
      icon: "🌬️",
      heading: "AIRFLOW & DUCTWORK",
      items: [
        { title: "Weak Airflow from Vents", href: p("weak-airflow") },
        { title: "Air Not Reaching Rooms", href: p("uneven-cooling") },
        { title: "Hot and Cold Spots", href: p("uneven-cooling") },
        { title: "Airflow Worse Upstairs", href: p("weak-airflow") },
      ],
      viewAllHref: HVAC_SYSTEM_HUB_PATHS.airflow,
      viewAllLabel: "View All Airflow Issues",
    },
    {
      icon: "🔥",
      heading: "HEATING SYSTEMS",
      items: [
        { title: "Furnace Not Turning On", href: p("furnace-not-turning-on") },
        { title: "No Heat", href: p("furnace-not-heating") },
        { title: "Furnace Blowing Cold Air", href: p("furnace-blowing-cold-air") },
        { title: "Furnace Shutting Off", href: p("furnace-short-cycling") },
      ],
      viewAllHref: HVAC_SYSTEM_HUB_PATHS.heating,
      viewAllLabel: "View All Heating Problems",
    },
    {
      icon: "⚡",
      heading: "ELECTRICAL & CONTROLS",
      items: [
        { title: "AC Has No Power", href: p("hvac-not-turning-on") },
        { title: "Thermostat Not Working", href: p("hvac-not-responding-to-thermostat") },
        { title: "Outdoor Unit Not Starting", href: p("ac-not-turning-on") },
        { title: "AC Clicking But Not Starting", href: p("furnace-clicking-no-ignition") },
      ],
      viewAllHref: HVAC_SYSTEM_HUB_PATHS.electrical,
      viewAllLabel: "View All Electrical Issues",
    },
    {
      icon: "🛠️",
      heading: "MAINTENANCE & COMMON FAILURES",
      items: [
        { title: "Water Leaking After Filter Change", href: p("hvac-leaking-water") },
        { title: "AC Dripping from Ceiling", href: p("ac-freezing-up") },
        { title: "System Short Cycling", href: p("hvac-short-cycling") },
        { title: "Strange Noises", href: p("hvac-making-noise") },
      ],
      viewAllHref: HVAC_SYSTEM_HUB_PATHS.maintenance,
      viewAllLabel: "View All Maintenance Issues",
    },
  ] as const;

  const quickEntry = [
    { title: "AC Not Cooling", href: p("ac-not-cooling") },
    { title: "AC Not Turning On", href: p("ac-not-turning-on") },
    { title: "Weak Airflow", href: p("weak-airflow") },
    { title: "Thermostat Not Working", href: p("hvac-not-responding-to-thermostat") },
  ] as const;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <HubHero
        theme="residential"
        badgeText="Residential HVAC diagnostics"
        title="HVAC problems, organized"
        description="Jump straight to the symptom that matches what you are seeing, then go deeper with localized guides where we serve Florida."
        primaryCTA={{ label: "Start Diagnosis", href: "/diagnose" }}
        secondaryCTA={{ label: "Browse problem clusters", href: "#problem-clusters" }}
      />

      <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <nav className="mb-10 text-sm text-slate-500">
          <Link href="/" className="hover:text-hvac-blue">
            Home
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">HVAC</span>
        </nav>

        <header id="problem-clusters" className="mb-10 scroll-mt-28">
          <h1 className="text-3xl font-black tracking-tight text-hvac-navy dark:text-white sm:text-4xl">
            Problem clusters
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Each card links to a national diagnostic pillar under{" "}
            <span className="font-mono text-sm text-slate-800 dark:text-slate-200">/hvac/…</span>. From there,
            open your city page (example:{" "}
            <Link
              className="font-medium text-hvac-blue hover:underline"
              href={buildHvacLocalizedPillarPath(DEMO_SYMPTOM, FL_EXAMPLE_PRIMARY_CITY_SLUG)}
            >
              /hvac/{DEMO_SYMPTOM}/{FL_EXAMPLE_PRIMARY_CITY_SLUG}
            </Link>
            ) for Florida-specific context.
          </p>
        </header>

        {problemClusters.map((cluster) => (
          <ProblemClusterSection
            key={cluster.heading}
            icon={cluster.icon}
            heading={cluster.heading}
            items={[...cluster.items]}
            viewAllHref={cluster.viewAllHref}
            viewAllLabel={cluster.viewAllLabel}
          />
        ))}

        <section className="mb-14 border-t border-slate-200 pt-12 dark:border-slate-800" aria-labelledby="quick-entry-heading">
          <h2 id="quick-entry-heading" className="mb-2 text-2xl font-black text-hvac-navy dark:text-white">
            Common HVAC problems right now
          </h2>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
            High-intent entry points — each opens the matching diagnostic pillar.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickEntry.map((item) => (
              <ProblemCard key={item.href} title={item.title} href={item.href} />
            ))}
          </div>
        </section>

        <section
          className="mb-14 rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-900/50"
          aria-labelledby="not-sure-heading"
        >
          <h2 id="not-sure-heading" className="text-xl font-black text-hvac-navy dark:text-white sm:text-2xl">
            Not sure what&apos;s wrong?
          </h2>
          <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
            Start a guided diagnosis and we&apos;ll help you narrow it down in minutes.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/diagnose"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-hvac-blue px-8 py-3.5 text-center text-sm font-black uppercase tracking-wide text-white shadow-md transition hover:bg-blue-600"
            >
              Start Diagnosis
            </Link>
            <Link
              href="/repair"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-8 py-3.5 text-center text-sm font-bold text-hvac-navy transition hover:border-hvac-blue hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:border-hvac-blue"
            >
              Talk to a Technician
            </Link>
          </div>
        </section>

        <section className="mb-14" aria-labelledby="how-heading">
          <h2 id="how-heading" className="mb-6 text-2xl font-black text-hvac-navy dark:text-white">
            How it works
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((s) => (
              <li key={s.step} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <span className="text-xs font-black uppercase tracking-widest text-hvac-blue">Step {s.step}</span>
                <h3 className="mt-2 text-lg font-bold text-hvac-navy dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-8 dark:border-slate-700 dark:bg-slate-900/30" aria-labelledby="location-heading">
          <h2 id="location-heading" className="text-lg font-bold text-hvac-navy dark:text-white">
            Florida service area
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            We currently serve Florida. Select your city to see local diagnostics and repair options.
          </p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {FL_EXAMPLE_CITIES.map((city) => (
              <li key={city.slug}>
                <Link
                  href={buildHvacLocalizedPillarPath(DEMO_SYMPTOM, city.slug)}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-hvac-navy shadow-sm transition hover:border-hvac-blue dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                >
                  {city.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/repair"
                className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-2 text-sm font-bold text-hvac-blue hover:underline"
              >
                View all cities
                <span aria-hidden>→</span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
