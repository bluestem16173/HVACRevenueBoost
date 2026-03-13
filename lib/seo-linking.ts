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
