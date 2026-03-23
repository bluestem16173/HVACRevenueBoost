import sql from "@/lib/db";
import type { GraphLinks, PageRow } from "@/lib/linking/graph-linking-engine";

export async function saveGraphLinks(
  page: PageRow,
  links: GraphLinks,
): Promise<void> {
  await sql`
    UPDATE pages
    SET content_json = jsonb_set(
      COALESCE(content_json, '{}'::jsonb),
      '{relationships}',
      ${JSON.stringify(links)}::jsonb,
      true
    ),
    updated_at = now()
    WHERE id = ${page.id}
  `;
}
