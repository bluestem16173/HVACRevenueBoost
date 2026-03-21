import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const failed = await sql`
      SELECT id, proposed_slug, attempts, last_error, updated_at 
      FROM generation_queue 
      WHERE status = 'failed'
      ORDER BY updated_at DESC 
      LIMIT 20
    ` as any[];

    return NextResponse.json({ success: true, failed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
