import { NextResponse } from "next/server";
import { CLUSTERS } from "@/lib/clusters";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://hvacrevenueboost.com";

/**
 * Returns a JSON list of cluster sitemap URLs for GSC submission.
 * GET /sitemap/cluster
 */
export async function GET() {
  const urls = CLUSTERS.map((c) => ({
    cluster: c.slug,
    name: c.name,
    sitemapUrl: `${BASE_URL}/sitemap/cluster/${c.slug}`,
    gscSubmitUrl: `https://search.google.com/search-console?resource_id=sc_domain:${BASE_URL.replace(/^https?:\/\//, "")}&url=${encodeURIComponent(`${BASE_URL}/sitemap/cluster/${c.slug}`)}`,
  }));

  return NextResponse.json({
    sitemapIndex: `${BASE_URL}/sitemap/index`,
    clusterSitemaps: urls,
    instructions: "Submit each sitemapUrl to Google Search Console under Sitemaps, or submit the sitemapIndex to include all.",
  });
}
