import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { normalizeSlug, isIndexable } from "@/lib/slug-utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // DB (filtered) -> sitemap
  const pages = await sql`
    SELECT * 
    FROM pages 
    WHERE status = 'published'
      AND quality_status = 'approved'
      AND (noindex IS NULL OR noindex = false)
      AND slug NOT LIKE '%canary%'
      AND slug NOT LIKE '%test%'
      AND slug NOT LIKE '%v1%'
      AND slug NOT LIKE '%full%'
      AND slug NOT LIKE '%fixed%'
      AND slug NOT LIKE '%after-%'
      AND slug NOT LIKE '%when-%'
      AND slug NOT LIKE '%while-%'
      AND slug NOT LIKE 'cause/%'
      AND slug NOT LIKE 'causes/%'
      AND slug NOT LIKE 'repair/%'
      AND slug NOT LIKE 'diagnose/%'
      AND slug NOT LIKE '%/%'
      AND content_html IS NOT NULL
      AND content_json IS NOT NULL
  `;

  // Ensure unique slugs via Set
  const uniqueSlugs = new Set();
  const urls: string[] = [];

  for (const page of pages) {
    // We check valid slugs FIRST on raw
    if (!isIndexable(page)) continue;

    // Then we normalize to prevent nested /diagnose/diagnose/...
    const cleanSlug = normalizeSlug(page.slug);
    
    // Safety check just in case normalize slug becomes an empty string or still contains bad stuff
    if (!cleanSlug || cleanSlug.includes("/")) continue;

    if (!uniqueSlugs.has(cleanSlug)) {
      uniqueSlugs.add(cleanSlug);
      urls.push(`
    <url>
      <loc>https://hvacrevenueboost.com/diagnose/${cleanSlug}</loc>
    </url>`);
    }
  }

  const xml = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls.join("")}
    </urlset>
  `.trim();

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
