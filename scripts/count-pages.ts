import "dotenv/config";
import sql from "../lib/db";

async function run() {
  const total = await sql`
    SELECT COUNT(*)::int as n FROM pages WHERE content_json IS NOT NULL
  ` as { n: number }[];
  const byType = await sql`
    SELECT page_type, COUNT(*)::int as n 
    FROM pages WHERE content_json IS NOT NULL 
    GROUP BY page_type
  ` as { page_type: string; n: number }[];
  const acPages = await sql`
    SELECT slug, page_type, title
    FROM pages 
    WHERE slug ILIKE '%ac-not-cooling%' AND content_json IS NOT NULL
  ` as { slug: string; page_type: string; title: string }[];

  console.log("\n=== TOTAL PAGES WITH CONTENT ===");
  console.log("Total:", total[0]?.n ?? 0);
  console.log("\nBy page_type:");
  byType.forEach((r) => console.log(" ", r.page_type || "(null):", r.n));
  console.log("\nac-not-cooling related pages:");
  acPages.forEach((r) => console.log(" ", r.slug, "|", r.page_type, "|", r.title));
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
