import type { Metadata } from "next";

import { enforceStoredSlug } from "@/lib/slug-utils";

/** Production origin (HTTPS). Prefer **www** so `<link rel="canonical">` matches the primary host in Search Console. */
export const SITE_ORIGIN = "https://www.hvacrevenueboost.com" as const;

/** Absolute canonical URL for a path (leading slash optional). */
export function siteCanonicalUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${p}`;
}

/**
 * Public pathname for `/diagnose/[...slug]` — `joinedOrStorageSlug` is `pages.slug` shape
 * (no leading slash, no `diagnose/` prefix), or the catch-all join.
 */
export function diagnosePublicPathname(joinedOrStorageSlug: string): string {
  const cleanSlug = joinedOrStorageSlug.replace(/^\/+/, "").trim();
  const normalized = enforceStoredSlug(cleanSlug).toLowerCase().replace(/\/+/g, "/");
  return `/diagnose/${normalized}`;
}

export function siteCanonicalDiagnoseUrl(joinedOrStorageSlug: string): string {
  return siteCanonicalUrl(diagnosePublicPathname(joinedOrStorageSlug));
}

/**
 * App Router canonical — spread into `metadata` or `generateMetadata` return value.
 * `next/head` is not supported under `app/`; this emits `<link rel="canonical">` via the Metadata API.
 *
 * @example
 * ```ts
 * import type { Metadata } from "next";
 * import { canonicalMetadata } from "@/lib/seo/canonical";
 *
 * export const metadata: Metadata = {
 *   title: "Request service",
 *   ...canonicalMetadata("/request-service"),
 * };
 * ```
 */
export function canonicalMetadata(path: string): Metadata {
  return {
    alternates: {
      canonical: siteCanonicalUrl(path),
    },
  };
}
