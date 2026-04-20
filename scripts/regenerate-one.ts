/**
 * Single-slug regen (matches `page_queue` worker):
 * - **Localized** `{vertical}/{symptom}/{city-st}` → `generateHsdPage` → `upsertPage`
 * - **National pillar** `{vertical}/{symptom}` → `generateProblemPillarPageWithRetry` → `upsertHsdPage` (`problem_pillar`)
 *
 * Prereq: `DATABASE_URL`, `OPENAI_API_KEY`, `.env.local`, and **`GENERATION_ENABLED=true`**.
 *
 *   GENERATION_ENABLED=true npx tsx scripts/regenerate-one.ts electrical/breaker-keeps-tripping/fort-myers-fl
 *   GENERATION_ENABLED=true npx tsx scripts/regenerate-one.ts /plumbing/no-hot-water/cape-coral-fl
 *   GENERATION_ENABLED=true npx tsx scripts/regenerate-one.ts /hvac/ac-not-cooling
 */
import path from "node:path";

import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { enforceStoredSlug } from "../lib/slug-utils";
import { canonicalLocalizedStorageSlug, formatCityPathSegmentForDisplay, parseLocalizedStorageSlug } from "../lib/localized-city-path";
import { parseCityStateForPrompt } from "../lib/prompt-schema-router";
import { upsertHsdPage } from "../lib/homeservice/upsertHsdPage";
import { parseNationalPillarJob } from "../lib/homeservice/hsdPageQueueWorker";
import { generateProblemPillarPageWithRetry } from "../src/lib/ai/generateProblemPillarPage";
import { generateHsdPage } from "../src/lib/ai/generateHsdPage";
import { upsertPage } from "../src/lib/db/upsertPage";

function cityStateFromStorageSlug(storageSlug: string): { city: string; state: string } {
  const parsed = parseLocalizedStorageSlug(enforceStoredSlug(storageSlug));
  if (!parsed) {
    throw new Error(`Unrecognized localized slug (need vertical/symptom/city-st): ${storageSlug}`);
  }
  const display = formatCityPathSegmentForDisplay(parsed.citySlug);
  const { city, state } = parseCityStateForPrompt(display, null);
  if (!city.trim() || !state.trim()) {
    throw new Error(`Could not derive city/state from city slug "${parsed.citySlug}" (${storageSlug})`);
  }
  return { city: city.trim(), state: state.trim() };
}

async function main() {
  const raw = (process.argv[2] ?? "").trim();
  if (!raw) {
    console.error("❌ Provide slug, e.g. electrical/breaker-keeps-tripping/fort-myers-fl");
    process.exit(1);
  }

  if (process.env.GENERATION_ENABLED !== "true") {
    console.error("❌ Set GENERATION_ENABLED=true to call the model.");
    process.exit(1);
  }

  const slug = canonicalLocalizedStorageSlug(enforceStoredSlug(raw.replace(/^\//, "")));
  console.log("🔧 Regenerating:", slug);

  const localized = parseLocalizedStorageSlug(slug);
  const national = parseNationalPillarJob(slug);

  if (national && !localized) {
    const page = await generateProblemPillarPageWithRetry(
      { vertical: national.vertical, pillarSlug: national.pillar },
      2
    );
    try {
      await upsertHsdPage({ slug, page_type: "problem_pillar" }, page as unknown as Record<string, unknown>);
    } catch (e) {
      console.log("❌ INVALID CONTENT — not saving:", e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
    console.log("✅ Regenerated successfully (national pillar):", slug);
    return;
  }

  if (!localized) {
    console.error("❌ Slug must be {vertical}/{symptom}/{city-st} or national {vertical}/{symptom}");
    process.exit(1);
  }

  const { city, state } = cityStateFromStorageSlug(slug);

  const page = await generateHsdPage({
    symptom: localized.pillarCore,
    city,
    state,
    vertical: localized.vertical,
  });

  try {
    await upsertPage(page as Parameters<typeof upsertPage>[0]);
  } catch (e) {
    console.log("❌ INVALID CONTENT — not saving:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  }

  console.log("✅ Regenerated successfully:", slug);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
