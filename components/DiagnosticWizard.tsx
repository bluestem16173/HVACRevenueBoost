"use client";

import { useState, useEffect } from "react";

export interface DiagnosticStep {
  id: string;
  diagnostic_id: string;
  step_order: number;
  question: string;
  yes_target_slug: string | null;
  no_target_slug: string | null;
  yes_cause_slug: string | null;
  no_cause_slug: string | null;
}

export interface CauseResult {
  slug: string;
  name: string;
  repair?: string;
  estimated_cost?: string;
}

interface DiagnosticWizardProps {
  diagnosticSlug: string;
  onComplete?: (cause: CauseResult | null) => void;
}

export default function DiagnosticWizard({ diagnosticSlug, onComplete }: DiagnosticWizardProps) {
  const [steps, setSteps] = useState<DiagnosticStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [result, setResult] = useState<CauseResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSteps() {
      try {
        const res = await fetch(`/api/diagnostic-steps?diagnostic=${diagnosticSlug}`);
        const data = await res.json();
        if (data.steps?.length) {
          setSteps(data.steps.sort((a: DiagnosticStep, b: DiagnosticStep) => a.step_order - b.step_order));
        }
      } catch {
        setSteps([]);
      } finally {
        setLoading(false);
      }
    }
    loadSteps();
  }, [diagnosticSlug]);

  const handleAnswer = (answer: boolean) => {
    const step = steps[currentStepIndex];
    if (!step) return;

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    const causeSlug = answer ? step.yes_cause_slug : step.no_cause_slug;
    const nextSlug = answer ? step.yes_target_slug : step.no_target_slug;

    if (causeSlug) {
      fetch(`/api/cause-by-slug?slug=${causeSlug}`)
        .then((r) => r.json())
        .then((cause) => {
          const res: CauseResult = {
            slug: cause.slug,
            name: cause.name,
            repair: cause.repair_name,
            estimated_cost: cause.estimated_cost,
          };
          setResult(res);
          onComplete?.(res);
        })
        .catch(() => {
          setResult({ slug: causeSlug, name: causeSlug.replace(/-/g, " ") });
          onComplete?.(null);
        });
      return;
    }

    if (nextSlug && currentStepIndex + 1 < steps.length) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setResult(null);
      onComplete?.(null);
    }
  };

  const handleOpenLeadModal = () => {
    window.dispatchEvent(new Event("open-lead-modal"));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 p-8 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-6"></div>
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full mb-4"></div>
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
      </div>
    );
  }

  if (steps.length === 0) {
    return null;
  }

  if (result) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-hvac-blue bg-blue-50 dark:bg-slate-800 px-3 py-1 rounded shadow-sm inline-block mb-4">
          Diagnostic Complete
        </span>
        <h3 className="text-2xl font-black text-hvac-navy dark:text-white mb-2">Likely Cause</h3>
        <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">{result.name}</p>
        {result.repair && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            <strong>Typical repair:</strong> {result.repair}
          </p>
        )}
        {result.estimated_cost && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            <strong>Est. cost:</strong> {result.estimated_cost}
          </p>
        )}
        <button
          onClick={handleOpenLeadModal}
          data-open-lead-modal
          className="w-full bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-6 py-4 rounded-xl uppercase tracking-widest text-sm transition-transform hover:scale-[1.02] shadow-md flex items-center justify-center gap-2"
        >
          Get HVAC Repair Help →
        </button>
      </div>
    );
  }

  const step = steps[currentStepIndex];
  if (!step) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-6">
        <span className="bg-hvac-blue text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
          {currentStepIndex + 1}
        </span>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
      </div>
      <h3 className="text-xl font-black text-hvac-navy dark:text-white mb-6">{step.question}</h3>
      <div className="flex gap-4">
        <button
          onClick={() => handleAnswer(true)}
          className="flex-1 py-4 px-6 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 font-bold text-green-800 dark:text-green-200 transition-colors"
        >
          Yes
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className="flex-1 py-4 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition-colors"
        >
          No
        </button>
      </div>
    </div>
  );
}
