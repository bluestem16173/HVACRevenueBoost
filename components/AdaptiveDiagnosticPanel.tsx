"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const DecisionTree = dynamic(() => import("@/components/DecisionTree"), { ssr: false });
// TEMP: const MermaidDiagram = dynamic(() => import("@/components/MermaidDiagram"), { ssr: false });

interface DiagnosticStep {
  step: number;
  title?: string;
  question?: string;
  actions?: string[];
  yes?: string | { action: string; next_step?: number; likely_cause?: string };
  no?: string | { action: string; next_step?: number; likely_cause?: string };
  interpretation?: string;
  field_insight?: string;
  related_causes?: string[];
}

interface Props {
  decisionTree: any;
  diagnosticFlow: DiagnosticStep[];
  slug: string;
}

export default function AdaptiveDiagnosticPanel({ decisionTree, diagnosticFlow, slug }: Props) {
  const [activeCauseId, setActiveCauseId] = useState<string>("");
  const resultRef = useRef<HTMLDivElement>(null);

  // ① AUTO-SCROLL: When cause is identified → scroll result into view
  useEffect(() => {
    if (activeCauseId && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120); // small delay lets the result card render fully first
    }
  }, [activeCauseId]);

  // ② BROADCAST cause ID via custom event so AdaptiveRepairMatrix can react
  const handleCauseIdentified = (causeId: string) => {
    setActiveCauseId(causeId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hvac-cause-identified", { detail: causeId })
      );
    }
  };

  const hasFlow = Array.isArray(diagnosticFlow) && diagnosticFlow.length > 0;

  // ③ SPLIT FLOW into Recommended (matches cause) + Additional Checks
  const recommendedSteps = hasFlow && activeCauseId
    ? diagnosticFlow.filter(s => s.related_causes?.includes(activeCauseId))
    : [];
  const additionalSteps = hasFlow
    ? activeCauseId
      ? diagnosticFlow.filter(s => !s.related_causes?.includes(activeCauseId))
      : diagnosticFlow
    : [];

  const renderStep = (step: DiagnosticStep, i: number, isRecommended: boolean) => (
    <div
      key={`${step.step}-${i}`}
      className={`rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
        isRecommended
          ? "ring-2 ring-hvac-gold scale-[1.01] border border-hvac-gold bg-white dark:bg-slate-900"
          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
      }`}
    >
      {/* Step header */}
      <div
        className={`flex items-center gap-3 px-5 py-3 transition-colors duration-300 ${
          isRecommended ? "bg-amber-50 dark:bg-amber-900/20 border-b border-hvac-gold/30" : "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700"
        }`}
      >
        <span
          className={`flex items-center justify-center w-7 h-7 rounded-full font-black text-sm shrink-0 ${
            isRecommended ? "bg-hvac-gold text-hvac-navy" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
          }`}
        >
          {step.step ?? i + 1}
        </span>
        <span
          className={`font-bold text-base tracking-wide ${
            isRecommended ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"
          }`}
        >
          {step.title || step.question}
          {isRecommended && (
            <span className="ml-2 text-xs font-black uppercase tracking-widest text-hvac-gold opacity-90">
              ← Likely Match
            </span>
          )}
        </span>
      </div>

      {/* Step body */}
      <div className="px-5 py-4 space-y-3">
        {Array.isArray(step.actions) && step.actions.length > 0 && (
          <ul className="space-y-1.5">
            {step.actions.map((action, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-slate-900 dark:text-white font-medium">
                <span className="text-hvac-gold font-bold shrink-0">→</span>
                {action}
              </li>
            ))}
          </ul>
        )}
        {step.yes && (
          <div className="text-sm text-slate-900 dark:text-white font-medium flex items-start gap-2">
            <span className="text-green-600 font-bold shrink-0">Yes:</span>
            {typeof step.yes === "string" ? step.yes : step.yes.action}
          </div>
        )}
        {step.no && (
          <div className="text-sm text-slate-900 dark:text-white font-medium flex items-start gap-2">
            <span className="text-hvac-safety font-bold shrink-0">No:</span>
            {typeof step.no === "string" ? step.no : step.no.action}
          </div>
        )}
        {step.interpretation && (
          <p className="text-sm font-semibold text-slate-800 dark:text-white border-l-2 border-hvac-blue pl-3">
            <strong className="text-hvac-blue">Result: </strong>
            <span dangerouslySetInnerHTML={{ __html: step.interpretation }} />
          </p>
        )}
        {step.field_insight && (
          <p 
            className="text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2"
            dangerouslySetInnerHTML={{ __html: `💡 ${step.field_insight}` }}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-6 p-4 bg-blue-50 dark:bg-hvac-blue/10 border-l-4 border-hvac-blue rounded-r-xl shadow-sm">
        <p className="text-lg font-bold text-hvac-navy dark:text-blue-100 m-0 leading-relaxed">
          🚀 Start Here: Follow the diagnostic flow and diagram below to quickly identify what’s causing your AC Issue and what to do next.
        </p>
      </div>

      {/* DECISION TREE 🔥 */}
      {decisionTree && typeof decisionTree === "string" ? (
        <div className="mb-12">
          {/* TEMP: MermaidDiagram (decisionTree string) disabled for hydration isolation */}
        </div>
      ) : decisionTree ? (
        <DecisionTree
          tree={decisionTree}
          slug={slug}
          onCauseIdentified={handleCauseIdentified}
        />
      ) : null}

      {/* ① AUTO-SCROLL TARGET — invisible anchor just below tree result */}
      <div ref={resultRef} className="-mt-4 pt-4" />

      {/* ④ SMART CTA — only appears after diagnosis */}
      {activeCauseId && (
        <section className="mb-6">
          <div className="bg-gradient-to-r from-hvac-navy to-hvac-blue rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <p className="text-xs font-black tracking-widest text-hvac-gold uppercase mb-1">Issue Identified</p>
              <h3 className="text-lg font-black text-white leading-tight">
                Need help fixing this?
              </h3>
              <p className="text-sm text-slate-300 mt-1">Get a local technician to confirm the diagnosis and repair.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a
                href="#"
                className="inline-block text-center px-5 py-2.5 bg-slate-300 text-slate-500 font-black rounded-lg cursor-not-allowed text-sm whitespace-nowrap"
              >
                Local Techs Coming Soon
              </a>
              <a
                href={`/repair/${slug}`}
                className="inline-block text-center px-5 py-2.5 border border-slate-400 text-white font-bold rounded-lg hover:border-white transition-colors text-sm whitespace-nowrap"
              >
                See Repair Guide →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ② DIAGNOSTIC FLOW — split into Recommended + Additional */}
      {hasFlow && (
        <section className="mb-12" id="diagnostic-flow">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-2">
            Diagnostic Flow
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            {activeCauseId
              ? "Relevant steps are highlighted. Follow them first to confirm the diagnosis."
              : "Follow these technician steps in sequence. Each step narrows the failure point."}
          </p>

          <div className="space-y-4">
            {/* RECOMMENDED STEPS — shown at top when cause identified */}
            {recommendedSteps.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black tracking-widest text-hvac-gold uppercase">🎯 Recommended Steps for Your Issue</span>
                </div>
                {recommendedSteps.map((step, i) => renderStep(step, i, true))}
                {additionalSteps.length > 0 && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Additional Checks</span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>
                )}
              </div>
            )}

            {/* ADDITIONAL / ALL STEPS */}
            {additionalSteps.map((step, i) => renderStep(step, i, false))}
          </div>

          <p className="mt-6 text-base font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            👉 Once you’ve narrowed it down, see the likely cause, fix steps, and cost breakdown below.
          </p>
        </section>
      )}
    </>
  );
}
