/**
 * Print production URLs for Lee monetization cluster pages that exist in `pages`.
 *
 *   npx tsx scripts/list-lee-monetization-produced-urls.ts
 */
import path from "node:path";

import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import sql from "../lib/db";
import { getLeeMonetizationPageQueueJobs } from "../lib/homeservice/leeCountyInitialMonetizationCluster";
import { LEE_COUNTY_CITIES } from "../lib/vertical-hub-shared";
import { SITE_ORIGIN } from "../lib/seo/canonical";

function expectedClusterSlugs(): string[] {
  const out: string[] = [];
  for (const job of getLeeMonetizationPageQueueJobs()) {
    for (const cityTail of LEE_COUNTY_CITIES) {
      out.push(`${job.vertical}/${job.slug}/${cityTail}`.toLowerCase());
    }
  }
  return out;
}

async function main() {
  const expected = expectedClusterSlugs();
  const rows = await sql`
    SELECT slug, status, updated_at
    FROM public.pages
    WHERE slug = ANY(${expected}::text[])
    ORDER BY slug
  `;
  const list = rows as Array<{ slug: string; status: string; updated_at: string | null }>;
  const found = new Set(list.map((r) => r.slug.toLowerCase()));

  console.log(`Cluster: ${expected.length} localized slugs (electrical + plumbing × Lee).`);
  console.log(`In pages table: ${list.length}\n`);

  for (const r of list) {
    const p = r.slug.startsWith("/") ? r.slug : `/${r.slug}`;
    console.log(`${SITE_ORIGIN}${p}`);
  }

  const missing = expected.filter((s) => !found.has(s.toLowerCase()));
  if (missing.length) {
    console.log(`\n--- Not in pages yet (no live URL until published) — ${missing.length} slugs ---`);
    for (const s of missing) {
      console.log(s);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
