/**
 * One-off: regenerate a localized HSD locked page (OpenAI + validate + upsert `pages`).
 * Usage: npx tsx scripts/regen-hsd-locked-page.ts [slug]
 * Example: npx tsx scripts/regen-hsd-locked-page.ts hvac/ac-not-cooling/tampa-fl
 */
import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import {
  generateJsonForHsdPageQueueSlug,
  upsertPageFromHsdCityJson,
} from "../lib/homeservice/hsdPageQueueWorker";

async function main() {
  const slug = process.argv[2]?.trim() || "hvac/ac-not-cooling/tampa-fl";
  if (!process.env.OPENAI_API_KEY?.trim()) {
    console.error("OPENAI_API_KEY missing (.env.local)");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL missing (.env.local)");
    process.exit(1);
  }

  console.log("Regenerating:", slug);
  const result = await generateJsonForHsdPageQueueSlug(slug);
  await upsertPageFromHsdCityJson(
    { slug, page_type: "city_symptom" },
    result
  );
  console.log("Done. title:", result.title);
  console.log("Has diagnostic_flow:", !!result.diagnostic_flow);
  console.log("content_html stored as NULL (render from JSON at request).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
