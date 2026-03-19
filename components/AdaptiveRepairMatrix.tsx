"use client";

import { useState, useEffect } from "react";

interface RepairEntry {
  name: string;
  difficulty: string;
  estimated_cost_range?: string;
  description?: string;
}

interface RepairMatrix {
  electrical?: RepairEntry[];
  mechanical?: RepairEntry[];
  structural?: RepairEntry[];
}

interface Props {
  repairMatrix: RepairMatrix;
}

const SYSTEM_LABELS: Record<string, string> = {
  electrical: "⚡ Electrical",
  mechanical: "⚙️ Mechanical",
  structural: "🏗️ Structural",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-green-600 dark:text-green-400",
  medium: "text-amber-600 dark:text-amber-400",
  moderate: "text-amber-600 dark:text-amber-400",
  hard: "text-red-600 dark:text-red-400",
};

export default function AdaptiveRepairMatrix({ repairMatrix }: Props) {
  const [activeCauseId, setActiveCauseId] = useState<string>("");

  // Listen for cause ID from AdaptiveDiagnosticPanel via custom event
  useEffect(() => {
    const handler = (e: Event) => {
      setActiveCauseId((e as CustomEvent<string>).detail ?? "");
    };
    window.addEventListener("hvac-cause-identified", handler);
    return () => window.removeEventListener("hvac-cause-identified", handler);
  }, []);

  // Check if a repair name matches the active cause
  const isHighlighted = (item: RepairEntry): boolean => {
    if (!activeCauseId) return false;
    const causeWords = activeCauseId.replace(/_/g, " ").toLowerCase().split(" ");
    const itemName = item.name.toLowerCase();
    const itemDesc = (item.description ?? "").toLowerCase();
    return causeWords.some(word => word.length > 3 && (itemName.includes(word) || itemDesc.includes(word)));
  };

  const systems = (["electrical", "mechanical", "structural"] as const).filter(
    sys => repairMatrix[sys]?.length
  );

  if (!systems.length) return null;

  return (
    <section className="mb-12" id="repair-matrix">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black text-hvac-navy dark:text-white">Repair Matrix</h2>
        {activeCauseId && (
          <span className="text-xs font-bold text-hvac-gold bg-hvac-navy px-3 py-1 rounded-full">
            🎯 Matched to your diagnosis
          </span>
        )}
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        {activeCauseId
          ? "Repairs most relevant to your identified issue are highlighted in gold."
          : "Common repairs ordered from easiest to most complex."}
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {systems.map(sys => (
          <div key={sys} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            {/* System header */}
            <div className="bg-hvac-navy px-4 py-3">
              <h3 className="font-black text-white text-sm tracking-wide">{SYSTEM_LABELS[sys]}</h3>
            </div>
            {/* Repair items */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {repairMatrix[sys]!.map((item, i) => {
                const highlighted = isHighlighted(item);
                return (
                  <div
                    key={i}
                    className={`px-4 py-3 transition-all duration-300 ${
                      highlighted
                        ? "bg-amber-50 dark:bg-amber-900/20 border-l-4 border-hvac-gold"
                        : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {highlighted && (
                            <span className="text-hvac-gold text-xs font-black">★</span>
                          )}
                          <span className={`font-bold text-sm ${highlighted ? "text-hvac-navy dark:text-white" : "text-slate-800 dark:text-slate-200"}`}>
                            {item.name}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`text-xs font-bold capitalize ${DIFFICULTY_COLORS[item.difficulty] ?? "text-slate-500"}`}>
                          {item.difficulty}
                        </span>
                        {item.estimated_cost_range && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.estimated_cost_range}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
