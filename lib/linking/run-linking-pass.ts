import sql from "@/lib/db";
import {
  buildGraphLinksForPage,
  type PageRow,
} from "@/lib/linking/graph-linking-engine";
import { saveGraphLinks } from "@/lib/linking/save-graph-links";

export async function runLinkingPass(site?: "dg" | "hvac") {
  const rows = (site
    ? await sql`
        SELECT id, site, slug, title, page_type, status, city, content_json
        FROM pages
        WHERE status IN ('generated', 'published', 'pending')
          AND page_type IN ('system', 'symptom', 'diagnostic', 'cause', 'repair', 'context', 'component')
          AND site = ${site}
        ORDER BY site, page_type, slug
      `
    : await sql`
        SELECT id, site, slug, title, page_type, status, city, content_json
        FROM pages
        WHERE status IN ('generated', 'published', 'pending')
          AND page_type IN ('system', 'symptom', 'diagnostic', 'cause', 'repair', 'context', 'component')
        ORDER BY site, page_type, slug
      `) as PageRow[];

  for (const page of rows) {
    const siteRows = rows.filter((r) => r.site === page.site);
    const links = buildGraphLinksForPage(page, siteRows);
    await saveGraphLinks(page, links);
  }

  return { processed: rows.length };
}
