import Link from "next/link";
import { HVAC_CORE_CLUSTER_SYMPTOM_ORDER } from "@/lib/homeservice/hsdHvacCoreCluster";
import { getRelatedSlugs, HVAC_CLUSTERS } from "@/lib/homeservice/masterProblemPillarClusters";
import {
  filterCitySlugsWithPublishedPillar,
  safeRelatedPillarSlugsForCity,
} from "@/lib/homeservice/safeTradePillarLinks";
import { getHvacGeoHintStorageSlugs, getHvacPillarNavCityStorageSlugs } from "@/lib/homeservice/hvacPillarNavCities";
import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";

function GeoHintLine({ symptom, citySlugs }: { symptom: string; citySlugs: string[] }) {
  const geo = getHvacGeoHintStorageSlugs().filter((c) => citySlugs.includes(c));
  if (!geo.length) return null;
  return (
    <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
      <span className="font-semibold text-slate-800 dark:text-slate-200">Southwest Florida:</span> see results in{" "}
      {geo.map((c, i) => (
        <span key={c}>
          {i > 0 ? (i === geo.length - 1 ? ", or " : ", ") : ""}
          <Link href={`/hvac/${symptom}/${c}`} className="font-medium text-hvac-blue hover:underline">
            {formatCityPathSegmentForDisplay(c)}
          </Link>
        </span>
      ))}
      .
    </p>
  );
}

function labelFromSlug(seg: string): string {
  return seg
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Pillar + localized city graph: pillar → cities; city → pillar, other cities, related symptoms (DB-safe). */
export async function HvacAuthorityLoopNav({
  variant,
  symptom,
  citySlug,
}: {
  variant: "pillar" | "city";
  symptom: string;
  citySlug?: string | null;
}) {
  const sym = String(symptom ?? "").trim().toLowerCase();
  if (!sym) return null;

  const citiesAll = getHvacPillarNavCityStorageSlugs();
  const citiesPublished = await filterCitySlugsWithPublishedPillar("hvac", sym, citiesAll);
  const city = String(citySlug ?? "").trim().toLowerCase();

  if (variant === "pillar") {
    return (
      <section
        className="mx-auto max-w-4xl border-b border-slate-200 bg-slate-50/80 px-4 py-6 dark:border-slate-700 dark:bg-slate-900/40"
        aria-labelledby="hvac-authority-pillar-nav"
      >
        <h2 id="hvac-authority-pillar-nav" className="text-sm font-black uppercase tracking-wide text-hvac-navy dark:text-white">
          Localized guides by city
        </h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Pick a market for the full diagnostic page. Same pillar, city-specific context and CTAs.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {citiesPublished.map((c) => (
            <li key={c}>
              <Link
                href={`/hvac/${sym}/${c}`}
                className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-hvac-blue shadow-sm hover:border-hvac-blue dark:border-slate-600 dark:bg-slate-950 dark:hover:border-hvac-gold"
              >
                {formatCityPathSegmentForDisplay(c)}
              </Link>
            </li>
          ))}
        </ul>
        <GeoHintLine symptom={sym} citySlugs={citiesPublished} />
      </section>
    );
  }

  if (!city) return null;

  const otherCities = citiesPublished.filter((c) => c && c !== city);
  const fromFailureClusters = getRelatedSlugs(sym, HVAC_CLUSTERS);
  const relatedPool = fromFailureClusters.length
    ? fromFailureClusters
    : HVAC_CORE_CLUSTER_SYMPTOM_ORDER.filter((s) => s !== sym);
  const related = await safeRelatedPillarSlugsForCity("hvac", relatedPool.slice(0, 8), city);

  return (
    <section
      className="mx-auto max-w-4xl border-b border-slate-200 bg-slate-50/80 px-4 py-6 dark:border-slate-700 dark:bg-slate-900/40"
      aria-labelledby="hvac-authority-city-nav"
    >
      <h2 id="hvac-authority-city-nav" className="text-sm font-black uppercase tracking-wide text-hvac-navy dark:text-white">
        Continue the diagnosis
      </h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">National pillar</div>
          <Link href={`/hvac/${sym}`} className="mt-2 inline-block text-sm font-semibold text-hvac-blue hover:underline">
            {labelFromSlug(sym)} (all cities)
          </Link>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Other cities</div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {otherCities.slice(0, 8).map((c) => (
              <li key={c}>
                <Link href={`/hvac/${sym}/${c}`} className="text-sm font-medium text-hvac-blue hover:underline">
                  {formatCityPathSegmentForDisplay(c)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Related problems</div>
          {related.length ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {related.map((s) => (
                <li key={s}>
                  <Link href={`/hvac/${s}/${city}`} className="text-sm font-medium text-hvac-blue hover:underline">
                    {labelFromSlug(s)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">No published related guides for this city yet.</p>
          )}
        </div>
      </div>

      {related.length > 0 ? (
        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            What most people check next
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5 sm:max-w-md">
            {related.slice(0, 2).map((r) => (
              <li key={r}>
                <Link href={`/hvac/${r}/${city}`} className="text-sm font-medium text-hvac-blue hover:underline">
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
