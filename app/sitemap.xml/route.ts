/**
 * Phase 16: Master Sitemap Index — served at the site root path `sitemap.xml`.
 *
 * GSC / robots: use `https://<domain>/sitemap.xml` only. There is no valid
 * `.../public/sitemap.xml` URL in Next.js (files under `public/` are served from `/`).
 *
 * Do not add `public/sitemap.xml`: it can shadow this route and freeze a static
 * index while child sitemaps stay dynamic. This handler is the source of truth.
 */
import { NextResponse } from "next/server";
import { toSitemapIndexXml } from "@/lib/sitemap-engine";
import { getIndexableSinceDate, isStrictIndexingEnabled } from "@/lib/seo/strict-indexing";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.hvacrevenueboost.com";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const now = new Date().toISOString().split("T")[0];
  const strict = isStrictIndexingEnabled();
  const since = getIndexableSinceDate();

  const sitemaps = strict
    ? since
      ? [
          { loc: `${BASE_URL}/sitemaps/static`, lastmod: now },
          { loc: `${BASE_URL}/sitemaps/hvac-tampa-city.xml`, lastmod: now },
          { loc: `${BASE_URL}/sitemaps/trade-tier-one-locals.xml`, lastmod: now },
          { loc: `${BASE_URL}/sitemaps/diagnose`, lastmod: now },
        ]
      : [{ loc: `${BASE_URL}/sitemaps/static`, lastmod: now }]
    : [
        { loc: `${BASE_URL}/sitemaps/static`, lastmod: now },
        { loc: `${BASE_URL}/sitemaps/systems-index`, lastmod: now },
        { loc: `${BASE_URL}/sitemaps/clusters-index`, lastmod: now },
        { loc: `${BASE_URL}/sitemaps/symptoms-index`, lastmod: now },
        { loc: `${BASE_URL}/sitemaps/conditions-index`, lastmod: now },
        { loc: `${BASE_URL}/sitemaps/diagnostics-index`, lastmod: now },
        { loc: `${BASE_URL}/sitemaps/causes-index`, lastmod: now },
        { loc: `${BASE_URL}/sitemaps/repairs-index`, lastmod: now },
        { loc: `${BASE_URL}/sitemaps/components-index`, lastmod: now },
        { loc: `${BASE_URL}/sitemaps/cities-index`, lastmod: now },
        { loc: `${BASE_URL}/sitemaps/local-index`, lastmod: now },
        { loc: `${BASE_URL}/sitemaps/diagnose`, lastmod: now },
        { loc: `${BASE_URL}/sitemaps/hvac-tampa-city.xml`, lastmod: now },
      ];

  const xml = toSitemapIndexXml(sitemaps);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
