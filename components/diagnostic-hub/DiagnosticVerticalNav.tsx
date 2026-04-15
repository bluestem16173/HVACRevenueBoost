import Link from "next/link";
import type { ServiceVertical } from "@/lib/localized-city-path";
import { localizedSiblingHref, parentHubPath, serviceHubPath, siblingSlugsFor } from "@/lib/vertical-diagnostic-links";

export function DiagnosticVerticalNav({
  vertical,
  pillarSlug,
  citySlug,
}: {
  vertical: ServiceVertical;
  pillarSlug: string;
  citySlug?: string | null;
}) {
  const model = { vertical, pillarSlug, citySlug: citySlug ?? null };
  const siblings = siblingSlugsFor(vertical, pillarSlug, 4);

  const verticalLabel =
    vertical === "hvac" ? "HVAC" : vertical === "plumbing" ? "Plumbing" : "Electrical";

  return (
    <aside className="mx-auto mb-6 max-w-4xl rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm dark:border-slate-700 dark:bg-slate-900/60">
      <div className="font-bold text-slate-800 dark:text-slate-100">On this topic</div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-slate-600 dark:text-slate-400">
        <li>
          <span className="text-slate-400">Parent · </span>
          <Link href={parentHubPath(vertical)} className="font-medium text-hvac-blue hover:underline">
            {verticalLabel} hub
          </Link>
        </li>
        <li>
          <span className="text-slate-400">Service · </span>
          <Link href={serviceHubPath()} className="font-medium text-hvac-blue hover:underline">
            Find local help
          </Link>
        </li>
      </ul>
      {citySlug ? (
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Related in your area</div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {siblings.map((slug) => (
              <li key={slug}>
                <Link
                  href={localizedSiblingHref(model, slug)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-hvac-navy hover:border-hvac-blue dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
                >
                  {slug.replace(/-/g, " ")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
