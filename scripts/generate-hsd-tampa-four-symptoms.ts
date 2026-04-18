/**
 * Generate + upsert four Tampa HVAC city_symptom pages (OpenAI + Zod + content rules + retries).
 *
 *   npx tsx scripts/generate-hsd-tampa-four-symptoms.ts
 *
 * Requires: DATABASE_URL, GENERATION_ENABLED=true, OPENAI_API_KEY
 */
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { generateWithRetry } from "../src/lib/ai/generateHsdPage";
import { upsertPage } from "../src/lib/db/upsertPage";

const JOBS: { symptom: string }[] = [
  { symptom: "Weak Airflow" },
  { symptom: "AC Making Noise" },
  { symptom: "AC Not Turning On" },
  { symptom: "AC Freezing Up" },
];

async function main() {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.error("Set GENERATION_ENABLED=true to run generation.");
    process.exit(1);
  }

  for (const { symptom } of JOBS) {
    const page = await generateWithRetry({
      symptom,
      city: "Tampa",
      state: "FL",
      vertical: "hvac",
    });
    await upsertPage(page);
    console.log("upserted:", page.slug);
  }

  console.log("Done:", JOBS.length, "pages.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
