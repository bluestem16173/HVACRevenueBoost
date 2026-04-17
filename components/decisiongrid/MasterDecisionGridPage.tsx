"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, ChevronRight, Shield, Wrench } from "lucide-react";
import MermaidRenderer from "@/components/MermaidRenderer";
import { LiveElectricitySafetyNotice } from "@/components/LiveElectricitySafetyNotice";
import type { BasePageViewModel, DiagnosticFlowPlaceholderData, SystemCardData } from "@/lib/content";

/** Static on every page — Electrical/Chemical/Mechanical → Pro; structural (filter-only) → DIY. @see docs/MASTER-PROMPT-DECISIONGRID.md */
const DIY_VS_PRO_MERMAID = `flowchart TD
  A[What kind of work?] --> B{Electrical, refrigerant, or compressor?}
  B -->|Yes| C[Professional repair]
  B -->|No| D{Only clogged filter / airflow you can reach safely?}
  D -->|Yes| E[DIY-friendly maintenance]
  D -->|No| C`;

function isFlowPlaceholder(
  f: BasePageViewModel["diagnosticFlow"],
): f is DiagnosticFlowPlaceholderData {
  return f != null && typeof f === "object" && "steps" in f && Array.isArray((f as DiagnosticFlowPlaceholderData).steps);
}

function badgeClass(diySafe: boolean | undefined, risk?: string): { label: string; className: string } {
  if (diySafe === true) return { label: "DIY Safe", className: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300" };
  const r = (risk || "").toLowerCase();
  if (r === "high") return { label: "Professional Required", className: "bg-rose-100 text-rose-900 ring-1 ring-rose-300" };
  return { label: "Moderate Skill", className: "bg-amber-100 text-amber-900 ring-1 ring-amber-300" };
}

function slugifyLabel(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type Props = {
  pageViewModel: BasePageViewModel;
  rawContent?: Record<string, unknown>;
};

export default function MasterDecisionGridPage({ pageViewModel: vm, rawContent = {} }: Props) {
  const system = typeof rawContent.system === "string" ? rawContent.system : "Residential HVAC";
  const symptom = typeof rawContent.symptom === "string" ? rawContent.symptom : vm.title;
  const difficulty = typeof rawContent.difficulty === "string" ? rawContent.difficulty : undefined;
  const costs = rawContent.costs as { low?: string; average?: string; high?: string } | undefined;
  const safetyNotes = Array.isArray(rawContent.safety_notes)
    ? (rawContent.safety_notes as unknown[]).map((x) => String(x))
    : Array.isArray(rawContent.safetyNotes)
      ? (rawContent.safetyNotes as unknown[]).map((x) => String(x))
      : [];
  const preventionRaw = vm.preventionTips?.length
    ? vm.preventionTips.map((p) => p.name + (p.description ? ` — ${p.description}` : ""))
    : Array.isArray(rawContent.prevention)
      ? (rawContent.prevention as unknown[]).map((x) => String(x))
      : [];
  const relatedConditions = Array.isArray(rawContent.related_conditions)
    ? (rawContent.related_conditions as { name?: string }[])
    : [];

  const flowSteps = isFlowPlaceholder(vm.diagnosticFlow) ? vm.diagnosticFlow.steps : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto max-w-4xl px-4 pt-10 pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <span>{system}</span>
            <ChevronRight className="h-3 w-3" />
            <span>DecisionGrid</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-hvac-blue">{symptom}</span>
          </div>
          <h1 className="mb-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{vm.title}</h1>
          {difficulty ? (
            <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              Difficulty: {difficulty}
            </span>
          ) : null}
        </div>
      </div>

      <div className="container mx-auto max-w-4xl space-y-12 px-4 pt-10">
        {/* Fast answer + 30s summary */}
        {vm.fastAnswer ? (
          <section className="rounded-xl border-l-4 border-hvac-blue bg-blue-50/90 p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-black tracking-wide text-blue-900 uppercase">
              Fast answer
            </div>
            <p className="text-lg font-medium leading-relaxed text-slate-800">{vm.fastAnswer}</p>
          </section>
        ) : null}

        {vm.summary30 && vm.summary30 !== vm.fastAnswer ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-black tracking-wide text-slate-600 uppercase">
              30-second summary
            </div>
            <p className="leading-relaxed text-slate-700">{vm.summary30}</p>
          </section>
        ) : null}

        {vm.fastAnswer || (vm.summary30 && vm.summary30 !== vm.fastAnswer) ? (
          <LiveElectricitySafetyNotice />
        ) : null}

        {/* DIY vs Pro — static */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-slate-900">
            <Shield className="h-6 w-6 text-slate-700" />
            DIY vs professional
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Same decision chart on every page — electrical, refrigerant, and compressor work routes to a licensed pro;
            simple airflow maintenance may be DIY.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
            <MermaidRenderer chart={DIY_VS_PRO_MERMAID} />
          </div>
        </section>

        {/* Diagram 1 — pillar triage */}
        {vm.diagnosticFlowMermaid ? (
          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">Diagnostic flow — pillar triage</h2>
            <p className="mb-4 text-sm text-slate-600">
              Broad pillars only (ducting, electrical, refrigeration, structural, controls). Narrow before naming a specific part.
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <MermaidRenderer chart={vm.diagnosticFlowMermaid} />
            </div>
          </section>
        ) : null}

        {/* Diagram 2 — cause confirmation */}
        {vm.causeConfirmationMermaid ? (
          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">Cause confirmation</h2>
            <p className="mb-4 text-sm text-slate-600">Pillar breakdown into specific causes and repair paths.</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <MermaidRenderer chart={vm.causeConfirmationMermaid} />
            </div>
          </section>
        ) : null}

        {/* Diagnostic steps */}
        {flowSteps.length > 0 ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">
              <BookOpen className="h-5 w-5 text-hvac-blue" />
              Diagnostic steps
            </h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
              {flowSteps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* System cards — Why that system fails */}
        {vm.systemCards && vm.systemCards.length > 0 ? (
          <section>
            <h2 className="mb-4 text-2xl font-black text-slate-900">Why that system fails</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {vm.systemCards.map((card: SystemCardData, i: number) => {
                const b = badgeClass(card.diy_safe, card.risk_level);
                return (
                  <div
                    key={i}
                    className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-black text-slate-900">{card.system}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${b.className}`}>
                        {b.label}
                      </span>
                    </div>
                    {card.summary ? <p className="mb-3 text-sm text-slate-700">{card.summary}</p> : null}
                    {card.why ? (
                      <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3 text-sm leading-relaxed text-slate-800">
                        <span className="font-bold text-amber-900">Field insight — </span>
                        {card.why}
                      </div>
                    ) : null}
                    {card.common_causes && card.common_causes.length > 0 ? (
                      <ul className="mb-3 list-disc pl-4 text-xs text-slate-600">
                        {card.common_causes.map((c, j) => (
                          <li key={j}>{c}</li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="mt-auto flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                      {card.cost_range ? <span>Cost: {card.cost_range}</span> : null}
                      {card.risk_level ? <span className="uppercase">Risk: {card.risk_level}</span> : null}
                    </div>
                    {card.why_not_diy ? (
                      <p className="mt-2 text-xs text-slate-500">{card.why_not_diy}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/diagnose/${card.diagnose_slug}`}
                        className="text-sm font-bold text-hvac-blue hover:underline"
                      >
                        Diagnose →
                      </Link>
                      <Link href={`/fix/${card.repair_slug}`} className="text-sm font-bold text-slate-700 hover:underline">
                        Repair →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Pillar breakdown */}
        {vm.pillarBreakdown && Object.keys(vm.pillarBreakdown).length > 0 ? (
          <section>
            <h2 className="mb-4 text-2xl font-black text-slate-900">Pillar breakdown</h2>
            <div className="space-y-6">
              {Object.entries(vm.pillarBreakdown).map(([pillar, items]) => (
                <div key={pillar} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 font-black capitalize text-slate-900">{pillar.replace(/_/g, " ")}</h3>
                  <ul className="space-y-3 text-sm text-slate-700">
                    {items.map((row, j) => (
                      <li key={j} className="border-l-2 border-slate-200 pl-3">
                        {row.issue ? <div className="font-semibold">{row.issue}</div> : null}
                        {row.explanation ? <p>{row.explanation}</p> : null}
                        {row.warning ? <p className="text-xs text-amber-800">{row.warning}</p> : null}
                        {row.diy_pro ? (
                          <span className="text-xs font-bold text-slate-500">{row.diy_pro}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Repair difficulty matrix */}
        {vm.repairDifficultyMatrix && Object.keys(vm.repairDifficultyMatrix).length > 0 ? (
          <section>
            <h2 className="mb-4 text-2xl font-black text-slate-900">Estimated cost / repair difficulty matrix</h2>
            <div className="space-y-6">
              {Object.entries(vm.repairDifficultyMatrix).map(([pillar, rows]) => (
                <div key={pillar} className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                  <h3 className="mb-3 font-bold capitalize text-slate-800">{pillar.replace(/_/g, " ")}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                          <th className="py-2 pr-4">Repair</th>
                          <th className="py-2 pr-4">Difficulty</th>
                          <th className="py-2">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, j) => (
                          <tr key={j} className="border-b border-slate-100">
                            <td className="py-2 pr-4 font-medium">{row.name}</td>
                            <td className="py-2 pr-4">
                              <span
                                className={
                                  row.color === "green"
                                    ? "text-emerald-700"
                                    : row.color === "red"
                                      ? "text-rose-700"
                                      : "text-amber-700"
                                }
                              >
                                {row.difficulty}
                              </span>
                            </td>
                            <td className="py-2 text-slate-600">{row.cost_range}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Grouped causes */}
        {vm.groupedCauses && Object.keys(vm.groupedCauses).length > 0 ? (
          <section>
            <h2 className="mb-4 text-2xl font-black text-slate-900">Causes by system</h2>
            <div className="space-y-8">
              {Object.entries(vm.groupedCauses).map(([group, causes]) => (
                <div key={group}>
                  <h3 className="mb-3 font-bold capitalize text-slate-800">{group.replace(/_/g, " ")}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {causes.map((c, j) => {
                      const b = badgeClass(c.diy_safe, c.risk);
                      return (
                        <div key={j} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                            <span className="font-bold text-slate-900">{c.name}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${b.className}`}>
                              {b.label}
                            </span>
                          </div>
                          <p className="mb-3 text-sm text-slate-600">{c.why}</p>
                          <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span>Likelihood: {c.likelihood}</span>
                            <span>Cost: {c.estimated_cost}</span>
                          </div>
                          <div className="flex gap-3 text-sm font-bold">
                            <Link href={`/diagnose/${c.diagnose_slug}`} className="text-hvac-blue hover:underline">
                              Diagnose
                            </Link>
                            <Link href={`/fix/${c.repair_slug}`} className="text-slate-700 hover:underline">
                              Repair
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Causes table (flat) */}
        {vm.rankedCauses && vm.rankedCauses.length > 0 && (!vm.groupedCauses || Object.keys(vm.groupedCauses).length === 0) ? (
          <section>
            <h2 className="mb-4 text-xl font-black text-slate-900">Common causes</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-left">Cause</th>
                    <th className="p-3 text-left">Indicator</th>
                  </tr>
                </thead>
                <tbody>
                  {vm.rankedCauses.map((c, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-slate-600">{c.indicator ?? c.explanation ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Repairs */}
        {vm.repairOptions && vm.repairOptions.length > 0 ? (
          <section>
            <h2 className="mb-4 text-xl font-black text-slate-900">Repairs</h2>
            <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
              {vm.repairOptions.map((r, i) => (
                <li key={i} className="flex flex-wrap gap-2 border-b border-slate-100 pb-2 text-sm last:border-0">
                  <span className="font-bold">{r.name}</span>
                  {r.difficulty ? <span className="text-slate-500">({r.difficulty})</span> : null}
                  {r.cost || r.estimated_cost ? (
                    <span className="text-slate-600">{r.cost ?? r.estimated_cost}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Tools + components */}
        {(vm.toolsRequired && vm.toolsRequired.length > 0) || (vm.components && vm.components.length > 0) ? (
          <section className="grid gap-6 md:grid-cols-2">
            {vm.toolsRequired && vm.toolsRequired.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 font-black text-slate-900">
                  <Wrench className="h-5 w-5" />
                  Tools
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {vm.toolsRequired.map((t, i) => (
                    <li key={i}>
                      <span className="font-semibold">{t.name}</span>
                      {t.reason || t.description ? (
                        <span className="text-slate-600"> — {t.reason ?? t.description}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {vm.components && vm.components.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-black text-slate-900">Components</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {vm.components.map((c, i) => (
                    <li key={i}>
                      <span className="font-semibold">{c.name}</span>
                      {c.role ? <span className="text-slate-600"> — {c.role}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Costs + safety */}
        {(costs && (costs.low || costs.average || costs.high)) || safetyNotes.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2">
            {costs && (costs.low || costs.average || costs.high) ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="mb-2 font-black text-slate-900">Typical cost range</h3>
                <ul className="text-sm text-slate-700">
                  {costs.low ? <li>Low: {costs.low}</li> : null}
                  {costs.average ? <li>Average: {costs.average}</li> : null}
                  {costs.high ? <li>High: {costs.high}</li> : null}
                </ul>
              </div>
            ) : null}
            {safetyNotes.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5">
                <h3 className="mb-2 font-black text-amber-950">Safety</h3>
                <ul className="list-disc pl-4 text-sm text-amber-950">
                  {safetyNotes.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Prevention + related */}
        {(preventionRaw.length > 0 || relatedConditions.length > 0) && (
          <section className="grid gap-6 md:grid-cols-2">
            {preventionRaw.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="mb-2 font-black text-slate-900">Prevention</h3>
                <ul className="list-disc pl-4 text-sm text-slate-700">
                  {preventionRaw.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {relatedConditions.length > 0 ? (
              <div className="rounded-xl border border-green-100 bg-emerald-50/50 p-5">
                <h3 className="mb-2 font-black text-emerald-950">Related conditions</h3>
                <ul className="space-y-1 text-sm">
                  {relatedConditions.map((rc, i) =>
                    rc.name ? (
                      <li key={i}>
                        <Link
                          href={`/diagnose/${slugifyLabel(rc.name)}`}
                          className="font-medium text-emerald-900 hover:underline"
                        >
                          {rc.name}
                        </Link>
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        {/* FAQ */}
        {vm.faq && vm.faq.length > 0 ? (
          <section>
            <h2 className="mb-4 text-xl font-black text-slate-900">FAQ</h2>
            <div className="space-y-4">
              {vm.faq.map((f, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-1 font-bold text-slate-900">{f.question}</div>
                  <p className="text-sm leading-relaxed text-slate-700">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Soft disclaimer */}
        {vm.disclaimer ? (
          <section className="rounded-xl border border-slate-200 bg-slate-100/80 p-5 text-sm leading-relaxed text-slate-700">
            {vm.disclaimer}
          </section>
        ) : null}

        {/* When to call a professional — primary conversion */}
        <section className="rounded-xl border-2 border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-rose-900">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <h2 className="text-xl font-black">When to call a professional</h2>
          </div>
          {vm.whenToCallProWarnings && vm.whenToCallProWarnings.length > 0 ? (
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-rose-950">
              {vm.whenToCallProWarnings.map((w, i) => (
                <li key={i}>
                  <strong>{w.type}:</strong> {w.description}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed text-rose-950">
              HVAC systems are complex and expensive. While some minor issues can be addressed safely, many repairs involve
              electrical or refrigerant components that require professional tools and certification. When in doubt,
              consult a licensed technician.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
