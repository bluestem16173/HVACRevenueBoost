"use client";

import { useState } from "react";
import InteractiveDiagnosticTree from "./InteractiveDiagnosticTree";

export default function DiagnosticTreeModal({
  symptomName,
  symptomId,
  causes,
  narrowYourDiagnosisLinks,
}: {
  symptomName: string;
  symptomId: string;
  causes: any[];
  narrowYourDiagnosisLinks: { slug: string; name: string; causeId: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!causes?.length) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-white dark:bg-slate-900 border-2 border-hvac-navy dark:border-hvac-blue text-hvac-navy dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 text-center py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2"
      >
        <span className="bg-hvac-blue text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">?</span>
        Open Interactive Diagnostic Tree
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="diagnostic-tree-title"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 id="diagnostic-tree-title" className="text-xl font-black text-hvac-navy dark:text-white m-0">
                Interactive Diagnostic Tree
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xl transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <InteractiveDiagnosticTree
                symptomName={symptomName}
                symptomId={symptomId}
                causes={causes}
                narrowYourDiagnosisLinks={narrowYourDiagnosisLinks}
                embedded
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
