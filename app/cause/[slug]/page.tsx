import { notFound } from "next/navigation";
import sql from "@/lib/db";
import CausePageTemplate from "@/templates/cause-page";
import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { normalizePageData } from "@/lib/content";

export const revalidate = 3600;

export default async function CausePage({ params }: { params: { slug: string } }) {
  const causeRes = await sql`
    SELECT c.*, comp.name as component_name, comp.slug as component_slug
    FROM causes c
    LEFT JOIN components comp ON c.component_id = comp.id
    WHERE c.slug = ${params.slug}
    LIMIT 1
  `;

  const aiPage = await getDiagnosticPageFromDB(params.slug);
  const rawContent = aiPage?.content_json;
  const contentJson = typeof rawContent === "string" ? (() => { try { return JSON.parse(rawContent) as Record<string, unknown>; } catch { return null; } })() : (rawContent as Record<string, unknown> | null);
  const legacyHtmlContent = contentJson?.html_content as string | null | undefined;

  if (causeRes.length === 0 && !contentJson && !legacyHtmlContent) {
    notFound();
  }

  const causeData = causeRes[0] ?? { name: params.slug.replace(/-/g, " "), explanation: "AI Generated Diagnostic Report", id: null, component_id: null, component_name: null, component_slug: null };

  // Repairs: prefer cause_id (core schema), fallback to component_id (5-tier)
  let repairsRes: any[] = [];
  try {
    repairsRes = await sql`
      SELECT id, name, slug, repair_type, skill_level 
      FROM repairs 
      WHERE cause_id = ${causeData.id}
      LIMIT 10
    `;
    if (repairsRes.length === 0 && causeData.component_id) {
      repairsRes = await sql`
        SELECT id, name, slug, repair_type, skill_level 
        FROM repairs 
        WHERE component_id = ${causeData.component_id}
        LIMIT 10
      `;
    }
  } catch {
    // repairs table may have different schema
  }

  const symptomRes = await sql`
    SELECT s.name, s.slug 
    FROM symptoms s
    JOIN symptom_causes sc ON sc.symptom_id = s.id
    WHERE sc.cause_id = ${causeData.id}
    LIMIT 1
  `;

  // Diagnostic tests (cause → tests workflow)
  let diagnosticTests: any[] = [];
  try {
    diagnosticTests = await sql`
      SELECT dt.id, dt.name, dt.slug, dt.description, dt.test_steps, dt.tools_required
      FROM diagnostic_tests dt
      JOIN cause_diagnostic_tests cdt ON cdt.test_id = dt.id
      WHERE cdt.cause_id = ${causeData.id}
      ORDER BY dt.name
    `;
  } catch {
    // Tables may not exist yet
  }

  const pageViewModel = normalizePageData({
    rawContent: contentJson,
    pageType: "cause",
    slug: params.slug,
    title: causeData.name,
    graphRepairs: repairsRes,
    legacyHtmlContent: legacyHtmlContent ?? null,
  });

  return (
    <CausePageTemplate
      cause={causeData as { name: string; explanation?: string; description?: string; difficulty?: string }}
      symptom={symptomRes && symptomRes.length > 0 ? (symptomRes[0] as { name: string; slug: string }) : null}
      component={causeData.component_name ? { name: causeData.component_name, slug: causeData.component_slug ?? "" } : null}
      repairs={repairsRes}
      diagnosticTests={diagnosticTests}
      pageViewModel={pageViewModel}
    />
  );
}
