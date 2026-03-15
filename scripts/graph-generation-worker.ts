/**
 * HVAC Revenue Boost Graph Generation Worker
 * Generates graph nodes only (symptoms, causes, repairs, components).
 * Templates render pages from graph data — no full HTML generation.
 *
 * Usage: npx tsx scripts/graph-generation-worker.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import sql from "@/lib/db";
import { generateGraphNode, type GraphNodeOutput, type SymptomNode, type CauseNode, type RepairNode } from "@/lib/ai-graph-generator";

async function upsertSymptom(data: SymptomNode["symptom"], systemId: string | null) {
  const res = await sql`
    INSERT INTO symptoms (slug, name, description, system_id)
    VALUES (${data.slug}, ${data.name}, ${data.description}, ${systemId})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id
  `;
  return (res as any[])[0]?.id;
}

async function upsertCause(data: { name: string; slug: string; description: string }) {
  const res = await sql`
    INSERT INTO causes (slug, name, description)
    VALUES (${data.slug}, ${data.name}, ${data.description})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id
  `;
  return (res as any[])[0]?.id;
}

async function upsertRepair(data: { name: string; slug: string; description: string; estimated_cost?: string; skill_level?: string }) {
  const res = await sql`
    INSERT INTO repairs (slug, name, description, estimated_cost, skill_level)
    VALUES (${data.slug}, ${data.name}, ${data.description}, ${data.estimated_cost || null}, ${data.skill_level || null})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id
  `;
  return (res as any[])[0]?.id;
}

async function upsertComponent(data: { name: string; slug: string }) {
  const res = await sql`
    INSERT INTO components (slug, name)
    VALUES (${data.slug}, ${data.name})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;
  return (res as any[])[0]?.id;
}

async function runWorker() {
  console.log("🚀 HVAC Revenue Boost Graph Generation Worker...");

  const systemRes = await sql`SELECT id FROM systems WHERE slug = 'residential-ac' LIMIT 1`;
  const systemId = (systemRes as any[])[0]?.id || null;

  // Example: generate one symptom node
  const symptomSlug = "ac-blowing-warm-air";
  const symptomTitle = "AC Blowing Warm Air";

  try {
    const data = await generateGraphNode("symptom", symptomSlug, symptomTitle);
    const node = data as SymptomNode;

    const symptomId = await upsertSymptom(node.symptom, systemId);
    if (!symptomId) throw new Error("Failed to upsert symptom");

    for (const c of node.causes) {
      const causeId = await upsertCause({ ...c, description: c.explanation });
      if (causeId) {
        await sql`
          INSERT INTO symptom_causes (symptom_id, cause_id)
          VALUES (${symptomId}, ${causeId})
          ON CONFLICT (symptom_id, cause_id) DO NOTHING
        `;
      }
    }

    for (const r of node.repairs) {
      await upsertRepair({
        name: r.name,
        slug: r.slug,
        description: r.name,
        estimated_cost: r.estimated_cost,
        skill_level: r.difficulty,
      });
    }

    for (const comp of node.components) {
      await upsertComponent(comp);
    }

    console.log(`✅ Generated graph node: ${symptomSlug}`);
  } catch (err) {
    console.error("❌ Graph generation failed:", err);
  }

  console.log("🏁 Graph worker complete.");
}

runWorker();
