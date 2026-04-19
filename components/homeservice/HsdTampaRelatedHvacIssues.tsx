import Link from "next/link";
import { HVAC_TAMPA_RELATED_ISSUES } from "@/lib/homeservice/hvacTampaRelatedIssues";
import { normalizeHsdCityPagePath } from "@/lib/homeservice/hsdCityInternalLinksRegistry";

/**
 * Footer-style discovery block for Tampa HVAC localized pages (`hvac/{symptom}/tampa-fl` storage slug).
 */
export function HsdTampaRelatedHvacIssues({ storageSlug }: { storageSlug: string }) {
  const s = (storageSlug || "").toLowerCase().trim();
  if (!/^hvac\/.+\/tampa-fl$/.test(s)) return null;

  const current = normalizeHsdCityPagePath(storageSlug);
  const items = HVAC_TAMPA_RELATED_ISSUES.filter(
    (row) => normalizeHsdCityPagePath(row.href) !== current
  );
  if (!items.length) return null;

  return (
    <section
      className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-600 dark:bg-slate-800/40"
      aria-labelledby="hsd-tampa-related-heading"
    >
      <h3
        id="hsd-tampa-related-heading"
        className="text-lg font-black tracking-tight text-hvac-navy dark:text-white"
      >
        Related HVAC Issues in Tampa
      </h3>
      <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {items.map((row) => (
          <li key={row.href}>
            <Link href={row.href} className="text-hvac-blue transition hover:underline">
              {row.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
