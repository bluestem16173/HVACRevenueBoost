"use client";

import { useState, useEffect, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Option {
  value: string;
  label: string;
}

interface Question {
  id: string;
  question: string;
  weight?: number;           // 1–3 per new schema
  options: Option[];
}

// New schema: weighted causes with score_map
interface WeightedCause {
  name: string;
  score_map: Record<string, number>; // "question_id:value" → weight
  recommended_action: string;
  cta_label?: string;
}

// Legacy schema: simple condition-matching outcomes
interface Outcome {
  conditions: Record<string, string>;
  primary_cause: string;
  recommended_action: string;
}

interface DecisionTreeData {
  questions: Question[];
  causes?: WeightedCause[];     // new schema
  outcomes?: Outcome[];         // legacy schema
}

interface Props {
  tree: DecisionTreeData;
  slug: string;
  onCauseIdentified?: (causeId: string) => void;
}

// ─── Weighted Scoring Engine ──────────────────────────────────────────────────

function computeWeightedCause(
  causes: WeightedCause[],
  answers: Record<string, string>
): WeightedCause | null {
  let best: WeightedCause | null = null;
  let bestScore = -1;

  for (const cause of causes) {
    let score = 0;
    for (const [key, weight] of Object.entries(cause.score_map)) {
      const [qid, val] = key.split(":");
      if (answers[qid] === val) {
        score += weight;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = cause;
    }
  }
  return best;
}

// ─── Legacy Outcome Matcher ───────────────────────────────────────────────────

function matchLegacyOutcome(
  outcomes: Outcome[],
  answers: Record<string, string>
): Outcome | null {
  let best: Outcome | null = null;
  let bestScore = -1;

  for (const outcome of outcomes) {
    let matches = 0;
    for (const [qid, val] of Object.entries(outcome.conditions)) {
      if (answers[qid] === val) matches++;
    }
    if (matches > bestScore) {
      bestScore = matches;
      best = outcome;
    }
  }
  return best;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DecisionTree({ tree, slug, onCauseIdentified }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [winningCauseId, setWinningCauseId] = useState<string | null>(null);

  const visibleQuestions = tree?.questions ?? [];
  const allAnswered = visibleQuestions.length > 0 && Object.keys(answers).length >= visibleQuestions.length;

  const computedCause = useMemo(() => {
    if (!tree.causes?.length) return null;
    return computeWeightedCause(tree.causes, answers);
  }, [tree.causes, answers]);

  useEffect(() => {
    if (!(allAnswered || showResult)) return;
    if (!computedCause) return;

    const cId = computedCause.name;

    if (cId && cId !== winningCauseId) {
      setWinningCauseId(cId);
      onCauseIdentified?.(cId);
    }
  }, [computedCause, allAnswered, showResult, winningCauseId, onCauseIdentified]);

  if (!tree?.questions?.length) return null;

  // Progress: only show questions that are relevant
  const progress = (Object.keys(answers).length / visibleQuestions.length) * 100;

  // Pick current question
  const currentQ = visibleQuestions[currentIndex];

  // Compute result
  let primaryCause = "";
  let recommended = "";
  let ctaLabel = "";
  let confidence = 0;

  if (allAnswered || showResult) {
    if (computedCause) {
      primaryCause = computedCause.name;
      recommended = computedCause.recommended_action;
      ctaLabel = computedCause.cta_label ?? "See Repair Guide";
      // Confidence: max possible score vs actual
      const maxScore = tree.causes!.reduce((acc, c) => {
        const max = Object.values(c.score_map).reduce((s, v) => s + v, 0);
        return Math.max(acc, max);
      }, 0);
      const achieved = tree.causes!.reduce((acc, c) => {
        if (c.name !== primaryCause) return acc;
        let s = 0;
        for (const [key, w] of Object.entries(c.score_map)) {
          const [qid, val] = key.split(":");
          if (answers[qid] === val) s += w;
        }
        return s;
      }, 0);
      confidence = maxScore > 0 ? Math.round((achieved / maxScore) * 100) : 75;
    } else if (tree.outcomes?.length) {
      const result = matchLegacyOutcome(tree.outcomes, answers);
      if (result) {
        primaryCause = result.primary_cause;
        recommended = result.recommended_action;
        ctaLabel = "See Repair Guide";
        confidence = 75;
      }
    }
  }

  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Auto-advance to next unanswered question
    const nextIndex = visibleQuestions.findIndex(
      (q, i) => i > currentIndex && !newAnswers[q.id]
    );
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
    } else if (Object.keys(newAnswers).length >= visibleQuestions.length) {
      setShowResult(true);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowResult(false);
    setWinningCauseId(null);
    onCauseIdentified?.("");
  };

  return (
    <section className="mb-12" id="decision-tree">
      <div className="decision-tree-container">

        {/* Header */}
        <div className="decision-tree-header">
          <h2>⚡ Diagnose Your Issue</h2>
          <p>Answer a few quick questions — we&apos;ll identify the most likely cause.</p>
        </div>

        {/* Progress Bar */}
        {!showResult && (
          <div className="decision-tree-progress">
            <div className="decision-tree-progress-bar">
              <div
                className="decision-tree-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="decision-tree-progress-label">
              {Object.keys(answers).length} of {visibleQuestions.length} answered
            </span>
          </div>
        )}

        {/* Questions */}
        {!showResult && (
          <div className="decision-tree-questions">
            {visibleQuestions.map((q, i) => {
              const isActive = i === currentIndex;
              const isAnswered = !!answers[q.id];
              return (
                <div
                  key={q.id}
                  className={`decision-tree-question ${isActive ? "active" : ""} ${isAnswered ? "answered" : ""}`}
                  onClick={() => !isAnswered && setCurrentIndex(i)}
                >
                  <p className="decision-tree-question-text">
                    <span className="question-number">{i + 1}.</span> {q.question}
                  </p>
                  {(isActive || isAnswered) && (
                    <div className="decision-tree-options">
                      {q.options.map((opt) => (
                        <button
                          key={opt.value}
                          className={`decision-tree-option ${answers[q.id] === opt.value ? "selected" : ""}`}
                          onClick={(e) => { e.stopPropagation(); handleAnswer(q.id, opt.value); }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Result */}
        {showResult && primaryCause && (
          <div className="decision-tree-result bg-hvac-navy rounded-2xl p-6 mt-4">
            <div className="text-xs font-black tracking-widest text-hvac-gold uppercase mb-3">⚡ LIKELY ISSUE IDENTIFIED</div>
            <h3 className="text-2xl font-black text-white mb-4">{primaryCause}</h3>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-slate-300 shrink-0">Diagnostic confidence:</span>
              <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-hvac-gold rounded-full transition-all duration-700"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className="text-sm font-black text-hvac-gold shrink-0">{confidence}%</span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed mb-6">{recommended}</p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`/repair/${slug}`}
                className="inline-block text-center px-5 py-2.5 bg-hvac-gold text-hvac-navy font-black rounded-lg hover:bg-yellow-400 transition-colors text-sm"
              >
                {ctaLabel} →
              </a>
              <a
                href="https://www.homeadvisor.com/sm/entry?keyword=hvac+repair"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-center px-5 py-2.5 border border-slate-500 text-white font-bold rounded-lg hover:border-white transition-colors text-sm"
              >
                Get Local HVAC Help →
              </a>
            </div>

            <button
              onClick={handleReset}
              className="mt-4 text-xs text-slate-400 hover:text-white transition-colors underline"
            >
              ↺ Start Over
            </button>
          </div>
        )}

        {/* Fallback: all answered but no result computed yet */}
        {!showResult && allAnswered && (
          <button
            className="decision-tree-option selected"
            style={{ width: "100%", marginTop: "1rem" }}
            onClick={() => setShowResult(true)}
          >
            See My Diagnosis →
          </button>
        )}
      </div>
    </section>
  );
}
