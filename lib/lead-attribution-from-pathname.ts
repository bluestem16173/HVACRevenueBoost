import { pathnameToStorageSlugCandidate } from "@/lib/pathname-storage-slug";

const TRADES = new Set(["electrical", "plumbing", "hvac"]);

export type LeadPathAttribution = {
  /** Storage-style path, no leading slash (e.g. `electrical/breaker-keeps-tripping/fort-myers-fl`). */
  page_slug: string;
  /** Last segment when path is `{trade}/{condition}/{city}`; otherwise empty. */
  city: string;
  /** First segment when it is a known trade vertical. */
  trade: string;
};

/**
 * Derive `page_slug`, URL `city` tail, and `trade` from the pathname for lead attribution
 * (hidden fields / API payload).
 */
export function getLeadAttributionFromPathname(pathname: string): LeadPathAttribution {
  const pathOnly = pathname.trim().split("?")[0] || "/";
  const slug = pathnameToStorageSlugCandidate(pathOnly);
  const raw = slug ?? pathOnly.replace(/^\/+|\/+$/g, "").toLowerCase();
  const parts = raw.split("/").filter(Boolean);

  let trade = "";
  let city = "";
  if (parts.length >= 1 && TRADES.has(parts[0]!)) {
    trade = parts[0]!;
    if (parts.length >= 3) city = parts[2]!;
  }

  return { page_slug: raw, city, trade };
}

export function readUtmParamsFromSearch(search: string): {
  utm_source: string;
  utm_campaign: string;
  utm_term: string;
} {
  const sp = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    utm_source: sp.get("utm_source")?.trim() ?? "",
    utm_campaign: sp.get("utm_campaign")?.trim() ?? "",
    utm_term: sp.get("utm_term")?.trim() ?? "",
  };
}
