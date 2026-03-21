import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sql`
      UPDATE generation_queue
      SET status = 'pending', attempts = 0, last_error = NULL
      WHERE status = 'failed'
      RETURNING id
    `;
    
    try {
      if (result.length > 0) {
        await sql`
          INSERT INTO system_logs (event_type, message, metadata)
          VALUES ('control_action', 'Reset failed queue items', ${JSON.stringify({ count: result.length }) as any})
        `;
      }
    } catch (e) { console.error('Failed to log reset action:', e); }

    return NextResponse.json({ success: true, count: result.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
