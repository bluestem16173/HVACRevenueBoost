/**
 * Link Engine — Entity-based internal linking (Ported from Flywheel)
 *
 * Creates a complete troubleshooting loop from the knowledge graph.
 */

import sql from "@/lib/db";

const LIMITS = {
  system: 1,
  symptom: 4,
  cause: 3,
  repair: 3,
  component: 3,
  diagnostic: 2,
  local_service: 2,
};

export interface PageLink {
  slug: string;
  title: string;
  relationType: string;
}

export type PageType = "symptom" | "condition" | "cause" | "repair" | "component" | "system" | "diagnostic";

export async function buildLinksForPage(
  pageTypeFallback: PageType,
  sourceSlug: string,
  context?: any
): Promise<PageLink[]> {
  await sql`DELETE FROM internal_links WHERE source_slug = ${sourceSlug}`;

  const links: { target_slug: string; anchor_text: string; link_reason: string }[] = [];
  const pathParts = sourceSlug.split('/').filter(Boolean);

  let resolvedSystemId = context?.systemId;
  if (!resolvedSystemId) {
    try {
      const dbRes = await sql`SELECT system_id FROM pages WHERE slug = ${sourceSlug} LIMIT 1`;
      resolvedSystemId = (dbRes as any[])[0]?.system_id;
    } catch (e) { }
  }

  if (!resolvedSystemId) return [];

  const sysRows = await sql`SELECT slug, name FROM systems WHERE id = ${resolvedSystemId}`;
  const sysRow = (sysRows as any[])[0];
  if (!sysRow) return [];

  const systemSlug = sysRow.slug as string;
  const pillarSlug = `system/${systemSlug}`;

  const sourcePages = await sql`SELECT id, page_type, symptom_id, repair_id, cause_id FROM pages WHERE slug = ${sourceSlug} LIMIT 1`;
  const sourcePage = (sourcePages as any[])[0];
  const pageType = sourcePage?.page_type || pageTypeFallback;

  try {
    const pillars = await sql`SELECT slug, title FROM pages WHERE slug = ${pillarSlug} AND status IN ('draft', 'published') LIMIT 1`;
    const pillar = (pillars as any[])[0];
    if (pillar) {
      links.push({ target_slug: pillarSlug, anchor_text: (pillar.title as string) || `${sysRow.name} Troubleshooting`, link_reason: 'system' });
    }
  } catch (e) { }

  try {
    if (pageType === 'symptom' && sourcePage?.symptom_id) {
      const diags = await sql`SELECT slug, title FROM pages WHERE system_id = ${resolvedSystemId} AND symptom_id = ${sourcePage.symptom_id} AND page_type = 'diagnostic' AND status IN ('draft', 'published') LIMIT ${LIMITS.diagnostic}`;
      for (const d of (diags as any[])) links.push({ target_slug: d.slug as string, anchor_text: (d.title as string) || d.slug, link_reason: 'diagnostic' });

      const repairs = await sql`SELECT p.slug, p.title FROM pages p JOIN repairs r ON p.repair_id = r.id JOIN cause_repairs cr ON r.id = cr.repair_id JOIN symptom_causes sc ON cr.cause_id = sc.cause_id WHERE sc.symptom_id = ${sourcePage.symptom_id} AND p.status IN ('draft', 'published') LIMIT ${LIMITS.repair}`;
      for (const r of (repairs as any[])) links.push({ target_slug: r.slug as string, anchor_text: (r.title as string) || r.slug, link_reason: 'repair' });

      const conditions = await sql`SELECT slug, title FROM pages WHERE symptom_id = ${sourcePage.symptom_id} AND page_type = 'symptom' AND slug != ${sourceSlug} AND status IN ('draft', 'published') LIMIT ${LIMITS.symptom}`;
      for (const c of (conditions as any[])) links.push({ target_slug: c.slug as string, anchor_text: (c.title as string) || c.slug, link_reason: 'condition' });
    }
    else if (pageType === 'repair' && sourcePage?.repair_id) {
      const components = await sql`SELECT p.slug, p.title FROM pages p JOIN causes c ON p.cause_id = c.id AND c.system_id = ${resolvedSystemId} JOIN cause_repairs cr ON c.id = cr.cause_id WHERE cr.repair_id = ${sourcePage.repair_id} AND p.page_type = 'component' AND p.status IN ('draft', 'published') LIMIT ${LIMITS.component}`;
      for (const c of (components as any[])) links.push({ target_slug: c.slug as string, anchor_text: (c.title as string) || c.slug, link_reason: 'component' });

      const relatedRepairs = await sql`SELECT p.slug, p.title FROM pages p JOIN repairs r ON p.repair_id = r.id JOIN cause_repairs cr1 ON r.id = cr1.repair_id JOIN cause_repairs cr2 ON cr1.cause_id = cr2.cause_id WHERE cr2.repair_id = ${sourcePage.repair_id} AND p.slug != ${sourceSlug} AND p.status IN ('draft', 'published') LIMIT ${LIMITS.repair}`;
      for (const r of (relatedRepairs as any[])) links.push({ target_slug: r.slug as string, anchor_text: (r.title as string) || r.slug, link_reason: 'repair' });
    }
    else if (pageType === 'component' && sourcePage?.cause_id) {
      const repairs = await sql`SELECT p.slug, p.title FROM pages p JOIN repairs r ON p.repair_id = r.id JOIN cause_repairs cr ON r.id = cr.repair_id WHERE cr.cause_id = ${sourcePage.cause_id} AND p.status IN ('draft', 'published') LIMIT ${LIMITS.repair}`;
      for (const r of (repairs as any[])) links.push({ target_slug: r.slug as string, anchor_text: (r.title as string) || r.slug, link_reason: 'repair' });
    }
    else {
      const generics = await sql`SELECT slug, title, page_type FROM pages WHERE system_id = ${resolvedSystemId} AND slug != ${sourceSlug} AND status IN ('draft', 'published') LIMIT 5`;
      for (const g of (generics as any[])) links.push({ target_slug: g.slug as string, anchor_text: (g.title as string) || g.slug, link_reason: g.page_type as string || 'related' });
    }
  } catch (e) { }

  for (const l of links) {
    try {
      await sql`
        INSERT INTO internal_links (source_slug, target_slug, anchor_text, link_reason)
        VALUES (${sourceSlug}, ${l.target_slug}, ${l.anchor_text}, ${l.link_reason})
        ON CONFLICT (source_slug, target_slug) DO NOTHING
      `;
    } catch (e) { }
  }

  return links.map(l => ({
    slug: l.target_slug.startsWith('/') ? l.target_slug : `/${l.target_slug}`,
    title: l.anchor_text,
    relationType: l.link_reason
  }));
}

export async function getOutgoingLinks(sourceSlug: string): Promise<{ href: string; title: string }[]> {
  try {
    const rows = await sql`SELECT target_slug, anchor_text FROM internal_links WHERE source_slug = ${sourceSlug}`;
    return (rows as any[]).map((r) => ({ href: (r.target_slug as string).startsWith('/') ? r.target_slug : `/${r.target_slug}`, title: (r.anchor_text as string) || r.target_slug }));
  } catch (e) {
    return [];
  }
}
