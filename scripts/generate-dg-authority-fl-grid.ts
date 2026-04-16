/**
 * Batch: DG_AUTHORITY_V3 JSON for Florida metros × core AC issues.
 *
 * Flow: generate → validate → enforce layout → related_links → render HTML → store → indexing ping → metrics log
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
import sql from "../lib/db";
import { generateDiagnosticEngineJson } from "../lib/content-engine/generator";
import { DG_AUTHORITY_V3_SCHEMA_VERSION } from "../lib/prompt-schema-router";
import {
  DG_FL_GRID_ISSUE_PHRASES,
  DG_FL_SPOKEN_CITY_TO_SLUG,
  buildDgFloridaGridRelatedLinks,
  issuePhraseToPillar,
} from "../lib/render/dgFloridaGridConfig";
import {
  assertDgAuthorityV3Publishable,
  enforceDgAuthorityV3Layout,
} from "../lib/render/dgAuthorityV3Publish";
import { renderDiagnosticEngineJsonToHtml } from "../lib/render/renderDiagnosticEngineJsonToHtml";
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
    for (const [cityKey, citySlug] of Object.entries(DG_FL_SPOKEN_CITY_TO_SLUG)) {
      const slug = buildLocalizedStorageSlug("hvac", pillar, citySlug);
      jobs.push({ issue, cityKey, citySlug, slug: enforceStoredSlug(slug) });
    }
  }

  console.log(
    `DG_AUTHORITY_V3 grid: ${jobs.length} pages (${DG_FL_GRID_ISSUE_PHRASES.length} issues × ${Object.keys(DG_FL_SPOKEN_CITY_TO_SLUG).length} cities).`
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
          schemaVersion: DG_AUTHORITY_V3_SCHEMA_VERSION,
          verticalId: "hvac",
          primaryIssue,
        }
      );

      if (!raw || typeof raw !== "object") {
        throw new Error("empty or non-object response");
      }

      let contentJson = { ...(raw as Record<string, unknown>) };
      contentJson = enforceDgAuthorityV3Layout(contentJson);

      assertDgAuthorityV3Publishable(j.slug, contentJson);

      const related_links = buildDgFloridaGridRelatedLinks(j.slug);
      contentJson = {
        ...contentJson,
        title,
        slug: j.slug,
        related_links,
      };

      const content_html = renderDiagnosticEngineJsonToHtml(contentJson);

      await sql`
        INSERT INTO pages (
          slug,
          content_json,
          content_html,
          status,
          page_type,
          title,
          city,
          schema_version,
          updated_at
        )
        VALUES (
          ${j.slug},
          ${JSON.stringify(contentJson)}::jsonb,
          ${content_html},
          'published',
          'city_symptom',
          ${title},
          ${displayCity},
          ${DG_AUTHORITY_V3_SCHEMA_VERSION},
          NOW()
        )
        ON CONFLICT (slug) DO UPDATE SET
          content_json = EXCLUDED.content_json,
          content_html = EXCLUDED.content_html,
          title = EXCLUDED.title,
          page_type = EXCLUDED.page_type,
          status = EXCLUDED.status,
          city = EXCLUDED.city,
          schema_version = EXCLUDED.schema_version,
          updated_at = NOW()
      `;

      const path = `/hvac/${issuePhraseToPillar(j.issue)}/${j.citySlug}`;
      const url = canonicalUrlForPath(path);
      const idx = url ? await notifyGoogleIndexing(url) : { ok: true as const, skipped: true as const };
      console.log(
        JSON.stringify({
          metric: "dg_fl_grid_page",
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
