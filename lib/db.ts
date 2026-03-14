import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

/**
 * Neon Database Client
 * --------------------
 * High-performance serverless Postgres client.
 * Uses the DATABASE_URL from .env.local
 */

// During Vercel's build phase, DATABASE_URL might be undefined.
// We provide a dummy postgres string so the initial module parser doesn't fatally crash.
const sql = neon(process.env.DATABASE_URL || 'postgres://dummy:dummy@dummy.neon.tech/dummy');

export default sql;

/**
 * Helper to fetch a complete diagnostic path from Neon
 */
export async function getDiagnosticData(slug: string) {
  try {
    const results = await sql`
      SELECT 
        p.*, 
        s.name as system_name,
        sym.name as symptom_name
      FROM pages p
      LEFT JOIN systems s ON p.system_id = s.id
      LEFT JOIN symptoms sym ON p.symptom_id = sym.id
      WHERE p.slug = ${slug}
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
        'queued'
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
