import sql from "@/lib/db";
import { normalizePagesTableSlugLookup } from "@/lib/slug-utils";

export type PageFromDbRow = {
  slug: string;
  title: string | null;
  content_html: string | null;
  content_json: unknown;
  status: string;
};

/** Raw published row for TEMP HTML/JSON bypass routes (no quality / schema gates). */
export async function getPageFromDB(slug: string): Promise<PageFromDbRow | null> {
  const normalized = normalizePagesTableSlugLookup(slug);
  if (!normalized) return null;

  const rows = await sql`
    SELECT slug, title, content_html, content_json, status
    FROM pages
    WHERE slug = ${normalized}
      AND status = 'published'
    LIMIT 1
  `;
  return (rows[0] as PageFromDbRow) ?? null;
}
