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

  const repairsRes = await sql`
    SELECT id, name, slug, repair_type, skill_level 
    FROM repairs 
    WHERE component_id = ${cause.component_id}
    OR id IN (
      SELECT repair_id 
      FROM repair_tools 
      WHERE tool_id IN (
        SELECT tool_id FROM repair_tools WHERE repair_id IN (
          SELECT id FROM repairs WHERE component_id = ${cause.component_id}
        )
      )
    ) LIMIT 5
  `;

  const symptomRes = await sql`
    SELECT s.name, s.slug 
    FROM symptoms s
    JOIN symptom_causes sc ON sc.symptom_id = s.id
    WHERE sc.cause_id = ${cause.id}
    LIMIT 1
  `;

  return (
    <CausePageTemplate 
      cause={cause} 
      symptom={symptomRes[0] || null}
      component={cause.component_name ? { name: cause.component_name, slug: cause.component_slug } : null}
      repairs={repairsRes}
    />
  );
}
