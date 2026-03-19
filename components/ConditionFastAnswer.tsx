/**
 * Condition Fast Answer — Headline + body + severity/time badges.
 * Used on condition pages with the locked schema.
 */

type Severity = "low" | "medium" | "high";
type TimeSensitivity = "monitor" | "soon" | "urgent";

const SEVERITY_COLORS: Record<Severity, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

const TIME_COLORS: Record<TimeSensitivity, string> = {
  monitor: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  soon: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export default function ConditionFastAnswer({
  title,
  body,
  severity = "medium",
  timeSensitivity = "soon",
}: {
  title: string;
  body: string;
  severity?: Severity;
  timeSensitivity?: TimeSensitivity;
}) {
  return (
    <div className="rounded-xl border-2 border-hvac-blue/20 bg-blue-50 dark:bg-slate-900/50 p-6">
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${SEVERITY_COLORS[severity]}`}>
          {severity} severity
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${TIME_COLORS[timeSensitivity]}`}>
          {timeSensitivity}
        </span>
      </div>
      <h2 className="text-lg font-bold text-hvac-navy dark:text-white mb-2">{title}</h2>
      <p className="text-slate-700 dark:text-slate-300">{body}</p>
    </div>
  );
}
