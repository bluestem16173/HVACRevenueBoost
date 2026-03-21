import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const logs = await sql`
      SELECT created_at, message 
      FROM system_logs 
      ORDER BY created_at DESC 
      LIMIT 100
    ` as any[];

    return NextResponse.json({
      success: true,
      logs: logs.map(l => {
        const time = new Date(l.created_at).toLocaleTimeString([], { hour12: false });
        return `[${time}] ${l.message}`;
      })
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
