"use client";

import { useState } from "react";
import Link from "next/link";
import { getCauseDiagnosticDetail } from "@/lib/cause-diagnostic-content";
import { normalizeToString } from "@/lib/utils";

export default function InteractiveDiagnosticTree({
  symptomName,
  symptomId,
  causes,
  narrowYourDiagnosisLinks,
  embedded,
}: {
  symptomName: string;
  symptomId: string;
  causes: any[];
  narrowYourDiagnosisLinks: { slug: string; name: string; causeId: string }[];
  embedded?: boolean;
}) {
  const [selectedCause, setSelectedCause] = useState<any | null>(null);

  const handleOpenModal = () => {
    window.dispatchEvent(new Event("open-lead-modal"));
  };

  if (!causes || causes.length === 0) return null;

  const getLinksForCause = (causeId: string) =>
    narrowYourDiagnosisLinks.filter((l) => l.causeId === causeId);

  return (
    <div className={embedded ? "" : "bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8"}>
      {!embedded && (
        <h3 className="text-2xl font-black text-hvac-navy dark:text-white mb-6 m-0 border-0 flex items-center gap-3">
          <span className="bg-hvac-blue text-white w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm">
            ?
          </span>
          Interactive Diagnostic Tree
        </h3>
      )}

      {!selectedCause ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Which of these specifically describes your {normalizeToString(symptomName).toLowerCase()} experience?
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {causes.map((cause) => (
              <button
                key={cause.id}
                onClick={() => setSelectedCause(cause)}
                className="text-left p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-hvac-blue hover:bg-blue-50 dark:hover:bg-slate-800 transition-all group"
              >
                <div className="font-bold text-hvac-navy dark:text-white group-hover:text-hvac-blue transition-colors">
                  {cause.name}
                </div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {cause.explanation}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-300 bg-blue-50/50 dark:bg-slate-800/50 p-6 rounded-xl border border-blue-100 dark:border-slate-700">
          <button
            onClick={() => setSelectedCause(null)}
            className="text-xs font-bold text-slate-400 hover:text-hvac-blue uppercase tracking-widest mb-4 flex items-center gap-1 transition-colors"
          >
            ← Back to Options
          </button>

          <div className="mb-6">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-hvac-blue bg-white dark:bg-slate-900 px-3 py-1 rounded shadow-sm inline-block mb-3">
              Likely Cause Identified
            </span>
            <h4 className="text-xl font-black text-hvac-navy dark:text-white mb-3">
              {selectedCause.name}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {selectedCause.explanation}
            </p>

            {(() => {
              const detail = getCauseDiagnosticDetail(selectedCause.id);
              if (!detail) return null;
              return (
                <div className="space-y-4 text-sm">
                  <div>
                    <strong className="text-slate-700 dark:text-slate-200 block mb-1">
                      How does this happen?
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400 m-0 leading-relaxed">
                      {detail.howItHappens}
                    </p>
                  </div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-200 block mb-1">
                      Why should it be fixed?
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400 m-0 leading-relaxed">
                      {detail.whyChange}
                    </p>
                  </div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-200 block mb-1">
                      Why leave it to professionals?
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400 m-0 leading-relaxed">
                      {detail.whyByPros}
                    </p>
                  </div>
                </div>
              );
            })()}

            {getLinksForCause(selectedCause.id).length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Narrow your diagnosis — head next to:
                </p>
                <div className="flex flex-wrap gap-2">
                  {getLinksForCause(selectedCause.id).map((link) => (
                    <Link
                      key={link.slug}
                      href={`/conditions/${link.slug}`}
                      className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded text-hvac-blue hover:bg-hvac-blue hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-blue-100/50 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <p className="text-sm font-bold text-hvac-navy m-0">
              Professional repair is recommended for this component.
            </p>
            <button
              onClick={handleOpenModal}
              className="w-full sm:w-auto bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-6 py-3 rounded-xl uppercase tracking-widest text-sm transition-transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
            >
              Get HVAC Repair Help →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
