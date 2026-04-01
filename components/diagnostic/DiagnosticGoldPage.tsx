"use client";

import React from "react";
import Link from "next/link";
import type { DiagnosticGoldDisplayModel } from "@/lib/normalize-diagnostic-display";
import FastIsolationPanel from "@/components/FastIsolationPanel";
import QuickCheckTable from "@/components/QuickCheckTable";
import DiagnosticTestCard from "@/components/DiagnosticTestCard";
import MermaidRenderer from "@/components/MermaidRenderer";
import {
  BookOpen,
  ChevronRight,
  Cpu,
  Cog,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Wrench,
} from "lucide-react";

function SummaryBlock({ summary }: { summary: unknown }) {
  if (summary == null) return null;
  if (typeof summary === "string") return <p className="leading-relaxed">{summary}</p>;
  if (typeof summary === "object" && summary !== null && "technical_summary" in summary) {
    const o = summary as { technical_summary?: string; primary_mechanism?: string };
    return (
      <>
        {o.technical_summary ? <p className="mb-3 leading-relaxed">{o.technical_summary}</p> : null}
        {o.primary_mechanism ? (
          <p className="border-t border-blue-100 pt-3 text-base font-semibold text-slate-800 dark:border-blue-900/40 dark:text-slate-200">
            <span className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Primary mechanism —{" "}
            </span>
            {o.primary_mechanism}
          </p>
        ) : null}
      </>
    );
  }
  return <pre className="text-sm">{JSON.stringify(summary, null, 2)}</pre>;
}

type Props = {
  display: DiagnosticGoldDisplayModel;
  routeSlug: string;
};

/**
 * DG/HRB hybrid shell for v5_master (+ v6): one presentation contract, fixed section order.
 */
export default function DiagnosticGoldPage({ display, routeSlug }: Props) {
  const formatTitle = (s: string) =>
    s?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Diagnostic";

  const causesForQuickTable = display.topCauses.map((c) => ({ name: c.name }));

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-hvac-blue selection:text-white dark:bg-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-white pt-8 pb-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="pointer-events-none absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-800/50" />
        <div className="relative z-10 container mx-auto max-w-4xl px-4">
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <span>{display.system || "HVAC"}</span>
            <ChevronRight className="h-3 w-3" />
            <span>Diagnostic Gold</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-hvac-blue">{display.symptom || formatTitle(routeSlug)}</span>
          </div>
          <h1 className="mb-6 text-3xl leading-tight font-black text-slate-900 md:text-5xl dark:text-white">
            {display.title || `Diagnosing ${formatTitle(routeSlug)}`}
          </h1>

          {/* 30-Second Summary */}
          {display.summary ? (
            <div className="mb-6 rounded-r-xl border-l-4 border-hvac-blue bg-blue-50/80 p-5 shadow-sm dark:bg-blue-900/10">
              <div className="mb-2 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-blue-900 dark:text-blue-300">30-Second Summary</span>
              </div>
              <div className="text-lg leading-relaxed font-medium text-slate-700 dark:text-slate-300">
                <SummaryBlock summary={display.summary} />
              </div>
            </div>
          ) : null}

          {/* Quick Repair Toolkit */}
          {display.toolkit.length > 0 ? (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-3 flex items-center gap-2 font-black text-slate-900 dark:text-white">
                <Wrench className="h-5 w-5 text-hvac-navy" />
                Quick Repair Toolkit
              </div>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {display.toolkit.map((t, i) => (
                  <li key={i} className="flex flex-wrap gap-2">
                    <span className="font-bold text-hvac-blue">{t.tool}</span>
                    <span className="text-slate-400">—</span>
                    <span>{t.purpose}</span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold dark:bg-slate-600">
                      {t.difficulty}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Problem Overview */}
          {display.overview ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="mb-2 text-xs font-black tracking-wide text-amber-900 uppercase dark:text-amber-400">
                Problem Overview
              </div>
              <p className="text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200">{display.overview}</p>
            </div>
          ) : null}

          {/* Quick Decision Tree (condensed + diagnostic order lines) */}
          {(display.quickDecisionTree.length > 0 || display.diagnosticOrder.length > 0) && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 font-black text-slate-900 dark:text-white">Quick Decision Tree</div>
              {display.diagnosticOrder.length > 0 ? (
                <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                  {display.diagnosticOrder.slice(0, 6).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              ) : null}
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {display.quickDecisionTree.map((g, i) => (
                  <li key={i}>
                    <span className="font-semibold">{g.question}</span>
                    {g.likelyModes && g.likelyModes.length > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400"> → {g.likelyModes.join(", ")}</span>
                    ) : null}
                    {g.nextStep ? <div className="text-slate-500">Next: {g.nextStep}</div> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <FastIsolationPanel guidedDiagnosis={display.guidedDiagnosis as never} />
          <QuickCheckTable causes={causesForQuickTable as never} />
        </div>
      </div>

      <div className="container mx-auto mt-12 max-w-4xl space-y-16 px-4">
        {/* How the System Works */}
        {display.systemExplainer ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-hvac-blue" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">How the System Works</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{display.systemExplainer}</p>
          </section>
        ) : null}

        {/* Diagnostic Flow */}
        {display.mermaid ? (
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                <Cog className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Diagnostic Flow</h2>
                <p className="mt-1 text-sm text-slate-500">Isolation matrix — branch on measurements first.</p>
              </div>
            </div>
            <div className="relative flex justify-center overflow-x-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <MermaidRenderer chart={display.mermaid} />
            </div>
          </section>
        ) : null}

        {/* Top Causes */}
        {display.topCauses.length > 0 ? (
          <section>
            <h2 className="mb-6 text-3xl font-black text-slate-900 dark:text-white">Top Causes</h2>
            <div className="flex flex-col space-y-4">
              {display.topCauses.map((c, idx) => {
                const eliminated = display.failureModeNames.filter((m) => m && m !== c.failureMode);
                const severity = idx === 0 ? "high" : idx === 1 ? "medium" : "low";
                return (
                  <DiagnosticTestCard
                    key={idx}
                    name={c.name}
                    test={c.test}
                    expected={c.expected}
                    confirms={c.failureMode}
                    eliminates={eliminated.length ? eliminated.join(" and ") : "Other failure modes"}
                    severity={severity as "low" | "medium" | "high"}
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Repair Matrix */}
        {display.repairMatrix.length > 0 ? (
          <section>
            <h2 className="mb-4 text-3xl font-black text-slate-900 dark:text-white">Repair Matrix</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs font-black tracking-wide uppercase dark:bg-slate-800">
                  <tr>
                    <th className="p-3">Repair</th>
                    <th className="p-3">Cause</th>
                    <th className="p-3">System effect</th>
                    <th className="p-3">Difficulty</th>
                    <th className="p-3">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {display.repairMatrix.map((r, i) => (
                    <tr key={i} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="p-3 font-semibold">{r.name}</td>
                      <td className="p-3">{r.cause}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{r.effect}</td>
                      <td className="p-3">{r.difficulty}</td>
                      <td className="p-3">{r.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Bench Procedures */}
        {display.benchProcedures.length > 0 ? (
          <section>
            <h2 className="mb-6 text-3xl font-black text-slate-900 dark:text-white">Bench Procedures</h2>
            <div className="space-y-6">
              {display.benchProcedures.map((bp, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="mb-3 text-lg font-black text-hvac-navy dark:text-white">{bp.title}</h3>
                  <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                    {bp.steps.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ol>
                  <p className="border-l-4 border-hvac-blue pl-3 text-sm italic text-slate-600 dark:text-slate-400">
                    Field insight: {bp.field_insight}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Preventative Maintenance */}
        {display.prevention.length > 0 ? (
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
              <ShieldCheck className="h-6 w-6 text-hvac-blue" />
              Preventative Maintenance
            </h2>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {display.prevention.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Tools (explicit structured) */}
        {display.tools.length > 0 ? (
          <section>
            <h2 className="mb-4 text-2xl font-black text-slate-900 dark:text-white">Tools</h2>
            <ul className="space-y-2 text-sm">
              {display.tools.map((t, i) => (
                <li key={i} className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <span className="font-bold text-hvac-blue">{t.name}</span>
                  <span className="text-slate-500">—</span>
                  <span>{t.purpose}</span>
                  <span className="rounded bg-slate-100 px-2 text-xs font-bold dark:bg-slate-800">{t.difficulty}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Related Guides */}
        {Array.isArray(display.internalLinks) && display.internalLinks.length > 0 ? (
          <section className="border-t border-slate-200 pt-8 dark:border-slate-800">
            <h3 className="mb-4 text-sm font-bold tracking-widest text-slate-500 uppercase">Related Troubleshooting</h3>
            <div className="flex flex-wrap gap-2">
              {(display.internalLinks as { anchor?: string; slug?: string; title?: string }[]).map((link, i) => (
                <Link
                  key={i}
                  href={`/diagnose/${String(link.slug ?? "").replace(/^\//, "")}`}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {link.anchor ?? link.title ?? "Guide"}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Local Help CTA */}
        <section className="rounded-2xl bg-hvac-navy p-8 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-black">Need Local Help?</h3>
              <p className="mt-1 text-sm text-slate-300">
                HVAC Revenue Boost connects you with verified technicians when field risk is high.
              </p>
            </div>
            <Link
              href="/repair"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-hvac-gold px-6 py-3 font-black text-hvac-navy hover:bg-yellow-400"
            >
              <Phone className="h-5 w-5" />
              Find technicians
            </Link>
          </div>
        </section>

        {/* FAQ */}
        {display.faq.length > 0 ? (
          <section>
            <h2 className="mb-6 text-2xl font-black text-slate-900 dark:text-white">FAQ</h2>
            <div className="space-y-4">
              {display.faq.map((f, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="font-bold text-slate-900 dark:text-white">{f.question}</div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Editorial footer */}
        <footer className="border-t border-slate-200 pt-8 pb-4 text-center text-xs text-slate-500 dark:border-slate-800">
          Procedures are for educational isolation only. Follow manufacturer literature and local codes. Licensed
          technicians should perform work on refrigerant circuits, combustion, and high-voltage equipment.
        </footer>
      </div>
    </div>
  );
}
