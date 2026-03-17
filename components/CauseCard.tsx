"use client";

import Link from "next/link";
import clsx from "clsx";
import { trackEvent } from "@/lib/tracking";

type CauseCardProps = {
  name: string;
  likelihood: "high" | "medium" | "low";
  risk: "low" | "medium" | "high";
  description: string;
  diagnoseHref: string;
  repairHref: string;
  cost?: string;
};

const likelihoodColors = {
  high: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  medium: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  low: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
};

const riskColors = {
  low: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  medium: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  high: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
};

export default function CauseCard({
  name,
  likelihood,
  risk,
  description,
  diagnoseHref,
  repairHref,
  cost,
}: CauseCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition bg-white dark:bg-slate-900 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-hvac-navy dark:text-white mb-2 uppercase tracking-wide">{name}</h3>

        <div className="flex gap-2 mb-3 flex-wrap">
          <span className={clsx("text-xs px-2 py-1 rounded font-bold", likelihoodColors[likelihood])}>
            {likelihood.toUpperCase()} LIKELIHOOD
          </span>
          <span className={clsx("text-xs px-2 py-1 rounded font-bold", riskColors[risk])}>
            {risk === "high" ? "PRO REQUIRED" : risk === "medium" ? "CAUTION" : "DIY"}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">{description}</p>
      </div>

      <div className="mt-auto">
        <div className="flex flex-col gap-1 text-xs font-medium">
          <Link
            href={diagnoseHref}
            onClick={() => trackEvent("diagnose_click", { cause: name })}
            className="text-hvac-blue hover:underline"
          >
            → Diagnose Issue
          </Link>
          <Link
            href={repairHref}
            onClick={() => trackEvent("repair_click", { cause: name, type: "repair" })}
            className="text-hvac-blue hover:underline"
          >
            → View Fix / Repair
          </Link>
        </div>

        {cost && <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{cost}</div>}

        {risk === "high" && (
          <div className="mt-2 text-xs text-hvac-safety font-medium">⚠ Professional repair recommended</div>
        )}
      </div>
    </div>
  );
}
