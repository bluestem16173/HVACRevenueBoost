/** Map public URL to storage slug for pages that mirror `pages.slug` (no leading slash). */
export function pathnameToStorageSlugCandidate(pathname: string): string | null {
  const pathOnly = pathname.trim().split("?")[0] ?? "";
  const clean = pathOnly.replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!clean) return null;

  let slug = clean;

  if (slug.startsWith("diagnose/")) {
    slug = slug.slice("diagnose/".length);
  } else if (slug.startsWith("p/")) {
    slug = slug.slice("p/".length);
  }
  if (!slug) return null;

  if (
    slug.startsWith("electrical/") ||
    slug.startsWith("plumbing/") ||
    slug.startsWith("hvac/")
  ) {
    return slug;
  }

  return null;
}

/**
 * True for `/electrical/{symptom}/{city}` (and plumbing/hvac) — three path segments under a trade vertical.
 * These pages mount `RelatedPagesSection` in `catchAllDbRoutes` city renderers; the footer slot skips them (no duplicate).
 */
export function isTradeCatchallLocalPathname(pathname: string): boolean {
  const pathOnly = (pathname.trim().split("?")[0] ?? "").replace(/\/+$/, "").toLowerCase();
  return /^\/(electrical|plumbing|hvac)\/[^/]+\/[^/]+$/.test(pathOnly);
}
