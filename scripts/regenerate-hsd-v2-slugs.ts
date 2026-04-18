/**
 * One-off / ops: regenerate specific localized slugs with HSD v2 → Neon upsert.
 *
 *   npx tsx scripts/regenerate-hsd-v2-slugs.ts
 *   npx tsx scripts/regenerate-hsd-v2-slugs.ts hvac/weak-airflow/tampa-fl hvac/ac-not-turning-on/tampa-fl
 *
 * Requires: GENERATION_ENABLED=true, OPENAI_API_KEY, DATABASE_URL
 */
import "dotenv/config";
import { generateDiagnosticEngineJson } from "../lib/content-engine/generator";
import { upsertHsdV2CitySymptomPage } from "../lib/db/upsertHsdV2CitySymptomPage";
import { HSD_V2_SCHEMA_VERSION } from "../lib/generated-page-json-contract";
import { assertHsdV2CitySymptomPublishable } from "../lib/hsd/assertHsdV2CitySymptomPublishable";
import { buildDgFloridaGridRelatedLinks } from "../lib/render/dgFloridaGridConfig";
import {
  formatCityPathSegmentForDisplay,
  parseLocalizedStorageSlug,
  type ServiceVertical,
} from "../lib/localized-city-path";
import { enforceStoredSlug } from "../lib/slug-utils";

const DEFAULT_SLUGS = [
  "hvac/ac-not-turning-on/tampa-fl",
  "hvac/weak-airflow/tampa-fl",
  "hvac/ac-freezing-up/tampa-fl",
  "hvac/ac-making-noise/tampa-fl",
  "plumbing/water-heater-not-working/tampa-fl",
  "electrical/circuit-overload/tampa-fl",
] as const;

const ACRONYMS = new Set(["ac", "hvac", "rv", "fl", "uv", "led", "diy"]);

function pillarToPrimaryIssue(pillar: string): string {
  return pillar
    .toLowerCase()
    .trim()
    .split("-")
    .map((w) =>
      ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
}

function relatedLinksForSlug(slug: string, vertical: ServiceVertical): Record<string, unknown> {
  const paths = buildDgFloridaGridRelatedLinks(slug);
  const siblings = paths.map((p) => p.replace(/^\//, ""));
  return {
    parent: `/${vertical}`,
    siblings: siblings.length ? siblings : [],
    service: "",
    authority: "",
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.error("Set GENERATION_ENABLED=true to run.");
    process.exit(1);
  }

  const argvSlugs = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const slugs =
    argvSlugs.length > 0 ? argvSlugs.map((s) => enforceStoredSlug(s)) : [...DEFAULT_SLUGS];

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const parsed = parseLocalizedStorageSlug(slug);
    if (!parsed) {
      console.error(`Skip (not localized pillar): ${slug}`);
      continue;
    }
    const displayCity = formatCityPathSegmentForDisplay(parsed.citySlug);
    const primaryIssue = pillarToPrimaryIssue(parsed.pillarCore);
    const title = `${primaryIssue} in ${displayCity}`;

    console.log(`[${i + 1}/${slugs.length}] ${slug}`);

    let lastFeedback = "";
    let contentJson: Record<string, unknown> | null = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const raw = await generateDiagnosticEngineJson(
        {
          symptom: slug,
          city: displayCity,
          pageType: "symptom",
        },
        lastFeedback,
        {
          schemaVersion: HSD_V2_SCHEMA_VERSION,
          verticalId: parsed.vertical,
          primaryIssue,
        }
      );

      if (!raw || typeof raw !== "object") {
        throw new Error(`empty or non-object response for ${slug}`);
      }

      let merged = { ...(raw as Record<string, unknown>) };
      merged = {
        ...merged,
        title,
        slug,
        city: displayCity,
        symptom: primaryIssue,
        vertical: parsed.vertical,
        related_links: relatedLinksForSlug(slug, parsed.vertical),
      };

      try {
        contentJson = assertHsdV2CitySymptomPublishable(slug, merged);
        break;
      } catch (e) {
        lastFeedback =
          e instanceof Error
            ? `Previous output failed validation: ${e.message}. Fix ALL fields; return full valid JSON only.`
            : String(e);
        if (attempt === 4) throw e;
        console.warn(`  retry ${attempt + 2}/5 (${slug}): ${lastFeedback.slice(0, 200)}`);
        await sleep(400);
      }
    }

    if (!contentJson) throw new Error(`no publishable JSON after retries for ${slug}`);

    await upsertHsdV2CitySymptomPage({ slug, title, contentJson });
    console.log(`  OK: ${title}`);
    await sleep(500);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
