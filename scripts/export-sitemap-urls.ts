/**
 * Prints all URLs used for indexing: same sources as `app/sitemaps/[filename]/route.ts`
 * plus published/generated `pages` rows under hvac|plumbing|electrical (HSD city paths).
 *
 * Usage:
 *   npx tsx scripts/export-sitemap-urls.ts
 *   npx tsx scripts/export-sitemap-urls.ts > sitemap-urls.txt
 *
 * Requires DATABASE_URL / .env.local like other DB scripts.
 */
import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import sql from "@/lib/db";
import {
  getStaticEntries,
  getSystemEntries,
  getDiagnosticEntries,
  getCityEntries,
  getClusterEntries,
  getSymptomEntries,
  getConditionEntries,
  getCauseEntries,
  getRepairEntries,
  getComponentEntries,
  getLocalEntries,
  getHvacTampaCitySymptomEntries,
} from "@/lib/sitemap-engine";

const BASE = (process.env.NEXT_PUBLIC_BASE_URL || "https://hvacrevenueboost.com").replace(/\/$/, "");

async function tradeHsdPageUrls(): Promise<string[]> {
  try {
    const rows = await sql`
      SELECT slug FROM pages
      WHERE status IN ('published', 'generated')
        AND (slug LIKE 'hvac/%' OR slug LIKE 'plumbing/%' OR slug LIKE 'electrical/%')
        AND (canonical_slug IS NULL OR canonical_slug = slug)
      ORDER BY slug
    `;
    return (rows as { slug: string }[]).map((r) => `${BASE}/${r.slug}`);
  } catch {
    return [];
  }
}

async function main() {
  const chunks: string[][] = [];

  chunks.push(getStaticEntries().map((e) => e.loc));
  chunks.push(getClusterEntries().map((e) => e.loc));
  chunks.push(getHvacTampaCitySymptomEntries().map((e) => e.loc));

  chunks.push((await getSystemEntries()).map((e) => e.loc));
  chunks.push((await getDiagnosticEntries()).map((e) => e.loc));
  chunks.push((await getCityEntries()).map((e) => e.loc));
  chunks.push((await getSymptomEntries()).map((e) => e.loc));
  chunks.push((await getConditionEntries()).map((e) => e.loc));
  chunks.push((await getCauseEntries()).map((e) => e.loc));
  chunks.push((await getRepairEntries()).map((e) => e.loc));
  chunks.push((await getComponentEntries()).map((e) => e.loc));
  chunks.push((await getLocalEntries()).map((e) => e.loc));
  chunks.push(await tradeHsdPageUrls());

  const merged = [...new Set(chunks.flat().filter(Boolean))].sort((a, b) => a.localeCompare(b));
  for (const u of merged) {
    console.log(u);
  }
  console.error(`# total unique URLs: ${merged.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
