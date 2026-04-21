/**
 * Generate **Lee County first-wave** electrical city pages (gold-standard pillars × priority cities).
 *
 * Uses `generateHsdPage` + `upsertPage` (same contract as `scripts/regenerate-one.ts`).
 *
 * Prereq: `DATABASE_URL`, `OPENAI_API_KEY`, `.env.local`, **`GENERATION_ENABLED=true`**.
 *
 *   GENERATION_ENABLED=true npx tsx scripts/generate-electrical-lee-priority.ts
 */
import path from "node:path";

import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { enforceStoredSlug } from "../lib/slug-utils";
import {
  canonicalLocalizedStorageSlug,
  formatCityPathSegmentForDisplay,
  parseLocalizedStorageSlug,
} from "../lib/localized-city-path";
import { parseCityStateForPrompt } from "../lib/prompt-schema-router";
import {
  LEE_ELECTRICAL_PRIORITY_CITY_SLUGS,
  LEE_MONETIZATION_ELECTRICAL_SYMPTOMS,
} from "../lib/homeservice/leeCountyInitialMonetizationCluster";
import { generateHsdPage } from "../src/lib/ai/generateHsdPage";
import { upsertPage } from "../src/lib/db/upsertPage";

function cityStateFromCitySlug(cityStorageTail: string): { city: string; state: string } {
  const display = formatCityPathSegmentForDisplay(cityStorageTail);
  const { city, state } = parseCityStateForPrompt(display, null);
  if (!city.trim() || !state.trim()) {
    throw new Error(`Could not derive city/state from "${cityStorageTail}"`);
  }
  return { city: city.trim(), state: state.trim() };
}

async function main() {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.error("❌ Set GENERATION_ENABLED=true to call the model.");
    process.exit(1);
  }

  const pillars = [...LEE_MONETIZATION_ELECTRICAL_SYMPTOMS];
  const cities = [...LEE_ELECTRICAL_PRIORITY_CITY_SLUGS];

  console.log(
    `Generating ${pillars.length} pillars × ${cities.length} cities = ${pillars.length * cities.length} pages\n`
  );

  for (const pillar of pillars) {
    for (const cityTail of cities) {
      const slug = canonicalLocalizedStorageSlug(
        enforceStoredSlug(`electrical/${pillar}/${cityTail}`)
      );
      const localized = parseLocalizedStorageSlug(slug);
      if (!localized) {
        console.error("❌ Bad slug:", slug);
        process.exit(1);
      }
      const { city, state } = cityStateFromCitySlug(localized.citySlug);

      console.log("→", slug);
      try {
        const page = await generateHsdPage({
          symptom: localized.pillarCore,
          city,
          state,
          vertical: "electrical",
        });
        await upsertPage(page as Parameters<typeof upsertPage>[0]);
        console.log("  ✅ saved");
      } catch (e) {
        console.error("  ❌", e instanceof Error ? e.message : String(e));
        process.exit(1);
      }
    }
  }

  console.log("\n✅ Electrical Lee priority batch complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
