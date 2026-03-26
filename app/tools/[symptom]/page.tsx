import { notFound } from "next/navigation";
import sql from "@/lib/db";
import ToolPageTemplate from "@/templates/tool-page";

export const revalidate = 3600;

export default async function ToolPage({ params }: { params: { symptom: string } }) {
  const toolRes = await sql`
    SELECT *
    FROM tools
    WHERE slug = ${params.symptom}
    LIMIT 1
  `;

  if (toolRes.length === 0) {
    notFound();
  }
  const tool = toolRes[0];

  const repairsRes = await sql`
    SELECT r.name, r.slug 
    FROM repairs r
    JOIN repair_tools rt ON rt.repair_id = r.id
    WHERE rt.tool_id = ${tool.id}
  `;

  return (
    <ToolPageTemplate 
      tool={tool} 
      repairs={repairsRes}
    />
  );
}
