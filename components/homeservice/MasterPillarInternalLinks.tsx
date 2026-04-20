import Link from "next/link";
import { getRelatedSlugsForVertical } from "@/lib/homeservice/masterProblemPillarClusters";
import {
  filterCitySlugsWithPublishedPillar,
  safeRelatedPillarSlugsForCity,
  safeRelatedPillarSlugsNational,
} from "@/lib/homeservice/safeTradePillarLinks";
import { getHvacPillarNavCityStorageSlugs } from "@/lib/homeservice/hvacPillarNavCities";
import type { ServiceVertical } from "@/lib/localized-city-path";
import { buildLocalizedPillarPath, formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";

function labelFromSlug(seg: string): string {
  return seg
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const VERTICAL_LABEL: Record<ServiceVertical, string> = {
  hvac: "HVAC",
  electrical: "electrical",
  plumbing: "plumbing",
};

/**
 * Drop-in internal link block: cities, DB-verified related issues, system hub,
 * and on **city pages** a “next step” deep link (conversion + crawl depth).
 */
export async function MasterPillarInternalLinks({
  vertical,
  slug,
  cityStorageSlug,
}: {
  vertical: ServiceVertical;
  slug: string;
  cityStorageSlug?: string | null;
}) {
  const sym = String(slug ?? "").trim().toLowerCase();
  if (!sym) return null;

  const city = String(cityStorageSlug ?? "").trim().toLowerCase();
  const citiesAll = getHvacPillarNavCityStorageSlugs();
  const citiesPublished = await filterCitySlugsWithPublishedPillar(vertical, sym, citiesAll);
  const cityPool = city ? citiesPublished.filter((c) => c && c !== city) : citiesPublished;

  const relatedRaw = getRelatedSlugsForVertical(vertical, sym);
  const related = city
    ? await safeRelatedPillarSlugsForCity(vertical, relatedRaw, city)
    : await safeRelatedPillarSlugsNational(vertical, relatedRaw);

  const nextStep = city ? related.slice(0, 2) : [];

  return (
    <section
      className="mx-auto max-w-4xl border-b border-slate-200 bg-slate-50/80 px-4 py-6 dark:border-slate-700 dark:bg-slate-900/40"
      aria-labelledby={`master-pillar-links-${vertical}-${sym}`}
    >
      <h2
        id={`master-pillar-links-${vertical}-${sym}`}
        className="text-sm font-black uppercase tracking-wide text-hvac-navy dark:text-white"
      >
        More diagnostics
      </h2>

      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Available near you
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {(city ? cityPool : citiesPublished).slice(0, 10).map((c) => (
              <li key={c}>
                <Link
                  href={buildLocalizedPillarPath(vertical, sym, c)}
                  className="text-sm font-medium text-hvac-blue hover:underline"
                >
                  {formatCityPathSegmentForDisplay(c)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Related issues
          </h3>
          {related.length ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {related.map((r) => (
                <li key={r}>
                  <Link
                    href={
                      city
                        ? buildLocalizedPillarPath(vertical, r, city)
                        : `/${vertical}/${r}`
                    }
                    className="text-sm font-medium text-hvac-blue hover:underline"
                  >
                    {labelFromSlug(r)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">No published related guides in this cluster yet.</p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Understand the system
          </h3>
          <Link href={`/${vertical}`} className="mt-2 inline-block text-sm font-semibold text-hvac-blue hover:underline">
            How {VERTICAL_LABEL[vertical]} systems work
          </Link>
        </div>
      </div>

      {city && nextStep.length > 0 ? (
        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            What most people check next
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5 sm:max-w-md">
            {nextStep.map((r) => (
              <li key={r}>
                <Link
                  href={buildLocalizedPillarPath(vertical, r, city)}
                  className="text-sm font-medium text-hvac-blue hover:underline"
                >
                  Check {labelFromSlug(r)} in your home
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
