/**
 * Phase 16: Master Sitemap Index
 * Submit only /sitemap.xml to Google Search Console.
 * References layer-specific sitemap indexes.
 */
import { NextResponse } from "next/server";
import { toSitemapIndexXml } from "@/lib/sitemap-engine";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://hvacrevenueboost.com";

export const revalidate = 3600;

export async function GET() {
  const now = new Date().toISOString().split("T")[0];

  const sitemaps = [
    { loc: `${BASE_URL}/sitemaps/static`, lastmod: now },
    { loc: `${BASE_URL}/sitemaps/clusters-index`, lastmod: now },
    { loc: `${BASE_URL}/sitemaps/symptoms-index`, lastmod: now },
    { loc: `${BASE_URL}/sitemaps/conditions-index`, lastmod: now },
    { loc: `${BASE_URL}/sitemaps/causes-index`, lastmod: now },
    { loc: `${BASE_URL}/sitemaps/repairs-index`, lastmod: now },
    { loc: `${BASE_URL}/sitemaps/components-index`, lastmod: now },
    { loc: `${BASE_URL}/sitemaps/local-index`, lastmod: now },
  ];

  const xml = toSitemapIndexXml(sitemaps);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
