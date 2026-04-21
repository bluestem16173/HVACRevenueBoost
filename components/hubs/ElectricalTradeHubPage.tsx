import Link from "next/link";
import { HubHero } from "@/components/hub/HubHero";
import { ProblemCard } from "@/components/diagnostic-hub/ProblemCard";
import { ProblemClusterSection } from "@/components/diagnostic-hub/ProblemClusterSection";
import { buildElectricalLocalizedPillarPath } from "@/lib/localized-city-path";
import { LEE_MONETIZATION_ELECTRICAL_SYMPTOMS } from "@/lib/homeservice/leeCountyInitialMonetizationCluster";
import { FL_EXAMPLE_CITIES, FL_EXAMPLE_PRIMARY_CITY_SLUG, HOW_IT_WORKS_STEPS } from "@/lib/vertical-hub-shared";

const DEMO_SYMPTOM = "breaker-keeps-tripping";

function humanizeSlugLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function ElectricalTradeHubPage() {
  const p = (slug: string) => `/electrical/${slug.trim().toLowerCase()}`;

  const problemClusters = [
    {
      icon: "⚡",
      heading: "POWER & OUTAGES",
      sectionId: "power-outages",
      items: [
        { title: "Breaker Keeps Tripping", href: p("breaker-keeps-tripping") },
        { title: "Partial Power (Half the House)", href: p("partial-power-house") },
        { title: "Power Out in One Room", href: p("power-out-in-one-room") },
        { title: "Whole House Power Out", href: p("whole-house-power-out") },
        { title: "Lights Flickering", href: p("lights-flickering") },
      ],
    },
    {
      icon: "🔌",
      heading: "OUTLETS & SWITCHES",
      sectionId: "outlets-switches",
      items: [
        { title: "Outlet Not Working", href: p("outlet-not-working") },
        { title: "Outlet Sparking", href: p("outlet-sparking") },
        { title: "Light Switch Not Working", href: p("light-switch-not-working") },
        { title: "Dead Outlet", href: p("dead-outlet") },
      ],
    },
    {
      icon: "⚙️",
      heading: "BREAKERS & PANELS",
      sectionId: "breakers-panels",
      items: [
        { title: "Panel Overheating", href: p("panel-overheating") },
        { title: "Circuit Overloaded", href: p("circuit-overloaded") },
        { title: "Breaker Won\u2019t Reset", href: p("breaker-wont-reset") },
        { title: "Partial Power Loss", href: p("partial-power-loss") },
      ],
    },
    {
      icon: "🧠",
      heading: "WIRING & SYSTEM ISSUES",
      sectionId: "wiring-system",
      items: [
        { title: "Burning Smell (Outlet or Panel)", href: p("burning-smell-outlet") },
        { title: "Burning Smell from Electrical", href: p("burning-smell-from-electrical") },
        { title: "Buzzing Sound in Walls", href: p("buzzing-sound-in-walls") },
        { title: "Exposed Wiring", href: p("exposed-wiring") },
        { title: "Faulty Wiring", href: p("faulty-wiring") },
      ],
    },
    {
      icon: "🏠",
      heading: "FIXTURES & APPLIANCES",
      sectionId: "fixtures-appliances",
      items: [
        { title: "Ceiling Fan Not Working", href: p("ceiling-fan-not-working") },
        { title: "Light Fixture Not Turning On", href: p("light-fixture-not-turning-on") },
        { title: "Appliance Tripping Breaker", href: p("appliance-tripping-breaker") },
      ],
    },
  ] as const;

  const quickEntry = LEE_MONETIZATION_ELECTRICAL_SYMPTOMS.map((slug) => ({
    title: humanizeSlugLabel(slug),
    href: p(slug),
  }));

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <HubHero
        theme="residential"
        badgeText="Residential electrical diagnostics"
        title="Diagnose electrical problems like a pro"
        description="Find the cause of power issues, breaker trips, and wiring problems using structured diagnostics — then decide whether to fix it or call an electrician."
        primaryCTA={{ label: "Start Diagnosis", href: "/diagnose" }}
        secondaryCTA={{ label: "Get local electrical help", href: "/repair" }}
      />

      <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <nav className="mb-10 text-sm text-slate-500">
          <Link href="/" className="hover:text-hvac-blue">
            Home
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">Electrical</span>
        </nav>

        <header id="problem-clusters" className="mb-10 scroll-mt-28">
          <h1 className="text-3xl font-black tracking-tight text-hvac-navy dark:text-white sm:text-4xl">
            Problem clusters
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Each card opens a national pillar under{" "}
            <span className="font-mono text-sm text-slate-800 dark:text-slate-200">/electrical/…</span>. Add your city
            for Florida context (example:{" "}
            <Link
              className="font-medium text-hvac-blue hover:underline"
              href={buildElectricalLocalizedPillarPath(DEMO_SYMPTOM, FL_EXAMPLE_PRIMARY_CITY_SLUG)}
            >
              /electrical/{DEMO_SYMPTOM}/{FL_EXAMPLE_PRIMARY_CITY_SLUG}
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
            Common electrical problems right now
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
            Start a guided diagnosis and we&apos;ll help you narrow it down safely.
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
              Find an electrician
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
                  href={buildElectricalLocalizedPillarPath(DEMO_SYMPTOM, city.slug)}
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
