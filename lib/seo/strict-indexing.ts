import type { Metadata } from "next";

/**
 * Rollout / crawl hygiene — **playbook**
 *
 * **Phase 1 — Lockdown (generating in the background)**  
 * `STRICT_SITE_INDEXING=true` — root metadata still uses {@link strictDefaultRobotsForPathname} (only `/` and
 * `INDEXABLE_EXTRA_PATHS` are broadly indexable). DB-backed routes that call {@link strictRobotsForDbPage} with
 * `eligible=true` and **no** `INDEXABLE_SINCE` are treated as **indexable** in page metadata (set `INDEXABLE_SINCE`
 * when you want a hard cutoff on `updated_at` for staged rollout).
 *
 * **Phase 2 — First controlled release**  
 * Set `INDEXABLE_SINCE` to an ISO instant (e.g. start of release day). Publish 10–25 high-value pages.  
 * Any route wired with `strictRobotsForDbPage` becomes `index` only when `pages.updated_at >= INDEXABLE_SINCE`.  
 * `sitemap.xml` then adds curated / DB-filtered children (e.g. Tampa HVAC urlset + filtered `sitemaps/diagnose`).
 *
 * **Phase 3 — Ongoing**  
 * Prefer bumping `updated_at` on rows you want crawled, or occasionally moving `INDEXABLE_SINCE` backward to widen
 * the cohort. Generate many pages per day; only fresh / eligible rows need to be indexable.
 *
 * **Env (server, e.g. Vercel)**  
 * - `STRICT_SITE_INDEXING=true` | `1` — enable the gate.  
 * - `INDEXABLE_SINCE` — optional ISO-8601 cutoff for DB-backed routes that call `strictRobotsForDbPage`.  
 * - `INDEXABLE_EXTRA_PATHS` — comma-separated paths that stay indexable in Phase 1 (exact match, e.g. `/hvac`).
 *
 * **Leak risk**  
 * Routes that set `robots: { index: true }` without merging strict logic can override the root default. Prefer
 * {@link robotsForDbBackedPage} for any route backed by a `pages` row so **unpublished** rows and rows before
 * `INDEXABLE_SINCE` never ship `index: true` metadata.
 *
 * **Tier-1 discovery (localized trade pages)**  
 * For `hvac|plumbing|electrical/{symptom}/{city}` triplets, indexing eligibility is further gated by
 * {@link isLocalizedTradeTripletEligibleForIndexingRobots} in `lib/seo/tier-one-discovery.ts` (HVAC core ×
 * `TIER_ONE_CITIES`, optional `TIER_ONE_EXTRA_SLUGS`). Sitemaps and hub links use the same cohort so crawl
 * budget concentrates on money pages while Tier-2 locals can stay published for direct traffic.
 */

export function isStrictIndexingEnabled(): boolean {
  return process.env.STRICT_SITE_INDEXING === "true" || process.env.STRICT_SITE_INDEXING === "1";
}

export function getIndexableSinceDate(): Date | null {
  const raw = (process.env.INDEXABLE_SINCE || "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getIndexableExtraPaths(): Set<string> {
  const raw = process.env.INDEXABLE_EXTRA_PATHS || "";
  const set = new Set<string>();
  for (const part of raw.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const norm = p.startsWith("/") ? p : `/${p}`;
    set.add(norm.toLowerCase());
  }
  return set;
}

export function parsePageUpdatedAt(row: unknown): Date | null {
  if (!row || typeof row !== "object") return null;
  const u = (row as Record<string, unknown>).updated_at;
  if (u instanceof Date) return Number.isNaN(u.getTime()) ? null : u;
  if (typeof u === "string") {
    const d = new Date(u);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** `true` when `INDEXABLE_SINCE` is unset, or `updated_at` parses and is on/after that instant. */
export function rowPassesIndexableSince(updatedAt: unknown): boolean {
  const since = getIndexableSinceDate();
  if (!since) return true;
  const at = parsePageUpdatedAt(updatedAt);
  return Boolean(at && at >= since);
}

type DbPageLike = { status?: unknown; updated_at?: unknown } | null | undefined;

/**
 * Crawl policy for a `pages` row:
 * - Always **noindex** when missing or `status !== 'published'`.
 * - When `INDEXABLE_SINCE` is set, **noindex** if `updated_at` is missing or before the cutoff (independent of
 *   `STRICT_SITE_INDEXING`, so new rollout rows stay out of the index until bumped).
 * - `eligible: false` (thin page, `quality_status`, etc.) always yields **noindex**, even when strict mode is off.
 * - When `STRICT_SITE_INDEXING` is on, published + eligible + date-ok rows get explicit `index: true` metadata
 *   (via {@link strictRobotsForDbPage}); otherwise the caller may fall back to route defaults.
 */
export function robotsForDbBackedPage(page: DbPageLike, eligible: boolean): Pick<Metadata, "robots"> | undefined {
  if (!page || String(page.status) !== "published") {
    return { robots: { index: false, follow: true } };
  }
  if (!rowPassesIndexableSince(page.updated_at)) {
    return { robots: { index: false, follow: true } };
  }
  if (!eligible) {
    return { robots: { index: false, follow: true } };
  }
  return strictRobotsForDbPage(true, page.updated_at);
}

/** Root default: noindex everywhere except `/` and optional extras when strict is on. */
export function strictDefaultRobotsForPathname(pathname: string): Metadata["robots"] {
  const p = (pathname || "/").split("?")[0] || "/";
  const lower = p === "/" ? "/" : p.toLowerCase();
  if (lower === "/" || getIndexableExtraPaths().has(lower)) {
    return { index: true, follow: true };
  }
  /** `/diagnose/*` uses segment `generateMetadata` + DB gates; avoid blanket noindex from root layout. */
  if (lower === "/diagnose" || lower.startsWith("/diagnose/")) {
    return { index: true, follow: true };
  }
  return { index: false, follow: true };
}

/**
 * When strict indexing is on, attach robots for a DB-backed page that should be indexable
 * only if `eligible` (quality gates, etc.) and `updated_at` is on/after `INDEXABLE_SINCE`.
 * Returns `undefined` when strict mode is off (leave metadata unchanged).
 */
export function strictRobotsForDbPage(eligible: boolean, updatedAt: unknown): Pick<Metadata, "robots"> | undefined {
  if (!isStrictIndexingEnabled()) return undefined;
  if (!eligible) return { robots: { index: false, follow: true } };
  const since = getIndexableSinceDate();
  // No cutoff: do not blanket-noindex eligible rows (use `INDEXABLE_SINCE` when you want a staged rollout).
  if (!since) return { robots: { index: true, follow: true } };
  const at = parsePageUpdatedAt(updatedAt);
  return { robots: { index: Boolean(at && at >= since), follow: true } };
}
