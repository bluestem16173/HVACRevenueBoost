/**
 * DecisionGrid-Aligned Related Link Builder
 * Queries graph junction tables to build dense internal links for SEO.
 *
 * Flow:
 * - symptom page → conditions, diagnostics, causes
 * - cause page → repairs, components
 * - repair page → components, symptoms
 * - condition page → symptoms, causes, diagnostics
 * - component page → repairs, symptoms
 */

import sql from "@/lib/db";

const MAX_RELATED = 8;

export interface GraphPageLink {
  slug: string;
  title: string;
  relationType: string;
}

/**
 * Build links for a symptom page using graph edges.
 */
export async function getSymptomLinks(symptomSlug: string): Promise<GraphPageLink[]> {
  const links: GraphPageLink[] = [];

  try {
    const sym = await sql`
      SELECT id FROM symptoms WHERE slug = ${symptomSlug} LIMIT 1
    `;
    if (!(sym as any[]).length) return [];

    const symptomId = (sym as any[])[0].id;

    // Conditions (symptom_conditions)
    const conds = await sql`
      SELECT c.slug, c.name FROM conditions c
      JOIN symptom_conditions sc ON sc.condition_id = c.id
      WHERE sc.symptom_id = ${symptomId}
      LIMIT 4
    `;
    for (const r of conds as any[]) {
      links.push({
        slug: `/conditions/${r.slug}`,
        title: r.name,
        relationType: "same-condition-family",
      });
    }

    // Causes (symptom_causes) — ordered by confidence_score (1.0 = most likely)
    const causes = await sql`
      SELECT ca.slug, ca.name FROM causes ca
      JOIN symptom_causes sc ON sc.cause_id = ca.id
      WHERE sc.symptom_id = ${symptomId}
      ORDER BY COALESCE(sc.confidence_score, 1) DESC
      LIMIT 4
    `;
    for (const r of causes as any[]) {
      links.push({
        slug: `/cause/${r.slug}`,
        title: r.name,
        relationType: "similar-cause",
      });
    }

    // Diagnostics (via condition_diagnostics from symptom's conditions)
    const diags = await sql`
      SELECT d.slug, d.name FROM diagnostics d
      JOIN condition_diagnostics cd ON cd.diagnostic_id = d.id
      JOIN symptom_conditions sc ON sc.condition_id = cd.condition_id
      WHERE sc.symptom_id = ${symptomId}
      LIMIT 3
    `;
    for (const r of diags as any[]) {
      links.push({
        slug: `/diagnostic/${r.slug}`,
        title: r.name,
        relationType: "diagnostic-path",
      });
    }

    return links.slice(0, MAX_RELATED);
  } catch {
    return [];
  }
}

/**
 * Build links for a cause page.
 */
export async function getCauseLinks(causeSlug: string): Promise<GraphPageLink[]> {
  const links: GraphPageLink[] = [];

  try {
    const cause = await sql`
      SELECT id FROM causes WHERE slug = ${causeSlug} LIMIT 1
    `;
    if (!(cause as any[]).length) return [];

    const causeId = (cause as any[])[0].id;

    // Repairs (cause_repairs)
    const repairs = await sql`
      SELECT r.slug, r.name FROM repairs r
      JOIN cause_repairs cr ON cr.repair_id = r.id
      WHERE cr.cause_id = ${causeId}
      LIMIT 4
    `;
    for (const r of repairs as any[]) {
      links.push({
        slug: `/fix/${r.slug}`,
        title: r.name,
        relationType: "alternative-repair",
      });
    }

    // Components (via repair_components from cause's repairs)
    const comps = await sql`
      SELECT c.slug, c.name FROM components c
      JOIN repair_components rc ON rc.component_id = c.id
      JOIN cause_repairs cr ON cr.repair_id = rc.repair_id
      WHERE cr.cause_id = ${causeId}
      LIMIT 4
    `;
    for (const r of comps as any[]) {
      links.push({
        slug: `/components/${r.slug}`,
        title: r.name,
        relationType: "same-component-family",
      });
    }

    return links.slice(0, MAX_RELATED);
  } catch {
    return [];
  }
}

/**
 * Build links for a repair page.
 */
export async function getRepairLinks(repairSlug: string): Promise<GraphPageLink[]> {
  const links: GraphPageLink[] = [];

  try {
    const repair = await sql`
      SELECT id FROM repairs WHERE slug = ${repairSlug} LIMIT 1
    `;
    if (!(repair as any[]).length) return [];

    const repairId = (repair as any[])[0].id;

    // Components (repair_components)
    const comps = await sql`
      SELECT c.slug, c.name FROM components c
      JOIN repair_components rc ON rc.component_id = c.id
      WHERE rc.repair_id = ${repairId}
      LIMIT 4
    `;
    for (const r of comps as any[]) {
      links.push({
        slug: `/components/${r.slug}`,
        title: r.name,
        relationType: "same-component-family",
      });
    }

    // Symptoms (via cause_repairs → symptom_causes)
    const syms = await sql`
      SELECT s.slug, s.name FROM symptoms s
      JOIN symptom_causes sc ON sc.symptom_id = s.id
      JOIN cause_repairs cr ON cr.cause_id = sc.cause_id
      WHERE cr.repair_id = ${repairId}
      LIMIT 4
    `;
    for (const r of syms as any[]) {
      links.push({
        slug: `/diagnose/${r.slug}`,
        title: r.name,
        relationType: "related-problem",
      });
    }

    return links.slice(0, MAX_RELATED);
  } catch {
    return [];
  }
}

/**
 * Build links for a condition page.
 */
export async function getConditionLinks(conditionSlug: string): Promise<GraphPageLink[]> {
  const links: GraphPageLink[] = [];

  try {
    const cond = await sql`
      SELECT id FROM conditions WHERE slug = ${conditionSlug} LIMIT 1
    `;
    if (!(cond as any[]).length) return [];

    const conditionId = (cond as any[])[0].id;

    // Symptoms (symptom_conditions)
    const syms = await sql`
      SELECT s.slug, s.name FROM symptoms s
      JOIN symptom_conditions sc ON sc.symptom_id = s.id
      WHERE sc.condition_id = ${conditionId}
      LIMIT 3
    `;
    for (const r of syms as any[]) {
      links.push({
        slug: `/diagnose/${r.slug}`,
        title: r.name,
        relationType: "parent-symptom",
      });
    }

    // Causes (condition_causes) — ordered by confidence_score
    const causes = await sql`
      SELECT ca.slug, ca.name FROM causes ca
      JOIN condition_causes cc ON cc.cause_id = ca.id
      WHERE cc.condition_id = ${conditionId}
      ORDER BY COALESCE(cc.confidence_score, 1) DESC
      LIMIT 4
    `;
    for (const r of causes as any[]) {
      links.push({
        slug: `/cause/${r.slug}`,
        title: r.name,
        relationType: "similar-cause",
      });
    }

    return links.slice(0, MAX_RELATED);
  } catch {
    return [];
  }
}

/**
 * Build links for a component page.
 */
export async function getComponentLinks(componentSlug: string): Promise<GraphPageLink[]> {
  const links: GraphPageLink[] = [];

  try {
    const comp = await sql`
      SELECT id FROM components WHERE slug = ${componentSlug} LIMIT 1
    `;
    if (!(comp as any[]).length) return [];

    const componentId = (comp as any[])[0].id;

    // Repairs (repair_components)
    const repairs = await sql`
      SELECT r.slug, r.name FROM repairs r
      JOIN repair_components rc ON rc.repair_id = r.id
      WHERE rc.component_id = ${componentId}
      LIMIT 6
    `;
    for (const r of repairs as any[]) {
      links.push({
        slug: `/fix/${r.slug}`,
        title: r.name,
        relationType: "alternative-repair",
      });
    }

    return links.slice(0, MAX_RELATED);
  } catch {
    return [];
  }
}

/**
 * Unified entry point - routes to appropriate builder by page type.
 */
export async function buildGraphLinks(
  pageType: "symptom" | "condition" | "cause" | "repair" | "component",
  slug: string
): Promise<GraphPageLink[]> {
  switch (pageType) {
    case "symptom":
      return getSymptomLinks(slug);
    case "condition":
      return getConditionLinks(slug);
    case "cause":
      return getCauseLinks(slug);
    case "repair":
      return getRepairLinks(slug);
    case "component":
      return getComponentLinks(slug);
    default:
      return [];
  }
}
