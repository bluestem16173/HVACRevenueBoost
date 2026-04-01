import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon, NeonQueryFunction } from '@neondatabase/serverless';

function normalizeSlug(slug: string) {
  return slug.replace(/^\/+/, "").trim();
}

/**
 * Neon Database Client
 * --------------------
 * Lazy init. Throws if DATABASE_URL missing (workers). Optional fallback for local dev.
 */

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;

  const url = (process.env.DATABASE_URL || process.env.DB_FALLBACK || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');

  if (!url || !url.startsWith('postgres')) {
    if (process.env.BUILD_SKIP_DB === 'true') {
      const noop = (() => Promise.resolve([])) as unknown as NeonQueryFunction<false, false>;
      return (_sql = noop);
    }
    throw new Error(
      'DATABASE_URL is missing. Set in .env.local. Optional local dev: DB_FALLBACK=postgresql://localhost:5432/dev'
    );
  }

  // Force NO Next.js Route Cache intercept
  const fs = require('fs');
  fs.appendFileSync('debug-render.txt', `\n[DB CONNECTION] Connecting to: ${url.replace(/:[^:@]+@/, ':***@')}\n`);
  _sql = neon(url, { fetchOptions: { cache: 'no-store' } });
  return _sql;
}

function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getSql()(strings as any, ...values);
}

export default sql;

/**
 * Helper to fetch a complete diagnostic path from Neon
 */
export async function getDiagnosticData(slug: string) {
  try {
    const normalized = normalizeSlug(slug);
    const results = await sql`
      SELECT 
        p.*, 
        s.name as system_name,
        sym.name as symptom_name
      FROM pages p
      LEFT JOIN systems s ON p.system_id = s.id
      LEFT JOIN symptoms sym ON p.symptom_id = sym.id
      WHERE p.slug = ${normalized}
      LIMIT 1
    `;
    return results[0] || null;
  } catch (error) {
    console.error('Neon Query Error:', error);
    return null;
  }
}

/**
 * Helper to queue a page for generation
 */
export async function queuePageGeneration(params: {
  page_type: string;
  proposed_slug: string;
  system_id?: string;
  symptom_id?: string;
  city?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO generation_queue (
        page_type, 
        proposed_slug, 
        system_id, 
        symptom_id, 
        city, 
        status
      ) VALUES (
        ${params.page_type}, 
        ${params.proposed_slug}, 
        ${params.system_id || null}, 
        ${params.symptom_id || null}, 
        ${params.city || null}, 
        'draft'
      )
      RETURNING *
    `;
    return { data: result[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Fetch local contractors for a specific city
 */
export async function getContractorsByCity(citySlug: string) {
  try {
    const results = await sql`
      SELECT * FROM contractors 
      WHERE city_slug = ${citySlug}
      LIMIT 10
    `;
    return results;
  } catch (error) {
    console.error('Neon Contractor Query Error:', error);
    return [];
  }
}

/**
 * Fetch page by full slug (e.g. conditions/ac-not-cooling).
 * Returns { title, html, content_json } for rendering.
 */
export async function getPageBySlug(fullSlug: string) {
  try {
    const normalized = normalizeSlug(fullSlug);
    const results = await sql`
      SELECT slug, title, raw_json as content_json
      FROM diagnostic_pages
      WHERE slug = ${normalized}
      LIMIT 1
    `;
    const row = results[0] as { slug?: string; title?: string; content_json?: unknown } | undefined;
    if (!row) {
      // Fallback to legacy pages if not found in V2
      const legacyRes = await sql`SELECT slug, title, page_type, content_json FROM pages WHERE slug = ${normalized} LIMIT 1`;
      return legacyRes[0] || null;
    }
    const cj = row.content_json;
    const parsed = typeof cj === "string" ? (() => { try { return JSON.parse(cj) as Record<string, unknown>; } catch { return null; } })() : (cj as Record<string, unknown>);
    const html = parsed?.html_content as string ?? "";
    const title = (row.title ?? parsed?.title) as string ?? "";
    return { ...row, title, html, content_json: parsed ?? cj };
  } catch (error) {
    console.error("getPageBySlug error:", error);
    return null;
  }
}

/**
 * Fetch all pages by page_type for static generation.
 * Returns slugs with prefix stripped (e.g. conditions/ac-not-cooling → ac-not-cooling).
 */
export async function getAllPagesByType(pageType: string) {
  try {
    const results = await sql`
      SELECT slug, title, page_type
      FROM pages
      WHERE page_type = ${pageType}
        AND (status = 'published' OR status IS NULL)
    `;
    return (results as { slug: string; title?: string; page_type?: string }[]) ?? [];
  } catch (error) {
    console.error("getAllPagesByType error:", error);
    return [];
  }
}

/**
 * Fetch generic tools safely during build
 */
export async function getToolsFromDB() {
  try {
    const results = await sql`SELECT * FROM tools LIMIT 4`;
    return results;
  } catch (error) {
    console.error("Tool Fetch Error:", error);
    return [];
  }
}

/**
 * Fetch fully hydrated related pages by slug array
 */
export async function getRelatedPagesBySlugs(site: "dg" | "hvac", slugs: string[]) {
  if (!slugs || slugs.length === 0) return [];
  try {
    const results = await sql`
      SELECT slug, title, page_type, site, city
      FROM pages
      WHERE site = ${site}
        AND slug = ANY(${slugs}::text[])
        AND status IN ('published', 'validated', 'review', 'generated', 'draft')
      ORDER BY title
    `;
    return results as Array<{ slug: string; title: string; page_type: any; site: "dg" | "hvac"; city?: string | null; }>;
  } catch (error) {
    console.error("getRelatedPagesBySlugs error:", error);
    return [];
  }
}
