import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const queueCounts = (await sql`
      SELECT status, COUNT(*)::int as count 
      FROM generation_queue 
      GROUP BY status
    `) as { status: string; count: number }[];

    const byStatus: Record<string, number> = {};
    for (const row of queueCounts) {
      byStatus[row.status] = row.count;
    }

    const pick = (...keys: string[]) =>
      keys.reduce((sum, k) => sum + (byStatus[k] ?? 0), 0);

    /** Backward-compatible aliases for the admin dashboard */
    const pending = pick("draft", "pending", "queued");
    const processing = pick("generated", "processing", "validated");
    const failed = pick("failed");

    const generatedToday = (await sql`
      SELECT COUNT(*) as count
      FROM pages
      WHERE created_at >= CURRENT_DATE
    `) as { count: string }[];

    const lastCronLog = (await sql`
      SELECT created_at 
      FROM system_logs 
      WHERE event_type = 'cron_heartbeat' 
      ORDER BY created_at DESC 
      LIMIT 1
    `) as { created_at: string }[];

    const autoModeState = (await sql`
      SELECT value FROM system_state WHERE key = 'auto_mode' LIMIT 1
    `) as { value: string }[];

    return NextResponse.json({
      success: true,
      pending,
      processing,
      failed,
      queue_by_status: byStatus,
      generated_today: parseInt(generatedToday[0]?.count || "0", 10),
      last_cron_run: lastCronLog[0]?.created_at || null,
      auto_mode: autoModeState[0]?.value === "ON",
      lock_status: processing > 0 ? "Active" : "Idle",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
