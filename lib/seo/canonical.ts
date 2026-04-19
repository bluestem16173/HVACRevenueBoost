import type { Metadata } from "next";

/** Production origin (apex, HTTPS). Use with redirects in `next.config.mjs`. */
export const SITE_ORIGIN = "https://hvacrevenueboost.com" as const;

/** Absolute canonical URL for a path (leading slash optional). */
export function siteCanonicalUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${p}`;
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
