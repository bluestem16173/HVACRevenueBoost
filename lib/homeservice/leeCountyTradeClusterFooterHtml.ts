/**
 * Deterministic **Problem cluster** + **Related problems** blocks for Lee County trade locals
 * (`/plumbing|/electrical/{symptom}/{city}-fl`), injected **above** the global site footer in HSD HTML.
 *
 * - **Problem cluster:** national pillar + same symptom across **multiple** Lee cities (Fort Myers prioritized).
 * - **Related problems:** same city, different symptoms (lateral crawl; max 3 peers from linking engine).
 *
 * Link sets use {@link buildTradeLocalLinkBuckets} and {@link buildLeeSameConditionCitySlugs}.
 */
import { formatCityPathSegmentForDisplay, type ServiceVertical } from "@/lib/localized-city-path";
import { isLeeCountyMonetizationLocalizedSlug } from "@/lib/homeservice/leeCountyInitialMonetizationCluster";
import {
  buildLeeSameConditionCitySlugs,
  buildTradeLocalLinkBuckets,
  storageSlugToUrlPath,
} from "@/lib/seo/pagesSlugLinkingEngine";
import { enforceStoredSlug } from "@/lib/slug-utils";

const SECTION_SHELL =
  "hsd-section hsd-block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-6 mb-8 last:mb-0";

const LINK_CLASS =
  "font-semibold text-blue-600 underline decoration-blue-600/40 underline-offset-2 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300";

const TITLE_CLASS =
  "hsd-section__title hsd-section-title text-base sm:text-lg font-semibold text-slate-900 dark:text-white";

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

const RELATED_PEER_MAX = 4;
const PROBLEM_CLUSTER_CITY_MAX = 5;

/** HTML fragments (Problem cluster + Related problems) appended before global chrome for Lee monetization locals. */
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

  const pillarHref = storageSlugToUrlPath(buckets.nationalHubSlug);
  const pillarLabel = `${titleCaseFromSlug(symptom)} — national pillar`;

  const citySlugs = buildLeeSameConditionCitySlugs(vertical as ServiceVertical, symptom, citySlug, PROBLEM_CLUSTER_CITY_MAX);

  const problemClusterLis: string[] = [
    `<li class="mb-2 last:mb-0"><a href="${escapeHtml(pillarHref)}" class="${LINK_CLASS}">${escapeHtml(pillarLabel)}</a></li>`,
  ];
  for (const storage of citySlugs) {
    const tail = storage.split("/").filter(Boolean).pop() ?? "";
    const href = storageSlugToUrlPath(storage);
    const label = shortPlaceName(tail);
    problemClusterLis.push(
      `<li class="mb-2 last:mb-0"><a href="${escapeHtml(href)}" class="${LINK_CLASS}">${escapeHtml(`${titleCaseFromSlug(symptom)} — ${label}`)}</a></li>`,
    );
  }

  const peers = buckets.sameCityPeerSlugs.slice(0, RELATED_PEER_MAX);
  const relatedLis = peers
    .map((storage) => {
      const seg = storage.split("/").filter(Boolean)[1] ?? storage;
      const href = storageSlugToUrlPath(storage);
      return `<li class="mb-2 last:mb-0"><a href="${escapeHtml(href)}" class="${LINK_CLASS}">${escapeHtml(titleCaseFromSlug(seg))}</a></li>`;
    })
    .join("");

  const problemBlock = `
<section class="${SECTION_SHELL} lee-problem-cluster" aria-labelledby="lee-problem-cluster-h">
  <h3 id="lee-problem-cluster-h" class="${TITLE_CLASS}">Problem cluster</h3>
  <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Same condition across Lee County — start at the national pillar, then open the city that matches where you need service.</p>
  <ul class="m-0 mt-3 list-none p-0 text-slate-800 dark:text-slate-300">${problemClusterLis.join("")}</ul>
</section>`.trim();

  const relatedBlock =
    relatedLis.trim().length > 0
      ? `
<section class="${SECTION_SHELL} lee-related-problems" aria-labelledby="lee-related-problems-h">
  <h3 id="lee-related-problems-h" class="${TITLE_CLASS}">Related problems</h3>
  <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Other ${tradeLabel.toLowerCase()} issues in <strong class="font-semibold text-slate-800 dark:text-slate-200">${escapeHtml(place)}</strong> — different symptoms, same service area.</p>
  <ul class="m-0 mt-3 list-none p-0 text-slate-800 dark:text-slate-300">${relatedLis}</ul>
</section>`.trim()
      : "";

  return `${problemBlock}\n${relatedBlock}`.trim();
}
