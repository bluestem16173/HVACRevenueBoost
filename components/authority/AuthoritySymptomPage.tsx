"use client";

import React from "react";
// TEMP: import MermaidRenderer from "@/components/MermaidRenderer";

type ContentRecord = Record<string, unknown>;

function escapeHtml(s: string): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeHtml(s: string): string {
  return s || "";
}

export default function AuthoritySymptomPage({ content }: { content: ContentRecord }) {
  const fastAnswer = content.aiSummary30s as string | undefined;
  const sysExp = content.systemExplanation as string | undefined;
  const deepDive = content.technicalDeepDive as
    | { physicsBody?: string; badgeLabel?: string }
    | undefined;
  const causes = (content.causes as Record<string, string>[]) || [];
  const repairs = (content.repairs as Record<string, string>[]) || [];
  const diagnostics = (content.diagnostics as { title?: string; steps?: string[]; field_insight?: string }[]) || [];
  const faqs = (content.faqs as { question?: string; answer?: string }[]) || [];
  const relatedLinks = (content.relatedLinks as { href?: string; slug?: string; label?: string; title?: string }[]) || [];
  const guideLinks = (content.guideLinks as { href?: string; slug?: string; label?: string; title?: string }[]) || [];
  const merm = content.mermaid as string | undefined;
  const tools = (content.tools as { name?: string; purpose?: string }[]) || [];
  const ctaBlock = content.ctaAboveFold as
    | { headline?: string; subtext?: string; href?: string; buttonText?: string }
    | undefined;

  const mostLikelyRepair = repairs.length > 0 ? repairs[0] : null;
  const allLinks = [...guideLinks, ...relatedLinks];

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-800">
      <div className="container mx-auto max-w-4xl px-4 pt-8">
        <div className="dg-money-printer-layout font-sans text-slate-800">
          {fastAnswer ? (
            <section className="mb-12">
              <div className="rounded-xl border-l-4 border-[#3b82f6] bg-[#e6f0fa] p-6 shadow-sm">
                <h2 className="mb-3 text-xs font-black tracking-widest text-blue-700 uppercase">
                  30-Second Summary
                </h2>
                <p
                  className="text-lg leading-relaxed font-medium text-slate-700"
                  dangerouslySetInnerHTML={{ __html: safeHtml(fastAnswer) }}
                />
              </div>
            </section>
          ) : null}

          {mostLikelyRepair ? (
            <section className="mb-10">
              <div className="rounded-xl border border-blue-200 bg-[#e6f0fa] p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-black text-blue-900">Most Likely Fix</h2>
                <h3 className="mb-2 text-lg font-bold">{escapeHtml(mostLikelyRepair.pattern || "")}</h3>
                <p className="mb-3 text-slate-700">{escapeHtml(mostLikelyRepair.fix || "")}</p>
                <div className="flex gap-4 text-xs font-bold uppercase">
                  <span>Cost: {escapeHtml(mostLikelyRepair.cost || "")}</span>
                  <span>Difficulty: {escapeHtml(mostLikelyRepair.difficulty || "")}</span>
                </div>
              </div>
            </section>
          ) : null}

          {tools.length > 0 ? (
            <section className="mb-10">
              <h2 className="mb-3 text-lg font-black">Quick Repair Toolkit</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {tools.slice(0, 3).map((t, i) => (
                  <div key={i} className="rounded-lg border bg-slate-50 p-3">
                    <div className="text-sm font-bold">{escapeHtml(t.name || "")}</div>
                    <div className="text-xs text-slate-600">{escapeHtml(t.purpose || "")}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {ctaBlock?.headline ? (
            <section className="mb-12 text-center">
              <div className="rounded-xl bg-slate-900 p-6 text-white">
                <h2 className="mb-2 text-xl font-black">{escapeHtml(ctaBlock.headline)}</h2>
                {ctaBlock.subtext ? (
                  <p className="mb-4 text-sm">{escapeHtml(ctaBlock.subtext)}</p>
                ) : null}
                <a
                  href={ctaBlock.href || "#"}
                  className="inline-block rounded bg-yellow-400 px-6 py-3 font-bold text-black"
                >
                  {escapeHtml(ctaBlock.buttonText || "Learn more")}
                </a>
              </div>
            </section>
          ) : null}

          {diagnostics.length > 0 ? (
            <section className="mb-12">
              <div className="rounded-xl border border-green-200 bg-[#e6f4ea] p-6">
                <h2 className="mb-4 text-lg font-black">Quick Diagnostic Checklist</h2>
                {diagnostics.map((d, idx) => (
                  <div key={idx} className="mb-4">
                    <strong>{escapeHtml(d.title || "")}</strong>
                    <ul className="mt-2 text-sm">
                      {(d.steps || []).map((s, j) => (
                        <li key={j}>• {escapeHtml(s)}</li>
                      ))}
                    </ul>
                    {d.field_insight ? (
                      <div className="mt-2 border-l-4 border-yellow-400 bg-[#fff7cc] p-2 text-xs">
                        💡 {escapeHtml(d.field_insight)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {merm ? (
            <section className="mb-12">
              <h2 className="mb-3 text-lg font-black">Diagnostic Flow</h2>
              <div className="rounded-xl border bg-slate-50 p-4">
                {/* TEMP: <MermaidRenderer chart={merm} /> */}
              </div>
            </section>
          ) : null}

          {causes.length > 0 ? (
            <section className="mb-12">
              <h2 className="mb-4 text-xl font-black">Common Causes</h2>
              <table className="w-full text-sm">
                <thead className="bg-[#e6f0fa]">
                  <tr>
                    <th className="p-3 text-left">Cause</th>
                    <th className="p-3 text-left">Check</th>
                  </tr>
                </thead>
                <tbody>
                  {causes.map((c, i) => (
                    <tr key={i}>
                      <td className="p-3">{escapeHtml(c.name || "")}</td>
                      <td className="p-3">{escapeHtml(c.first_check || "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          {deepDive?.physicsBody || sysExp ? (
            <section className="mb-12">
              <div className="rounded-xl border border-blue-200 bg-[#e6f0fa] p-6">
                <h2 className="mb-2 font-black">{escapeHtml(deepDive?.badgeLabel || "Technical Deep Dive")}</h2>
                <div
                  className="prose prose-slate max-w-none text-slate-800"
                  dangerouslySetInnerHTML={{
                    __html: safeHtml(deepDive?.physicsBody || sysExp || ""),
                  }}
                />
              </div>
            </section>
          ) : null}

          {allLinks.length > 0 ? (
            <section className="mb-12">
              <div className="rounded-xl border border-green-200 bg-[#e6f4ea] p-6">
                <h3 className="mb-3 font-black">Related Troubleshooting</h3>
                <div className="grid gap-2 md:grid-cols-3">
                  {allLinks.map((l, i) => (
                    <a key={i} href={l.href || l.slug || "#"} className="text-sm">
                      {escapeHtml(l.label || l.title || l.href || "")}
                    </a>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {faqs.length > 0 ? (
            <section className="mb-12">
              <h2 className="mb-4 text-xl font-black">FAQ</h2>
              {faqs.map((f, i) => (
                <div key={i} className="mb-3">
                  <strong>{escapeHtml(f.question || "")}</strong>
                  <p>{escapeHtml(f.answer || "")}</p>
                </div>
              ))}
            </section>
          ) : null}

          {ctaBlock?.headline ? (
            <section className="mb-16 text-center">
              <div className="rounded-xl bg-slate-900 p-6 text-white">
                <h2 className="mb-2 text-xl font-black">{escapeHtml(ctaBlock.headline)}</h2>
                <a
                  href={ctaBlock.href || "#"}
                  className="inline-block rounded bg-yellow-400 px-6 py-3 font-bold text-black"
                >
                  {escapeHtml(ctaBlock.buttonText || "Learn more")}
                </a>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
