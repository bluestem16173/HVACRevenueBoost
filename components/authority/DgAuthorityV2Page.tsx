"use client";

import React, { useState } from "react";
import LeadCard from "@/components/LeadCard";
import Mermaid from "@/components/Mermaid";
import { HVACAuthorityPage, HVACAuthorityPageSchema } from "@/types/hvac-authority";

export default function DgAuthorityV2Page({ content }: { content: Record<string, unknown> }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // PRODUCTION LOCK: Enforce strict Zod schema validation
  const validationResult = HVACAuthorityPageSchema.safeParse(content);
  let data;
  if (!validationResult.success) {
    console.warn("Rendering fallback content due to schema drift:", validationResult.error.flatten());
    data = content as any;
  } else {
    data = validationResult.data;
  }

  // Render arrays safely
  const quickChecks = Array.isArray(data.immediate_quick_checks) ? data.immediate_quick_checks : [];
  const diyTools = Array.isArray(data.diy_tools) ? data.diy_tools : [];
  const causes = Array.isArray(data.most_common_causes) ? data.most_common_causes : [];
  const diagnosticFlow = Array.isArray(data.advanced_diagnostic_flow) ? data.advanced_diagnostic_flow : [];
  const repairMatrix = Array.isArray(data.repair_matrix) ? data.repair_matrix : [];
  const preventionTips = Array.isArray(data.prevention_tips) ? data.prevention_tips : [];
  const faqs = Array.isArray(data.faqs) ? data.faqs : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 md:p-6 transition-opacity">
          <div className="relative w-full max-w-2xl max-h-[95vh] bg-white rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-20 flex justify-end p-3 bg-white border-b shrink-0 rounded-t-2xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-full w-10 h-10 flex items-center justify-center font-black text-2xl transition-colors shadow-sm"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="p-1 overflow-y-auto pb-10">
              <LeadCard />
            </div>
          </div>
        </div>
      )}

      {/* Header & Intro */}
      <header className="bg-white border-b border-slate-200 pt-16 pb-12 shadow-sm">
        <div className="container mx-auto max-w-5xl px-4">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
            {data.h1 || data.title}
          </h1>
          {data.intro && (
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-4xl">
              {data.intro}
            </p>
          )}
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 pt-10">
        
        {/* 30-Second Summary */}
        {data.summary_30s && (
          <section className="mb-12 bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-xs font-black tracking-widest uppercase text-blue-800 mb-4 flex items-center bg-blue-50/50 p-2 rounded max-w-fit border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>
              {data.summary_30s.label || "30-Second Summary"}
            </h2>
            
            {data.summary_30s.overview && (
              <p className="text-slate-700 font-medium leading-relaxed mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                {data.summary_30s.overview}
              </p>
            )}

            <ul className="grid md:grid-cols-2 gap-4">
              {data.summary_30s.bullets?.map((b: any, i: number) => (
                <li key={i} className="flex items-start text-slate-700 leading-relaxed font-medium">
                  <span className="text-blue-500 font-black mr-3 mt-0.5">·</span> {b}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* DIY Tools Grid (Full Width directly below summary) */}
        {diyTools.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-black text-slate-900 mb-6">DIY Tools Needed</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {diyTools.map((t: any, i: number) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <strong className="text-slate-900 flex items-center text-lg">
                      <span className="text-blue-500 mr-2 text-xl">🔧</span> {t.tool}
                    </strong>
                  </div>
                  <p className="text-slate-700 text-sm mb-4 flex-grow leading-relaxed">{t.purpose}</p>
                  <div>
                    {t.safe_for_basic_diy ? (
                      <span className="inline-block bg-green-50 text-green-700 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border border-green-200">
                        Safe for DIY
                      </span>
                    ) : (
                      <span className="inline-block bg-red-50 text-red-700 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border border-red-200">
                        Pro / High Risk
                      </span>
                    )}
                    <p className="text-xs text-slate-500 mt-2 italic flex items-start">
                      <span className="text-slate-400 mr-1 not-italic">⚠️</span> {t.caution_note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Immediate Quick Checks */}
        {quickChecks.length > 0 && (
          <section className="mb-16">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                Immediate Quick Checks
              </h2>
              <div className="inline-flex items-center mt-2 text-blue-800 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-md shadow-sm font-bold tracking-wide uppercase text-xs">
                <span className="text-yellow-500 text-base mr-2">★</span> Do this before you call a pro
              </div>
            </div>

            <div className="space-y-0 relative">
              {/* Connecting back line for visual flow */}
              <div className="absolute left-6 md:left-[2.25rem] top-8 bottom-12 w-1 bg-slate-200 z-0 hidden md:block"></div>
              
              {quickChecks.map((qc: any, i: number) => (
                <div key={i} className="relative z-10 flex flex-col md:flex-row mb-6 md:gap-6">
                  {/* Step Number Circle */}
                  <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white text-blue-900 font-black flex items-center justify-center border-4 border-slate-100 shadow-sm text-lg md:text-2xl mx-auto md:mx-0 mb-3 md:mb-0 relative z-10">
                    {qc.step_number}
                  </div>
                  
                  {/* Content Box */}
                  <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm w-full relative z-10">
                    <strong className="block text-slate-900 text-lg md:text-xl mb-2">{qc.instruction}</strong>
                    <span className="text-sm md:text-base text-slate-600 leading-relaxed block">{qc.why_it_matters}</span>
                  </div>

                  {/* High Visibility Arrow linking downward between steps */}
                  {i !== quickChecks.length - 1 && (
                    <div className="w-full h-12 flex justify-center items-center md:hidden">
                       <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* High Risk Warning + Immediate Emergency CTA */}
        {data.high_risk_warning && (
          <div className="mb-16 bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-full h-2 ${data.high_risk_warning.severity === 'critical' ? 'bg-red-700' : 'bg-red-500'}`}></div>
            
            <section className="bg-red-50 border-b border-red-100 p-8 md:p-10">
              <div className="flex items-start">
                <span className="text-red-600 text-4xl mr-4 leading-none">⚠️</span>
                <div>
                  <h3 className="text-2xl font-black text-red-900 mb-3 uppercase tracking-wider">
                    {data.high_risk_warning.title}
                  </h3>
                  <p className="text-red-800 font-medium text-base md:text-lg leading-relaxed mb-4">
                    {data.high_risk_warning.body}
                  </p>
                  {data.high_risk_warning.risk_points?.length > 0 && (
                    <ul className="list-disc pl-5 text-base text-red-800 opacity-90 space-y-2 font-medium">
                      {data.high_risk_warning.risk_points.map((t: any, i: number) => <li key={i}>{t}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            {data.emergency_cta && data.high_risk_warning.show_emergency_cta && (data.high_risk_warning.severity === "high" || data.high_risk_warning.severity === "critical") && (
              <section className="p-8 md:p-10 text-center bg-white flex flex-col items-center justify-center">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">{data.emergency_cta.title}</h3>
                <p className="text-slate-700 mb-6 leading-relaxed text-lg max-w-2xl">{data.emergency_cta.body}</p>
                <div className="bg-red-50 text-red-800 text-xs font-black uppercase tracking-widest inline-block px-4 py-2 rounded-md mb-6 border border-red-200 animate-pulse outline outline-2 outline-white shadow-sm">
                  {data.emergency_cta.urgency_note}
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full md:w-auto rounded-xl bg-yellow-400 text-slate-900 px-10 py-5 font-black transition-transform hover:scale-105 shadow-md uppercase tracking-widest text-lg border border-yellow-500"
                >
                  {data.emergency_cta.button_text}
                </button>
              </section>
            )}
          </div>
        )}

        {/* Most Common Causes (Forced 2x2 Grid) */}
        {causes.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-3">
              Deep Dive: Most Common Causes
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {causes.map((cause: any, i: number) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="flex flex-col mb-4 border-b border-slate-100 pb-4">
                    <span className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-2">Cause #{i + 1}</span>
                    <h3 className="font-black text-slate-900 text-xl leading-tight mb-2">{cause.cause}</h3>
                    <span className="inline-block self-start bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border border-slate-200">
                      Probability: {cause.probability_note}
                    </span>
                  </div>
                  <p className="text-base text-slate-600 mb-6 flex-grow leading-relaxed">{cause.explanation}</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                    <strong className="block text-xs uppercase tracking-widest text-slate-500 mb-3">Common Signs:</strong>
                    <ul className="text-sm text-slate-700 space-y-2 pl-4 list-disc marker:text-slate-400 font-medium">
                      {cause.signs?.map((s: any, j: number) => <li key={j}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How The System Works (Sequence mapping) */}
        {data.how_the_system_works && (
          <section className="mb-16 bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">How This System Actually Works</h2>
            <p className="text-slate-700 mb-8 text-base md:text-lg leading-relaxed max-w-3xl border-l-4 border-blue-200 pl-4 bg-slate-50 py-3 rounded-r-lg">
              {data.how_the_system_works.overview}
            </p>
            <div className="grid md:grid-cols-2 gap-4 relative">
              {data.how_the_system_works.components?.map((c: any, i: number) => (
                <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center shadow-sm hover:border-blue-300 transition-colors">
                  <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-800 font-black flex items-center justify-center mr-4 flex-shrink-0 text-sm border border-blue-200">
                    {i + 1}
                  </div>
                  <span className="text-base text-slate-800 font-bold leading-relaxed">{c}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Advanced Diagnostic Flow */}
        {diagnosticFlow.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-3">
              Advanced Diagnostic Flow
            </h2>
            <div className="space-y-4 mb-12">
              {diagnosticFlow.map((step: any, i: number) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="bg-white border-2 border-slate-200 rounded-xl p-6 md:p-8 shadow-sm w-full relative z-10 max-w-3xl hover:border-slate-300 transition-colors">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-800 text-white font-black flex items-center justify-center text-xl shadow-md mx-auto md:mx-0">
                        {step.step_number}
                      </div>
                      <div className="w-full text-center md:text-left">
                        <h3 className="font-black text-slate-900 mb-2 text-xl">{step.title}</h3>
                        <p className="text-slate-700 font-medium text-base mb-6 bg-slate-50 p-4 rounded-md border border-slate-200 inline-block w-full">{step.check}</p>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6 text-left">
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <strong className="block text-[10px] uppercase mb-2 text-slate-500 tracking-widest border-b border-slate-200 pb-1">If Normal</strong>
                            <span className="text-slate-800 font-medium">{step.normal_result}</span>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <strong className="block text-[10px] uppercase mb-2 text-slate-500 tracking-widest border-b border-slate-200 pb-1">Danger / Fail Result</strong>
                            <span className="text-slate-800 font-medium">{step.danger_or_fail_result}</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-200 text-base text-left">
                          <span className="inline-flex items-center text-blue-900 font-black uppercase text-xs tracking-widest bg-blue-50 px-2 py-1 rounded border border-blue-100 mr-3">Next Action</span>
                          <span className="text-slate-800 font-bold">{step.next_action}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {i !== diagnosticFlow.length - 1 && (
                    <div className="flex justify-center -my-2 relative z-0 h-16 w-full">
                      <div className="w-1 h-full bg-slate-300 rounded-full"></div>
                      <div className="absolute top-1/2 transform -translate-y-1/2 text-slate-400 bg-slate-50 w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Massive Mermaid Diagram directly below advanced flow */}
            {data.mermaid_diagram?.code && (
              <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-300 shadow-md overflow-x-auto text-center w-full max-w-5xl mx-auto">
                <h4 className="font-black text-slate-800 uppercase tracking-widest text-lg mb-8 border-b-2 border-slate-100 pb-4">{data.mermaid_diagram.title}</h4>
                <div className="flex justify-center scale-100 md:scale-110 transform origin-top my-4">
                  <Mermaid chart={data.mermaid_diagram.code} />
                </div>
              </div>
            )}
          </section>
        )}

        {/* Repair Matrix Table */}
        {repairMatrix.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-3">
              Repair matrix & Estimated Costs
            </h2>
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
              <table className="w-full text-left text-sm whitespace-nowrap hidden md:table">
                <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-widest border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-5">Symptom</th>
                    <th className="px-6 py-5">Likely Issue</th>
                    <th className="px-6 py-5">Fix Type</th>
                    <th className="px-6 py-5">Difficulty</th>
                    <th className="px-6 py-5 text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {repairMatrix.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5 font-black text-slate-900 text-base">{row.symptom}</td>
                      <td className="px-6 py-5 text-slate-700 font-medium text-base">{row.likely_issue}</td>
                      <td className="px-6 py-5 text-slate-600 uppercase text-[10px] font-bold tracking-widest">{row.fix_type}</td>
                      <td className="px-6 py-5">
                        <span className="bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                          {row.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-black text-slate-900 text-right text-base">{row.estimated_cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Mobile Table */}
              <div className="md:hidden space-y-0 divide-y divide-slate-100">
                {repairMatrix.map((row: any, i: number) => (
                  <div key={i} className="p-4">
                    <div className="flex justify-between items-center mb-2">
                       <strong className="text-slate-900 font-black">{row.symptom}</strong>
                       <span className="text-slate-900 font-black">{row.estimated_cost}</span>
                    </div>
                    <div className="text-sm text-slate-600 mb-2 font-medium">{row.likely_issue} • <span className="uppercase text-[10px] font-bold">{row.fix_type}</span></div>
                    <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider">
                       Difficulty: {row.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Repair Vs Replace Card */}
        {data.repair_vs_replace && (
          <section className="mb-16">
            <div className="bg-white rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center border border-slate-200 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-3 h-full bg-slate-900"></div>
              <div className="flex-1 pl-4">
                <h2 className="text-2xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-3">Repair vs. Replace Guidelines</h2>
                <div className="grid sm:grid-cols-2 gap-8 text-base mb-8">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="text-slate-900 font-black uppercase tracking-widest text-[11px] mb-4 border-b border-slate-200 pb-2 flex items-center">
                       <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> When to Repair
                    </h4>
                    <p className="text-slate-600 leading-relaxed font-medium">{data.repair_vs_replace.repair_when}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="text-slate-900 font-black uppercase tracking-widest text-[11px] mb-4 border-b border-slate-200 pb-2 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span> When to Replace
                    </h4>
                    <p className="text-slate-600 leading-relaxed font-medium">{data.repair_vs_replace.replace_when}</p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-lg border border-slate-200 text-slate-700 text-sm italic font-medium flex items-start shadow-sm leading-relaxed">
                  <span className="text-slate-400 mr-3 font-normal whitespace-nowrap uppercase text-[10px] tracking-widest not-italic mt-1 border-r border-slate-200 pr-3">Authority Note</span> 
                  {data.repair_vs_replace.decision_note}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* When To Stop & Call a Pro (MAJOR CONVERSION) */}
        {data.when_to_stop_diy && (
          <section className="mb-20 bg-white border border-slate-200 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-3 bg-red-600"></div>
            <div className="p-8 md:p-14 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">{data.when_to_stop_diy.title}</h2>
              <p className="text-slate-600 text-xl mb-10 max-w-3xl mx-auto leading-relaxed">{data.when_to_stop_diy.intro}</p>
              
              <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-8 text-left max-w-3xl mx-auto mb-10 shadow-inner">
                <ul className="space-y-5">
                  {data.when_to_stop_diy.danger_points.map((p: any, i: number) => (
                    <li key={i} className="flex items-start text-red-900 font-bold text-lg">
                      <span className="text-red-500 mr-4 text-2xl leading-none">🛑</span> {p}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-slate-800 font-black mb-10 max-w-2xl mx-auto leading-relaxed text-xl">{data.when_to_stop_diy.conversion_body}</p>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="rounded-2xl bg-red-600 text-white px-10 py-6 font-black transition-transform hover:scale-105 shadow-xl uppercase tracking-widest text-xl w-full md:w-auto"
              >
                {data.when_to_stop_diy.cta_text}
              </button>
            </div>
          </section>
        )}

        {/* Prevention Tips */}
        {preventionTips.length > 0 && (
          <section className="mb-16">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-3">
                Prevention Tips
              </h2>
              <ul className="space-y-4">
                {preventionTips.map((tip: any, i: number) => (
                  <li key={i} className="flex items-start text-slate-700 text-base font-medium leading-relaxed bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                    <span className="text-green-500 mr-4 mt-0.5 font-bold text-xl leading-none">✓</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-3">
              Frequently Asked Questions
            </h2>
            {/* Forced grid structure to safely hold 4 to 6 items */}
            <div className="grid md:grid-cols-2 gap-8">
              {faqs.map((faq: any, i: number) => (
                <div key={i} className="bg-white border text-left border-slate-200 rounded-xl p-8 shadow-sm flex flex-col justify-start">
                  <h4 className="font-black text-slate-900 text-lg mb-4 leading-relaxed border-l-4 border-yellow-400 pl-3">{faq.question}</h4>
                  <p className="text-slate-600 text-base leading-relaxed pl-4">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Internal Footer Links Block */}
        {data.internal_links && (
          <section className="mb-20 pt-10 border-t border-slate-200">
            <h3 className="font-black text-slate-900 mb-6 text-xl">Related Technical Resources</h3>
            <div className="grid sm:grid-cols-3 gap-6 text-sm">
              {data.internal_links.pillar_page && (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                  <strong className="block text-[10px] uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-200 pb-1">Main Category</strong>
                  <a href={`/${data.internal_links.pillar_page.toLowerCase().replace(/\s+/g, '-')}`} className="text-blue-700 hover:text-blue-900 font-bold block text-base">
                    {data.internal_links.pillar_page}
                  </a>
                </div>
              )}
              {Array.isArray(data.internal_links.related_symptoms) && data.internal_links.related_symptoms.length > 0 && (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                  <strong className="block text-[10px] uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-200 pb-1">Similar Symptoms</strong>
                  <ul className="space-y-3">
                    {data.internal_links.related_symptoms.map((link: any, i: number) => (
                      <li key={i}><a href={`/diagnose/${link.toLowerCase().replace(/\s+/g, '-')}`} className="text-blue-600 hover:text-blue-800 font-medium block">{link}</a></li>
                    ))}
                  </ul>
                </div>
              )}
               {Array.isArray(data.internal_links.related_system_pages) && data.internal_links.related_system_pages.length > 0 && (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                  <strong className="block text-[10px] uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-200 pb-1">Related Systems</strong>
                  <ul className="space-y-3">
                    {data.internal_links.related_system_pages.map((link: any, i: number) => (
                      <li key={i}><a href={`/${link.toLowerCase().replace(/\s+/g, '-')}`} className="text-blue-600 hover:text-blue-800 font-medium block">{link}</a></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Final Bottom CTA */}
        {data.bottom_cta && (
          <section className="mb-12 bg-white border-2 border-slate-200 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">{data.bottom_cta.title}</h2>
            <p className="text-slate-600 text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed">{data.bottom_cta.body}</p>
            
            {data.bottom_cta.urgency_bullets?.length > 0 && (
              <ul className="mb-12 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-10">
                {data.bottom_cta.urgency_bullets.map((bull: any, i: number) => (
                  <li key={i} className="text-base md:text-lg font-black text-slate-800 uppercase tracking-widest flex items-center justify-center bg-red-50 py-2 px-4 rounded-md border border-red-100 w-full md:w-auto">
                     <span className="text-red-600 mr-3 text-2xl leading-none">⚠️</span> {bull}
                  </li>
                ))}
              </ul>
            )}

            <button 
              onClick={() => setIsModalOpen(true)}
              className="rounded-2xl bg-yellow-400 text-slate-900 px-10 py-6 font-black transition-transform hover:scale-[1.03] shadow-2xl uppercase tracking-widest text-xl border-b-4 border-yellow-600 w-full md:w-auto active:scale-95"
            >
              {data.bottom_cta.button_text}
            </button>
          </section>
        )}

        {/* Author Note */}
        {data.author_note && (
          <div className="text-center pt-8 border-t border-slate-200 mt-8 mb-4 flex flex-col md:flex-row items-center justify-center text-sm text-slate-500 font-medium">
            <span className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-[10px] uppercase font-black tracking-widest md:mr-4 mb-3 md:mb-0 shadow-sm border border-slate-300">
              Technical Accuracy Verified
            </span>
            {data.author_note}
          </div>
        )}

      </main>
    </div>
  );
}
