/**
 * Phase 16: Internal Link Injection Engine
 * buildLinksForPage() - Returns 4-8 related links per page type.
 * Priority: graph junction tables → related_nodes → heuristic fallback.
 */

import sql from "@/lib/db";
import { getClusterForSymptom, CLUSTERS } from "@/lib/clusters";
import { getConditionsForSymptom, CONDITIONS } from "@/lib/conditions";
import { SYMPTOMS, CAUSES, REPAIRS } from "@/data/knowledge-graph";
import { buildGraphLinks } from "@/lib/graph-link-builder";

const MAX_RELATED = 8;

export interface PageLink {
  slug: string;
  title: string;
  relationType: string;
}

export type PageType = "symptom" | "condition" | "cause" | "repair" | "component";

/**
 * Build internal links for a page.
 * Priority: 1) Graph junction tables (DecisionGrid) 2) related_nodes 3) heuristic
 */
export async function buildLinksForPage(
  pageType: PageType,
  slug: string,
  context?: {
    symptomId?: string;
    causeIds?: string[];
    repairIds?: string[];
    component?: string;
  }
): Promise<PageLink[]> {
  const rawSlug = slug.replace("diagnose/", "").replace("conditions/", "").replace("cause/", "").replace("fix/", "").replace("components/", "");

  // 1. Try graph junction tables (DecisionGrid-aligned)
  try {
    const graphLinks = await buildGraphLinks(pageType, rawSlug);
    if (graphLinks.length > 0) return graphLinks;
  } catch {
    // Fall through
  }

  // 2. Try related_nodes
  try {
    const dbSlug = slug.startsWith("diagnose/") ? slug : getCanonicalSlug(pageType, slug);
    const dbLinks = await sql`
      SELECT target_slug, target_type, relation_type
      FROM related_nodes
      WHERE source_slug = ${dbSlug}
      ORDER BY score DESC
      LIMIT ${MAX_RELATED}
    `;

    if ((dbLinks as any[]).length > 0) {
      return (dbLinks as any[]).map((row) => ({
        slug: `/${row.target_slug}`,
        title: slugToTitle(row.target_slug),
        relationType: row.relation_type || "related",
      }));
    }
  } catch {
    // Fall through
  }

  // 3. Heuristic fallback
  switch (pageType) {
    case "symptom":
      return buildSymptomLinks(slug, context);
    case "condition":
      return buildConditionLinks(slug, context);
    case "cause":
      return buildCauseLinks(slug, context);
    case "repair":
      return buildRepairLinks(slug, context);
    case "component":
      return buildComponentLinks(slug, context);
    default:
      return [];
  }
}

function getCanonicalSlug(pageType: PageType, slug: string): string {
  switch (pageType) {
    case "symptom":
      return slug.startsWith("diagnose/") ? slug : `diagnose/${slug}`;
    case "condition":
      return slug.startsWith("conditions/") ? slug : `conditions/${slug}`;
    case "cause":
      return slug.startsWith("cause/") ? slug : `cause/${slug}`;
    case "repair":
      return slug.startsWith("fix/") ? slug : `fix/${slug}`;
    case "component":
      return slug.startsWith("components/") ? slug : `components/${slug}`;
    default:
      return slug;
  }
}

function slugToTitle(slug: string): string {
  const part = slug.split("/").pop() || slug;
  return part
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function buildSymptomLinks(slug: string, context?: { symptomId?: string }): PageLink[] {
  const symptomId = context?.symptomId || slug.replace("diagnose/", "");
  const symptom = SYMPTOMS.find((s) => s.id === symptomId);
  if (!symptom) return [];

  const links: PageLink[] = [];
  const cluster = getClusterForSymptom(symptomId);

  // Parent cluster
  if (cluster) {
    links.push({
      slug: `/cluster/${cluster.slug}`,
      title: cluster.name,
      relationType: "parent-cluster",
    });
  }

  // Conditions
  const conditions = getConditionsForSymptom(symptomId);
  for (const c of conditions.slice(0, 4)) {
    links.push({
      slug: `/conditions/${c.slug}`,
      title: c.name,
      relationType: "same-condition-family",
    });
  }

  // Related symptoms (same cluster)
  if (cluster) {
    const cl = CLUSTERS.find((c) => c.slug === cluster.slug);
    if (cl) {
      for (const id of cl.symptomIds) {
        if (id !== symptomId && links.length < MAX_RELATED) {
          const s = SYMPTOMS.find((x) => x.id === id);
          if (s) {
            links.push({
              slug: `/diagnose/${id}`,
              title: s.name,
              relationType: "same-system-cluster",
            });
          }
        }
      }
    }
  }

  return links.slice(0, MAX_RELATED);
}

function buildConditionLinks(slug: string, context?: { symptomId?: string }): PageLink[] {
  const condSlug = slug.replace("conditions/", "");
  const condition = CONDITIONS.find((c) => c.slug === condSlug);
  if (!condition) return [];

  const links: PageLink[] = [];

  // Parent symptom
  links.push({
    slug: `/diagnose/${condition.symptomId}`,
    title: SYMPTOMS.find((s) => s.id === condition.symptomId)?.name || condition.symptomId,
    relationType: "parent-symptom",
  });

  // Sibling conditions
  const siblings = CONDITIONS.filter(
    (c) => c.symptomId === condition.symptomId && c.slug !== condSlug
  );
  for (const s of siblings.slice(0, 4)) {
    links.push({
      slug: `/conditions/${s.slug}`,
      title: s.name,
      relationType: "same-condition-family",
    });
  }

  // Causes
  for (const causeId of (condition.causeIds || []).slice(0, 3)) {
    const cause = CAUSES[causeId];
    if (cause) {
      links.push({
        slug: `/cause/${causeId}`,
        title: cause.name,
        relationType: "similar-cause",
      });
    }
  }

  return links.slice(0, MAX_RELATED);
}

function buildCauseLinks(slug: string, context?: { causeIds?: string[] }): PageLink[] {
  const causeSlug = slug.replace("cause/", "");
  const cause = CAUSES[causeSlug];
  if (!cause) return [];

  const links: PageLink[] = [];

  // Repairs
  for (const repairId of (cause.repairs || []).slice(0, 4)) {
    const repair = REPAIRS[repairId];
    if (repair) {
      links.push({
        slug: `/fix/${repairId}`,
        title: repair.name,
        relationType: "alternative-repair",
      });
    }
  }

  // Same component causes
  const component = cause.component;
  for (const [id, c] of Object.entries(CAUSES)) {
    if (id !== causeSlug && c.component === component && links.length < MAX_RELATED) {
      links.push({
        slug: `/cause/${id}`,
        title: c.name,
        relationType: "same-component-family",
      });
    }
  }

  return links.slice(0, MAX_RELATED);
}

function buildRepairLinks(slug: string, context?: { repairIds?: string[] }): PageLink[] {
  const repairSlug = slug.replace("fix/", "");
  const repair = REPAIRS[repairSlug];
  if (!repair) return [];

  const links: PageLink[] = [];

  // Component
  const compSlug = repair.component?.replace(/\s+/g, "-");
  if (compSlug) {
    links.push({
      slug: `/components/${compSlug}`,
      title: (repair.component || "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      relationType: "same-component-family",
    });
  }

  // Same component repairs
  for (const [id, r] of Object.entries(REPAIRS)) {
    if (id !== repairSlug && r.component === repair.component && links.length < MAX_RELATED) {
      links.push({
        slug: `/fix/${id}`,
        title: r.name,
        relationType: "alternative-repair",
      });
    }
  }

  return links.slice(0, MAX_RELATED);
}

function buildComponentLinks(slug: string, context?: { component?: string }): PageLink[] {
  const compSlug = slug.replace("components/", "");
  const links: PageLink[] = [];

  // Repairs using this component
  for (const [id, r] of Object.entries(REPAIRS)) {
    const rComp = r.component?.replace(/\s+/g, "-");
    if (rComp === compSlug && links.length < MAX_RELATED) {
      links.push({
        slug: `/fix/${id}`,
        title: r.name,
        relationType: "alternative-repair",
      });
    }
  }

  return links.slice(0, MAX_RELATED);
}
