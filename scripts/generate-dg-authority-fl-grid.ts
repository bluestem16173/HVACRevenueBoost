/**
 * Batch: **hsd_v2** city × symptom JSON for Florida metros × core AC issues.
 *
 * Requires: OPENAI_API_KEY, DATABASE_URL, GENERATION_ENABLED=true
 * Optional: SITE_ORIGIN, GOOGLE_INDEXING_ACCESS_TOKEN
 *
 * Usage:
 *   npx tsx scripts/generate-dg-authority-fl-grid.ts
 *   npx tsx scripts/generate-dg-authority-fl-grid.ts --dry-run
 *
 * npm: `npm run generate:dg-fl-grid` / `npm run generate:dg-fl-grid -- --dry-run`
 */
import "dotenv/config";
import { generateDiagnosticEngineJson } from "../lib/content-engine/generator";
import { upsertHsdV2CitySymptomPage } from "../lib/db/upsertHsdV2CitySymptomPage";
import { HSD_V2_SCHEMA_VERSION } from "../lib/generated-page-json-contract";
import { assertHsdV2CitySymptomPublishable } from "../lib/hsd/assertHsdV2CitySymptomPublishable";
import {
  DG_FL_GRID_ISSUE_PHRASES,
  DG_FL_SPOKEN_CITY_TO_SLUG,
  buildDgFloridaGridRelatedLinks,
  issuePhraseToPillar,
} from "../lib/render/dgFloridaGridConfig";
import {
  canonicalUrlForPath,
  notifyGoogleIndexing,
} from "../lib/indexing/notifyGoogleIndexing";
import {
  buildLocalizedStorageSlug,
  formatCityPathSegmentForDisplay,
} from "../lib/localized-city-path";
import { enforceStoredSlug } from "../lib/slug-utils";

const ACRONYMS = new Set([
  "ac",
  "hvac",
  "rv",
  "fl",
  "uv",
  "led",
  "diy",
]);

function primaryIssueTitle(issue: string): string {
  return issue
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((w) =>
      ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!dryRun && process.env.GENERATION_ENABLED !== "true") {
    console.error(
      "Set GENERATION_ENABLED=true (and OPENAI_API_KEY) to run generation, or pass --dry-run."
    );
    process.exit(1);
  }

  const jobs: { issue: string; cityKey: string; citySlug: string; slug: string }[] = [];
  for (const issue of DG_FL_GRID_ISSUE_PHRASES) {
    const pillar = issuePhraseToPillar(issue);
    for (const [, citySlug] of Object.entries(DG_FL_SPOKEN_CITY_TO_SLUG)) {
      const slug = buildLocalizedStorageSlug("hvac", pillar, citySlug);
      jobs.push({ issue, cityKey: citySlug, citySlug, slug: enforceStoredSlug(slug) });
    }
  }

  console.log(
    `HSD_V2 grid: ${jobs.length} pages (${DG_FL_GRID_ISSUE_PHRASES.length} issues × ${Object.keys(DG_FL_SPOKEN_CITY_TO_SLUG).length} cities).`
  );
  if (dryRun) {
    for (const j of jobs) {
      console.log(
        `  [dry-run] ${j.slug}  |  ${primaryIssueTitle(j.issue)}  |  ${formatCityPathSegmentForDisplay(j.citySlug)}`
      );
      console.log(`            related_links: ${JSON.stringify(buildDgFloridaGridRelatedLinks(j.slug))}`);
    }
    process.exit(0);
  }

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    const displayCity = formatCityPathSegmentForDisplay(j.citySlug);
    const title = `${primaryIssueTitle(j.issue)} in ${displayCity}`;
    const primaryIssue = primaryIssueTitle(j.issue);

    console.log(`[${i + 1}/${jobs.length}] ${j.slug}`);

    try {
      const raw = await generateDiagnosticEngineJson(
        {
          symptom: j.slug,
          city: displayCity,
          pageType: "symptom",
        },
        "",
        {
          schemaVersion: HSD_V2_SCHEMA_VERSION,
          verticalId: "hvac",
          primaryIssue,
        }
      );

      if (!raw || typeof raw !== "object") {
        throw new Error("empty or non-object response");
      }

      let contentJson = { ...(raw as Record<string, unknown>) };
      const related_links = buildDgFloridaGridRelatedLinks(j.slug);
      contentJson = {
        ...contentJson,
        title,
        slug: j.slug,
        city: displayCity,
        symptom: primaryIssue,
        vertical: "hvac",
        related_links,
      };

      assertHsdV2CitySymptomPublishable(j.slug, contentJson);

      await upsertHsdV2CitySymptomPage({
        slug: j.slug,
        title,
        contentJson,
      });

      const path = `/hvac/${issuePhraseToPillar(j.issue)}/${j.citySlug}`;
      const url = canonicalUrlForPath(path);
      const idx = url ? await notifyGoogleIndexing(url) : { ok: true as const, skipped: true as const };
      console.log(
        JSON.stringify({
          metric: "hsd_v2_fl_grid_page",
          slug: j.slug,
          path,
          canonicalUrl: url || null,
          indexing: idx,
        })
      );

      ok++;
      await sleep(400);
    } catch (e: unknown) {
      fail++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  ❌ ${j.slug}: ${msg}`);
    }
  }

  console.log(`Done. OK=${ok} failed=${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
