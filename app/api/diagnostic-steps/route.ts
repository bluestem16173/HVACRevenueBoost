import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const diagnostic = searchParams.get("diagnostic");
  if (!diagnostic) {
    return NextResponse.json({ error: "Missing diagnostic slug" }, { status: 400 });
  }

  try {
    const diag = await sql`
      SELECT id FROM diagnostics WHERE slug = ${diagnostic} LIMIT 1
    `;
    if (!(diag as any[]).length) {
      return NextResponse.json({ steps: [] });
    }

    const steps = await sql`
      SELECT id, diagnostic_id, step_order, question, yes_target_slug, no_target_slug, yes_cause_slug, no_cause_slug
      FROM diagnostic_steps
      WHERE diagnostic_id = ${(diag as any[])[0].id}
      ORDER BY step_order
    `;

    return NextResponse.json({ steps: steps as any[] });
  } catch (e) {
    console.error("[diagnostic-steps]", e);
    return NextResponse.json({ steps: [] });
  }
}
