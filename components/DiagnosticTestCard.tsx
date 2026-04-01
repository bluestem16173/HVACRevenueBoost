import React from 'react';
import ThresholdBadge from './ThresholdBadge';

type Props = {
  name: string;
  test: string;
  expected: string;
  confirms: string;
  eliminates: string;
  severity?: "low" | "medium" | "high";
};

export default function DiagnosticTestCard({
  name,
  test,
  expected,
  confirms,
  eliminates,
  severity = "medium"
}: Props) {
  const severityColor = {
    low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
  };

  // Helper to parse thresholds into Badges
  const highlightWithBadges = (str: string) => {
    if (!str) return str;
    const regex = /(\\b\\d+%|±\\d+%|~?\\d+°F|<\\s?\\d+V|>\\s?\\d+V|\\d+\\s?psi|<|>|\\bLOW\\b|\\bHIGH\\b)/g;
    const parts = str.split(regex);
    return (
      <>
        {parts.map((p, i) => regex.test(p) ? <ThresholdBadge key={i}>{p}</ThresholdBadge> : <span key={i}>{p}</span>)}
      </>
    );
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-5 mb-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tight">{name}</h3>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${severityColor[severity]}`}>
          {severity} SEVERITY
        </span>
      </div>

      <div className="space-y-4 text-sm">

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <strong className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">TEST PROCEDURE</strong>
          <p className="text-slate-800 dark:text-slate-300 font-medium leading-relaxed">{highlightWithBadges(test)}</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <strong className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">EXPECTED RESULT</strong>
          <p className="text-slate-800 dark:text-slate-300 font-medium leading-relaxed">{highlightWithBadges(expected)}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <div className="flex-1 bg-red-50 dark:bg-red-900/10 border-l-2 border-red-500 p-3 rounded-r-lg">
            <strong className="block text-[10px] text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">CONFIRMS</strong>
            <p className="text-red-900 dark:text-red-300 font-bold leading-tight">{confirms}</p>
          </div>

          <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/10 border-l-2 border-emerald-500 p-3 rounded-r-lg">
            <strong className="block text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">ELIMINATES</strong>
            <p className="text-emerald-900 dark:text-emerald-300 font-bold leading-tight">{eliminates}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
