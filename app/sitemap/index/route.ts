import { NextResponse } from "next/server";
import { CLUSTERS } from "@/lib/clusters";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://hvacrevenueboost.com";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Sitemap index listing all cluster sitemaps + main sitemap.
 * Submit this URL to GSC, or submit individual cluster sitemaps.
 * URL: /sitemap/index
 */
export async function GET() {
  const now = new Date().toISOString().split("T")[0];

  const sitemaps = [
    { loc: `${BASE_URL}/sitemap.xml`, lastmod: now },
    ...CLUSTERS.map((c) => ({
      loc: `${BASE_URL}/sitemap/cluster/${c.slug}`,
      lastmod: now,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (s) => `  <sitemap>
    <loc>${escapeXml(s.loc)}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
