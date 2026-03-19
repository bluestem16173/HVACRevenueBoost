/**
 * Thirty-Second Summary — Condition page quick-scan block.
 * Shows: Usually Means, Likely Fix, DIY Potential, Call Pro When.
 */

type Item = { label: string; value: string };

export default function ThirtySecondSummary({ items, points }: { items?: Item[]; points?: Item[] }) {
  const list = items ?? points ?? [];
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
        30-Second Summary
      </h3>
      <dl className="grid gap-4 sm:grid-cols-2">
        {list.map((item) => (
          <div key={item.label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
