/** Inspect what's stored for a page in the DB */
import "dotenv/config";
import sql from "../lib/db";

async function main() {
  const slug = process.argv[2] || "ac-blowing-warm-air";
  const rows = await sql`
    SELECT id, slug, title, page_type, status,
           (content_json IS NOT NULL) as has_content_json
    FROM pages
    WHERE slug = ${slug} OR slug = ${`diagnose/${slug}`}
  `;
  console.log("Pages found:", rows.length);
  console.log(JSON.stringify(rows, null, 2));

  if (rows.length > 0) {
    const full = await sql`
      SELECT * FROM pages WHERE slug = ${slug} OR slug = ${`diagnose/${slug}`}
    `;
    const r = full[0] as any;
    const data = r?.content_json;
    console.log("\nContent keys:", data ? Object.keys(data) : "none");
  }
}

main().catch(console.error);
