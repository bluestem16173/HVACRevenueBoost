/**
 * Components for Page — Rule-Based Mapping (MVP)
 * ----------------------------------------------
 * Components = what's broken. Auto-map page slug → component slugs.
 * Future: page_components table, affiliate URLs, pricing.
 */

import sql from "./db";

/** Rule-based mapping: page slug → component slugs. Hardcode 2–3 mappings for MVP. */
export function getComponentSlugsFromPage(slug: string): string[] {
  const s = (slug || "").toLowerCase();
  if (s.includes("capacitor")) return ["capacitor"];
  if (s.includes("air-filter") || s.includes("filter")) return ["air-filter"];
  if (s.includes("thermostat")) return ["thermostat"];
  if (s.includes("evaporator") || s.includes("evaporator-coil")) return ["evaporator-coil"];
  if (s.includes("condenser")) return ["condenser-coil"];
  if (s.includes("compressor")) return ["compressor"];
  if (s.includes("not-cooling") || s.includes("warm-air") || s.includes("not-cold")) {
    return ["capacitor", "evaporator-coil", "condenser"];
  }
  if (s.includes("not-turning-on") || s.includes("not-running")) {
    return ["capacitor", "contactor", "thermostat"];
  }
  if (s.includes("ice") || s.includes("freezing")) return ["evaporator-coil", "air-filter"];
  if (s.includes("heat-pump") || s.includes("not-heating")) return ["capacitor", "reversing-valve", "thermostat"];
  return [];
}

/** Fetch components from DB by slugs. Returns { name, slug, description, link }[]. */
export async function getComponentsForPage(slug: string): Promise<Array<{ name: string; slug: string; description?: string; link: string }>> {
  const componentSlugs = getComponentSlugsFromPage(slug);
  if (componentSlugs.length === 0) return [];

  try {
    const out: Array<{ name: string; slug: string; description?: string; link: string }> = [];
    for (const compSlug of componentSlugs) {
      const rows = await sql`
        SELECT id, name, slug, description
        FROM components
        WHERE slug = ${compSlug}
        LIMIT 1
      ` as Array<{ id: number; name: string; slug: string; description?: string }>;
      const r = rows?.[0];
      if (r) {
        out.push({
          name: r.name ?? r.slug?.replace(/-/g, " ") ?? "Component",
          slug: r.slug ?? "",
          description: r.description ?? undefined,
          link: `/components/${r.slug ?? ""}`,
        });
      }
    }
    return out;
  } catch (err) {
    console.error("getComponentsForPage error:", err);
    return [];
  }
}
