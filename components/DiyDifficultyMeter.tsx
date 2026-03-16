"use client";

import type { DiyDifficulty, SafetyConcern } from "@/data/knowledge-graph";

const DIFFICULTY_LABELS: Record<DiyDifficulty, string> = {
  rookie: "Beginner-friendly",
  moderate: "Moderate skill",
  advanced: "Advanced DIY",
  "professional-only": "Leave to professionals",
};

const DIFFICULTY_ORDER: DiyDifficulty[] = ["rookie", "moderate", "advanced", "professional-only"];

const SAFETY_LABELS: Record<SafetyConcern, string> = {
  electrical: "Electrical work",
  gas: "Gas line / combustion",
  refrigerant: "Refrigerant (EPA 608)",
  high_voltage: "High voltage (240V)",
};

const DIY_DISCLAIMER =
  "DIY repairs may void manufacturer warranties, create unseen safety hazards, or cause unintended damage to equipment. " +
  "Work involving electrical, gas, or refrigerant should be performed by licensed professionals.";

interface DiyDifficultyMeterProps {
  diyDifficulty?: DiyDifficulty;
  safetyConcerns?: SafetyConcern[];
  /** Compact mode for inline use in repair cards */
  compact?: boolean;
}

export default function DiyDifficultyMeter({
  diyDifficulty = "moderate",
  safetyConcerns = [],
  compact = false,
}: DiyDifficultyMeterProps) {
  const idx = DIFFICULTY_ORDER.indexOf(diyDifficulty);
  const hasSafetyConcerns = safetyConcerns.length > 0;
  const isProfessionalOnly = diyDifficulty === "professional-only";

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">DIY level</span>
          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            {DIFFICULTY_ORDER.map((d, i) => (
              <div
                key={d}
                className={`flex-1 transition-colors ${
                  i <= idx
                    ? isProfessionalOnly
                      ? "bg-red-500"
                      : i === 0
                        ? "bg-green-500"
                        : i === 1
                          ? "bg-amber-500"
                          : "bg-orange-500"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>
        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
          {DIFFICULTY_LABELS[diyDifficulty]}
        </span>
        {hasSafetyConcerns && (
          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
            ⚠ {safetyConcerns.map((s) => SAFETY_LABELS[s]).join(" • ")} — strongly discourage DIY.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4">
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          DIY Difficulty
        </span>
        <span
          className={`text-xs font-bold ${
            isProfessionalOnly ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"
          }`}
        >
          {DIFFICULTY_LABELS[diyDifficulty]}
        </span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex mb-3">
        {DIFFICULTY_ORDER.map((d, i) => (
          <div
            key={d}
            className={`flex-1 transition-colors ${
              i <= idx
                ? isProfessionalOnly
                  ? "bg-red-500"
                  : i === 0
                    ? "bg-green-500"
                    : i === 1
                      ? "bg-amber-500"
                      : "bg-orange-500"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
      <div className="flex gap-1 text-[10px] text-slate-500">
        <span>Easy</span>
        <span className="flex-1" />
        <span>Hard</span>
      </div>
      {hasSafetyConcerns && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
            Work involves: {safetyConcerns.map((s) => SAFETY_LABELS[s]).join(", ")}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
            DIY is strongly discouraged. Electrical, gas, and refrigerant work require licensed professionals and may
            violate EPA Section 608 or local codes.
          </p>
        </div>
      )}
      <p className="mt-3 text-[10px] text-slate-500 dark:text-slate-500 italic leading-snug">
        {DIY_DISCLAIMER}
      </p>
    </div>
  );
}

/** Reusable legal disclaimer block for "When to Call" sections */
export function DiyLegalDisclaimer() {
  return (
    <div className="mt-6 p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed m-0">
        <strong className="text-slate-700 dark:text-slate-300">General guideline:</strong> DIY repairs may void
        manufacturer warranties, create unseen safety hazards, or cause unintended damage to your equipment. Work
        involving electrical (including high voltage), gas lines, or refrigerant handling is strongly discouraged for
        homeowners—and in many cases is illegal without proper certification (e.g., EPA Section 608 for refrigerants).
        When in doubt, consult a licensed HVAC professional.
      </p>
    </div>
  );
}
