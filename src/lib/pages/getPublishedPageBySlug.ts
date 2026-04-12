import sql from "../../../lib/db";

export type PublishedPageRow = {
  id?: number;
  slug: string;
  page_type: string | null;
  status: string;
  content_json: unknown;
  content_html?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

export async function getPublishedPageBySlug(slug: string): Promise<PublishedPageRow | null> {
  // Use existing Neon 'sql' template tag
  const result = await sql`
    SELECT
      id,
      slug,
      page_type,
      status,
      content_json,
      content_html
    FROM pages
    WHERE slug = ${slug}
      AND status = 'published'
    LIMIT 1
  `;

  return (result[0] as PublishedPageRow) ?? null;
}
