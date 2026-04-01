import "dotenv/config";
import sql from "../lib/db";
import { isGoldStandardPageRow } from "../lib/page-gold";
import { PagesStatus } from "../lib/page-status";

/**
 * Marks non–gold-standard **live** pages as stale (run manually).
 * Set CONFIRM_STALE_MARK=yes to execute updates.
 */
async function main() {
  if (process.env.CONFIRM_STALE_MARK !== "yes") {
    console.log("Refusing to run: set CONFIRM_STALE_MARK=yes after reviewing criteria.");
    process.exit(0);
  }

  const rows = await sql`
    SELECT slug, schema_version, quality_score
    FROM pages
    WHERE status IN ('published', 'validated', 'generated')
  ` as { slug: string; schema_version?: string | null; quality_score?: number | null }[];

  let n = 0;
  for (const row of rows) {
    if (!isGoldStandardPageRow(row)) {
      await sql`UPDATE pages SET status = ${PagesStatus.STALE} WHERE slug = ${row.slug}`;
      n++;
    }
  }
  console.log(`Updated ${n} rows to status '${PagesStatus.STALE}' (non-gold).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
