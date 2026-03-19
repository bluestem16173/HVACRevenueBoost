"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const DecisionTree = dynamic(() => import("@/components/DecisionTree"), { ssr: false });

interface DiagnosticStep {
  step: number;
  title: string;
  actions: string[];
  interpretation: string;
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
          isRecommended ? "bg-hvac-gold" : "bg-hvac-navy"
        }`}
      >
        <span
          className={`flex items-center justify-center w-7 h-7 rounded-full font-black text-sm shrink-0 ${
            isRecommended ? "bg-hvac-navy text-hvac-gold" : "bg-hvac-gold text-hvac-navy"
          }`}
        >
          {step.step ?? i + 1}
        </span>
        <span
          className={`font-bold text-base tracking-wide ${
            isRecommended ? "text-hvac-navy" : "text-white"
          }`}
        >
          {step.title}
          {isRecommended && (
            <span className="ml-2 text-xs font-black uppercase tracking-widest opacity-70">
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
              <li key={j} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="text-hvac-gold font-bold shrink-0">→</span>
                {action}
              </li>
            ))}
          </ul>
        )}
        {step.interpretation && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 border-l-2 border-hvac-blue pl-3">
            <strong className="text-hvac-blue">Result: </strong>
            {step.interpretation}
          </p>
        )}
        {step.field_insight && (
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
            💡 {step.field_insight}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* DECISION TREE 🔥 */}
      {decisionTree && (
        <DecisionTree
          tree={decisionTree}
          slug={slug}
          onCauseIdentified={handleCauseIdentified}
        />
      )}

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
                href="https://www.homeadvisor.com/sm/entry?keyword=hvac+repair"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-center px-5 py-2.5 bg-hvac-gold text-hvac-navy font-black rounded-lg hover:bg-yellow-400 transition-colors text-sm whitespace-nowrap"
              >
                Get Local HVAC Help →
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
        </section>
      )}
    </>
  );
}
