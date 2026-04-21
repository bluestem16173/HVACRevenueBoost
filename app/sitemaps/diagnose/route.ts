import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { diagnosePublicPathname, siteCanonicalUrl } from "@/lib/seo/canonical";
import { getIndexableSinceDate, isStrictIndexingEnabled } from "@/lib/seo/strict-indexing";
import { enforceStoredSlug, isIndexable, isNationalVerticalPillarSlug } from "@/lib/slug-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** National `/diagnose/{vertical}/{symptom}` or legacy flat slug (no `…/{city}-fl` rows in this feed). */
function diagnoseStorageKeyForSitemap(raw: string): string | null {
  const s = enforceStoredSlug(String(raw ?? "")).toLowerCase();
  if (isNationalVerticalPillarSlug(s)) return s;
  if (!s.includes("/")) return s;
  return null;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toLastmod(page: { updated_at?: unknown; created_at?: unknown }): string {
  const u = page.updated_at ? new Date(String(page.updated_at)) : null;
  const c = page.created_at ? new Date(String(page.created_at)) : null;
  const d = (u && !Number.isNaN(u.getTime()) ? u : c) ?? new Date();
  return d.toISOString().split("T")[0]!;
}

/** National trade pillar OR legacy flat slug; HSD may be JSON-only (no `content_html`). */
const slugAndContentClause = sql`
      AND slug NOT LIKE 'cause/%'
      AND slug NOT LIKE 'causes/%'
      AND slug NOT LIKE 'repair/%'
      AND slug NOT LIKE 'diagnose/%'
      AND (
        slug ~ '^(hvac|plumbing|electrical)/[a-z0-9-]+$'
        OR (position('/' in slug) = 0 AND length(trim(slug)) > 0)
      )
      AND (content_html IS NOT NULL OR content_json IS NOT NULL)
`;

export async function GET() {
  const since = getIndexableSinceDate();
  const strictSince = isStrictIndexingEnabled() && since;

  if (isStrictIndexingEnabled() && !since) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`.trim();
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  const pages = strictSince
    ? await sql`
    SELECT *
    FROM pages
    WHERE status = 'published'
      AND quality_status = 'approved'
      AND (noindex IS NULL OR noindex = false)
      AND (updated_at >= ${since.toISOString()} OR created_at >= ${since.toISOString()})
      AND slug NOT LIKE '%canary%'
      AND slug NOT LIKE '%test%'
      AND slug NOT LIKE '%v1%'
      AND slug NOT LIKE '%full%'
      AND slug NOT LIKE '%fixed%'
      AND slug NOT LIKE '%after-%'
      AND slug NOT LIKE '%when-%'
      AND slug NOT LIKE '%while-%'
      ${slugAndContentClause}
  `
    : await sql`
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
      ${slugAndContentClause}
  `;

  const uniqueSlugs = new Set<string>();
  const urls: string[] = [];

  for (const page of pages as Record<string, unknown>[]) {
    if (!isIndexable(page)) continue;

    const storage = enforceStoredSlug(String(page.slug ?? "")).toLowerCase();
    const storageKey = diagnoseStorageKeyForSitemap(storage);
    if (!storageKey) continue;

    if (uniqueSlugs.has(storage)) continue;
    uniqueSlugs.add(storage);

    const loc = siteCanonicalUrl(diagnosePublicPathname(storageKey));
    const lastmod = toLastmod(page);
    urls.push(`
  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`.trim();

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
