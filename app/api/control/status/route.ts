import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const queueCounts = await sql`
      SELECT status, COUNT(*) as count 
      FROM generation_queue 
      GROUP BY status
    ` as any[];

    const generatedToday = await sql`
      SELECT COUNT(*) as count
      FROM pages
      WHERE created_at >= CURRENT_DATE
    ` as any[];

    const qStatus = { pending: 0, processing: 0, failed: 0 };
    for (const row of queueCounts) {
      if (row.status in qStatus) {
        qStatus[row.status as keyof typeof qStatus] = parseInt(row.count, 10);
      }
    }

    const lastCronLog = await sql`
      SELECT created_at 
      FROM system_logs 
      WHERE event_type = 'cron_heartbeat' 
      ORDER BY created_at DESC 
      LIMIT 1
    ` as any[];

    // Check Auto Mode system_state
    const autoModeState = await sql`
      SELECT value FROM system_state WHERE key = 'auto_mode' LIMIT 1
    ` as any[];

    return NextResponse.json({
      success: true,
      ...qStatus,
      generated_today: parseInt(generatedToday[0]?.count || "0", 10),
      last_cron_run: lastCronLog[0]?.created_at || null,
      auto_mode: autoModeState[0]?.value === 'ON',
      lock_status: qStatus.processing > 0 ? 'Active' : 'Idle'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
