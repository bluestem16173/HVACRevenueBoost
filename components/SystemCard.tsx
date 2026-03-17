"use client";

import Link from "next/link";
import clsx from "clsx";
import { trackEvent } from "@/lib/tracking";

type Props = {
  system: string;
  summary: string;
  commonCauses: string[];
  riskLevel: "low" | "medium" | "high";
  diySafe: boolean;
  costRange: string;
  whyNotDiy?: string;
  diagnoseHref: string;
  repairHref: string;
  symptomId?: string;
};

const riskColors = {
  low: "text-green-600 dark:text-green-400",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-hvac-safety dark:text-red-400",
};

export default function SystemCard({
  system,
  summary,
  commonCauses,
  riskLevel,
  diySafe,
  costRange,
  whyNotDiy,
  diagnoseHref,
  repairHref,
  symptomId,
}: Props) {
  return (
    <div className="h-full flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition bg-white dark:bg-slate-900">
      <div>
        <h3 className="font-semibold text-hvac-navy dark:text-white mb-2 uppercase tracking-wide text-sm">
          {system}
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">{summary}</p>

        <ul className="text-xs mb-3 space-y-1 text-slate-700 dark:text-slate-300">
          {commonCauses.map((c, i) => (
            <li key={i}>• {c}</li>
          ))}
        </ul>

        <div className={clsx("text-xs font-bold mb-2", riskColors[riskLevel])}>
          {riskLevel === "high" && "⚠ High Risk"}
          {riskLevel === "medium" && "⚠ Moderate Risk"}
          {riskLevel === "low" && "🟢 Low Risk"}
        </div>

        <div className="text-xs mb-2">
          {diySafe ? (
            <span className="text-green-600 dark:text-green-400">DIY Possible</span>
          ) : (
            <span className="text-hvac-safety dark:text-red-400">Professional Recommended</span>
          )}
        </div>

        {!diySafe && whyNotDiy && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{whyNotDiy}</p>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{costRange}</div>

        <div className="flex flex-col text-xs font-medium gap-1">
          <Link
            href={diagnoseHref}
            onClick={() => trackEvent("diagnose_click", { system, cause: system })}
            className="text-hvac-blue hover:underline"
          >
            → Diagnose
          </Link>
          <Link
            href={repairHref}
            onClick={() => trackEvent("repair_click", { cause: system, type: "system" })}
            className="text-hvac-blue hover:underline"
          >
            → Repair Options
          </Link>
        </div>

        {riskLevel === "high" && (
          <div className="mt-2 text-xs text-hvac-safety font-medium">⚠ Professional repair recommended</div>
        )}
      </div>
    </div>
  );
}
