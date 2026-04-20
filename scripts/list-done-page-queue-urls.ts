/**
 * One-off: print canonical URLs for page_queue jobs that finished successfully (status = done).
 * Run: npx tsx scripts/list-done-page-queue-urls.ts
 */
import path from "node:path";

import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import sql from "../lib/db";
import { SITE_ORIGIN } from "../lib/seo/canonical";

async function main() {
  const rows = await sql`
    SELECT slug, completed_at
    FROM public.page_queue
    WHERE status = 'done'
    ORDER BY completed_at DESC NULLS LAST
    LIMIT 100
  `;
  const list = rows as Array<{ slug: string; completed_at: string | null }>;
  if (list.length === 0) {
    console.log("(no rows with status = 'done')");
    return;
  }
  for (const r of list) {
    const pathSeg = r.slug.startsWith("/") ? r.slug : `/${r.slug}`;
    console.log(`${SITE_ORIGIN}${pathSeg}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
