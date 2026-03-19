/**
 * Modular Section Renderer — Layout-Aware
 * --------------------------------------
 * Renders individual sections from canary content_json.
 * Each section is independently renderable (no cross-references).
 *
 * @see docs/MASTER-PROMPT-CANARY.md
 */

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { normalizeToString } from "@/lib/utils";
import { normalizeItems } from "@/lib/text-format";

const MermaidDiagram = dynamic(() => import("@/components/MermaidDiagram"), { ssr: false });

export interface SectionRendererProps {
  sectionKey: string;
  sectionData: unknown;
  symptomName?: string;
  symptomSlug?: string;
}

export function renderSection({
  sectionKey,
  sectionData,
  symptomName = "",
  symptomSlug = "",
}: SectionRendererProps): React.ReactNode {
  const s = sectionData as Record<string, unknown>;
  if (!s) return null;

  switch (sectionKey) {
    case "hero":
      return (
        <section className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight m-0">
            {(s.title as string) || symptomName}
          </h1>
          <div className="mt-6 text-gray-600 dark:text-slate-400 text-lg leading-relaxed">
            {(s.description as string) || ""}
          </div>
        </section>
      );

    case "technician_summary":
      return (
        <section className="mb-12">
          <div className="p-6 sm:p-8 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-hvac-brown-warm rounded-r-xl shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-hvac-brown dark:text-amber-200 mb-3">
              Technician Statement
            </h3>
            <p className="text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed m-0">
              {String(sectionData ?? s)}
            </p>
            <p className="text-xs font-bold text-hvac-brown dark:text-amber-200/80 mt-4 m-0 uppercase tracking-widest">
              — ASHRAE Fundamentals & Top Rated Local Techs
            </p>
          </div>
        </section>
      );

    case "fast_answer": {
      const fa = s as { summary?: string; likely_cause?: string };
      const text = fa.summary || fa.likely_cause || "";
      if (!text) return null;
      return (
        <section className="mb-12" id="fast-answer">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Fast Answer</h2>
          <div className="p-6 bg-hvac-blue/5 dark:bg-hvac-blue/10 border-l-4 border-hvac-blue rounded-r-xl">
            <p className="text-xl font-medium text-slate-800 dark:text-slate-200 m-0 leading-relaxed">{text}</p>
          </div>
        </section>
      );
    }

    case "most_common_fix": {
      const mcf = s as { title?: string; steps?: string[]; difficulty?: string; estimated_cost?: string };
      if (!mcf.title) return null;
      return (
        <section className="mb-12" id="common-fix">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Most Common Fix</h2>
          <div className="bg-white dark:bg-slate-900 border-2 border-green-500 dark:border-green-600 p-6 rounded-xl shadow-md">
            <h3 className="text-2xl font-black text-hvac-navy dark:text-white m-0">{mcf.title}</h3>
            {(mcf.steps?.length ?? 0) > 0 && (
              <ul className="mt-4 space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
                {mcf.steps!.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex gap-4 text-sm">
              <span className="font-bold text-slate-500">Cost:</span>
              <span className="font-black text-hvac-navy dark:text-white">{mcf.estimated_cost ?? "—"}</span>
              <span className="font-bold text-slate-500 ml-4">Difficulty:</span>
              <span className="font-black text-green-600 dark:text-green-400">{mcf.difficulty ?? "—"}</span>
            </div>
          </div>
        </section>
      );
    }

    case "diagnostic_flow": {
      const mermaid = (s as { mermaid?: string }).mermaid;
      if (!mermaid) return null;
      return (
        <section className="mb-12" id="flowchart">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Diagnostic Flowchart</h2>
          <div className="w-full overflow-auto bg-hvac-brown/5 dark:bg-hvac-brown/10 border border-hvac-brown/20 rounded-xl p-6">
            <MermaidDiagram chart={mermaid} title="Diagnostic Flowchart" className="w-full min-w-0" />
          </div>
        </section>
      );
    }

    case "guided_filters": {
      const gf = s as { environment?: string[]; symptoms?: string[]; noise?: string[] };
      const env = gf.environment ?? [];
      const sym = gf.symptoms ?? [];
      const noise = gf.noise ?? [];
      if (env.length === 0 && sym.length === 0 && noise.length === 0) return null;
      return (
        <section className="mb-16" id="guided-diagnosis">
          <div className="bg-hvac-navy p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-black text-white mb-2">Guided Diagnosis Filters</h2>
            <div className="grid md:grid-cols-3 gap-6 mt-4">
              {env.length > 0 && (
                <div className="bg-hvac-brown/30 p-5 rounded-xl">
                  <h4 className="text-xs font-black text-hvac-gold uppercase tracking-widest mb-4">Environment</h4>
                  <div className="flex flex-wrap gap-2">
                    {env.map((o: any, i: number) => (
                    <Link key={`env-${i}`} href={`/conditions/${normalizeToString(o).toLowerCase().replace(/\s+/g, "-")}`} className="px-3 py-2 bg-hvac-brown/50 hover:bg-hvac-blue text-white text-sm font-bold rounded">
                      {normalizeToString(o)}
                    </Link>
                    ))}
                  </div>
                </div>
              )}
              {sym.length > 0 && (
                <div className="bg-hvac-brown/30 p-5 rounded-xl">
                  <h4 className="text-xs font-black text-hvac-gold uppercase tracking-widest mb-4">Conditions</h4>
                  <div className="flex flex-wrap gap-2">
                    {sym.map((o: any, i: number) => (
                    <Link key={`sym-${i}`} href={`/conditions/${normalizeToString(o).toLowerCase().replace(/\s+/g, "-")}`} className="px-3 py-2 bg-hvac-brown/50 hover:bg-hvac-blue text-white text-sm font-bold rounded">
                      {normalizeToString(o)}
                    </Link>
                    ))}
                  </div>
                </div>
              )}
              {noise.length > 0 && (
                <div className="bg-hvac-brown/30 p-5 rounded-xl">
                  <h4 className="text-xs font-black text-hvac-gold uppercase tracking-widest mb-4">Noise(s)</h4>
                  <div className="flex flex-wrap gap-2">
                    {noise.map((o: any, i: number) => (
                    <Link key={`noise-${i}`} href={`/conditions/${normalizeToString(o).toLowerCase().replace(/\s+/g, "-")}`} className="px-3 py-2 bg-hvac-brown/50 hover:bg-hvac-blue text-white text-sm font-bold rounded">
                      {normalizeToString(o)}
                    </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    case "causes": {
      const causes = Array.isArray(s) ? s : (s as { causes?: unknown[] }).causes ?? [];
      if (!Array.isArray(causes) || causes.length === 0) return null;
      return (
        <section className="mb-16" id="common-causes">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">Common Causes</h2>
          <div className="space-y-6">
            {causes.map((c: any, idx: number) => (
              <div key={idx} className="border-l-4 border-hvac-blue pl-6">
                <h3 className="text-xl font-bold text-hvac-navy dark:text-white">{normalizeToString(c.name)}</h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">{normalizeToString(c.description)}</p>
                {Array.isArray(c.indicators) && c.indicators.length > 0 && (
                  <p className="text-sm text-slate-500 mt-2">
                    <strong>Indicators:</strong> {c.indicators.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "repairs": {
      const repairs = Array.isArray(s) ? s : (s as { repairs?: unknown[] }).repairs ?? [];
      if (!Array.isArray(repairs) || repairs.length === 0) return null;
      return (
        <section className="mb-16">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Repairs</h2>
          <div className="space-y-4">
            {repairs.map((r: any, idx: number) => (
              <Link
                key={idx}
                href={`/fix/${r.slug || normalizeToString(r.name).toLowerCase().replace(/\s+/g, "-")}`}
                className="block p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-hvac-blue"
              >
                <span className="font-bold text-slate-800 dark:text-slate-200">{normalizeToString(r.name)}</span>
                <span className="ml-2 text-sm text-slate-500">
                  {r.difficulty} · {r.estimated_cost ?? r.cost}
                </span>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case "repair_matrix": {
      const matrix = Array.isArray(s) ? s : (s as { repair_matrix?: unknown[] }).repair_matrix ?? [];
      if (!Array.isArray(matrix) || matrix.length === 0) return null;
      return (
        <section className="mb-16">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Repair Difficulty Matrix</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-4 font-bold">Repair</th>
                  <th className="p-4 font-bold">Difficulty</th>
                  <th className="p-4 font-bold">Cost</th>
                  <th className="p-4 font-bold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {matrix.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-medium">{row.repair}</td>
                    <td className="p-4">{row.difficulty}</td>
                    <td className="p-4">{row.cost}</td>
                    <td className="p-4">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    case "tools": {
      const toolsRaw = Array.isArray(s) ? s : (s as { tools?: unknown[] }).tools ?? [];
      const tools = normalizeItems(Array.isArray(toolsRaw) ? toolsRaw : []);
      return (
        <section className="mb-16">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Tools Required</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {tools.map((t: any, idx: number) => (
              <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="font-bold text-slate-700 dark:text-slate-300">{t.name}</div>
                <div className="text-xs text-slate-500 mt-1">{t.purpose ?? t.reason}</div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "components": {
      const compsRaw = Array.isArray(s) ? s : (s as { components?: unknown[] }).components ?? [];
      const comps = normalizeItems(Array.isArray(compsRaw) ? compsRaw : []);
      return (
        <section className="mb-16">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Components</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {comps.map((c: any, idx: number) => (
              <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="font-bold text-slate-700 dark:text-slate-300">{c.name}</div>
                <div className="text-xs text-slate-500 mt-1">{c.role ?? c.description}</div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "costs": {
      const costs = s as { diy?: string; moderate?: string; professional?: string };
      if (!costs.diy && !costs.moderate && !costs.professional) return null;
      return (
        <section className="mb-16" id="cost">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Typical Repair Costs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {costs.diy && (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 p-6 rounded-xl">
                <h3 className="text-sm font-black text-green-800 uppercase tracking-widest mb-2">DIY / Low</h3>
                <p className="text-3xl font-black text-slate-800 m-0">{costs.diy}</p>
              </div>
            )}
            {costs.moderate && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 p-6 rounded-xl">
                <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-2">Moderate</h3>
                <p className="text-3xl font-black text-slate-800 m-0">{costs.moderate}</p>
              </div>
            )}
            {costs.professional && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 p-6 rounded-xl">
                <h3 className="text-sm font-black text-red-800 uppercase tracking-widest mb-2">Professional</h3>
                <p className="text-3xl font-black text-slate-800 m-0">{costs.professional}</p>
              </div>
            )}
          </div>
        </section>
      );
    }

    case "insights": {
      const insights = Array.isArray(s) ? s : [];
      if (insights.length === 0) return null;
      return (
        <section className="mb-16">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">Technician Insights</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {insights.slice(0, 2).map((text: string | { text?: string }, idx: number) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-xl border-l-4 border-l-hvac-blue">
                <p className="text-slate-700 dark:text-slate-300 italic m-0">
                  &quot;{typeof text === "string" ? text : text.text}&quot;
                </p>
                <p className="text-xs font-bold text-slate-500 mt-3 m-0">— Top Rated Local Techs</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "warnings": {
      const w = s as { ignore_risk?: string; safety?: string };
      if (!w.ignore_risk && !w.safety) return null;
      return (
        <section className="mb-16">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-hvac-gold/50 p-8 rounded-2xl">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-3">⚠️ What Happens If You Ignore This?</h2>
            <p className="text-slate-700 dark:text-slate-300 font-medium m-0">{w.ignore_risk}</p>
            {w.safety && (
              <p className="text-slate-700 dark:text-slate-300 font-medium mt-4 m-0">
                <strong>Safety:</strong> {w.safety}
              </p>
            )}
          </div>
        </section>
      );
    }

    case "mistakes": {
      const mistakes = Array.isArray(s) ? s : [];
      if (mistakes.length === 0) return null;
      return (
        <section className="mb-16" id="common-mistakes">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Common DIY Mistakes</h2>
          <ul className="space-y-4 list-none p-0">
            {mistakes.map((m: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-hvac-safety font-black mt-1">✗</span>
                <span className="text-slate-700 dark:text-slate-300">{m}</span>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    case "environmental_factors": {
      const factors = Array.isArray(s) ? s : [];
      if (factors.length === 0) return null;
      return (
        <section className="mb-16">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Environmental Factors</h2>
          <div className="space-y-4">
            {factors.map((f: string, idx: number) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                {f}
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "prevention": {
      const tips = Array.isArray(s) ? s : [];
      if (tips.length === 0) return null;
      return (
        <section className="mb-16" id="prevention">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Prevention Tips</h2>
          <ul className="grid sm:grid-cols-3 gap-6 list-none p-0">
            {tips.map((tip: string, idx: number) => (
              <li key={idx} className="text-center">
                <div className="w-12 h-12 bg-hvac-navy text-hvac-gold rounded-full flex items-center justify-center mx-auto mb-3 font-black text-xl">
                  {idx + 1}
                </div>
                <span className="font-medium text-slate-800 dark:text-slate-200">{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    case "cta": {
      const cta = s as { primary?: string; secondary?: string };
      if (!cta.primary) return null;
      return (
        <section className="mb-16" id="get-quote">
          <div className="bg-hvac-navy text-white p-10 md:p-14 rounded-3xl text-center">
            <h2 className="text-3xl md:text-5xl font-black m-0 mb-6 text-white">{cta.primary}</h2>
            <button data-open-lead-modal className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-10 py-5 rounded-2xl uppercase tracking-widest text-lg">
              Request Diagnostic Today
            </button>
          </div>
        </section>
      );
    }

    case "faq": {
      const faq = Array.isArray(s) ? s : [];
      if (faq.length === 0) return null;
      return (
        <section className="mb-16" id="faq">
          <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faq.map((item: { question?: string; answer?: string }, idx: number) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 m-0">{item.question}</h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2 m-0">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "internal_links": {
      const links = Array.isArray(s) ? s : [];
      if (links.length === 0) return null;
      return (
        <section className="mb-16">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Related Guides</h2>
          <div className="flex flex-wrap gap-3">
            {links.map((link: { type?: string; slug?: string; anchor?: string }, idx: number) => (
              <Link
                key={idx}
                href={`/${link.type}/${link.slug}`}
                className="text-sm font-bold text-hvac-blue hover:underline"
              >
                {link.anchor || link.slug} →
              </Link>
            ))}
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}
