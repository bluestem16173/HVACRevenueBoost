import type { Metadata } from "next";
import Link from "next/link";
import DiagnosticCard from "@/components/DiagnosticCard";
import { SmsLegalFooterLinks } from "@/components/SmsLegalFooterLinks";
import { canonicalMetadata } from "@/lib/seo/canonical";
import { buildHvacLocalizedPillarPath } from "@/lib/localized-city-path";
import { FL_EXAMPLE_PRIMARY_CITY_SLUG } from "@/lib/vertical-hub-shared";
import { isStrictIndexingEnabled } from "@/lib/seo/strict-indexing";

const RV_DIAGNOSTICS_URL = "https://www.decisiongrid.co";

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...canonicalMetadata("/"),
    ...(isStrictIndexingEnabled() ? { robots: { index: true, follow: true } } : {}),
  };
}

/** Example Lee County FL storage slug for HVAC localized URLs (`/{vertical}/{symptom}/{city}`). */
const DEMO_CITY_SLUG = FL_EXAMPLE_PRIMARY_CITY_SLUG;

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hvac-navy pb-20 pt-16 text-white sm:pb-24 sm:pt-20">
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex flex-col gap-10 sm:gap-12">
              <span className="inline-block max-w-full self-start rounded-full bg-hvac-gold px-4 py-2 text-xs font-bold uppercase leading-normal tracking-widest text-hvac-navy shadow-sm sm:px-5 sm:text-sm">
                Home service diagnostics
              </span>
              <h1 className="text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
                <span className="text-white">Diagnose problems </span>
                <span className="text-hvac-gold">before they cost you thousands</span>
              </h1>
            </div>
            <p className="mb-10 mt-8 max-w-2xl text-lg leading-relaxed text-slate-300 sm:mt-10 sm:text-xl">
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

      {/* Visual system selector — primary funnel: /hvac | /plumbing | /electrical */}
      <section className="relative z-20 -mt-10 px-4 pb-6 sm:-mt-12">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DiagnosticCard
              title="Diagnose HVAC Problems"
              description="AC not cooling, airflow issues, thermostat problems"
              href="/hvac"
              image="/images/hvac.jpg"
              icon="❄️"
              ctaLine="Start HVAC diagnosis →"
            />
            <DiagnosticCard
              title="Diagnose Plumbing Problems"
              description="Leaks, water heater issues, clogged drains"
              href="/plumbing"
              image="/images/plumbing.jpg"
              icon="🚿"
              ctaLine="Start plumbing diagnosis →"
            />
            <DiagnosticCard
              title="Diagnose Electrical Problems"
              description="Breaker trips, power loss, outlet issues"
              href="/electrical"
              image="/images/electrical.jpg"
              icon="⚡"
              ctaLine="Start electrical diagnosis →"
            />
          </div>
          <p className="mt-5 text-center text-[11px] text-slate-400">
            Card photos are curated stock images; replace files in{" "}
            <span className="font-mono">public/images/</span> with your own licensed assets anytime.
          </p>
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
          <SmsLegalFooterLinks className="mt-6 justify-center text-[10px]" />
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
