/**
 * Step 5 — `page_queue` worker: claim → generating → generate → validate → pages upsert → done | failed.
 *
 * Table name is **`page_queue`** (see `db/migrations/015_page_queue.sql`). Product docs may contrast with
 * `generation_queue` (`lib/generation-queue.ts`) which powers the legacy HVAC worker.
 */

import sql from "@/lib/db";
import { ensurePageQueueSchema } from "@/lib/homeservice/ensurePageQueueSchema";
import { generateDiagnosticEngineJson } from "@/lib/content-engine/generator";
import {
  HSD_CITY_DIAGNOSTIC_SCHEMA_VERSION,
} from "@/lib/prompt-schema-router";
import { validateHsdCityPublishGate } from "./validateHsdCityPublishGate";
import { enforceStoredSlug } from "@/lib/slug-utils";
import { canonicalLocalizedStorageSlug } from "@/lib/localized-city-path";

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

function inferVerticalId(slug: string): string {
  const s = enforceStoredSlug(slug).toLowerCase();
  if (s.startsWith("plumbing/")) return "plumbing";
  return "hvac";
}

function inferCityColumn(slug: string): string | null {
  const parts = enforceStoredSlug(slug).split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && /-fl$|-tx$|-az$/i.test(last)) return last;
  return null;
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
  result: Record<string, unknown>
): Promise<void> {
  const cleanSlug = canonicalLocalizedStorageSlug(job.slug);
  const title = String(result.title || "Untitled");
  const pageType = job.page_type || "city_symptom";
  const city = inferCityColumn(job.slug);
  const html = `<h1>${title}</h1><p>HSD city diagnostic (page_queue).</p>`;
  (result as Record<string, unknown>).slug = cleanSlug;

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
      updated_at
    )
    VALUES (
      ${cleanSlug},
      ${JSON.stringify(result)}::jsonb,
      ${html},
      'published',
      'approved',
      ${pageType},
      ${title},
      ${city},
      ${HSD_CITY_DIAGNOSTIC_SCHEMA_VERSION},
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
      updated_at = NOW()
  `;
}

export async function generateJsonForHsdPageQueueSlug(
  slug: string,
  pageType: string
): Promise<Record<string, unknown>> {
  const path = enforceStoredSlug(slug);
  const verticalId = inferVerticalId(path);
  const raw = await generateDiagnosticEngineJson(
    {
      symptom: path,
      city: "Tampa, FL",
      pageType,
    },
    "",
    { schemaVersion: HSD_CITY_DIAGNOSTIC_SCHEMA_VERSION, verticalId }
  );
  if (!raw || typeof raw !== "object") {
    throw new Error("generateDiagnosticEngineJson returned empty or non-object");
  }
  return raw as Record<string, unknown>;
}

/**
 * One job: generate → gate → upsert pages → done. On any error, mark failed (no publish).
 */
export async function processOnePageQueueJob(job: PageQueueRow): Promise<void> {
  try {
    const result = await generateJsonForHsdPageQueueSlug(
      canonicalLocalizedStorageSlug(job.slug),
      job.page_type
    );
    const gate = validateHsdCityPublishGate(result);
    if (!gate.ok) {
      throw new Error(`publish gate: ${gate.errors.join("; ")}`);
    }
    await upsertPageFromHsdCityJson(job, result);
    await markPageQueueDone(job.id);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await markPageQueueFailed(job.id, msg);
    throw e;
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
