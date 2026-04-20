/**
 * Step 5 — `page_queue` worker: claim → generating → generate → validate → pages upsert → done | failed.
 *
 * `page_type === "hsd"` uses **generateDiagnosticEngineJson** (HSD v2 + HVAC orchestrator) + finalize + {@link upsertHsdPage}; other schemas use {@link upsertPageFromHsdCityJson}. Any other `page_type` uses
 * **generateHsdPage** + **upsertPage** (same shape as `scripts/worker.ts`).
 *
 * Table name is **`page_queue`** (see `db/migrations/015_page_queue.sql`). Product docs may contrast with
 * `generation_queue` (`lib/generation-queue.ts`) which powers the legacy HVAC worker.
 */

import sql from "@/lib/db";
import { generateDiagnosticEngineJson } from "@/lib/content-engine/generator";
import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import { ensurePageQueueSchema } from "@/lib/homeservice/ensurePageQueueSchema";
import { finalizeHsdModelJsonFromRow } from "@/lib/hsd/HSD_Page_Build";
import { parseSlugToHsdRow } from "@/lib/hsd/parseSlugToHsdRow";
import { HSD_V1_LOCKED_LAYOUT, HSD_V1_LOCKED_SCHEMA_VERSION } from "@/lib/hsd/constants";
import { assertPersistableDgAuthorityV2ContentJson } from "@/lib/hsd/assertPersistableDgAuthorityV2ContentJson";
import { enforceStoredSlug } from "@/lib/slug-utils";
import {
  canonicalLocalizedStorageSlug,
  formatCityPathSegmentForDisplay,
  parseLocalizedStorageSlug,
} from "@/lib/localized-city-path";
import { parseCityStateForPrompt } from "@/lib/prompt-schema-router";
import { generateHsdPage } from "@/src/lib/ai/generateHsdPage";
import { generateProblemPillarPageWithRetry } from "@/src/lib/ai/generateProblemPillarPage";
import { upsertPage } from "@/src/lib/db/upsertPage";
import { upsertHsdPage } from "@/lib/homeservice/upsertHsdPage";
import { assertPayloadSubstantiveForPublish } from "@/lib/homeservice/assertPayloadSubstantiveForPublish";

export type PageQueueRow = {
  id: number;
  slug: string;
  page_type: string;
  status: string;
  priority: string;
  last_error: string | null;
  /** Incremented each time the row is claimed (`status` → `generating`). */
  attempts: number;
};

/** Must satisfy `pages.page_type` check constraint (Neon); queue rows may use `diagnostic` etc. */
const allowedPageTypes = new Set([
  "city_symptom",
  "hsd",
  "national_symptom",
  "problem_pillar",
  "repair",
  "guide",
  "landing",
]);

function cityStateFromStorageSlugForQueue(storageSlug: string): { city: string; state: string } {
  const parsed = parseLocalizedStorageSlug(enforceStoredSlug(storageSlug));
  if (!parsed) {
    throw new Error(`Unrecognized localized slug: ${storageSlug}`);
  }
  const display = formatCityPathSegmentForDisplay(parsed.citySlug);
  const { city, state } = parseCityStateForPrompt(display, null);
  if (!city.trim() || !state.trim()) {
    throw new Error(
      `Could not derive city/state from city slug "${parsed.citySlug}" (${storageSlug})`,
    );
  }
  return { city: city.trim(), state: state.trim() };
}

function inferCityColumn(slug: string): string | null {
  const parts = enforceStoredSlug(slug).split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && /-fl$|-tx$|-az$/i.test(last)) return last;
  return null;
}

/** `hvac/ac-not-cooling` → national problem pillar (no city segment). */
export function parseNationalPillarJob(slug: string): { vertical: "hvac" | "plumbing" | "electrical"; pillar: string } | null {
  const parts = enforceStoredSlug(slug).split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const v = parts[0].toLowerCase();
  if (v !== "hvac" && v !== "plumbing" && v !== "electrical") return null;
  const pillar = parts[1].trim().toLowerCase();
  if (!pillar) return null;
  return { vertical: v, pillar };
}

/**
 * Atomically claim up to `limit` pending jobs (priority order), set `generating`, return rows.
 */
export async function claimPageQueueJobs(limit: number): Promise<PageQueueRow[]> {
  const cap = Math.min(50, Math.max(1, limit));
  const rows = await sql`
    UPDATE public.page_queue pq
    SET
      status = 'generating',
      attempts = COALESCE(pq.attempts, 0) + 1,
      updated_at = NOW()
    FROM (
      SELECT id FROM public.page_queue
      WHERE status = 'pending'
      ORDER BY
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          ELSE 3
        END,
        id ASC
      LIMIT ${cap}
      FOR UPDATE SKIP LOCKED
    ) c
    WHERE pq.id = c.id
    RETURNING pq.id, pq.slug, pq.page_type, pq.status, pq.priority, pq.last_error, pq.attempts
  `;
  return rows as unknown as PageQueueRow[];
}

export async function markPageQueueDone(id: number): Promise<void> {
  await sql`
    UPDATE public.page_queue
    SET
      status = 'done',
      completed_at = NOW(),
      updated_at = NOW(),
      last_error = NULL
    WHERE id = ${id}
  `;
}

export async function markPageQueueFailed(id: number, message: string): Promise<void> {
  const msg = message.slice(0, 4000);
  await sql`
    UPDATE public.page_queue
    SET status = 'failed', updated_at = NOW(), last_error = ${msg}
    WHERE id = ${id}
  `;
}

export async function upsertPageFromHsdCityJson(
  job: Pick<PageQueueRow, "slug" | "page_type">,
  result: Record<string, unknown>,
  schemaVersion: string = HSD_V1_LOCKED_SCHEMA_VERSION
): Promise<void> {
  const source = job;
  const cleanSlug = canonicalLocalizedStorageSlug(job.slug);
  const title = String(result.title || "Untitled");
  const dbPageType = allowedPageTypes.has(source.page_type) ? source.page_type : "hsd";
  const city = inferCityColumn(job.slug);
  (result as Record<string, unknown>).slug = cleanSlug;
  (result as Record<string, unknown>).schema_version = schemaVersion;

  /** DG envelope only; `hsd_v2` uses structured `summary_30s` — see {@link upsertHsdPage}. */
  if (schemaVersion === HSD_V1_LOCKED_SCHEMA_VERSION) {
    assertPersistableDgAuthorityV2ContentJson(result);
  }

  assertPayloadSubstantiveForPublish(cleanSlug, result);

  await sql`
    INSERT INTO pages (
      slug,
      content_json,
      content_html,
      status,
      quality_status,
      page_type,
      title,
      city,
      schema_version,
      noindex,
      updated_at
    )
    VALUES (
      ${cleanSlug},
      ${JSON.stringify(result)}::jsonb,
      ${null},
      'published',
      'approved',
      ${dbPageType},
      ${title},
      ${city},
      ${schemaVersion},
      ${false},
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      page_type = EXCLUDED.page_type,
      status = EXCLUDED.status,
      quality_status = EXCLUDED.quality_status,
      content_json = EXCLUDED.content_json,
      content_html = EXCLUDED.content_html,
      schema_version = EXCLUDED.schema_version,
      city = COALESCE(EXCLUDED.city, pages.city),
      noindex = false,
      updated_at = NOW()
  `;
}

/** Fail before Zod / finalize if the model omitted core HSD v2 blocks (saves downstream work). */
export function assertHsdShape(json: Record<string, unknown>): void {
  if (typeof json.summary_30s !== "object" || json.summary_30s === null) {
    throw new Error("Missing HSD core fields: summary_30s");
  }
  if (!Array.isArray(json.diagnostic_steps) || json.diagnostic_steps.length === 0) {
    throw new Error("Missing HSD core fields: diagnostic_steps");
  }
  const hasBranchField =
    (Array.isArray(json.decision_tree_text) &&
      json.decision_tree_text.some((s) => String(s ?? "").trim().length > 0)) ||
    (typeof json.decision_tree === "string" && json.decision_tree.trim().length > 0) ||
    (json.decision_tree != null && typeof json.decision_tree !== "string");
  if (!hasBranchField) {
    throw new Error("Missing HSD branching field: decision_tree_text or decision_tree");
  }
}

/**
 * queue → **generateDiagnosticEngineJson** (HSD v2 orchestrator + HVAC vertical) →
 * {@link finalizeHsdModelJsonFromRow} → payload for `pages.content_json`.
 */
export async function generateJsonForHsdPageQueueSlug(slug: string): Promise<Record<string, unknown>> {
  const path = enforceStoredSlug(slug);
  const row = parseSlugToHsdRow(path);
  const storage = canonicalLocalizedStorageSlug(path);

  const orch = {
    schemaVersion: HSD_V2_SCHEMA_VERSION,
    verticalId: "hvac",
  };

  const rawModel = await generateDiagnosticEngineJson(
    { symptom: storage, city: row.city, pageType: "diagnostic_engine" },
    "",
    orch
  );

  if (!rawModel || typeof rawModel !== "object") {
    throw new Error(
      `generateJsonForHsdPageQueueSlug: generation disabled or empty (${storage}). Set GENERATION_ENABLED=true.`,
    );
  }

  const asRecord = rawModel as Record<string, unknown>;
  if (String(asRecord.schema_version ?? "").trim() !== HSD_V2_SCHEMA_VERSION) {
    throw new Error(`Non-HSD schema generated: ${String(asRecord.schema_version ?? "")}`);
  }
  assertHsdShape(asRecord);

  const built = finalizeHsdModelJsonFromRow(row, asRecord);
  const body = { ...(built.content_json as Record<string, unknown>) };
  if (typeof body.summary_30s !== "string" || !body.summary_30s.trim()) {
    const hw = body.how_system_works;
    const dt = body.decision_tree;
    const fallback =
      typeof hw === "string" && hw.trim()
        ? hw.slice(0, 500)
        : typeof dt === "string" && dt.trim()
          ? dt.slice(0, 500)
          : "";
    body.summary_30s = fallback;
  }
  return {
    layout: HSD_V1_LOCKED_LAYOUT,
    schema_version: HSD_V2_SCHEMA_VERSION,
    title: built.title,
    slug: canonicalLocalizedStorageSlug(built.slug),
    page_type_contract: built.page_type,
    ...body,
  };
}

/** PROBLEM_PILLAR_V1 → HSD v2 national slug (`{vertical}/{symptom}`) → `pages` as `problem_pillar`. */
export async function runNationalProblemPillarPipeline(job: PageQueueRow): Promise<void> {
  const slug = canonicalLocalizedStorageSlug(job.slug);
  const parsed = parseNationalPillarJob(slug);
  if (!parsed) {
    throw new Error(`national pillar: expected {vertical}/{symptom}, got: ${slug}`);
  }
  const page = await generateProblemPillarPageWithRetry(
    { vertical: parsed.vertical, pillarSlug: parsed.pillar },
    2
  );
  const upsertJob = { ...job, slug, page_type: "problem_pillar" };
  await upsertHsdPage(upsertJob, page as unknown as Record<string, unknown>);
}

/** `page_type === "hsd"`: HSD v2 diagnostic engine + finalize (via {@link generateJsonForHsdPageQueueSlug}) → `pages` upsert. */
export async function runHsdPipeline(job: PageQueueRow): Promise<void> {
  const result = await generateJsonForHsdPageQueueSlug(canonicalLocalizedStorageSlug(job.slug));
  result.schema_version = HSD_V2_SCHEMA_VERSION;
  if (result.schema_version === HSD_V2_SCHEMA_VERSION) {
    await upsertHsdPage(job, result);
  } else {
    await upsertPageFromHsdCityJson(job, result, String(result.schema_version ?? HSD_V1_LOCKED_SCHEMA_VERSION));
  }
}

async function runLegacyPageQueuePipeline(job: PageQueueRow): Promise<void> {
  const slug = canonicalLocalizedStorageSlug(job.slug);
  const parsed = parseLocalizedStorageSlug(slug);
  if (!parsed) {
    throw new Error(`Invalid queue slug: ${slug}`);
  }
  const { city, state } = cityStateFromStorageSlugForQueue(slug);
  const page = await generateHsdPage({
    symptom: parsed.pillarCore,
    city,
    state,
    vertical: parsed.vertical,
  });
  await upsertPage(page as Parameters<typeof upsertPage>[0]);
}

/**
 * One job:
 * - `national_symptom` / `problem_pillar` with `{vertical}/{symptom}` slug → {@link runNationalProblemPillarPipeline}
 * - `hsd` → {@link runHsdPipeline}
 * - else → `generateHsdPage` + `upsertPage` (localized legacy)
 */
export async function processOnePageQueueJob(job: PageQueueRow): Promise<void> {
  try {
    const pt = (job.page_type ?? "").trim();
    const slug = canonicalLocalizedStorageSlug(job.slug);
    const national = parseNationalPillarJob(slug);
    if (national && (pt === "national_symptom" || pt === "problem_pillar")) {
      await runNationalProblemPillarPipeline(job);
    } else if (pt === "hsd") {
      await runHsdPipeline(job);
    } else {
      await runLegacyPageQueuePipeline(job);
    }
    await markPageQueueDone(job.id);
  } catch (err: any) {
    const message = String(err?.message || err).slice(0, 4000);

    console.error("❌ JOB FAILED:", {
      slug: job.slug,
      error: message,
      stack: err?.stack,
    });

    // Neon `sql` tagged template (this repo has no `db.execute`).
    await sql`
      UPDATE public.page_queue
      SET
        status = 'failed',
        attempts = COALESCE(attempts, 0) + 1,
        last_error = ${message},
        updated_at = NOW()
      WHERE id = ${job.id}
    `;

    throw err;
  }
}

/**
 * Claim up to `limit` jobs and process each sequentially (rate limits / spend).
 */
export async function runHsdPageQueueBatch(limit: number): Promise<{
  claimed: number;
  succeeded: number;
  failed: number;
}> {
  if (process.env.GENERATION_ENABLED !== "true") {
    throw new Error("GENERATION_ENABLED must be 'true' to run page_queue generation");
  }
  await ensurePageQueueSchema();
  const jobs = await claimPageQueueJobs(limit);
  let succeeded = 0;
  let failed = 0;
  for (const job of jobs) {
    try {
      await processOnePageQueueJob(job);
      succeeded++;
    } catch {
      failed++;
    }
  }
  return { claimed: jobs.length, succeeded, failed };
}
