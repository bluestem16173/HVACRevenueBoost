/**
 * GET smoke test: Lee monetization cluster pages in `pages` that were **created or updated today (UTC)**.
 *
 * Uses locked slugs from `lib/homeservice/leeCountyInitialMonetizationCluster.ts` (electrical + plumbing × `LEE_COUNTY_CITIES`).
 *
 *   npx tsx scripts/smoke-lee-county-generated-today.ts
 *   npx tsx scripts/smoke-lee-county-generated-today.ts http://localhost:3000
 *   npx tsx scripts/smoke-lee-county-generated-today.ts https://www.hvacrevenueboost.com
 */
import path from "node:path";

import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import sql from "../lib/db";
import { getLeeMonetizationPageQueueJobs } from "../lib/homeservice/leeCountyInitialMonetizationCluster";
import { LEE_COUNTY_CITIES } from "../lib/vertical-hub-shared";
import { enforceStoredSlug } from "../lib/slug-utils";

const DEFAULT_BASE = "http://localhost:3000";

function expectedClusterSlugs(): string[] {
  const out: string[] = [];
  for (const job of getLeeMonetizationPageQueueJobs()) {
    for (const cityTail of LEE_COUNTY_CITIES) {
      out.push(`${job.vertical}/${job.slug}/${cityTail}`.toLowerCase());
    }
  }
  return out;
}

function normalizeBase(raw: string): string {
  return raw.replace(/\/+$/, "");
}

async function main() {
  const base = normalizeBase(process.argv[2]?.trim() || DEFAULT_BASE);
  const expected = expectedClusterSlugs();

  const rows = (await sql`
    SELECT slug
    FROM public.pages
    WHERE slug = ANY(${expected}::text[])
      AND (timezone('utc', COALESCE(updated_at, created_at)))::date = (timezone('utc', now()))::date
    ORDER BY slug
  `) as Array<{ slug: string }>;

  const list = rows.map((r) => enforceStoredSlug(r.slug)).filter(Boolean);

  console.log(`Lee cluster smoke (UTC today): base=${base}`);
  console.log(`Candidates in DB for today: ${list.length} (of ${expected.length} cluster slugs)\n`);

  if (list.length === 0) {
    console.log("Nothing to smoke — no Lee cluster rows touched today in `pages`.");
    const foundOther = (await sql`
      SELECT COUNT(*)::int AS c
      FROM public.pages
      WHERE slug = ANY(${expected}::text[])
    `) as Array<{ c: number }>;
    console.log(`Hint: ${foundOther[0]?.c ?? 0} cluster page(s) exist in pages (any date). Run without date filter or generate first.`);
    return;
  }

  let fail = 0;
  for (const slug of list) {
    const pathSeg = `/${slug}`;
    const url = `${base}${pathSeg}`;
    try {
      const res = await fetch(url, { redirect: "follow" });
      const ok = res.ok;
      if (!ok) fail++;
      console.log(`${ok ? "OK " : "FAIL"} ${res.status} ${url}`);
    } catch (e) {
      fail++;
      console.log(`FAIL — ${url} (${e instanceof Error ? e.message : String(e)})`);
    }
  }

  console.log(`\nDone: ${list.length - fail}/${list.length} OK`);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
