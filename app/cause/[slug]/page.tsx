import { notFound } from "next/navigation";
import sql from "@/lib/db";
import CausePageTemplate from "@/templates/cause-page";

export const revalidate = 3600;

export default async function CausePage({ params }: { params: { slug: string } }) {
  const causeRes = await sql`
    SELECT c.*, comp.name as component_name, comp.slug as component_slug
    FROM causes c
    LEFT JOIN components comp ON c.component_id = comp.id
    WHERE c.slug = ${params.slug}
    LIMIT 1
  `;

  if (causeRes.length === 0) {
    notFound();
  }
  const cause = causeRes[0];

  // Repairs: prefer cause_id (core schema), fallback to component_id (5-tier)
  let repairsRes: any[] = [];
  try {
    repairsRes = await sql`
      SELECT id, name, slug, repair_type, skill_level 
      FROM repairs 
      WHERE cause_id = ${cause.id}
      LIMIT 10
    `;
    if (repairsRes.length === 0 && cause.component_id) {
      repairsRes = await sql`
        SELECT id, name, slug, repair_type, skill_level 
        FROM repairs 
        WHERE component_id = ${cause.component_id}
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
    WHERE sc.cause_id = ${cause.id}
    LIMIT 1
  `;

  // Diagnostic tests (cause → tests workflow)
  let diagnosticTests: any[] = [];
  try {
    diagnosticTests = await sql`
      SELECT dt.id, dt.name, dt.slug, dt.description, dt.test_steps, dt.tools_required
      FROM diagnostic_tests dt
      JOIN cause_diagnostic_tests cdt ON cdt.test_id = dt.id
      WHERE cdt.cause_id = ${cause.id}
      ORDER BY dt.name
    `;
  } catch {
    // Tables may not exist yet
  }

  return (
    <CausePageTemplate
      cause={cause}
      symptom={symptomRes[0] || null}
      component={cause.component_name ? { name: cause.component_name, slug: cause.component_slug } : null}
      repairs={repairsRes}
      diagnosticTests={diagnosticTests}
    />
  );
}
