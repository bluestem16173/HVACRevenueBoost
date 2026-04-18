/**
 * System Page Template — authority pillar.
 * Same design system as symptom page. Different section order + headings.
 */
import React from "react";
import Link from "next/link";
// TEMP: import dynamic from "next/dynamic";
// TEMP: const MermaidDiagram = dynamic(() => import("@/components/MermaidDiagram"), { ssr: false });

export default function SystemPageTemplate({ system, contentJson }: any) {
  const {
    fast_answer,
    system_diagram_mermaid,
    major_components,
    common_symptoms,
    maintenance_schedule,
  } = contentJson || {};

  const name = system?.name ?? system;
  const slug = system?.slug ?? (typeof system === "string" ? system.replace(/\s+/g, "-") : "");

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <nav className="text-sm text-gray-500 mb-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/hvac" className="hover:text-hvac-blue">HVAC Systems</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{name}</span>
      </nav>

      <section className="mb-12">
        <div className="inline-block bg-hvac-blue/10 text-hvac-blue text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          System Guide
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight">
          {name} System Guide
        </h1>
      </section>

      {fast_answer && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-3">Fast Overview</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{fast_answer}</p>
        </section>
      )}

      {system_diagram_mermaid && (
        <section className="mb-10 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">System Diagram</h2>
          {/* TEMP: <MermaidDiagram chart={system_diagram_mermaid} title="System Overview" /> */}
        </section>
      )}

      {major_components?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Major Components</h2>
          <div className="grid gap-4">
            {major_components.map((c: any, i: number) => (
              <div
                key={i}
                className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                {c.link ? (
                  <Link href={c.link} className="font-bold text-hvac-blue hover:underline">
                    {c.name} →
                  </Link>
                ) : (
                  <strong className="text-hvac-navy dark:text-white">{c.name}</strong>
                )}
                {c.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 m-0">{c.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {common_symptoms?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Common Symptoms</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {common_symptoms.map((s: any, i: number) => (
              <Link
                key={i}
                href={s.link || `/diagnose/${s.slug || ""}`}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-hvac-blue transition-colors"
              >
                <strong className="text-hvac-navy dark:text-white">{s.name}</strong>
                {s.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 m-0 line-clamp-2">{s.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {maintenance_schedule?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Maintenance Schedule</h2>
          <ul className="space-y-2 list-disc pl-5 text-slate-600 dark:text-slate-400">
            {maintenance_schedule.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-16 bg-hvac-navy text-white p-10 rounded-2xl text-center">
        <h2 className="text-2xl font-black mb-4 border-0 text-white">Need {name} Service?</h2>
        <p className="text-slate-300 mb-6">Connect with a certified technician for diagnostics and repair.</p>
        <button
          data-open-lead-modal
          className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-8 py-4 rounded-xl uppercase tracking-widest text-sm"
        >
          Get Local HVAC Help
        </button>
      </section>
    </div>
  );
}
