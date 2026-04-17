import { Zap } from "lucide-react";

const COPY =
  "Working with live electricity carries significant risk for injury and possibly death. If you are not experienced, do NOT attempt any DIY. Call a professional today.";

/**
 * Prominent early-page notice: live electrical work is high risk.
 * Place immediately after the 30-second summary and quick-checks blocks.
 */
export function LiveElectricitySafetyNotice({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`electric-safety-notice mb-8 flex gap-3 rounded-xl border-2 border-amber-400/90 bg-amber-50 p-4 shadow-sm dark:border-amber-500/70 dark:bg-amber-950/50 ${className}`.trim()}
      role="note"
      aria-label="Electrical safety"
    >
      <Zap
        className="electric-safety-notice__icon h-9 w-9 shrink-0 text-amber-600 dark:text-amber-400"
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <p className="electric-safety-notice__text m-0 text-sm font-semibold leading-snug text-amber-950 dark:text-amber-100 sm:text-base">
        {COPY}
      </p>
    </aside>
  );
}
