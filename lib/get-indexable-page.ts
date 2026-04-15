import sql from "@/lib/db";
import { isIndexable } from "@/lib/slug-utils";

/** Published, indexable row from `pages` for public diagnostic rendering. */
export async function getIndexablePageBySlug(slug: string) {
  try {
    const query = await sql`SELECT * FROM pages WHERE slug = ${slug} LIMIT 1`;
    if (!query?.length) return null;
    const page = query[0] as Record<string, unknown>;
    return isIndexable(page) ? page : null;
  } catch {
    return null;
  }
}
