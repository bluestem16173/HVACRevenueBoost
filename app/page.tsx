import Link from "next/link";
import { buildHvacLocalizedPillarPath } from "@/lib/localized-city-path";

const RV_DIAGNOSTICS_URL = "https://decisiongrid.com";

/** Example FL metro for HVAC localized URLs (indexable symptom × city pattern). */
const DEMO_CITY_SLUG = "tampa-fl";

const IMG_HVAC =
  "https://images.unsplash.com/photo-1631540579298-3689d0680f5b?w=800&q=80&auto=format&fit=crop";
const IMG_PLUMBING =
  "https://images.unsplash.com/photo-1585704032919-cb0a7da62d8a?w=800&q=80&auto=format&fit=crop";
const IMG_ELECTRICAL =
  "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80&auto=format&fit=crop";

function SystemSelectorCard({
  href,
  imageSrc,
  imageAlt,
  title,
  description,
  cta,
}: {
  href: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all hover:-translate-y-1 hover:border-hvac-blue/40 hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-hvac-navy/80 via-hvac-navy/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="m-0 text-xl font-black text-white drop-shadow-sm sm:text-2xl">{title}</h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="m-0 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-black uppercase tracking-wide text-hvac-blue">
          {cta}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hvac-navy pb-20 pt-16 text-white sm:pb-24 sm:pt-20">
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl">
            <span className="mb-5 inline-block rounded-full bg-hvac-gold px-4 py-1 text-xs font-bold uppercase tracking-widest text-hvac-navy sm:text-sm">
              Home service diagnostics
            </span>
            <h1 className="mb-6 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Diagnose Home System Problems{" "}
              <span className="text-hvac-gold">Before They Cost You Thousands</span>
            </h1>
            <p className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
              Identify HVAC, plumbing, and electrical issues fast using structured diagnostic guides — then decide
              whether to fix it yourself or call a pro.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link
                href="/diagnose"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-hvac-gold px-8 py-3.5 text-base font-black uppercase tracking-wide text-hvac-navy shadow-lg transition-colors hover:bg-yellow-400 sm:px-10 sm:text-lg"
              >
                Start My Diagnosis
              </Link>
              <Link
                href="/repair"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-white bg-white/5 px-8 py-3.5 text-base font-bold text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-hvac-navy sm:px-10 sm:text-lg"
              >
                Get Local Help
              </Link>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-0 right-0 opacity-10">
          <div className="h-[480px] w-[480px] translate-x-1/4 translate-y-1/4 rounded-full border-[40px] border-white sm:h-[640px] sm:w-[640px]" />
        </div>
      </section>

      {/* Visual system selector */}
      <section className="relative z-20 -mt-10 px-4 pb-4 sm:-mt-12">
        <div className="container mx-auto">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            <SystemSelectorCard
              href="/hvac"
              imageSrc={IMG_HVAC}
              imageAlt="HVAC technician working on outdoor AC unit"
              title="Diagnose HVAC Problems"
              description="AC not cooling, weak airflow, thermostat issues, strange noises"
              cta="Start HVAC Diagnosis"
            />
            <SystemSelectorCard
              href="/plumbing"
              imageSrc={IMG_PLUMBING}
              imageAlt="Plumbing — sink and water lines"
              title="Diagnose Plumbing Problems"
              description="No hot water, leaks, clogged drains, low pressure"
              cta="Start Plumbing Diagnosis"
            />
            <SystemSelectorCard
              href="/electrical"
              imageSrc={IMG_ELECTRICAL}
              imageAlt="Electrical breaker panel"
              title="Diagnose Electrical Problems"
              description="Power outages, breaker trips, outlet failures, wiring issues"
              cta="Start Electrical Diagnosis"
            />
          </div>
        </div>
      </section>

      {/* Common problems — fast entry (localized HVAC examples) */}
      <section className="border-t border-slate-200 bg-white py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 text-center text-2xl font-black text-hvac-navy sm:text-3xl">
            Common Issues Homeowners Are Facing
          </h2>
          <p className="mb-10 text-center text-sm text-slate-500">
            Example metro: Tampa area — same pattern scales to your city pages.
          </p>
          <ul className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
            {[
              { label: "AC Not Cooling", href: buildHvacLocalizedPillarPath("ac-not-cooling", DEMO_CITY_SLUG) },
              { label: "AC Not Turning On", href: buildHvacLocalizedPillarPath("ac-not-turning-on", DEMO_CITY_SLUG) },
              { label: "No Hot Water", href: "/plumbing" },
              { label: "Water Heater Leaking", href: "/plumbing" },
              { label: "Breaker Keeps Tripping", href: "/electrical" },
              { label: "Power Out in One Room", href: "/electrical" },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-hvac-navy transition-colors hover:border-hvac-blue hover:bg-white sm:text-base"
                >
                  <span>{item.label}</span>
                  <span className="text-hvac-blue" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Guided diagnostic */}
      <section className="bg-slate-100 py-16 sm:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-3 text-2xl font-black text-hvac-navy sm:text-3xl">Not Sure What&apos;s Wrong?</h2>
          <p className="mb-8 text-slate-600">
            Start a guided diagnosis and we&apos;ll help you identify the problem in minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              href="/diagnose"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-hvac-gold px-8 py-3.5 font-black uppercase tracking-wide text-hvac-navy shadow-md hover:bg-yellow-400"
            >
              Start Diagnosis
            </Link>
            <button
              type="button"
              data-open-lead-modal
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-hvac-navy bg-white px-8 py-3.5 font-bold text-hvac-navy hover:bg-slate-50"
            >
              Find a Local Technician
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-2xl font-black text-hvac-navy sm:text-3xl">How It Works</h2>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Identify the Problem",
                text: "We help you quickly narrow down what is going wrong.",
              },
              {
                step: "2",
                title: "Diagnose the Cause",
                text: "Follow structured steps used by professionals.",
              },
              {
                step: "3",
                title: "Fix or Get Help",
                text: "Handle it yourself or connect with a trusted local expert.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-hvac-navy text-xl font-black text-hvac-gold">
                  {s.step}
                </div>
                <h3 className="mb-2 text-lg font-bold text-hvac-navy">{s.title}</h3>
                <p className="m-0 text-sm leading-relaxed text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authority — light */}
      <section className="border-y border-slate-200 bg-white py-14 sm:py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-xl font-black text-hvac-navy sm:text-2xl">
            Built for Real-World Home System Problems
          </h2>
          <p className="m-0 text-slate-600 leading-relaxed">
            Our diagnostic engine is designed to mirror how experienced technicians troubleshoot issues — not generic
            advice, but real diagnostic logic.
          </p>
        </div>
      </section>

      {/* RV bridge */}
      <section className="bg-slate-50 py-10">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-slate-500">Diagnosing an RV System?</h2>
          <p className="mb-4 text-sm text-slate-600">
            For RV air conditioning, electrical, and water system issues, visit our specialized platform.
          </p>
          <a
            href={RV_DIAGNOSTICS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-bold text-hvac-blue hover:text-hvac-navy"
          >
            Go to RV Diagnostics
            <span className="text-hvac-gold" aria-hidden>
              ↗
            </span>
            <span className="sr-only">(opens in new tab)</span>
          </a>
        </div>
      </section>
    </div>
  );
}
