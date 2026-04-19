/**
 * One-shot: generate + upsert hvac/ac-making-noise/tampa-fl (HSD v2 JSON).
 *
 *   npx tsx scripts/generate-hsd-ac-making-noise-tampa.ts
 *
 * Requires: DATABASE_URL, GENERATION_ENABLED=true, OPENAI_API_KEY (.env.local)
 */
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { generateHsdPage } from "../src/lib/ai/generateHsdPage";
import { upsertPage } from "../src/lib/db/upsertPage";

const EXPECTED_SLUG = "hvac/ac-making-noise/tampa-fl";

async function main() {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.error("Set GENERATION_ENABLED=true");
    process.exit(1);
  }

  const page = await generateHsdPage({
    symptom: "AC Making Noise",
    city: "Tampa",
    state: "FL",
    vertical: "hvac",
  });

  if (page.slug !== EXPECTED_SLUG) {
    console.warn(`Expected slug ${EXPECTED_SLUG}, got ${page.slug} — still upserting.`);
  }

  await upsertPage(page);
  console.log("upserted:", page.slug, page.title);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
