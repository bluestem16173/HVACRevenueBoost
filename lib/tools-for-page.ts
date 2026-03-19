/**
 * Tools for Page — Rule-Based Mapping (MVP)
 * -----------------------------------------
 * Tools = how to fix it. Auto-map page slug → tool slugs.
 * Future: page_tools table, affiliate URLs, pricing.
 */

import sql from "./db";

/** Rule-based mapping: page slug → tool slugs. Hardcode 2–3 mappings for MVP. */
export function getToolSlugsFromPage(slug: string): string[] {
  const s = (slug || "").toLowerCase();
  if (s.includes("capacitor")) return ["multimeter", "capacitor-tester"];
  if (s.includes("electrical") || s.includes("not-turning-on")) return ["multimeter", "screwdriver-set"];
  if (s.includes("refrigerant") || s.includes("leak")) return ["refrigerant-gauge-set", "vacuum-pump"];
  if (s.includes("coil") || s.includes("dirty")) return ["coil-cleaner", "fin-comb"];
  if (s.includes("not-cooling") || s.includes("warm-air") || s.includes("not-cold")) {
    return ["multimeter", "capacitor-tester", "coil-cleaner"];
  }
  if (s.includes("ice") || s.includes("freezing")) return ["multimeter", "coil-cleaner"];
  if (s.includes("filter") || s.includes("airflow")) return ["screwdriver-set"];
  return [];
}

/** Fetch tools from DB by slugs. Returns { name, slug, description, link, affiliate_url }[]. */
export async function getToolsForPage(slug: string): Promise<Array<{ name: string; slug: string; description?: string; link: string; affiliate_url?: string | null }>> {
  const toolSlugs = getToolSlugsFromPage(slug);
  if (toolSlugs.length === 0) return [];

  try {
    const out: Array<{ name: string; slug: string; description?: string; link: string; affiliate_url?: string | null }> = [];
    for (const toolSlug of toolSlugs) {
      const rows = await sql`
        SELECT id, name, slug, description, affiliate_url
        FROM tools
        WHERE slug = ${toolSlug}
        LIMIT 1
      ` as Array<{ id: number; name: string; slug: string; description?: string; affiliate_url?: string | null }>;
      const r = rows?.[0];
      if (r) {
        out.push({
          name: r.name ?? r.slug?.replace(/-/g, " ") ?? "Tool",
          slug: r.slug ?? "",
          description: r.description ?? undefined,
          link: `/tools/${r.slug ?? ""}`,
          affiliate_url: r.affiliate_url ?? null,
        });
      }
    }
    return out;
  } catch (err) {
    console.error("getToolsForPage error:", err);
    return [];
  }
}
