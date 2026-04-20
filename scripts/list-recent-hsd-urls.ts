/**
 * Print recent localized HSD `pages.slug` rows as full URLs (default base: http://localhost:3000).
 * Usage: npx tsx scripts/list-recent-hsd-urls.ts [baseUrl] [limit]
 */
import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import sql from "@/lib/db";

function slugToPath(slug: string): string {
  const s = String(slug ?? "").trim().replace(/^\/+/, "");
  return s ? `/${s}` : "/";
}

async function main() {
  const base = (process.argv[2] || "http://localhost:3000").replace(/\/+$/, "");
  const limit = Math.min(100, Math.max(1, parseInt(process.argv[3] || "40", 10) || 40));

  const rows = await sql`
    SELECT slug, status, updated_at
    FROM pages
    WHERE slug LIKE 'hvac/%'
       OR slug LIKE 'plumbing/%'
       OR slug LIKE 'electrical/%'
    ORDER BY updated_at DESC NULLS LAST
    LIMIT ${limit}
  `;

  const list = rows as { slug: string; status: string; updated_at: string | null }[];
  if (!list.length) {
    console.log("No matching rows in pages.");
    return;
  }
  for (const r of list) {
    console.log(`${base}${slugToPath(r.slug)}  (${r.status}${r.updated_at ? `, ${r.updated_at}` : ""})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
