/**
 * Generate a **national problem pillar** with PROBLEM_PILLAR_V1, map to hsd_v2, upsert `pages`.
 *
 * Usage:
 *   GENERATION_ENABLED=true npx tsx scripts/generate-problem-pillar-page.ts hvac ac-not-cooling
 *   GENERATION_ENABLED=true npx tsx scripts/generate-problem-pillar-page.ts electrical breaker-keeps-tripping
 */
import path from "node:path";

import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { upsertHsdPage } from "@/lib/homeservice/upsertHsdPage";
import type { ServiceVertical } from "@/lib/localized-city-path";
import { generateProblemPillarPage } from "@/src/lib/ai/generateProblemPillarPage";

function usage(): never {
  console.error(
    "Usage: GENERATION_ENABLED=true npx tsx scripts/generate-problem-pillar-page.ts <hvac|plumbing|electrical> <pillar-slug>"
  );
  process.exit(1);
}

async function main() {
  const v = String(process.argv[2] ?? "").trim().toLowerCase() as ServiceVertical;
  const pillar = String(process.argv[3] ?? "").trim().toLowerCase();
  if (!v || !pillar) usage();
  if (v !== "hvac" && v !== "plumbing" && v !== "electrical") usage();

  const slug = `${v}/${pillar}`;
  const page = await generateProblemPillarPage({ vertical: v, pillarSlug: pillar }, 2);
  await upsertHsdPage({ slug, page_type: "problem_pillar" }, page as unknown as Record<string, unknown>);
  console.log("Upserted national pillar:", slug);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
