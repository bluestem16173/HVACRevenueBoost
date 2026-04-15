import Link from "next/link";
import { HubHero } from "@/components/hub/HubHero";
import { ProblemCard } from "@/components/diagnostic-hub/ProblemCard";
import { ProblemClusterSection } from "@/components/diagnostic-hub/ProblemClusterSection";
import { buildPlumbingLocalizedPillarPath } from "@/lib/localized-city-path";
import { FL_EXAMPLE_CITIES, HOW_IT_WORKS_STEPS } from "@/lib/vertical-hub-shared";

export const revalidate = 3600;

const DEMO_SYMPTOM = "no-hot-water";

export default function PlumbingHubPage() {
  const p = (slug: string) => `/plumbing/${slug.trim().toLowerCase()}`;

  const problemClusters = [
    {
      icon: "🔥",
      heading: "WATER HEATER PROBLEMS",
      sectionId: "water-heater-problems",
      items: [
        { title: "Water Heater Not Working", href: p("water-heater-not-working") },
        { title: "No Hot Water", href: p("no-hot-water") },
        { title: "Not Enough Hot Water", href: p("not-enough-hot-water") },
        { title: "Water Heater Leaking", href: p("water-heater-leaking") },
        { title: "Strange Noises from Tank", href: p("water-heater-strange-noises") },
      ],
    },
    {
      icon: "🚿",
      heading: "LEAKS & WATER DAMAGE",
      sectionId: "leaks-water-damage",
      items: [
        { title: "Pipe Leaking Under Sink", href: p("pipe-leaking-under-sink") },
        { title: "Water Leak in Wall", href: p("water-leak-in-wall") },
        { title: "Ceiling Water Leak", href: p("ceiling-water-leak") },
        { title: "Faucet Dripping", href: p("faucet-dripping") },
        { title: "Toilet Leaking at Base", href: p("toilet-leaking-at-base") },
      ],
    },
    {
      icon: "🚰",
      heading: "DRAIN & SEWER ISSUES",
      sectionId: "drain-sewer",
      items: [
        { title: "Drain Clogged", href: p("drain-clogged") },
        { title: "Shower Drain Backing Up", href: p("shower-drain-backing-up") },
        { title: "Main Sewer Line Clogged", href: p("main-sewer-line-clogged") },
        { title: "Slow Draining Sink", href: p("slow-draining-sink") },
        { title: "Gurgling Drains", href: p("gurgling-drains") },
      ],
    },
    {
      icon: "⚙️",
      heading: "WATER PRESSURE & FLOW",
      sectionId: "water-pressure-flow",
      items: [
        { title: "Low Water Pressure", href: p("low-water-pressure") },
        { title: "No Water in House", href: p("no-water-in-house") },
        { title: "Uneven Water Pressure", href: p("uneven-water-pressure") },
        { title: "Water Pressure Drops Suddenly", href: p("water-pressure-drops-suddenly") },
      ],
    },
    {
      icon: "🛠️",
      heading: "FIXTURES & APPLIANCES",
      sectionId: "fixtures-appliances",
      items: [
        { title: "Toilet Keeps Running", href: p("toilet-keeps-running") },
        { title: "Garbage Disposal Not Working", href: p("garbage-disposal-not-working") },
        { title: "Dishwasher Not Draining", href: p("dishwasher-not-draining") },
        { title: "Sink Not Draining", href: p("sink-not-draining") },
      ],
    },
  ] as const;

  const quickEntry = [
    { title: "No Hot Water", href: p("no-hot-water") },
    { title: "Water Heater Leaking", href: p("water-heater-leaking") },
    { title: "Toilet Keeps Running", href: p("toilet-keeps-running") },
    { title: "Drain Clogged", href: p("drain-clogged") },
  ] as const;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <HubHero
        theme="residential"
        badgeText="Residential plumbing diagnostics"
        title="Diagnose plumbing problems like a pro"
        description="Identify leaks, water heater issues, pressure problems, and drain failures using structured diagnostic guides — then decide whether to fix it or call a plumber."
        primaryCTA={{ label: "Start Diagnosis", href: "/diagnose" }}
        secondaryCTA={{ label: "Get local plumbing help", href: "/repair" }}
      />

      <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <nav className="mb-10 text-sm text-slate-500">
          <Link href="/" className="hover:text-hvac-blue">
            Home
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">Plumbing</span>
        </nav>

        <header id="problem-clusters" className="mb-10 scroll-mt-28">
          <h1 className="text-3xl font-black tracking-tight text-hvac-navy dark:text-white sm:text-4xl">
            Problem clusters
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Each card opens a national pillar under{" "}
            <span className="font-mono text-sm text-slate-800 dark:text-slate-200">/plumbing/…</span>. Add your city
            for Florida context (example:{" "}
            <Link
              className="font-medium text-hvac-blue hover:underline"
              href={buildPlumbingLocalizedPillarPath(DEMO_SYMPTOM, "tampa-fl")}
            >
              /plumbing/{DEMO_SYMPTOM}/tampa-fl
            </Link>
            ).
          </p>
        </header>

        {problemClusters.map((cluster) => (
          <ProblemClusterSection
            key={cluster.heading}
            icon={cluster.icon}
            heading={cluster.heading}
            items={[...cluster.items]}
            sectionId={cluster.sectionId}
          />
        ))}

        <section className="mb-14 border-t border-slate-200 pt-12 dark:border-slate-800" aria-labelledby="quick-entry-heading">
          <h2 id="quick-entry-heading" className="mb-2 text-2xl font-black text-hvac-navy dark:text-white">
            Common plumbing problems right now
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
            Start a guided diagnosis and we&apos;ll help you identify the issue quickly.
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
              Find a local plumber
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
                  href={buildPlumbingLocalizedPillarPath(DEMO_SYMPTOM, city.slug)}
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
