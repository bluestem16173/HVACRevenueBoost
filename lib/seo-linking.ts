import { SYMPTOMS } from "@/data/knowledge-graph";
import sql from "./db";

/**
 * SEO LINKING ENGINE
 * Strategy: Create topical authority clusters around Symptoms and Components.
 */

export function getRelatedContent(currentSymptom: any) {
  // Sibling symptoms (same system category)
  const relatedSymptoms = SYMPTOMS.filter(s => 
    s.id !== currentSymptom.id
  ).slice(0, 5);

  // Extract unique components from the causes list
  const relatedComponents = Array.from(new Set(
    (currentSymptom.causes || []).map((c: any) => {
      // Handle both string IDs (JSON fallback) and Objects (DB)
      const componentName = typeof c === 'string' ? "HVAC Component" : (c.component || "HVAC Component");
      return componentName;
    })
  )).slice(0, 3);

  return {
    relatedSymptoms,
    relatedComponents
  };
}

export function buildRelatedLinks(slug: string, type: string) {
  return {
    diagnose: [`${slug}-symptom`, `airflow-issues`, `ac-not-cooling`],
    conditions: [`${slug}`, `low-refrigerant`, `dirty-coils`],
    repairs: [`replace-filter`, `recharge-refrigerant`, `clean-coils`]
  };
}

export async function getRelatedPages(type: string, currentSlug: string) {
  try {
    const data = await sql`
      SELECT slug FROM pages
      WHERE page_type = ${type}
        AND slug != ${currentSlug}
      LIMIT 5
    `;
    return data.map((p: any) => p.slug) || [];
  } catch (error) {
    return [];
  }
}

/**
 * DECISIONGRID NEON LINKING
 * Fetches link graph data from the internal_links table.
 */
export async function getInternalLinksForPage(slug: string) {
  try {
    const links = await sql`
      SELECT * FROM internal_links WHERE source_slug = ${slug}
    `;
    return links;
  } catch (error) {
    return [];
  }
}

export async function getGlobalPillarLinks() {
  try {
    const links = await sql`
      SELECT * FROM internal_links WHERE link_reason = 'pillar_link' LIMIT 10
    `;
    return links;
  } catch (error) {
    return [];
  }
}
