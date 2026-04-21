/**
 * Deterministic **cluster graph** footer for locked Lee County trade locals
 * (`/plumbing|/electrical/{symptom}/{city}-fl`).
 *
 * Ideal structure (crawl + topical authority):
 * - **UP** → national pillar `/{trade}/{symptom}` (topic hub).
 * - **SIDEWAYS** → other symptoms, **same city** (peer locals).
 * - **CROSS-CITY** → **same symptom**, other grid cities (optional but high value).
 *
 * Link sets come from {@link buildTradeLocalLinkBuckets} in `lib/seo/pagesSlugLinkingEngine.ts`.
 */
import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";
import { isLeeCountyMonetizationLocalizedSlug } from "@/lib/homeservice/leeCountyInitialMonetizationCluster";
import { buildTradeLocalLinkBuckets, storageSlugToUrlPath } from "@/lib/seo/pagesSlugLinkingEngine";
import { enforceStoredSlug } from "@/lib/slug-utils";

const SECTION_SHELL =
  "hsd-section hsd-block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6 mb-8 last:mb-0";

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function titleCaseFromSlug(seg: string): string {
  return seg
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function shortPlaceName(cityStorage: string): string {
  const full = formatCityPathSegmentForDisplay(cityStorage);
  const cut = full.split(",")[0]?.trim();
  return cut || full;
}

const SIDEWAYS_MAX = 6;
const CROSS_CITY_MAX = 5;

/** HTML fragment appended to HSD v2.5 render for locked Lee County monetization locals. */
export function buildLeeCountyTradeClusterFooterHtml(storageSlug: string): string {
  const canon = enforceStoredSlug(storageSlug);
  if (!isLeeCountyMonetizationLocalizedSlug(canon)) return "";
  const buckets = buildTradeLocalLinkBuckets(canon);
  if (!buckets?.nationalHubSlug) return "";

  const parts = canon.split("/").filter(Boolean);
  const vertical = (parts[0] ?? "").toLowerCase();
  const symptom = (parts[1] ?? "").toLowerCase();
  const citySlug = (parts[2] ?? "").toLowerCase();
  if (!vertical || !symptom || !citySlug) return "";

  const tradeLabel = vertical === "electrical" ? "Electrical" : "Plumbing";
  const place = shortPlaceName(citySlug);

  const upHref = storageSlugToUrlPath(buckets.nationalHubSlug);
  const upLabel = `${titleCaseFromSlug(symptom)} — national overview`;

  const sideways = buckets.sameCityPeerSlugs.slice(0, SIDEWAYS_MAX);
  const sidewaysLis = sideways
    .map((storage) => {
      const seg = storage.split("/").filter(Boolean)[1] ?? storage;
      const href = storageSlugToUrlPath(storage);
      return `<li class="mb-2 last:mb-0"><a href="${escapeHtml(href)}" class="font-semibold text-hvac-blue underline decoration-hvac-blue/40 underline-offset-2 hover:text-hvac-gold dark:text-hvac-gold">${escapeHtml(titleCaseFromSlug(seg))}</a></li>`;
    })
    .join("");

  const cross = buckets.crossGeoSameSymptomSlugs.slice(0, CROSS_CITY_MAX);
  const crossLis = cross
    .map((storage) => {
      const tail = storage.split("/").filter(Boolean).pop() ?? "";
      const href = storageSlugToUrlPath(storage);
      const label = shortPlaceName(tail);
      return `<li class="mb-2 last:mb-0"><a href="${escapeHtml(href)}" class="font-semibold text-hvac-blue underline decoration-hvac-blue/40 underline-offset-2 hover:text-hvac-gold dark:text-hvac-gold">${escapeHtml(label)}</a></li>`;
    })
    .join("");

  const upHeading = `Topic hub (national ${tradeLabel.toLowerCase()} guide)`;
  const sidewaysHeading = `Related ${tradeLabel.toLowerCase()} issues in ${place}`;
  const crossHeading = `Same issue nearby`;

  return `
<section class="${SECTION_SHELL} lee-cluster-footer" aria-label="Cluster navigation: pillar, peers, nearby cities">
  <div class="internal-links cluster-graph space-y-8">
    <div>
      <h3 class="hsd-section__title hsd-section-title text-base sm:text-lg">${escapeHtml(upHeading)}</h3>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Link up to the pillar page, then spread across cities and peer symptoms.</p>
      <ul class="m-0 mt-3 list-none p-0">
        <li class="mb-2 last:mb-0"><a href="${escapeHtml(upHref)}" class="font-semibold text-hvac-blue underline decoration-hvac-blue/40 underline-offset-2 hover:text-hvac-gold dark:text-hvac-gold">${escapeHtml(upLabel)}</a></li>
      </ul>
    </div>
    <div>
      <h3 class="hsd-section__title hsd-section-title text-base sm:text-lg">${escapeHtml(sidewaysHeading)}</h3>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Sideways — other symptoms in the same city (cluster lateral crawl).</p>
      <ul class="m-0 mt-3 list-none p-0">${sidewaysLis}</ul>
    </div>
    <div>
      <h3 class="hsd-section__title hsd-section-title text-base sm:text-lg">${escapeHtml(crossHeading)}</h3>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Cross-city — same symptom in other service areas (optional but high value).</p>
      <ul class="m-0 mt-3 list-none p-0">${crossLis}</ul>
    </div>
  </div>
</section>`.trim();
}
