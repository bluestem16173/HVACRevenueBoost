/**
 * Page Targets DB Helpers
 * -----------------------
 * Topic expansion / generation queue layer for HVAC Revenue Boost.
 *
 * ARCHITECTURE (why these tables exist):
 *
 * - page_targets = roadmap: what pages should exist (priority, status, refresh).
 *   Exists separately from pages so we can plan expansion, track what's pending,
 *   and avoid duplicate generation. Pages are the artifact; targets are the plan.
 *
 * - pages = generated artifact (actual content). Knowledge content is GLOBAL.
 *   We do NOT duplicate page content for every city. One page slug (e.g. ac-not-cooling)
 *   renders at /tampa/ac-not-cooling, /phoenix/ac-not-cooling via dynamic routing.
 *
 * - page_generation_runs = observability for every AI attempt. Required for:
 *   cost tracking (tokens), retries on failure, debugging validation_failed.
 *
 * Local URLs = shared global content + local contractor/lead module overlay.
 */

import sql from './db';

export type PageTargetType =
  | 'system'
  | 'symptom'
  | 'symptom_condition'
  | 'cause'
  | 'repair'
  | 'diagnostic'
  | 'location_hub'
  | 'component'
  | 'comparison'
  | 'service'
  | 'faq_cluster';

export type GenerationStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'success'
  | 'failed'
  | 'validation_failed';

export interface CreatePageTargetParams {
  slug: string;
  page_type: PageTargetType;
  system_id?: string;
  symptom_id?: string;
  condition_id?: string;
  cause_id?: string;
  repair_id?: string;
  city_id?: string;
  location_id?: string;
  parent_target_id?: string;
  priority_score?: number;
  authority_score?: number;
  monetization_score?: number;
  search_intent_score?: number;
}

/**
 * Create or update a page target.
 * Prevents duplicate generation by slug.
 */
export async function createPageTarget(params: CreatePageTargetParams) {
  const result = await sql`
    INSERT INTO page_targets (
      slug, page_type, system_id, symptom_id, condition_id, cause_id, repair_id, city_id, location_id,
      parent_target_id, priority_score, authority_score, monetization_score, search_intent_score
    ) VALUES (
      ${params.slug}, ${params.page_type},
      ${params.system_id ?? null}, ${params.symptom_id ?? null}, ${params.condition_id ?? null},
      ${params.cause_id ?? null}, ${params.repair_id ?? null}, ${params.city_id ?? null}, ${params.location_id ?? null},
      ${params.parent_target_id ?? null},
      ${params.priority_score ?? 0}, ${params.authority_score ?? 0},
      ${params.monetization_score ?? 0}, ${params.search_intent_score ?? 0}
    )
    ON CONFLICT (slug) DO UPDATE SET
      page_type = EXCLUDED.page_type,
      priority_score = EXCLUDED.priority_score,
      updated_at = NOW()
    RETURNING id, slug, page_type, generation_status
  `;
  return result[0];
}

/**
 * Select pending targets by priority.
 * Includes stale pages (next_refresh_at <= NOW()) for regeneration.
 */
export async function selectPendingTargets(limit = 50) {
  const rows = await sql`
    SELECT *
    FROM page_targets
    WHERE generation_status IN ('pending', 'failed')
       OR (next_refresh_at IS NOT NULL AND next_refresh_at <= NOW())
    ORDER BY priority_score DESC, created_at ASC
    LIMIT ${limit}
  `;
  return rows;
}

/**
 * Store a generated page and link to its target.
 * Uses slug as title fallback; pass title for display.
 */
export async function storeGeneratedPage(params: {
  page_target_id: string;
  slug: string;
  page_type: string;
  content_json: object;
  title?: string;
  system_id?: string;
  symptom_id?: string;
  condition_id?: string;
  cause_id?: string;
  repair_id?: string;
}) {
  const title = params.title ?? params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const result = await sql`
    INSERT INTO pages (
      slug, page_type, title, status, content_json,
      system_id, symptom_id, condition_id, cause_id, repair_id, page_target_id
    ) VALUES (
      ${params.slug}, ${params.page_type}, ${title}, 'published', ${JSON.stringify(params.content_json)},
      ${params.system_id ?? null}, ${params.symptom_id ?? null}, ${params.condition_id ?? null},
      ${params.cause_id ?? null}, ${params.repair_id ?? null}, ${params.page_target_id}
    )
    ON CONFLICT (slug) DO UPDATE SET
      content_json = EXCLUDED.content_json,
      page_target_id = EXCLUDED.page_target_id,
      status = 'published'
    RETURNING id
  `;
  return result[0]?.id;
}

/**
 * Log a generation run (start).
 */
export async function logGenerationRunStart(params: {
  page_target_id: string;
  model_name?: string;
  prompt_version?: string;
}) {
  const result = await sql`
    INSERT INTO page_generation_runs (page_target_id, model_name, prompt_version, status)
    VALUES (${params.page_target_id}, ${params.model_name ?? null}, ${params.prompt_version ?? null}, 'running')
    RETURNING id
  `;
  return result[0]?.id;
}

/**
 * Log a generation run (complete).
 */
export async function logGenerationRunComplete(params: {
  run_id: string;
  status: 'success' | 'failed' | 'validation_failed';
  created_page_id?: string;
  error_message?: string;
  token_input?: number;
  token_output?: number;
  generation_time_ms?: number;
}) {
  await sql`
    UPDATE page_generation_runs
    SET status = ${params.status},
        created_page_id = ${params.created_page_id ?? null},
        error_message = ${params.error_message ?? null},
        token_input = ${params.token_input ?? null},
        token_output = ${params.token_output ?? null},
        generation_time_ms = ${params.generation_time_ms ?? null}
    WHERE id = ${params.run_id}
  `;

  // Update page_target status and refresh
  const run = await sql`
    SELECT page_target_id FROM page_generation_runs WHERE id = ${params.run_id} LIMIT 1
  `;
  const targetId = run[0]?.page_target_id;
  if (targetId) {
    await sql`
      UPDATE page_targets
      SET generation_status = ${params.status},
          token_input = ${params.token_input ?? null},
          token_output = ${params.token_output ?? null},
          generation_time_ms = ${params.generation_time_ms ?? null},
          next_refresh_at = CASE WHEN ${params.status} = 'success' THEN NOW() + INTERVAL '180 days' ELSE NULL END
      WHERE id = ${targetId}
    `;
  }
}

/**
 * Route leads to contractors by location.
 * Uses contractor_locations (location_id or city_id) when available,
 * else contractors.city_slug for backward compatibility.
 */
export async function getContractorsForLocation(citySlug: string) {
  const rows = await sql`
    SELECT DISTINCT c.* FROM contractors c
    LEFT JOIN contractor_locations cl ON cl.contractor_id = c.id
    LEFT JOIN cities ci ON ci.id = cl.city_id
    LEFT JOIN locations loc ON loc.id = cl.location_id OR loc.id = cl.city_id
    WHERE c.city_slug = ${citySlug} OR ci.slug = ${citySlug} OR loc.slug = ${citySlug}
    LIMIT 10
  `;
  return rows;
}

/** Assign a lead to a contractor (for lead routing). */
export async function assignLeadToContractor(leadId: string, contractorId: string) {
  await sql`
    UPDATE leads SET contractor_id = ${contractorId}, status = 'assigned' WHERE id = ${leadId}
  `;
}
