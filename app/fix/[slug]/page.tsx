import { notFound } from "next/navigation";
import sql from "@/lib/db";
import RepairPageTemplate from "@/templates/repair-page";
import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { normalizePageData } from "@/lib/content";

export const revalidate = 3600;

export default async function RepairPage({ params }: { params: { slug: string } }) {
  const repairRes = await sql`
    SELECT r.*, comp.name as component_name, comp.slug as component_slug
    FROM repairs r
    LEFT JOIN components comp ON r.component_id = comp.id
    WHERE r.slug = ${params.slug}
    LIMIT 1
  `;

  if (repairRes.length === 0) {
    notFound();
  }
  const repair = repairRes[0];

  const toolsRes = await sql`
    SELECT t.name, t.slug, t.description 
    FROM tools t
    JOIN repair_tools rt ON rt.tool_id = t.id
    WHERE rt.repair_id = ${repair.id}
  `;

  const causeRes = await sql`
    SELECT c.name, c.slug 
    FROM causes c
    WHERE c.component_id = ${repair.component_id}
    LIMIT 1
  `;

  const aiPage = await getDiagnosticPageFromDB(params.slug, 'fix');
  const rawContent = aiPage?.content_json;
  const contentJson = typeof rawContent === "string" ? (() => { try { return JSON.parse(rawContent) as Record<string, unknown>; } catch { return null; } })() : (rawContent as Record<string, unknown> | null);

  const pageViewModel = normalizePageData({
    rawContent: contentJson,
    pageType: "repair",
    slug: params.slug,
    title: repair.name,
    graphTools: toolsRes,
  });

  return (
    <RepairPageTemplate
      repair={repair as { name: string; repair_type?: string; skill_level?: string }}
      component={repair.component_name ? { name: repair.component_name, slug: repair.component_slug } : null}
      tools={toolsRes}
      cause={causeRes[0] || null}
      pageViewModel={pageViewModel}
    />
  );
}
