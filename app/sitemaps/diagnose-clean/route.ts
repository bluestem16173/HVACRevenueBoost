import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { isIndexable } from "@/lib/slug-utils";

export async function GET() {
  // Step 2: Clean SQL Query
  const pages = await sql`
    SELECT * 
    FROM pages 
    WHERE status = 'published'
      AND (quality_status = 'approved' OR quality_status IS NULL)
      AND quality_status != 'noindex'
      AND slug NOT LIKE '%canary%'
      AND slug NOT LIKE '%test%'
      AND slug NOT LIKE '%v1%'
      AND slug NOT LIKE '%full%'
      AND slug NOT LIKE '%fixed%'
      AND slug NOT LIKE '%after-%'
      AND slug NOT LIKE '%when-%'
      AND slug NOT LIKE '%while-%'
      AND slug NOT LIKE '%/%'
      AND content_html IS NOT NULL
    LIMIT 300
  `;

  // Step 4: Output sitemap XML
  const validPages = pages.filter((p: any) => isIndexable(p));

  const urls = validPages.map((p: any) => `
    <url>
      <loc>https://hvacrevenueboost.com/diagnose/${p.slug}</loc>
    </url>
  `).join("");

  const xml = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls}
    </urlset>
  `.trim();

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
