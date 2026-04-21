/**
 * Batch national **problem pillars**: **DG_AUTHORITY_ENGINE_V4** via
 * {@link generateProblemPillarPage} → hsd_v2 finalize → `pages` upsert (`problem_pillar`).
 *
 * This repo does not ship `generateWithLLM` or `@vercel/postgres`; generation goes through
 * `generateProblemPillarPage` so `content_json` matches `renderHsdV25`.
 *
 * `pages.slug` is **storage shape** (no leading slash): `hvac/ac-not-cooling`, not `/hvac/...`.
 *
 * Usage:
 *   GENERATION_ENABLED=true npx tsx scripts/generate-pillars.ts
 */
import path from "node:path";

import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { upsertHsdPage } from "@/lib/homeservice/upsertHsdPage";
import type { ServiceVertical } from "@/lib/localized-city-path";
import { generateProblemPillarPage } from "@/src/lib/ai/generateProblemPillarPage";

type PillarDef = {
  vertical: ServiceVertical;
  /** URL segment / storage tail (kebab-case). */
  slug: string;
  system: string;
  symptom: string;
};

// ---- DEFINE YOUR PILLARS ----

const PILLARS: PillarDef[] = [
  // HVAC
  { vertical: "hvac", slug: "ac-not-cooling", system: "HVAC", symptom: "AC not cooling" },
  { vertical: "hvac", slug: "weak-airflow", system: "HVAC", symptom: "Weak airflow" },
  { vertical: "hvac", slug: "no-cold-air", system: "HVAC", symptom: "No cold air" },

  // Electrical (gold-standard national pillars — Lee cluster)
  {
    vertical: "electrical",
    slug: "breaker-keeps-tripping",
    system: "Electrical",
    symptom: "Breaker keeps tripping",
  },
  { vertical: "electrical", slug: "outlet-not-working", system: "Electrical", symptom: "Outlet not working" },
  { vertical: "electrical", slug: "lights-flickering", system: "Electrical", symptom: "Lights flickering or dimming" },
  {
    vertical: "electrical",
    slug: "burning-smell-outlet",
    system: "Electrical",
    symptom: "Burning smell from outlet or panel",
  },
  {
    vertical: "electrical",
    slug: "partial-power-house",
    system: "Electrical",
    symptom: "Partial power — half the house dead",
  },

  // Plumbing
  { vertical: "plumbing", slug: "no-hot-water", system: "Plumbing", symptom: "No hot water" },
  { vertical: "plumbing", slug: "drain-clogged", system: "Plumbing", symptom: "Drain clogged" },
  {
    vertical: "plumbing",
    slug: "water-heater-leaking",
    system: "Plumbing",
    symptom: "Water heater leaking",
  },
];

// ---- MAIN ----

async function main() {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.error("Set GENERATION_ENABLED=true to run generation.");
    process.exit(1);
  }

  for (const p of PILLARS) {
    const storageSlug = `${p.vertical}/${p.slug}`.toLowerCase();
    const urlPath = `/${p.vertical}/${p.slug}`;

    console.log(`\nGenerating: ${urlPath}  (storage slug: ${storageSlug})`);
    console.log(`  system=${p.system}  symptom=${p.symptom}`);

    const page = await generateProblemPillarPage({ vertical: p.vertical, pillarSlug: p.slug }, 2);
    await upsertHsdPage(
      { slug: storageSlug, page_type: "problem_pillar" },
      page as unknown as Record<string, unknown>
    );

    console.log(`Saved: ${urlPath}`);
  }

  console.log("\nPillar generation complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
