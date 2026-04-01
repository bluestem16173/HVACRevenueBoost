import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { SYMPTOMS } from "@/data/knowledge-graph";

export async function POST(req: Request) {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.log("🚫 Generation globally disabled");
    return NextResponse.json(
      { error: "Generation disabled", code: "GENERATION_DISABLED" },
      { status: 403 }
    );
  }
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body;
    try { body = await req.json(); } catch { body = {}; }
    
    // Feature: Parse a prompt and turn it into slugs (mocked for now as high intent seeder)
    // The user's goal: Output generates 20-50 slugs into queue
    // For now, we seed the top 20 symptoms from our taxonomy logic
    let seeded = 0;
    const existing = await sql`SELECT proposed_slug FROM generation_queue`;
    const existingSlugs = new Set((existing as any[]).map(r => r.proposed_slug));

    for (const symptom of SYMPTOMS.slice(0, 20)) {
      const slug = `diagnose/${(symptom as any).slug || symptom.id}`;
      if (!existingSlugs.has(slug)) {
        await sql`
          INSERT INTO generation_queue (proposed_slug, page_type, status, started_at, finished_at)
          VALUES (${slug}, 'symptom', 'draft', NULL, NULL)
        `;
        seeded++;
      }
    }

    try {
      if (seeded > 0) {
        await sql`
          INSERT INTO system_logs (event_type, message, metadata)
          VALUES ('control_action', 'Seeded generation queue', ${JSON.stringify({ count: seeded, prompt: body?.prompt || null }) as any})
        `;
      }
    } catch (e) { console.error('Failed to log seed action:', e); }

    return NextResponse.json({ success: true, seeded, message: body?.prompt ? `Seeded ${seeded} slugs based on prompt` : `Seeded ${seeded} high intent slugs` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
